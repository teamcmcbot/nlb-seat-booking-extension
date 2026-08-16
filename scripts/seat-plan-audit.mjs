import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  BASELINE_PATH,
  REPO_ROOT,
  baselineAreaKey,
  parseArgs,
  readJson,
  writeJson,
} from "./seat-plan-tools.mjs";

const args = parseArgs(process.argv.slice(2));
const baselinePath = path.resolve(REPO_ROOT, args.baseline || BASELINE_PATH);
const snapshotPath = path.resolve(REPO_ROOT, args.snapshot || BASELINE_PATH);
const baseline = await readJson(baselinePath);
const snapshot = await readJson(snapshotPath);
const before = new Map(baseline.areas.map((area) => [baselineAreaKey(area), area]));
const after = new Map(snapshot.areas.map((area) => [baselineAreaKey(area), area]));
const changes = [];

for (const [key, current] of after) {
  const previous = before.get(key);
  if (!previous) {
    changes.push({ severity: "breaking", type: "area-added", key });
    continue;
  }
  compare(changes, key, "branch-name", previous.branchName, current.branchName, "review");
  compare(changes, key, "area-name", previous.areaName, current.areaName, "review");
  compareMapUrls(changes, key, previous.observedMapUrls, current.observedMapUrls);
  compare(changes, key, "map-path", previous.mapPath, current.mapPath, "breaking");
  compare(changes, key, "image-width", previous.image?.width, current.image?.width, "breaking");
  compare(changes, key, "image-height", previous.image?.height, current.image?.height, "breaking");
  compare(changes, key, "image-sha256", previous.image?.sha256, current.image?.sha256, "breaking");
  compareSeats(changes, key, previous.seats, current.seats);
}

for (const key of before.keys()) {
  if (!after.has(key)) {
    changes.push({ severity: "breaking", type: "area-removed", key });
  }
}

const evidence = snapshot.catalogEvidence;
const evidenceIssues = [...(evidence?.mapDiscovery?.failed ?? [])];
if (
  snapshot.catalogSource === "sanitized-get-account-info" &&
  snapshotPath !== baselinePath
) {
  if (!["catalog", "targeted-discovery"].includes(evidence?.exportMetadata?.mode)) {
    evidenceIssues.unshift({
      branchId: "—",
      areaId: "—",
      message: "Candidate lacks recognized sanitized-export provenance.",
    });
  }
  if (
    evidence?.exportMetadata?.mode === "targeted-discovery" &&
    (evidence?.mapDiscovery?.requested !== true || evidence?.mapDiscovery?.scope !== "branch")
  ) {
    evidenceIssues.unshift({
      branchId: "—",
      areaId: "—",
      message: "Targeted discovery lacks its branch-scoped report.",
    });
  }
}
const status = evidenceIssues.length > 0
  ? "incomplete"
  : changes.length > 0
    ? "drift"
    : "clean";
const report = {
  schemaVersion: 1,
  status,
  baseline: path.relative(REPO_ROOT, baselinePath),
  snapshot: path.relative(REPO_ROOT, snapshotPath),
  generatedAt: new Date().toISOString(),
  evidence,
  evidenceIssues,
  summary: {
    total: changes.length,
    breaking: changes.filter(({ severity }) => severity === "breaking").length,
    review: changes.filter(({ severity }) => severity === "review").length,
    enrichment: changes.filter(({ severity }) => severity === "enrichment").length,
  },
  changes,
};

if (args.output) {
  await writeJson(path.resolve(REPO_ROOT, args.output), report);
}
if (args.html) {
  const htmlPath = path.resolve(REPO_ROOT, args.html);
  await mkdir(path.dirname(htmlPath), { recursive: true });
  await writeFile(htmlPath, renderHtml(report));
}
console.log(renderMarkdown(report));
if (status === "incomplete") {
  process.exitCode = 3;
} else if (status === "drift") {
  process.exitCode = 2;
}

function compare(target, key, type, previous, current, severity) {
  if (previous !== current) {
    target.push({ severity, type, key, previous, current });
  }
}

function compareMapUrls(target, key, previousUrls = [], currentUrls = []) {
  const previous = [...new Set(previousUrls)].sort();
  const current = [...new Set(currentUrls)].sort();
  if (JSON.stringify(previous) === JSON.stringify(current)) {
    return;
  }
  target.push({
    severity: previous.length === 0 ? "enrichment" : "review",
    type: "map-urls",
    key,
    previous,
    current,
  });
}

function compareSeats(target, key, previousSeats, currentSeats) {
  const unmatchedPrevious = new Set(previousSeats);
  for (const current of currentSeats) {
    const previous =
      previousSeats.find(
        (candidate) =>
          unmatchedPrevious.has(candidate) &&
          candidate.id && current.id && candidate.id === current.id,
      ) ??
      previousSeats.find(
        (candidate) => unmatchedPrevious.has(candidate) && candidate.name === current.name,
      ) ??
      previousSeats.find(
        (candidate) =>
          unmatchedPrevious.has(candidate) &&
          canonicalSeatName(candidate.name) === canonicalSeatName(current.name),
      );
    if (!previous) {
      target.push({ severity: "breaking", type: "seat-added", key, seat: current });
      continue;
    }
    unmatchedPrevious.delete(previous);
    compare(target, key, "seat-name", previous.name, current.name, "breaking");
    compare(target, key, "seat-id", previous.id, current.id, previous.id === undefined ? "enrichment" : "review");
    compare(target, key, "seat-code", previous.code, current.code, previous.code === undefined ? "enrichment" : "review");
    compare(target, key, "seat-disabled", previous.disabled, current.disabled, previous.disabled === undefined ? "enrichment" : "review");
  }
  for (const seat of unmatchedPrevious) {
    target.push({ severity: "breaking", type: "seat-removed", key, seat });
  }
}

function canonicalSeatName(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  const match = normalized.match(/^([^0-9]*)([0-9]+)$/);
  return match ? `${match[1]}${Number(match[2])}` : normalized;
}

function detail(change) {
  return change.seat
    ? JSON.stringify(change.seat)
    : `${JSON.stringify(change.previous)} → ${JSON.stringify(change.current)}`;
}

function renderMarkdown(value) {
  const actionable = value.changes.filter(({ severity }) => severity !== "enrichment");
  const lines = [
    "# Seat-plan drift report",
    "",
    `Status: ${value.status}`,
    `Changes: ${value.summary.total} (${value.summary.breaking} breaking, ${value.summary.review} review, ${value.summary.enrichment} baseline enrichment)`,
  ];
  if (value.evidenceIssues.length) {
    lines.push("", `Evidence incomplete for ${value.evidenceIssues.length} area(s). Do not interpret missing data as drift.`);
  }
  if (value.changes.length === 0) {
    lines.push("", value.status === "clean" ? "No catalog or map drift detected." : "No drift was detected in the evidence that was returned.");
  } else if (actionable.length > 0) {
    lines.push("", "| Severity | Area | Change | Details |", "| --- | --- | --- | --- |");
    for (const change of actionable) {
      lines.push(`| ${change.severity} | ${change.key} | ${change.type} | ${detail(change)} |`);
    }
  }
  if (value.summary.enrichment > 0) {
    lines.push("", `${value.summary.enrichment} baseline-enrichment changes are retained in the JSON report and omitted from this table.`);
  }
  return lines.join("\n");
}

function renderHtml(value) {
  const rows = value.changes.map((change) => `<tr><td>${escapeHtml(change.severity)}</td><td>${escapeHtml(change.key)}</td><td>${escapeHtml(change.type)}</td><td><code>${escapeHtml(detail(change))}</code></td></tr>`).join("");
  const failures = value.evidenceIssues.map((failure) => `<tr><td>${escapeHtml(`${failure.branchId}:${failure.areaId}`)}</td><td>${escapeHtml(failure.message)}</td></tr>`).join("");
  const discovery = value.evidence?.mapDiscovery;
  const exportMetadata = value.evidence?.exportMetadata;
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>NLB seat-plan audit</title>
<style>body{max-width:1200px;margin:32px auto;padding:0 20px;font:15px/1.5 system-ui;color:#183128}h1{margin-bottom:4px}.status{padding:12px 16px;border-radius:8px;background:${value.status === "clean" ? "#e8f6ed" : value.status === "drift" ? "#fff4d8" : "#fdeae7"};font-weight:700}table{width:100%;border-collapse:collapse;margin:12px 0 28px}th,td{padding:8px;border:1px solid #cfdad5;text-align:left;vertical-align:top}th{background:#f4f7f5}code{white-space:pre-wrap;overflow-wrap:anywhere}.note{padding:12px;border-left:4px solid #287753;background:#f4f7f5}</style></head><body>
<h1>NLB seat-plan audit</h1><p>Generated ${escapeHtml(value.generatedAt)}</p>
<p class="status">Status: ${escapeHtml(value.status.toUpperCase())}</p>
<p class="note">This report is read-only. The reviewed baseline and annotation definitions were not changed.</p>
<h2>Evidence</h2><ul><li>Snapshot: <code>${escapeHtml(value.snapshot)}</code></li><li>Catalog captured: ${escapeHtml(value.evidence?.capturedAt ?? "not recorded")}</li><li>Extension: ${escapeHtml(exportMetadata?.extensionVersion ?? "not recorded")}</li><li>Export mode: ${escapeHtml(exportMetadata?.mode ?? "not recorded")}</li><li>Map discovery: ${discovery ? `${discovery.succeeded}/${discovery.attempted} targeted areas succeeded in ${discovery.requestCount ?? "an unrecorded number of"} request(s)` : "not requested; reviewed map paths were checked directly"}</li></ul>
${failures ? `<h2>Incomplete evidence</h2><p>These areas could not be discovered. Their absence must not be treated as removal or clean evidence.</p><table><thead><tr><th>Area</th><th>Reason</th></tr></thead><tbody>${failures}</tbody></table>` : ""}
<h2>Drift summary</h2><p>${value.summary.total} changes: ${value.summary.breaking} breaking, ${value.summary.review} review, ${value.summary.enrichment} baseline enrichment.</p>
${rows ? `<table><thead><tr><th>Severity</th><th>Area</th><th>Change</th><th>Details</th></tr></thead><tbody>${rows}</tbody></table>` : `<p>${value.status === "clean" ? "No catalog or map drift detected." : "No drift detected in the returned evidence."}</p>`}
</body></html>\n`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
