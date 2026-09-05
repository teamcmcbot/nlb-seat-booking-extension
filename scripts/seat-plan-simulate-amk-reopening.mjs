import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import {
  BASELINE_PATH,
  REPO_ROOT,
  readJson,
  sortAreas,
  writeJson,
} from "./seat-plan-tools.mjs";

const outputDir = path.resolve(
  REPO_ROOT,
  "seat-plan-work/simulations/ang-mo-kio-reopening-2026-11-20",
);
await mkdir(outputDir, { recursive: true });

const baseline = await readJson(BASELINE_PATH);
const packageMetadata = await readJson(path.join(REPO_ROOT, "package.json"));
const syntheticSeats = Array.from({ length: 12 }, (_, index) => ({
  id: `SIM-AMK-${index + 1}`,
  name: `AMK-S${index + 1}`,
  disabled: false,
}));
const syntheticRawArea = {
  branchId: "SIM-AMK-2026",
  branchCode: "AMPL-SIM",
  branchName: "Ang Mo Kio Library",
  areaId: "SIM-AMK-AREA-1",
  areaName: "Simulated Study Area at AMK Hub",
  floor: "SIM",
  areaMapUrls: [],
  seats: syntheticSeats,
};
const syntheticCandidateArea = {
  branchId: syntheticRawArea.branchId,
  branchCode: syntheticRawArea.branchCode,
  branchName: syntheticRawArea.branchName,
  areaId: syntheticRawArea.areaId,
  areaName: syntheticRawArea.areaName,
  floor: syntheticRawArea.floor,
  labelType: "unknown",
  observedMapUrls: [],
  seats: syntheticSeats,
  catalogState: "present",
  seatSource: "catalog",
  annotationStatus: "missing",
};
const currentRawAreas = baseline.areas
  .filter((area) => String(area.branchId) !== "25")
  .map((area) => ({
    branchId: area.branchId,
    branchCode: area.branchCode,
    branchName: area.branchName,
    areaId: area.areaId,
    areaName: area.areaName,
    floor: area.floor,
    areaMapUrls: area.observedMapUrls ?? [],
    seats: area.seats,
  }));
const snapshot = {
  ...baseline,
  observedAt: "2026-11-20T04:00:00.000Z",
  catalogSource: "sanitized-get-account-info",
  catalogEvidence: {
    capturedAt: "2026-11-20T04:00:00.000Z",
    exportMetadata: {
      extensionVersion: packageMetadata.version,
      mode: "catalog",
    },
  },
  simulation: {
    title: "Ang Mo Kio Library reopening catalog scenario",
    description: "Synthetic November 2026 scenario after Queenstown retirement: a new Ang Mo Kio branch with one placeholder area and 12 placeholder seats appears. IDs, counts, areas, seats, maps, and opening status must be replaced by fresh live evidence during a real audit.",
    scenarioDate: "2026-11-20",
  },
  rawCatalogAreas: sortAreas([...currentRawAreas, syntheticRawArea]),
  areas: sortAreas([...baseline.areas, syntheticCandidateArea]),
};

const candidatePath = path.join(outputDir, "candidate.json");
const reportPath = path.join(outputDir, "drift.json");
const htmlPath = path.join(outputDir, "report.html");
await writeJson(candidatePath, snapshot);
const exitCode = await runNode([
  "scripts/seat-plan-audit.mjs",
  "--snapshot", candidatePath,
  "--output", reportPath,
  "--html", htmlPath,
]);
if (exitCode !== 2) {
  throw new Error(`Expected the simulation to produce drift exit code 2, received ${exitCode}.`);
}
console.log(`Simulation candidate: ${path.relative(REPO_ROOT, candidatePath)}`);
console.log(`Simulation JSON report: ${path.relative(REPO_ROOT, reportPath)}`);
console.log(`Simulation HTML report: ${path.relative(REPO_ROOT, htmlPath)}`);

function runNode(argv) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, argv, { cwd: REPO_ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) reject(new Error(`Simulation terminated by ${signal}.`));
      else resolve(code ?? 1);
    });
  });
}
