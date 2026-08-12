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

const report = {
  schemaVersion: 1,
  baseline: path.relative(REPO_ROOT, baselinePath),
  snapshot: path.relative(REPO_ROOT, snapshotPath),
  generatedAt: new Date().toISOString(),
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
console.log(renderReport(report));
if (changes.length > 0) {
  process.exitCode = 2;
}

function compare(target, key, type, previous, current, severity) {
  if (previous !== current) {
    target.push({ severity, type, key, previous, current });
  }
}

function compareMapUrls(changes, key, previousUrls = [], currentUrls = []) {
  const previous = [...new Set(previousUrls)].sort();
  const current = [...new Set(currentUrls)].sort();
  if (JSON.stringify(previous) === JSON.stringify(current)) {
    return;
  }
  changes.push({
    severity: previous.length === 0 ? "enrichment" : "review",
    type: "map-urls",
    key,
    previous,
    current,
  });
}

function compareSeats(changes, key, previousSeats, currentSeats) {
  const unmatchedPrevious = new Set(previousSeats);
  for (const current of currentSeats) {
    const previous =
      previousSeats.find(
        (candidate) =>
          unmatchedPrevious.has(candidate) &&
          candidate.id &&
          current.id &&
          candidate.id === current.id,
      ) ??
      previousSeats.find(
        (candidate) =>
          unmatchedPrevious.has(candidate) && candidate.name === current.name,
      ) ??
      previousSeats.find(
        (candidate) =>
          unmatchedPrevious.has(candidate) &&
          canonicalSeatName(candidate.name) === canonicalSeatName(current.name),
      );
    if (!previous) {
      changes.push({ severity: "breaking", type: "seat-added", key, seat: current });
      continue;
    }
    unmatchedPrevious.delete(previous);
    compare(changes, key, "seat-name", previous.name, current.name, "breaking");
    compare(changes, key, "seat-id", previous.id, current.id, previous.id === undefined ? "enrichment" : "review");
    compare(changes, key, "seat-code", previous.code, current.code, previous.code === undefined ? "enrichment" : "review");
    compare(changes, key, "seat-disabled", previous.disabled, current.disabled, previous.disabled === undefined ? "enrichment" : "review");
  }
  for (const seat of unmatchedPrevious) {
    changes.push({ severity: "breaking", type: "seat-removed", key, seat });
  }
}

function canonicalSeatName(value) {
  const normalized = String(value ?? "").trim().toUpperCase();
  const match = normalized.match(/^([^0-9]*)([0-9]+)$/);
  return match ? `${match[1]}${Number(match[2])}` : normalized;
}

function renderReport(report) {
  const actionableChanges = report.changes.filter(
    ({ severity }) => severity !== "enrichment",
  );
  const lines = [
    "# Seat-plan drift report",
    "",
    `Changes: ${report.summary.total} (${report.summary.breaking} breaking, ${report.summary.review} review, ${report.summary.enrichment} baseline enrichment)`,
  ];
  if (report.changes.length === 0) {
    lines.push("", "No catalog or map drift detected.");
  } else if (actionableChanges.length > 0) {
    lines.push("", "| Severity | Area | Change | Details |", "| --- | --- | --- | --- |");
    for (const change of actionableChanges) {
      const details = change.seat
        ? JSON.stringify(change.seat)
        : `${JSON.stringify(change.previous)} → ${JSON.stringify(change.current)}`;
      lines.push(`| ${change.severity} | ${change.key} | ${change.type} | ${details} |`);
    }
  }
  if (report.summary.enrichment > 0) {
    lines.push(
      "",
      `${report.summary.enrichment} baseline-enrichment changes are retained in the JSON report and omitted from this table.`,
    );
  }
  return lines.join("\n");
}
