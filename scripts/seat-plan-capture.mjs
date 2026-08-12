import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  BASELINE_PATH,
  REPO_ROOT,
  fetchMapImage,
  loadDefinitions,
  normalizedCatalogAreas,
  normalizeMapPath,
  parseArgs,
  parseInventory,
  sortAreas,
  writeFingerprintModule,
  writeInventory,
  writeJson,
} from "./seat-plan-tools.mjs";

const args = parseArgs(process.argv.slice(2));
const outputPath = path.resolve(REPO_ROOT, args.output || BASELINE_PATH);
const catalog = args.catalog
  ? JSON.parse(await readFile(path.resolve(REPO_ROOT, args.catalog), "utf8"))
  : undefined;
const catalogAreas = normalizedCatalogAreas(catalog);
const definitions = await loadDefinitions();
const inventory = await parseInventory();
const areas = [];
const capturedAreaIds = new Set();

for (const [index, definition] of definitions.entries()) {
  const identity = `${definition.branchId}:${definition.areaId}`;
  const inventoryArea = inventory.get(identity);
  const catalogArea = catalogAreas.get(identity);
  if (!inventoryArea) {
    throw new Error(`Inventory is missing ${identity}.`);
  }
  const observedMapPath = chooseMapPath(catalogArea?.areaMapUrls);
  const mapPath = normalizeMapPath(observedMapPath || definition.mapPath);
  process.stdout.write(
    `[${index + 1}/${definitions.length}] ${identity} ${mapPath}\n`,
  );
  const image = await fetchMapImage(mapPath, {
    refresh: !args["cache-only"],
  });
  if (
    !catalog &&
    (image.width !== definition.imageWidth ||
      image.height !== definition.imageHeight)
  ) {
    throw new Error(
      `${identity} image is ${image.width}x${image.height}; annotation expects ${definition.imageWidth}x${definition.imageHeight}.`,
    );
  }
  const annotationSeatNames = definition.hotspots.map(({ seatName }) => seatName);
  const seats = catalogArea?.seats.length
    ? catalogArea.seats
    : annotationSeatNames.map((name) => ({ name }));
  areas.push({
    branchId: definition.branchId,
    branchCode: catalogArea?.branchCode,
    branchName: catalogArea?.branchName || inventoryArea.branchName,
    areaId: definition.areaId,
    areaName: catalogArea?.areaName || inventoryArea.areaName,
    floor: catalogArea?.floor,
    labelType: inventoryArea.labelType,
    mapPath,
    observedMapUrls: catalogArea?.areaMapUrls ?? [],
    image: {
      width: image.width,
      height: image.height,
      sha256: image.sha256,
      byteLength: image.byteLength,
      contentType: image.contentType,
      etag: image.etag,
      lastModified: image.lastModified,
    },
    seats,
    annotationStatus: "implemented",
  });
  capturedAreaIds.add(identity);
}

for (const catalogArea of catalogAreas.values()) {
  const identity = `${catalogArea.branchId}:${catalogArea.areaId}`;
  if (capturedAreaIds.has(identity)) {
    continue;
  }
  const observedMapPath = chooseMapPath(catalogArea.areaMapUrls);
  let image;
  if (observedMapPath) {
    const fetched = await fetchMapImage(observedMapPath, {
      refresh: !args["cache-only"],
    });
    image = {
      width: fetched.width,
      height: fetched.height,
      sha256: fetched.sha256,
      byteLength: fetched.byteLength,
      contentType: fetched.contentType,
      etag: fetched.etag,
      lastModified: fetched.lastModified,
    };
  }
  areas.push({
    ...catalogArea,
    labelType: "unknown",
    mapPath: observedMapPath ? normalizeMapPath(observedMapPath) : undefined,
    observedMapUrls: catalogArea.areaMapUrls,
    image,
    annotationStatus: "missing",
  });
}

const baseline = {
  schemaVersion: 1,
  observedAt: new Date().toISOString(),
  catalogSource: catalog
    ? "sanitized-get-account-info"
    : "reviewed-annotation-inventory",
  imageSource: "nlb-seat-plan-assets",
  areas: sortAreas(areas),
};

await writeJson(outputPath, baseline);
if (outputPath === BASELINE_PATH) {
  await writeFingerprintModule(baseline);
  await writeInventory(baseline);
}
console.log(`Wrote ${areas.length} areas to ${path.relative(REPO_ROOT, outputPath)}.`);

function chooseMapPath(urls = []) {
  return (
    urls.find((value) => /-sp(?:-|\.|\?)/i.test(value)) ??
    urls[0]
  );
}
