import { readFile } from "node:fs/promises";
import {
  BASELINE_PATH,
  FINGERPRINT_PATH,
  RETIREMENTS_PATH,
  annotationKey,
  baselineAreaKey,
  fingerprintModule,
  inventoryMarkdown,
  loadDefinitions,
  parseInventory,
  readJson,
} from "./seat-plan-tools.mjs";

const [definitions, baseline, retirements, inventory, fingerprintSource, inventorySource] = await Promise.all([
  loadDefinitions(),
  readJson(BASELINE_PATH),
  readJson(RETIREMENTS_PATH),
  parseInventory(),
  readFile(FINGERPRINT_PATH, "utf8"),
  readFile(new URL("../docs/seat-plan-inventory.md", import.meta.url), "utf8"),
]);
const errors = [];
const baselineByKey = new Map(
  baseline.areas.map((area) => [
    annotationKey(area.branchId, area.areaId, area.mapPath),
    area,
  ]),
);
const definitionKeys = new Set();

for (const definition of definitions) {
  const key = annotationKey(
    definition.branchId,
    definition.areaId,
    definition.mapPath,
  );
  if (definitionKeys.has(key)) {
    errors.push(`${key}: duplicate definition`);
  }
  definitionKeys.add(key);
  const area = baselineByKey.get(key);
  if (!area) {
    errors.push(`${key}: missing baseline entry`);
    continue;
  }
  if (area.annotationStatus !== "implemented") {
    errors.push(`${key}: active definition points to a baseline area that is not marked implemented`);
  }
  if (
    area.image.width !== definition.imageWidth ||
    area.image.height !== definition.imageHeight
  ) {
    errors.push(`${key}: baseline dimensions do not match definition`);
  }
  if (!/^[a-f0-9]{64}$/.test(area.image.sha256)) {
    errors.push(`${key}: invalid SHA-256 fingerprint`);
  }
  const expectedNames = new Set(area.seats.map(({ name }) => name));
  const actualNames = new Set(definition.hotspots.map(({ seatName }) => seatName));
  if (
    definition.coverage === "complete" &&
    (expectedNames.size !== actualNames.size ||
      [...expectedNames].some((name) => !actualNames.has(name)))
  ) {
    errors.push(`${key}: complete coverage differs from baseline seats`);
  }
  const inventoryArea = inventory.get(
    baselineAreaKey({ branchId: definition.branchId, areaId: definition.areaId }),
  );
  if (!inventoryArea || inventoryArea.seatCount !== definition.hotspots.length) {
    errors.push(`${key}: inventory seat count differs from hotspots`);
  }
}

for (const key of baselineByKey.keys()) {
  const area = baselineByKey.get(key);
  if (area.annotationStatus === "implemented" && !definitionKeys.has(key)) {
    errors.push(`${key}: baseline has no annotation definition`);
  }
}

for (const entry of retirements.entries ?? []) {
  if (entry.scope === "branch") {
    const active = definitions.filter((definition) => definition.branchId === entry.key);
    if (active.length > 0) {
      errors.push(`${entry.key}: retired branch still has ${active.length} active annotation definition(s)`);
    }
  }
  if (entry.scope === "area") {
    const [branchId, areaId] = String(entry.key).split(":");
    if (definitions.some((definition) => definition.branchId === branchId && definition.areaId === areaId)) {
      errors.push(`${entry.key}: retired area still has an active annotation definition`);
    }
  }
}

if (fingerprintSource !== fingerprintModule(baseline)) {
  errors.push("src/data/seatPlanFingerprints.ts is stale; run npm run seat-plans:capture");
}
if (inventorySource !== inventoryMarkdown(baseline)) {
  errors.push("docs/seat-plan-inventory.md is stale; run npm run seat-plans:capture");
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Verified ${definitions.length} active definitions, ${baseline.areas.length} catalog baseline areas, ${definitionKeys.size} fingerprints, and ${retirements.entries?.length ?? 0} retirement records.`,
  );
}
