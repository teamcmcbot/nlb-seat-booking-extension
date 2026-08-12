import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  BASELINE_PATH,
  IMAGE_CACHE,
  REPO_ROOT,
  annotationKey,
  fetchMapImage,
  loadDefinitions,
  parseArgs,
  readJson,
} from "./seat-plan-tools.mjs";

const args = parseArgs(process.argv.slice(2));
if (!args.area) {
  throw new Error("Usage: npm run seat-plans:prepare -- --area <area-id> [--branch <branch-id>] [--snapshot <file>]");
}
const baseline = await readJson(BASELINE_PATH);
const definitions = await loadDefinitions();
const candidates = baseline.areas.filter(
  (area) =>
    area.areaId === String(args.area) &&
    (!args.branch || area.branchId === String(args.branch)),
);
if (candidates.length !== 1) {
  throw new Error(`Expected exactly one matching baseline area, found ${candidates.length}.`);
}
const baselineArea = candidates[0];
const currentSnapshot = args.snapshot
  ? await readJson(path.resolve(REPO_ROOT, args.snapshot))
  : baseline;
const currentArea = currentSnapshot.areas.find(
  (area) => area.branchId === baselineArea.branchId && area.areaId === baselineArea.areaId,
);
if (!currentArea) {
  throw new Error("The selected area is absent from the current snapshot.");
}
const definition = definitions.find(
  (candidate) =>
    annotationKey(candidate.branchId, candidate.areaId, candidate.mapPath) ===
    annotationKey(baselineArea.branchId, baselineArea.areaId, baselineArea.mapPath),
);
if (!definition) {
  throw new Error("The selected baseline area has no current annotation definition.");
}

const outputDir = path.resolve(
  REPO_ROOT,
  args.output || `seat-plan-work/${baselineArea.branchId}-${baselineArea.areaId}`,
);
await mkdir(outputDir, { recursive: true });
const currentImage = await fetchMapImage(currentArea.mapPath, { refresh: true });
if (currentArea.image?.sha256 !== currentImage.sha256) {
  throw new Error(
    "The current map changed after the candidate snapshot was captured. Capture and audit again.",
  );
}
const currentName = `current-${currentImage.sha256}.png`;
await copyFile(path.join(IMAGE_CACHE, currentImage.cacheFile), path.join(outputDir, currentName));
const scaleX = numberArg(args["scale-x"], currentImage.width / definition.imageWidth);
const scaleY = numberArg(args["scale-y"], currentImage.height / definition.imageHeight);
const translateX = numberArg(args["translate-x"], 0);
const translateY = numberArg(args["translate-y"], 0);
const proposedDefinition = {
  ...definition,
  imageWidth: currentImage.width,
  imageHeight: currentImage.height,
  hotspots: definition.hotspots.map((hotspot) => ({
    ...hotspot,
    x: round(hotspot.x * scaleX + translateX),
    y: round(hotspot.y * scaleY + translateY),
    width: round(hotspot.width * scaleX),
    height: round(hotspot.height * scaleY),
  })),
};

const baselinePointer = await findCachedImage(baselineArea.image.sha256);
let baselineName;
if (baselinePointer) {
  baselineName = `baseline-${baselineArea.image.sha256}.png`;
  await copyFile(baselinePointer, path.join(outputDir, baselineName));
}

await writeFile(
  path.join(outputDir, "current-original-overlay.svg"),
  renderOverlay(
    { ...definition, imageWidth: currentImage.width, imageHeight: currentImage.height },
    currentName,
  ),
);
await writeFile(
  path.join(outputDir, "proposed-overlay.svg"),
  renderOverlay(proposedDefinition, currentName),
);
await writeFile(
  path.join(outputDir, "proposed-hotspots.json"),
  `${JSON.stringify(
    {
      proposalOnly: true,
      transform: { scaleX, scaleY, translateX, translateY },
      imageWidth: currentImage.width,
      imageHeight: currentImage.height,
      hotspots: proposedDefinition.hotspots,
    },
    null,
    2,
  )}\n`,
);
if (baselineName) {
  await writeFile(
    path.join(outputDir, "baseline-overlay.svg"),
    renderOverlay(definition, baselineName),
  );
}
await writeFile(
  path.join(outputDir, "comparison.html"),
  renderComparison(Boolean(baselineName)),
);
await writeFile(
  path.join(outputDir, "report.md"),
  renderReport({ baselineArea, currentArea, definition, baselineName, currentName }),
);
console.log(`Prepared ${path.relative(REPO_ROOT, outputDir)}.`);

async function findCachedImage(digest) {
  for (const extension of [".png", ".bin"]) {
    const candidate = path.join(IMAGE_CACHE, `${digest}${extension}`);
    try {
      await readFile(candidate);
      return candidate;
    } catch {
      // Try the next known extension.
    }
  }
  return undefined;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function renderOverlay(plan, imageName) {
  const shapes = plan.hotspots
    .map(
      (hotspot) => `  <g><rect x="${hotspot.x}" y="${hotspot.y}" width="${hotspot.width}" height="${hotspot.height}"/><title>${escapeXml(hotspot.seatName)}</title><text x="${hotspot.x + 2}" y="${hotspot.y + 12}">${escapeXml(hotspot.seatName)}</text></g>`,
    )
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${plan.imageWidth}" height="${plan.imageHeight}" viewBox="0 0 ${plan.imageWidth} ${plan.imageHeight}">
  <image href="${escapeXml(imageName)}" width="100%" height="100%"/>
  <style>rect{fill:#00834a22;stroke:#00834a;stroke-width:2}text{font:11px sans-serif;fill:#111;paint-order:stroke;stroke:#fff;stroke-width:3px}</style>
${shapes}
</svg>\n`;
}

function renderReport({ baselineArea, currentArea, definition, baselineName, currentName }) {
  const oldNames = new Set(baselineArea.seats.map(({ name }) => name));
  const newNames = new Set(currentArea.seats.map(({ name }) => name));
  const added = [...newNames].filter((name) => !oldNames.has(name));
  const removed = [...oldNames].filter((name) => !newNames.has(name));
  return `# Seat-plan maintenance work packet

- Branch: ${baselineArea.branchName} (${baselineArea.branchId})
- Area: ${baselineArea.areaName} (${baselineArea.areaId})
- Label type: ${baselineArea.labelType}
- Baseline map: \`${baselineArea.mapPath}\`
- Current map: \`${currentArea.mapPath}\`
- Baseline SHA-256: \`${baselineArea.image.sha256}\`
- Current SHA-256: \`${currentArea.image.sha256}\`
- Baseline image cached: ${baselineName ? "yes" : "no"}
- Current image: \`${currentName}\`
- Existing hotspots: ${definition.hotspots.length}
- Added seats: ${added.length ? added.join(", ") : "none"}
- Removed seats: ${removed.length ? removed.join(", ") : "none"}

Open \`comparison.html\` and compare every hotspot against the current image. Generated coordinates are proposals only; do not ship them without visual review.
`;
}

function renderComparison(hasBaseline) {
  const baseline = hasBaseline
    ? '<section><h2>Reviewed baseline</h2><iframe src="baseline-overlay.svg"></iframe></section>'
    : '<section><h2>Reviewed baseline</h2><p>The baseline image is not available in the local cache.</p></section>';
  return `<!doctype html>
<html lang="en"><meta charset="utf-8"><title>Seat-plan comparison</title>
<style>body{font:16px system-ui;margin:16px}main{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}iframe{width:100%;height:80vh;border:1px solid #777}@media(max-width:1100px){main{grid-template-columns:1fr}}</style>
<h1>Seat-plan annotation comparison</h1><p>The transformed overlay is a proposal and requires seat-by-seat review.</p><main>${baseline}<section><h2>Current image, old coordinates</h2><iframe src="current-original-overlay.svg"></iframe></section><section><h2>Scale/translate proposal</h2><iframe src="proposed-overlay.svg"></iframe></section></main></html>\n`;
}

function numberArg(value, fallback) {
  if (value === undefined) {
    return fallback;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Invalid transform value: ${value}`);
  }
  return number;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
