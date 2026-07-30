import { execFileSync } from "node:child_process";
import {
  existsSync,
  readFileSync,
  rmSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const distDirectory = join(projectRoot, "dist");
const outputPath = join(projectRoot, "nlb-seat-helper.zip");
const requiredFiles = ["manifest.json", "content.js", "content.css"];

for (const file of requiredFiles) {
  if (!existsSync(join(distDirectory, file))) {
    throw new Error(`Build output is missing dist/${file}.`);
  }
}

const packageJson = JSON.parse(
  readFileSync(join(projectRoot, "package.json"), "utf8"),
);
const manifest = JSON.parse(
  readFileSync(join(distDirectory, "manifest.json"), "utf8"),
);

if (packageJson.version !== manifest.version) {
  throw new Error(
    `Version mismatch: package.json is ${packageJson.version}, ` +
      `but manifest.json is ${manifest.version}.`,
  );
}

rmSync(outputPath, { force: true });
execFileSync("zip", ["-q", "-r", outputPath, "."], {
  cwd: distDirectory,
  stdio: "inherit",
});

console.log(
  `Created nlb-seat-helper.zip for version ${manifest.version}.`,
);
