import { copyFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDirectory = join(projectRoot, "dist");
const noticeFiles = new Map([
  ["LICENSE", "LICENSE.txt"],
  ["NOTICE", "NOTICE.txt"],
  ["THIRD_PARTY_NOTICES", "THIRD_PARTY_NOTICES.txt"],
]);

if (!existsSync(distDirectory)) {
  throw new Error("Build output is missing dist/. Run Vite before copying notices.");
}

for (const [sourceName, targetName] of noticeFiles) {
  const sourcePath = join(projectRoot, sourceName);
  if (!existsSync(sourcePath)) {
    throw new Error(`Release notice is missing ${sourceName}.`);
  }
  copyFileSync(sourcePath, join(distDirectory, targetName));
}

console.log("Copied project and third-party notices into dist/.");
