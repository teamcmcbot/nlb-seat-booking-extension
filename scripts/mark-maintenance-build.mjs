import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(
  path.dirname(fileURLToPath(import.meta.url)),
);
const manifestPath = path.join(projectRoot, "dist", "manifest.json");
const packagePath = path.join(projectRoot, "package.json");
const [manifest, packageMetadata] = await Promise.all(
  [manifestPath, packagePath].map(async (filePath) =>
    JSON.parse(await readFile(filePath, "utf8")),
  ),
);

if (manifest.version !== packageMetadata.version) {
  throw new Error(
    `Cannot mark maintenance build: manifest version ${manifest.version} ` +
      `does not match package version ${packageMetadata.version}.`,
  );
}

manifest.name = "Library Seats SG - for NLB (Maintenance)";
manifest.description =
  "Developer-only maintenance build for seat-plan audits. Not for normal use.";
manifest.version_name = `${manifest.version}-maintenance`;

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Marked dist/manifest.json as maintenance version ${manifest.version_name}.`,
);
