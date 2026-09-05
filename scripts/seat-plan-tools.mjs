import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";

export const REPO_ROOT = path.resolve(import.meta.dirname, "..");
export const BASELINE_PATH = path.join(
  REPO_ROOT,
  "docs/data/seat-plan-baseline.json",
);
export const FINGERPRINT_PATH = path.join(
  REPO_ROOT,
  "src/data/seatPlanFingerprints.ts",
);
export const INVENTORY_PATH = path.join(
  REPO_ROOT,
  "docs/seat-plan-inventory.md",
);
export const BRANCH_STATUS_PATH = path.join(
  REPO_ROOT,
  "docs/data/branch-status.json",
);
export const RETIREMENTS_PATH = path.join(
  REPO_ROOT,
  "docs/data/seat-plan-retirements.json",
);
export const IMAGE_CACHE = path.join(REPO_ROOT, ".cache/seat-plans");
export const MAP_BASE_URL = "https://www.nlb.gov.sg/seatbooking/img/areas/";

export function parseArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      values[key] = next;
      index += 1;
    } else {
      values[key] = true;
    }
  }
  return values;
}

export function annotationKey(branchId, areaId, mapPath) {
  return `${branchId}:${areaId}:${normalizeMapPath(mapPath)}`;
}

export function normalizeMapPath(value) {
  return String(value ?? "")
    .trim()
    .replace(/^https?:\/\/[^/]+\//, "")
    .replace(/^\/+/, "")
    .replace(/^seatbooking\/img\/areas\//, "");
}

export function mapUrl(mapPath) {
  return new URL(normalizeMapPath(mapPath), MAP_BASE_URL).href;
}

export function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function loadDefinitions() {
  const result = await build({
    absWorkingDir: REPO_ROOT,
    stdin: {
      contents:
        'import { SEAT_PLAN_DEFINITIONS } from "./src/data/seatPlans/index.ts"; export default SEAT_PLAN_DEFINITIONS;',
      resolveDir: REPO_ROOT,
      sourcefile: "seat-plan-definition-loader.ts",
    },
    bundle: true,
    format: "esm",
    platform: "node",
    target: "node22",
    write: false,
  });
  const source = result.outputFiles[0].text;
  const module = await import(
    `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
  );
  return module.default;
}

export async function parseInventory() {
  const markdown = await readFile(INVENTORY_PATH, "utf8");
  const rows = new Map();
  let branchName;
  let branchId;

  for (const line of markdown.split(/\r?\n/)) {
    const heading = line.match(/^### (.+) \(branch (\d+)\)$/);
    if (heading) {
      [, branchName, branchId] = heading;
      continue;
    }
    if (!branchId || !line.startsWith("| ") || line.includes("---")) {
      continue;
    }
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((cell) => cell.trim().replaceAll("**", ""));
    if (!/^\d+$/.test(cells[0] ?? "")) {
      continue;
    }
    const [areaId, areaName, seatCount, labelType, mapCell, size] = cells;
    const mapMatch = mapCell.match(/`([^`]+)`/);
    const sizeMatch = size.match(/(\d+)×(\d+)/);
    if (!mapMatch || !sizeMatch) {
      throw new Error(`Cannot parse inventory row: ${line}`);
    }
    rows.set(`${branchId}:${areaId}`, {
      branchId,
      branchName,
      areaId,
      areaName,
      seatCount: Number(seatCount),
      labelType: labelType.toLowerCase(),
      mapPath: mapMatch[1],
      imageWidth: Number(sizeMatch[1]),
      imageHeight: Number(sizeMatch[2]),
    });
  }
  return rows;
}

function pngDimensions(buffer) {
  const signature = "89504e470d0a1a0a";
  if (buffer.length < 24 || buffer.subarray(0, 8).toString("hex") !== signature) {
    return undefined;
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

export function imageDimensions(buffer, contentType = "") {
  if (contentType.includes("png") || buffer.subarray(1, 4).toString() === "PNG") {
    return pngDimensions(buffer);
  }
  return undefined;
}

export async function fetchMapImage(mapPath, { refresh = false } = {}) {
  await mkdir(IMAGE_CACHE, { recursive: true });
  const url = mapUrl(mapPath);
  const requestKey = sha256(Buffer.from(url));
  const pointerPath = path.join(IMAGE_CACHE, `${requestKey}.json`);

  if (!refresh) {
    try {
      const pointer = await readJson(pointerPath);
      const bytes = await readFile(path.join(IMAGE_CACHE, pointer.cacheFile));
      return { ...pointer, bytes, fromCache: true };
    } catch {
      // A missing or incomplete cache entry is fetched below.
    }
  }

  const response = await fetch(url, {
    headers: { accept: "image/*" },
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`Map fetch failed (${response.status}) for ${url}`);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  const digest = sha256(bytes);
  const contentType = response.headers.get("content-type") ?? "application/octet-stream";
  const dimensions = imageDimensions(bytes, contentType);
  if (!dimensions) {
    throw new Error(`Unsupported map image format for ${url}: ${contentType}`);
  }
  const extension = contentType.includes("png") ? ".png" : ".bin";
  const cacheFile = `${digest}${extension}`;
  await writeFile(path.join(IMAGE_CACHE, cacheFile), bytes);
  const pointer = {
    url,
    cacheFile,
    sha256: digest,
    byteLength: bytes.length,
    contentType,
    width: dimensions.width,
    height: dimensions.height,
    etag: response.headers.get("etag") ?? undefined,
    lastModified: response.headers.get("last-modified") ?? undefined,
  };
  await writeJson(pointerPath, pointer);
  return { ...pointer, bytes, fromCache: false };
}

export function normalizedCatalogAreas(catalog) {
  if (!catalog) {
    return new Map();
  }
  const branches = Array.isArray(catalog) ? catalog : catalog.branches;
  if (!Array.isArray(branches)) {
    throw new Error("Catalog must be an array of branches or { branches: [...] }.");
  }
  const areas = new Map();
  for (const branch of branches) {
    for (const area of branch.areas ?? []) {
      const branchId = String(branch.id ?? area.branchId ?? "");
      const areaId = String(area.id ?? "");
      if (!branchId || !areaId) {
        throw new Error("Every catalog branch and area must have an ID.");
      }
      areas.set(`${branchId}:${areaId}`, {
        branchId,
        branchCode: stringOrUndefined(branch.code ?? area.branchCode),
        branchName: String(branch.name ?? area.branchName ?? ""),
        areaId,
        areaName: String(area.name ?? ""),
        floor: stringOrUndefined(area.floor),
        areaMapUrls: uniqueStrings(area.areaMapUrls ?? []),
        seats: (area.seats ?? []).map((seat) => ({
          id: String(seat.id ?? ""),
          code: stringOrUndefined(seat.code),
          name: String(seat.name ?? ""),
          disabled: Boolean(seat.disabled),
        })),
      });
    }
  }
  return areas;
}

function stringOrUndefined(value) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function uniqueStrings(values) {
  return [...new Set(values.filter((value) => typeof value === "string" && value.trim()))];
}

export function fingerprintModule(baseline) {
  const entries = baseline.areas
    .filter(
      (area) =>
        area.annotationStatus === "implemented" &&
        area.mapPath &&
        area.image?.sha256,
    )
    .map((area) => [
      annotationKey(area.branchId, area.areaId, area.mapPath),
      area.image.sha256,
    ])
    .sort(([left], [right]) => left.localeCompare(right));
  return `// Generated by npm run seat-plans:capture. Do not edit manually.\nexport const SEAT_PLAN_FINGERPRINTS: Readonly<Record<string, string>> = ${JSON.stringify(Object.fromEntries(entries), null, 2)};\n`;
}

export async function writeFingerprintModule(baseline) {
  await writeFile(FINGERPRINT_PATH, fingerprintModule(baseline));
}

export function inventoryMarkdown(baseline) {
  const branchIds = new Set(baseline.areas.map(({ branchId }) => branchId));
  const mapped = baseline.areas.filter(
    ({ annotationStatus }) => annotationStatus === "implemented",
  );
  const labelCount = (type) =>
    baseline.areas.filter(({ labelType }) => labelType === type).length;
  const lines = [
    "# Seat-plan inventory",
    "",
    `Generated from \`docs/data/seat-plan-baseline.json\`, observed ${baseline.observedAt}.`,
    "It is point-in-time evidence, not a stable NLB API contract. Run the",
    "maintenance capture and audit before changing or releasing annotations.",
    "",
    "## Summary",
    "",
    "| Item | Count |",
    "| --- | ---: |",
    `| Branch entries | ${branchIds.size} |`,
    `| Areas | ${baseline.areas.length} |`,
    `| Areas with a seat-plan image | ${baseline.areas.filter(({ image }) => image).length} |`,
    `| Fully labelled plans | ${labelCount("full")} |`,
    `| Range-only plans | ${labelCount("range")} |`,
    `| Hybrid plans | ${labelCount("hybrid")} |`,
    `| Implemented clickable annotations | ${mapped.length} |`,
    `| Pending clickable annotations | ${baseline.areas.length - mapped.length} |`,
    "",
    "The SHA-256 column is abbreviated for review. The complete digest and seat",
    "identity set are retained in the machine-readable baseline.",
  ];
  const groups = new Map();
  for (const area of baseline.areas) {
    const group = groups.get(area.branchId) ?? [];
    group.push(area);
    groups.set(area.branchId, group);
  }
  for (const areas of groups.values()) {
    const first = areas[0];
    lines.push(
      "",
      `### ${first.branchName} (branch ${first.branchId})`,
      "",
      "| Area ID | Area | Seats | Labels | Map asset | Size | SHA-256 | Annotation |",
      "| ---: | --- | ---: | --- | --- | ---: | --- | --- |",
    );
    for (const area of areas) {
      const mapPath = area.mapPath ? `\`${area.mapPath}\`` : "—";
      const size = area.image ? `${area.image.width}×${area.image.height}` : "—";
      const digest = area.image ? `\`${area.image.sha256.slice(0, 12)}…\`` : "—";
      const annotation =
        area.annotationStatus === "implemented" ? "**Done**" : "**Pending**";
      lines.push(
        `| ${area.areaId} | ${area.areaName} | ${area.seats.length} | ${titleCase(area.labelType)} | ${mapPath} | ${size} | ${digest} | ${annotation} |`,
      );
    }
  }
  return `${lines.join("\n")}\n`;
}

function titleCase(value) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : "Unknown";
}

export async function writeInventory(baseline) {
  await writeFile(INVENTORY_PATH, inventoryMarkdown(baseline));
}

export function baselineAreaKey(area) {
  return `${area.branchId}:${area.areaId}`;
}

export function sortAreas(areas) {
  return [...areas].sort(
    (left, right) =>
      Number(left.branchId) - Number(right.branchId) ||
      Number(left.areaId) - Number(right.areaId),
  );
}
