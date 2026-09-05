import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  BASELINE_PATH,
  BRANCH_STATUS_PATH,
  REPO_ROOT,
  baselineAreaKey,
  parseArgs,
  readJson,
  writeJson,
} from "./seat-plan-tools.mjs";
import { enrichChange } from "./seat-plan-drift-actions.mjs";

const args = parseArgs(process.argv.slice(2));
const baselinePath = path.resolve(REPO_ROOT, args.baseline || BASELINE_PATH);
const snapshotPath = path.resolve(REPO_ROOT, args.snapshot || BASELINE_PATH);
const baseline = await readJson(baselinePath);
const snapshot = await readJson(snapshotPath);
const branchStatus = await readJson(BRANCH_STATUS_PATH);
const before = new Map(baseline.areas.map((area) => [baselineAreaKey(area), area]));
const after = new Map(snapshot.areas.map((area) => [baselineAreaKey(area), area]));
const rawCatalogAreas = Array.isArray(snapshot.rawCatalogAreas)
  ? snapshot.rawCatalogAreas
  : snapshot.areas;
const afterCatalog = new Map(rawCatalogAreas.map((area) => [baselineAreaKey(area), area]));
const beforeBranches = summarizeBranches(baseline.areas);
const afterBranches = summarizeBranches(rawCatalogAreas);
const detectedChanges = [];
const evidence = snapshot.catalogEvidence;

for (const [branchId, branch] of afterBranches) {
  if (!beforeBranches.has(branchId)) {
    detectedChanges.push({ severity: "breaking", type: "branch-added", key: branchId, branch });
  }
}

for (const [branchId, branch] of beforeBranches) {
  if (!afterBranches.has(branchId)) {
    detectedChanges.push({ severity: "breaking", type: "branch-removed", key: branchId, branch });
    continue;
  }
  const current = afterBranches.get(branchId);
  compare(detectedChanges, branchId, "branch-name", branch.branchName, current.branchName, "review", { branch: current });
  compare(detectedChanges, branchId, "branch-code", branch.branchCode, current.branchCode, "review", { branch: current });
}

for (const [key, currentCatalog] of afterCatalog) {
  const previous = before.get(key);
  if (!previous) {
    if (beforeBranches.has(String(currentCatalog.branchId))) {
      detectedChanges.push({ severity: "breaking", type: "area-added", key, area: summarizeArea(currentCatalog, currentCatalog.seats?.length) });
    }
    continue;
  }
  const current = after.get(key) ?? currentCatalog;
  const area = summarizeArea(currentCatalog, currentCatalog.seats?.length);
  compare(detectedChanges, key, "area-name", previous.areaName, currentCatalog.areaName, "review", { area });
  compare(detectedChanges, key, "area-floor", previous.floor, currentCatalog.floor, "review", { area });
  if (hasAuthoritativeMapEvidence(evidence, key, current.observedMapUrls)) {
    compareMapUrls(detectedChanges, key, previous.observedMapUrls, current.observedMapUrls, area);
  }
  compare(detectedChanges, key, "map-path", previous.mapPath, current.mapPath, "breaking", { area });
  compare(detectedChanges, key, "image-width", previous.image?.width, current.image?.width, "breaking", { area });
  compare(detectedChanges, key, "image-height", previous.image?.height, current.image?.height, "breaking", { area });
  compare(detectedChanges, key, "image-sha256", previous.image?.sha256, current.image?.sha256, "breaking", { area });
  compareSeats(detectedChanges, key, previous.seats, currentCatalog.seats, area);
}

for (const key of before.keys()) {
  if (!afterCatalog.has(key)) {
    const previous = before.get(key);
    if (afterBranches.has(String(previous.branchId))) {
      detectedChanges.push({
        severity: "breaking",
        type: "area-removed",
        key,
        area: summarizeArea(previous, previous.seats?.length),
      });
    }
  }
}

const changes = detectedChanges.map((change) => enrichChange(change, branchStatus));
const operationalNotices = resolveOperationalNotices(branchStatus);

const evidenceIssues = [
  ...validateCatalogAreas(rawCatalogAreas, baseline.areas),
  ...(evidence?.mapDiscovery?.failed ?? []),
];
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
  schemaVersion: 2,
  status,
  simulation: snapshot.simulation,
  baseline: path.relative(REPO_ROOT, baselinePath),
  snapshot: path.relative(REPO_ROOT, snapshotPath),
  generatedAt: new Date().toISOString(),
  evidence,
  evidenceIssues,
  operationalNotices,
  coverage: {
    observed: catalogCounts(rawCatalogAreas),
    candidate: catalogCounts(snapshot.areas),
    configured: catalogCounts(baseline.areas),
    images: {
      configured: configuredImageKeys.length,
      checked: configuredImageKeys.filter((key) => after.get(key)?.image?.sha256).length,
      changed: changedImages,
      missing: missingImages,
    },
    annotations: {
      configured: baseline.areas.filter(({ annotationStatus }) => annotationStatus === "implemented").length,
      present: baseline.areas
        .filter(({ annotationStatus }) => annotationStatus === "implemented")
        .filter((area) => afterCatalog.has(baselineAreaKey(area))).length,
      absent: baseline.areas
        .filter(({ annotationStatus }) => annotationStatus === "implemented")
        .filter((area) => !afterCatalog.has(baselineAreaKey(area)))
        .map((area) => summarizeArea(area)),
      pending: snapshot.areas
        .filter(({ annotationStatus }) => annotationStatus !== "implemented")
        .map((area) => summarizeArea(area)),
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
    branchStatus: "docs/data/branch-status.json",
    branchInventory: "docs/branch-inventory.md",
    retirementLedger: "docs/data/seat-plan-retirements.json",
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

function compare(target, key, type, previous, current, severity, context = {}) {
  if (previous !== current) {
    target.push({ severity, type, key, previous, current, ...context });
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
        areaCount: 0,
        seatCount: 0,
        areas: [],
      });
    }
    const branch = branches.get(branchId);
    branch.areaCount += 1;
    branch.seatCount += area.seats?.length ?? 0;
    branch.areas.push({
      areaId: String(area.areaId),
      areaName: area.areaName,
      seatCount: area.seats?.length ?? 0,
    });
  }
  return branches;
}

function summarizeArea(area = {}, seatCount) {
  return {
    branchId: String(area.branchId ?? ""),
    branchCode: area.branchCode,
    branchName: area.branchName,
    areaId: String(area.areaId ?? ""),
    areaName: area.areaName,
    seatCount: seatCount ?? area.seats?.length ?? 0,
  };
}

function catalogCounts(areas) {
  return {
    branches: new Set(areas.map(({ branchId }) => String(branchId))).size,
    areas: areas.length,
    seats: areas.reduce((total, area) => total + (area.seats?.length ?? 0), 0),
  };
}

function compareMapUrls(target, key, previousUrls = [], currentUrls = [], area) {
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
    area,
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

function compareSeats(target, key, previousSeats, currentSeats, area) {
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
      target.push({ severity: "breaking", type: "seat-added", key, seat: current, area });
      continue;
    }
    unmatchedPrevious.delete(previous);
    compare(target, key, "seat-name", previous.name, current.name, "breaking", { area });
    compare(target, key, "seat-id", previous.id, current.id, previous.id === undefined ? "enrichment" : "review", { area });
    if (previous.code && current.code) {
      compare(target, key, "seat-code", previous.code, current.code, "review", { area });
    }
    compare(target, key, "seat-disabled", previous.disabled, current.disabled, previous.disabled === undefined ? "enrichment" : "review", { area });
  }
  for (const seat of unmatchedPrevious) {
    target.push({ severity: "breaking", type: "seat-removed", key, seat, area });
  }
}

function validateCatalogAreas(areas, baselineAreas) {
  const issues = [];
  if (!Array.isArray(areas)) {
    return [{ branchId: "—", areaId: "—", message: "Raw catalog areas are missing or malformed." }];
  }
  if (baselineAreas.length > 0 && areas.length === 0) {
    issues.push({ branchId: "—", areaId: "—", message: "Raw catalog is empty while the baseline is not; treat the export as incomplete." });
  }
  if (baselineAreas.length >= 10 && areas.length < baselineAreas.length / 2) {
    issues.push({ branchId: "—", areaId: "—", message: "Raw catalog contains fewer than half of the configured areas; confirm that the response was not truncated." });
  }
  const areaKeys = new Set();
  for (const area of areas) {
    const key = baselineAreaKey(area);
    if (!area.branchId || !area.areaId) {
      issues.push({ branchId: String(area.branchId ?? "—"), areaId: String(area.areaId ?? "—"), message: "Catalog area is missing a stable branch or area ID." });
      continue;
    }
    if (areaKeys.has(key)) {
      issues.push({ branchId: String(area.branchId), areaId: String(area.areaId), message: "Catalog contains a duplicate branch/area identity." });
    }
    areaKeys.add(key);
    const seatIds = new Set();
    const seatNames = new Set();
    for (const seat of area.seats ?? []) {
      if (seat.id && seatIds.has(String(seat.id))) {
        issues.push({ branchId: String(area.branchId), areaId: String(area.areaId), message: `Duplicate seat ID ${seat.id} makes hotspot identity ambiguous.` });
      }
      if (seat.name && seatNames.has(String(seat.name))) {
        issues.push({ branchId: String(area.branchId), areaId: String(area.areaId), message: `Duplicate seat name ${seat.name} makes hotspot identity ambiguous.` });
      }
      if (seat.id) seatIds.add(String(seat.id));
      if (seat.name) seatNames.add(String(seat.name));
    }
  }
  return issues;
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
    const count = Number.isInteger(change.area.seatCount)
      ? ` (${change.area.seatCount} seats)`
      : "";
    return `${change.area.branchName ?? change.area.branchId} / ${change.area.areaName ?? change.area.areaId}${count}`;
  }
  if (change.branch) {
    const areaLabel = change.branch.areaCount === 1 ? "area" : "areas";
    const seatLabel = change.branch.seatCount === 1 ? "seat" : "seats";
    const impact = Number.isInteger(change.branch.areaCount)
      ? ` (${change.branch.areaCount} ${areaLabel}, ${change.branch.seatCount} ${seatLabel})`
      : "";
    return `${change.branch.branchName ?? change.branch.branchId}${impact}`;
  }
  return `${JSON.stringify(change.previous)} → ${JSON.stringify(change.current)}`;
}

function renderMarkdown(value) {
  const actionable = value.changes.filter(({ severity }) => severity !== "enrichment");
  const lines = [
    "# Seat-plan drift report",
    "",
    ...(value.simulation ? [`SIMULATION: ${value.simulation.title}`, ""] : []),
    `Status: ${value.status}`,
    `Changes: ${value.summary.total} (${value.summary.breaking} breaking, ${value.summary.review} review, ${value.summary.enrichment} baseline enrichment)`,
  ];
  if (value.evidenceIssues.length) {
    lines.push("", `Evidence incomplete for ${value.evidenceIssues.length} area(s). Do not interpret missing data as drift.`);
  }
  if (value.operationalNotices.length > 0) {
    lines.push("", `Tracked operational notices to re-check: ${value.operationalNotices.length}`);
  }
  if (value.changes.length === 0) {
    lines.push("", value.status === "clean" ? "No catalog or map drift detected." : "No drift was detected in the evidence that was returned.");
  } else if (actionable.length > 0) {
    lines.push("", "| Severity | Scope | Change | Details |", "| --- | --- | --- | --- |");
    for (const change of actionable) {
      lines.push(`| ${change.severity} | ${change.key} | ${change.type} | ${detail(change)} |`);
    }
    lines.push("", "## Investigation and resolution");
    for (const change of actionable) {
      lines.push("", `### ${change.key} — ${change.actionPlan.title}`);
      if (change.operationalContext) {
        lines.push(`Operational context: ${change.operationalContext.notice}`);
      }
      lines.push("", "Investigate:");
      for (const item of change.actionPlan.investigation) {
        lines.push(`- ${item}`);
      }
      lines.push("", "Recommended resolution:");
      for (const item of change.actionPlan.resolution) {
        lines.push(`- ${item}`);
      }
    }
  }
  if (value.summary.enrichment > 0) {
    lines.push("", `${value.summary.enrichment} baseline-enrichment changes are retained in the JSON report and omitted from this table.`);
  }
  return lines.join("\n");
}

function renderHtml(value, htmlPath) {
  const rows = value.changes.map((change) => `<tr><td>${escapeHtml(change.severity)}</td><td>${escapeHtml(change.key)}</td><td>${escapeHtml(change.type)}</td><td><code>${escapeHtml(detail(change))}</code></td><td>${escapeHtml(change.actionPlan.title)}</td></tr>`).join("");
  const failures = value.evidenceIssues.map((failure) => `<tr><td>${escapeHtml(`${failure.branchId}:${failure.areaId}`)}</td><td>${escapeHtml(failure.message)}</td></tr>`).join("");
  const discovery = value.evidence?.mapDiscovery;
  const exportMetadata = value.evidence?.exportMetadata;
  const artifactItems = Object.entries(value.artifacts)
    .filter(([, target]) => target)
    .map(([label, target]) => `<li><a href="${escapeHtml(relativeHref(htmlPath, target))}">${escapeHtml(artifactLabel(label))}</a><br><code>${escapeHtml(target)}</code></li>`)
    .join("");
  const lifecycle = value.changes.filter(({ type }) => ["branch-added", "branch-removed", "area-added", "area-removed"].includes(type));
  const lifecycleRows = lifecycle.map((change) => `<tr><td>${escapeHtml(change.type)}</td><td>${escapeHtml(change.key)}</td><td>${escapeHtml(detail(change))}</td><td>${escapeHtml(change.actionPlan.title)}</td></tr>`).join("");
  const changedImageRows = value.coverage.images.changed.map((area) => `<tr><td>${escapeHtml(`${area.branchId}:${area.areaId}`)}</td><td>${escapeHtml(`${area.branchName ?? area.branchId} / ${area.areaName ?? area.areaId}`)}</td><td><code>${escapeHtml(area.changes.map(({ type, previous, current }) => `${type}: ${JSON.stringify(previous)} → ${JSON.stringify(current)}`).join("\n"))}</code></td></tr>`).join("");
  const missingImageRows = value.coverage.images.missing.map((area) => `<li>${escapeHtml(`${area.branchId}:${area.areaId} — ${area.branchName ?? area.branchId} / ${area.areaName ?? area.areaId}`)}</li>`).join("");
  const absentAnnotationRows = value.coverage.annotations.absent.map((area) => `<li>${escapeHtml(`${area.branchId}:${area.areaId} — ${area.branchName ?? area.branchId} / ${area.areaName ?? area.areaId}`)}</li>`).join("");
  const pendingAnnotationRows = value.coverage.annotations.pending.map((area) => `<li>${escapeHtml(`${area.branchId}:${area.areaId} — ${area.branchName ?? area.branchId} / ${area.areaName ?? area.areaId}`)}</li>`).join("");
  const actionCards = value.changes.map((change) => renderActionCard(change, htmlPath)).join("");
  const operationalRows = value.operationalNotices.map((notice) => `<tr><td>${escapeHtml(notice.branchName)}</td><td>${escapeHtml(notice.notice)}</td><td>${escapeHtml(notice.evidenceLevel)}</td><td>${escapeHtml(notice.expectedCatalogState)}</td></tr>`).join("");
  const simulationBanner = value.simulation
    ? `<div class="simulation"><strong>SIMULATION — NOT LIVE NLB EVIDENCE</strong><br>${escapeHtml(value.simulation.title)}<br>${escapeHtml(value.simulation.description)}</div>`
    : "";
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>NLB seat-plan audit</title>
<style>body{max-width:1200px;margin:32px auto;padding:0 20px;font:15px/1.5 system-ui;color:#183128}h1{margin-bottom:4px}.status{padding:12px 16px;border-radius:8px;background:${value.status === "clean" ? "#e8f6ed" : value.status === "drift" ? "#fff4d8" : "#fdeae7"};font-weight:700}table{width:100%;border-collapse:collapse;margin:12px 0 28px}th,td{padding:8px;border:1px solid #cfdad5;text-align:left;vertical-align:top}th{background:#f4f7f5}code{white-space:pre-wrap;overflow-wrap:anywhere}.note{padding:12px;border-left:4px solid #287753;background:#f4f7f5}.simulation{padding:14px 16px;border:2px solid #8c4d00;background:#fff1d6;margin:16px 0}.action{border:1px solid #cfdad5;border-radius:8px;padding:16px;margin:16px 0}.context{background:#eef5ff;border-left:4px solid #316aa3;padding:10px 12px}.dispositions{font-family:ui-monospace,monospace}.sources li,.artifacts li{margin:8px 0}a{color:#12613f}</style></head><body>
<h1>NLB seat-plan audit</h1><p>Generated ${escapeHtml(value.generatedAt)}</p>
${simulationBanner}
<p class="status">Status: ${escapeHtml(value.status.toUpperCase())}</p>
<p class="note">This report is read-only. Drift remains unresolved until a reviewed baseline or annotation update is explicitly accepted; operational notes never suppress structural drift.</p>
<h2>Evidence</h2><ul><li>Catalog captured: ${escapeHtml(value.evidence?.capturedAt ?? "not recorded")}</li><li>Extension: ${escapeHtml(exportMetadata?.extensionVersion ?? "not recorded")}</li><li>Export mode: ${escapeHtml(exportMetadata?.mode ?? "not recorded")}</li><li>Map discovery: ${discovery ? `${discovery.succeeded}/${discovery.attempted} targeted areas succeeded in ${discovery.requestCount ?? "an unrecorded number of"} request(s)` : "not requested; reviewed map paths were checked directly"}</li></ul>
<ul class="artifacts">${artifactItems}</ul>
<h2>Operational notices to re-check</h2><p>These dated notes come from the repository branch inventory and its linked sources. They guide investigation but do not suppress drift or prove current API state.</p>
${operationalRows ? `<table><thead><tr><th>Library</th><th>Recorded notice</th><th>Evidence</th><th>Expected catalog state</th></tr></thead><tbody>${operationalRows}</tbody></table>` : "<p>No operational notice is tracked.</p>"}
<h2>Catalog and configuration coverage</h2>
<table><thead><tr><th>Item</th><th>Raw catalog</th><th>Audit candidate</th><th>Current config</th><th>Raw difference</th></tr></thead><tbody>
<tr><td>Branches</td><td>${value.coverage.observed.branches}</td><td>${value.coverage.candidate.branches}</td><td>${value.coverage.configured.branches}</td><td>${signedDifference(value.coverage.observed.branches, value.coverage.configured.branches)}</td></tr>
<tr><td>Areas</td><td>${value.coverage.observed.areas}</td><td>${value.coverage.candidate.areas}</td><td>${value.coverage.configured.areas}</td><td>${signedDifference(value.coverage.observed.areas, value.coverage.configured.areas)}</td></tr>
<tr><td>Seats</td><td>${value.coverage.observed.seats}</td><td>${value.coverage.candidate.seats}</td><td>${value.coverage.configured.seats}</td><td>${signedDifference(value.coverage.observed.seats, value.coverage.configured.seats)}</td></tr>
</tbody></table>
<h2>Branch and area lifecycle</h2>
${lifecycleRows ? `<table><thead><tr><th>Change</th><th>ID</th><th>Impact</th><th>Next review</th></tr></thead><tbody>${lifecycleRows}</tbody></table>` : "<p>No branches or areas were added or removed.</p>"}
<h2>Seat-plan images</h2><p>${value.coverage.images.checked} of ${value.coverage.images.configured} configured seat-plan images were downloaded and fingerprinted. ${value.coverage.images.changed.length} changed; ${value.coverage.images.missing.length} missing.</p>
${changedImageRows ? `<table><thead><tr><th>Area</th><th>Name</th><th>Image changes</th></tr></thead><tbody>${changedImageRows}</tbody></table>` : "<p>No seat-plan path, dimensions, or SHA-256 fingerprint changed.</p>"}
${missingImageRows ? `<h3>Missing images</h3><ul>${missingImageRows}</ul>` : ""}
<h2>Annotations</h2><p>${value.coverage.annotations.present} of ${value.coverage.annotations.configured} active reviewed areas are present in the raw catalog.</p>
${absentAnnotationRows ? `<h3>Active annotations absent from the catalog</h3><ul>${absentAnnotationRows}</ul>` : "<p>No active annotation is absent from the raw catalog.</p>"}
${pendingAnnotationRows ? `<h3>Catalog areas pending annotation</h3><ul>${pendingAnnotationRows}</ul>` : "<p>No catalog area is pending annotation.</p>"}
${failures ? `<h2>Incomplete evidence</h2><p>These areas could not be discovered. Their absence must not be treated as removal or clean evidence.</p><table><thead><tr><th>Area</th><th>Reason</th></tr></thead><tbody>${failures}</tbody></table>` : ""}
<h2>Drift summary</h2><p>${value.summary.total} changes: ${value.summary.breaking} breaking, ${value.summary.review} review, ${value.summary.enrichment} baseline enrichment.</p>
${rows ? `<table><thead><tr><th>Severity</th><th>Scope</th><th>Change</th><th>Details</th><th>Next review</th></tr></thead><tbody>${rows}</tbody></table>` : `<p>${value.status === "clean" ? "No catalog or map drift detected." : "No drift detected in the returned evidence."}</p>`}
${actionCards ? `<h2>Investigation and resolution</h2>${actionCards}` : ""}
</body></html>\n`;
}

function renderActionCard(change, htmlPath) {
  const context = change.operationalContext;
  const sourceRows = context?.sources?.map((source) => {
    const href = source.url?.startsWith("http")
      ? source.url
      : source.url
        ? relativeHref(htmlPath, source.url)
        : undefined;
    const label = href
      ? `<a href="${escapeHtml(href)}">${escapeHtml(source.title)}</a>`
      : escapeHtml(source.title);
    return `<li>${label} — ${escapeHtml(source.authority)}${source.note ? `<br>${escapeHtml(source.note)}` : ""}</li>`;
  }).join("") ?? "";
  const contextHtml = context
    ? `<div class="context"><strong>Operational context:</strong> ${escapeHtml(context.notice)}<br><strong>Evidence level:</strong> ${escapeHtml(context.evidenceLevel)}${sourceRows ? `<ul class="sources">${sourceRows}</ul>` : ""}</div>`
    : `<div class="context"><strong>Operational context:</strong> No matching tracked closure or reopening notice. Investigate this as unexpected drift.</div>`;
  const investigation = change.actionPlan.investigation.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const resolution = change.actionPlan.resolution.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  return `<section class="action"><h3>${escapeHtml(change.key)} — ${escapeHtml(change.actionPlan.title)}</h3><p><code>${escapeHtml(change.type)}</code>: ${escapeHtml(detail(change))}</p>${contextHtml}<p><strong>Allowed dispositions:</strong> <span class="dispositions">${escapeHtml(change.actionPlan.dispositions.join(" | "))}</span></p><h4>Investigation</h4><ol>${investigation}</ol><h4>Recommended resolution</h4><ol>${resolution}</ol></section>`;
}

function resolveOperationalNotices(inventory) {
  const sourcesById = new Map(
    (inventory.sources ?? []).map((source) => [source.id, source]),
  );
  return (inventory.branches ?? []).map((branch) => ({
    ...branch,
    sources: (branch.sourceIds ?? [])
      .map((sourceId) => sourcesById.get(sourceId))
      .filter(Boolean),
  }));
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
    branchStatus: "Operational branch status data",
    branchInventory: "Branch inventory and evidence notes",
    retirementLedger: "Seat-plan retirement ledger",
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
