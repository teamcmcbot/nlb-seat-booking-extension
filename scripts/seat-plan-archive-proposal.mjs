import path from "node:path";
import {
  BASELINE_PATH,
  REPO_ROOT,
  loadDefinitions,
  parseArgs,
  readJson,
  writeJson,
} from "./seat-plan-tools.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.report || (!args.branch && !args.area) || (args.branch && args.area)) {
  throw new Error(
    "Usage: npm run seat-plans:archive-proposal -- --report <drift.json> (--branch <branch-id> | --area <branch-id:area-id>) [--output <proposal.json>]",
  );
}

const reportPath = path.resolve(REPO_ROOT, args.report);
const report = await readJson(reportPath);
const baseline = await readJson(BASELINE_PATH);
const definitions = await loadDefinitions();
const scope = args.branch ? "branch" : "area";
const key = String(args.branch ?? args.area);
const expectedType = `${scope}-removed`;
const change = report.changes?.find(
  (candidate) => candidate.type === expectedType && String(candidate.key) === key,
);
if (!change) {
  throw new Error(`${expectedType}:${key} is not an unresolved change in ${args.report}.`);
}

const [branchId, areaId] = scope === "branch" ? [key, undefined] : key.split(":");
const catalogAreas = baseline.areas.filter(
  (area) =>
    String(area.branchId) === branchId &&
    (areaId === undefined || String(area.areaId) === areaId),
);
const annotationDefinitions = definitions.filter(
  (definition) =>
    String(definition.branchId) === branchId &&
    (areaId === undefined || String(definition.areaId) === areaId),
);
if (catalogAreas.length === 0) {
  throw new Error(`${scope} ${key} has no reviewed baseline evidence to archive.`);
}

const proposal = {
  schemaVersion: 1,
  proposalOnly: true,
  scope,
  key,
  generatedAt: new Date().toISOString(),
  sourceReport: path.relative(REPO_ROOT, reportPath),
  operationalContext: change.operationalContext,
  impact: {
    areas: catalogAreas.length,
    seats: catalogAreas.reduce((total, area) => total + (area.seats?.length ?? 0), 0),
    annotationDefinitions: annotationDefinitions.length,
  },
  catalogAreas,
  annotationDefinitions,
  reactivationPolicy:
    "Treat reappearance as new catalog drift. Recheck stable IDs, every seat, exact map bytes, dimensions, fingerprint, and every hotspot before restoring runtime definitions.",
  acceptanceChecklist: [
    "Confirm the removal using complete catalog evidence and dated operational evidence.",
    "Review this proposal for personal data; only sanitized catalog and annotation evidence may be retained.",
    "Append an approved retirement entry to docs/data/seat-plan-retirements.json.",
    "Remove retired definitions from the active runtime index and update the accepted baseline, fingerprints, generated inventory, tests, and documentation.",
    "Rerun seat-plans:verify, tests, typecheck, build, and a fresh audit.",
  ],
};

const safeKey = key.replaceAll(/[^a-zA-Z0-9.-]+/g, "-");
const outputPath = path.resolve(
  REPO_ROOT,
  args.output || path.join(path.dirname(reportPath), `archive-proposal-${scope}-${safeKey}.json`),
);
await writeJson(outputPath, proposal);
console.log(`Wrote archive proposal to ${path.relative(REPO_ROOT, outputPath)}.`);
console.log("Proposal only: no baseline, annotation definition, fingerprint, inventory, or retirement ledger was changed.");
