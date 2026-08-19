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
const beforeBranches = summarizeBranches(baseline.areas);
const afterBranches = summarizeBranches(snapshot.areas);
const changes = [];
const evidence = snapshot.catalogEvidence;

for (const [branchId, branch] of afterBranches) {
  if (!beforeBranches.has(branchId)) {
    changes.push({ severity: "breaking", type: "branch-added", key: branchId, branch });
  }
}

for (const [branchId, branch] of beforeBranches) {
  if (!afterBranches.has(branchId)) {
    changes.push({ severity: "breaking", type: "branch-removed", key: branchId, branch });
  }
}

for (const [key, current] of after) {
  const previous = before.get(key);
  if (!previous) {
    changes.push({ severity: "breaking", type: "area-added", key, area: summarizeArea(current) });
    continue;
  }
  compare(changes, key, "branch-name", previous.branchName, current.branchName, "review");
  compare(changes, key, "area-name", previous.areaName, current.areaName, "review");
  if (hasAuthoritativeMapEvidence(evidence, key, current.observedMapUrls)) {
    compareMapUrls(changes, key, previous.observedMapUrls, current.observedMapUrls);
  }
  compare(changes, key, "map-path", previous.mapPath, current.mapPath, "breaking");
  compare(changes, key, "image-width", previous.image?.width, current.image?.width, "breaking");
  compare(changes, key, "image-height", previous.image?.height, current.image?.height, "breaking");
  compare(changes, key, "image-sha256", previous.image?.sha256, current.image?.sha256, "breaking");
  compareSeats(changes, key, previous.seats, current.seats);
}

for (const key of before.keys()) {
  if (!after.has(key)) {
    changes.push({ severity: "breaking", type: "area-removed", key, area: summarizeArea(before.get(key)) });
  }
}

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
const imageChangeTypes = new Set(["map-path", "image-width", "image-height", "image-sha256"]);
const changedImages = [...new Set(
  changes
    .filter(({ type }) => imageChangeTypes.has(type))
    .map(({ key }) => key),
)].map((key) => ({
  ...summarizeArea(after.get(key) ?? before.get(key)),
  changes: changes
    .filter((change) => change.key === key && imageChangeTypes.has(change.type))
    .map(({ type, previous, current }) => ({ type, previous, current })),
}));
const configuredImageKeys = [...before.entries()]
  .filter(([, area]) => area.mapPath)
  .map(([key]) => key);
const missingImages = configuredImageKeys
  .filter((key) => !after.get(key)?.image?.sha256)
  .map((key) => summarizeArea(after.get(key) ?? before.get(key)));
const reportPath = args.output
  ? path.resolve(REPO_ROOT, args.output)
  : undefined;
const htmlPath = args.html
  ? path.resolve(REPO_ROOT, args.html)
  : undefined;
const report = {
  schemaVersion: 1,
  status,
  baseline: path.relative(REPO_ROOT, baselinePath),
  snapshot: path.relative(REPO_ROOT, snapshotPath),
  generatedAt: new Date().toISOString(),
  evidence,
  evidenceIssues,
  coverage: {
    observed: catalogCounts(snapshot.areas),
    configured: catalogCounts(baseline.areas),
    images: {
      configured: configuredImageKeys.length,
      checked: configuredImageKeys.filter((key) => after.get(key)?.image?.sha256).length,
      changed: changedImages,
      missing: missingImages,
    },
    annotations: {
      configured: baseline.areas.filter(({ annotationStatus }) => annotationStatus === "implemented").length,
      implemented: snapshot.areas.filter(({ annotationStatus }) => annotationStatus === "implemented").length,
      missing: snapshot.areas
        .filter(({ annotationStatus }) => annotationStatus !== "implemented")
        .map(summarizeArea),
    },
  },
  artifacts: {
    baseline: path.relative(REPO_ROOT, baselinePath),
    candidate: path.relative(REPO_ROOT, snapshotPath),
    jsonReport: reportPath ? path.relative(REPO_ROOT, reportPath) : undefined,
    htmlReport: htmlPath ? path.relative(REPO_ROOT, htmlPath) : undefined,
    fingerprints: "src/data/seatPlanFingerprints.ts",
    annotationIndex: "src/data/seatPlans/index.ts",
    inventory: "docs/seat-plan-inventory.md",
  },
  summary: {
    total: changes.length,
    breaking: changes.filter(({ severity }) => severity === "breaking").length,
    review: changes.filter(({ severity }) => severity === "review").length,
    enrichment: changes.filter(({ severity }) => severity === "enrichment").length,
  },
  changes,
};

if (reportPath) {
  await writeJson(reportPath, report);
}
if (htmlPath) {
  await mkdir(path.dirname(htmlPath), { recursive: true });
  await writeFile(htmlPath, renderHtml(report, htmlPath));
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

function summarizeBranches(areas) {
  const branches = new Map();
  for (const area of areas) {
    const branchId = String(area.branchId);
    if (!branches.has(branchId)) {
      branches.set(branchId, {
        branchId,
        branchCode: area.branchCode,
        branchName: area.branchName,
      });
    }
  }
  return branches;
}

function summarizeArea(area = {}) {
  return {
    branchId: String(area.branchId ?? ""),
    branchCode: area.branchCode,
    branchName: area.branchName,
    areaId: String(area.areaId ?? ""),
    areaName: area.areaName,
  };
}

function catalogCounts(areas) {
  return {
    branches: new Set(areas.map(({ branchId }) => String(branchId))).size,
    areas: areas.length,
    seats: areas.reduce((total, area) => total + (area.seats?.length ?? 0), 0),
  };
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

function hasAuthoritativeMapEvidence(evidence, key, currentUrls = []) {
  const discovery = evidence?.mapDiscovery;
  if (
    evidence?.exportMetadata?.mode !== "targeted-discovery" ||
    discovery?.requested !== true ||
    discovery?.scope !== "branch" ||
    currentUrls.length === 0
  ) {
    return false;
  }
  const [branchId, areaId] = key.split(":");
  if (String(discovery.branchId) !== branchId) {
    return false;
  }
  return !discovery.failed?.some(
    (failure) =>
      String(failure.branchId) === branchId &&
      String(failure.areaId) === areaId,
  );
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
    if (previous.code && current.code) {
      compare(target, key, "seat-code", previous.code, current.code, "review");
    }
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
  if (change.seat) {
    return JSON.stringify(change.seat);
  }
  if (change.area) {
    return `${change.area.branchName ?? change.area.branchId} / ${change.area.areaName ?? change.area.areaId}`;
  }
  if (change.branch) {
    return change.branch.branchName ?? change.branch.branchId;
  }
  return `${JSON.stringify(change.previous)} → ${JSON.stringify(change.current)}`;
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

function renderHtml(value, htmlPath) {
  const rows = value.changes.map((change) => `<tr><td>${escapeHtml(change.severity)}</td><td>${escapeHtml(change.key)}</td><td>${escapeHtml(change.type)}</td><td><code>${escapeHtml(detail(change))}</code></td></tr>`).join("");
  const failures = value.evidenceIssues.map((failure) => `<tr><td>${escapeHtml(`${failure.branchId}:${failure.areaId}`)}</td><td>${escapeHtml(failure.message)}</td></tr>`).join("");
  const discovery = value.evidence?.mapDiscovery;
  const exportMetadata = value.evidence?.exportMetadata;
  const artifactItems = Object.entries(value.artifacts)
    .filter(([, target]) => target)
    .map(([label, target]) => `<li><a href="${escapeHtml(relativeHref(htmlPath, target))}">${escapeHtml(artifactLabel(label))}</a><br><code>${escapeHtml(target)}</code></li>`)
    .join("");
  const lifecycle = value.changes.filter(({ type }) => ["branch-added", "branch-removed", "area-added", "area-removed"].includes(type));
  const lifecycleRows = lifecycle.map((change) => `<tr><td>${escapeHtml(change.type)}</td><td>${escapeHtml(change.key)}</td><td>${escapeHtml(detail(change))}</td></tr>`).join("");
  const changedImageRows = value.coverage.images.changed.map((area) => `<tr><td>${escapeHtml(`${area.branchId}:${area.areaId}`)}</td><td>${escapeHtml(`${area.branchName ?? area.branchId} / ${area.areaName ?? area.areaId}`)}</td><td><code>${escapeHtml(area.changes.map(({ type, previous, current }) => `${type}: ${JSON.stringify(previous)} → ${JSON.stringify(current)}`).join("\n"))}</code></td></tr>`).join("");
  const missingImageRows = value.coverage.images.missing.map((area) => `<li>${escapeHtml(`${area.branchId}:${area.areaId} — ${area.branchName ?? area.branchId} / ${area.areaName ?? area.areaId}`)}</li>`).join("");
  const missingAnnotationRows = value.coverage.annotations.missing.map((area) => `<li>${escapeHtml(`${area.branchId}:${area.areaId} — ${area.branchName ?? area.branchId} / ${area.areaName ?? area.areaId}`)}</li>`).join("");
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>NLB seat-plan audit</title>
<style>body{max-width:1200px;margin:32px auto;padding:0 20px;font:15px/1.5 system-ui;color:#183128}h1{margin-bottom:4px}.status{padding:12px 16px;border-radius:8px;background:${value.status === "clean" ? "#e8f6ed" : value.status === "drift" ? "#fff4d8" : "#fdeae7"};font-weight:700}table{width:100%;border-collapse:collapse;margin:12px 0 28px}th,td{padding:8px;border:1px solid #cfdad5;text-align:left;vertical-align:top}th{background:#f4f7f5}code{white-space:pre-wrap;overflow-wrap:anywhere}.note{padding:12px;border-left:4px solid #287753;background:#f4f7f5}a{color:#12613f}.artifacts li{margin:8px 0}</style></head><body>
<h1>NLB seat-plan audit</h1><p>Generated ${escapeHtml(value.generatedAt)}</p>
<p class="status">Status: ${escapeHtml(value.status.toUpperCase())}</p>
<p class="note">This report is read-only. The reviewed baseline and annotation definitions were not changed.</p>
<h2>Evidence</h2><ul><li>Catalog captured: ${escapeHtml(value.evidence?.capturedAt ?? "not recorded")}</li><li>Extension: ${escapeHtml(exportMetadata?.extensionVersion ?? "not recorded")}</li><li>Export mode: ${escapeHtml(exportMetadata?.mode ?? "not recorded")}</li><li>Map discovery: ${discovery ? `${discovery.succeeded}/${discovery.attempted} targeted areas succeeded in ${discovery.requestCount ?? "an unrecorded number of"} request(s)` : "not requested; reviewed map paths were checked directly"}</li></ul>
<ul class="artifacts">${artifactItems}</ul>
<h2>Catalog and configuration coverage</h2>
<table><thead><tr><th>Item</th><th>Observed now</th><th>Current config</th><th>Difference</th></tr></thead><tbody>
<tr><td>Branches</td><td>${value.coverage.observed.branches}</td><td>${value.coverage.configured.branches}</td><td>${signedDifference(value.coverage.observed.branches, value.coverage.configured.branches)}</td></tr>
<tr><td>Areas</td><td>${value.coverage.observed.areas}</td><td>${value.coverage.configured.areas}</td><td>${signedDifference(value.coverage.observed.areas, value.coverage.configured.areas)}</td></tr>
<tr><td>Seats</td><td>${value.coverage.observed.seats}</td><td>${value.coverage.configured.seats}</td><td>${signedDifference(value.coverage.observed.seats, value.coverage.configured.seats)}</td></tr>
</tbody></table>
<h2>Branch and area lifecycle</h2>
${lifecycleRows ? `<table><thead><tr><th>Change</th><th>ID</th><th>Name</th></tr></thead><tbody>${lifecycleRows}</tbody></table>` : "<p>No branches or areas were added or removed.</p>"}
<h2>Seat-plan images</h2><p>${value.coverage.images.checked} of ${value.coverage.images.configured} configured seat-plan images were downloaded and fingerprinted. ${value.coverage.images.changed.length} changed; ${value.coverage.images.missing.length} missing.</p>
${changedImageRows ? `<table><thead><tr><th>Area</th><th>Name</th><th>Image changes</th></tr></thead><tbody>${changedImageRows}</tbody></table>` : "<p>No seat-plan path, dimensions, or SHA-256 fingerprint changed.</p>"}
${missingImageRows ? `<h3>Missing images</h3><ul>${missingImageRows}</ul>` : ""}
<h2>Annotations</h2><p>${value.coverage.annotations.implemented} implemented areas observed versus ${value.coverage.annotations.configured} configured.</p>
${missingAnnotationRows ? `<h3>Missing annotation coverage</h3><ul>${missingAnnotationRows}</ul>` : "<p>No missing annotation coverage.</p>"}
${failures ? `<h2>Incomplete evidence</h2><p>These areas could not be discovered. Their absence must not be treated as removal or clean evidence.</p><table><thead><tr><th>Area</th><th>Reason</th></tr></thead><tbody>${failures}</tbody></table>` : ""}
<h2>Drift summary</h2><p>${value.summary.total} changes: ${value.summary.breaking} breaking, ${value.summary.review} review, ${value.summary.enrichment} baseline enrichment.</p>
${rows ? `<table><thead><tr><th>Severity</th><th>Area</th><th>Change</th><th>Details</th></tr></thead><tbody>${rows}</tbody></table>` : `<p>${value.status === "clean" ? "No catalog or map drift detected." : "No drift detected in the returned evidence."}</p>`}
</body></html>\n`;
}

function signedDifference(observed, configured) {
  const difference = observed - configured;
  return difference > 0 ? `+${difference}` : String(difference);
}

function artifactLabel(key) {
  return ({
    baseline: "Reviewed baseline",
    candidate: "Candidate snapshot",
    jsonReport: "JSON drift report",
    htmlReport: "HTML report",
    fingerprints: "Fingerprint configuration",
    annotationIndex: "Annotation configuration index",
    inventory: "Seat-plan inventory",
  })[key] ?? key;
}

function relativeHref(htmlPath, target) {
  const absoluteTarget = path.resolve(REPO_ROOT, target);
  return encodeURI(path.relative(path.dirname(htmlPath), absoluteTarget).split(path.sep).join("/"));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
