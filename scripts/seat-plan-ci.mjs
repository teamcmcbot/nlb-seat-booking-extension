import { spawn } from "node:child_process";
import { appendFile, copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { REPO_ROOT, IMAGE_CACHE, parseArgs, readJson } from "./seat-plan-tools.mjs";

const args = parseArgs(process.argv.slice(2));
if (Object.keys(args).some((key) => !["branch", "channel", "headless"].includes(key)) ||
    (args.branch !== undefined && !/^\d+$/.test(args.branch))) {
  throw new Error("Usage: npm run seat-plans:ci -- [--branch <numeric-id>] [--channel chrome] [--headless]");
}
const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
const runDir = path.join(REPO_ROOT, "seat-plan-work", `ci-${stamp}`);
await mkdir(runDir, { recursive: true });
const catalogPath = path.join(runDir, "catalog.json");
let exitCode = 1;
let status = "failed";
try {
  const collectArgs = ["scripts/seat-plan-collect.mjs", "--output", catalogPath];
  for (const key of ["branch", "channel", "headless"]) {
    if (args[key]) collectArgs.push(`--${key}`, ...(args[key] === true ? [] : [args[key]]));
  }
  const collectCode = await run(collectArgs);
  if (![0, 3].includes(collectCode)) throw new Error("Anonymous collection failed.");
  exitCode = await run(["scripts/seat-plan-full-audit.mjs", "--catalog", catalogPath, "--output", runDir]);
  if (![0, 2, 3].includes(exitCode)) throw new Error("Capture or audit failed.");
  const report = await readJson(path.join(runDir, "drift.json"));
  status = report.status;
  await writeFile(path.join(runDir, "summary.md"),
    `Seat-plan audit: **${status}**\n\n` +
    `Raw catalog: ${report.coverage.observed.branches} branches, ${report.coverage.observed.areas} areas, ${report.coverage.observed.seats} seats.\n\n` +
    `${report.coverage.images.checked} images checked; ${report.summary.total} changes. No baseline or annotations were changed.\n`);
} catch {
  status = "failed";
  exitCode = 1;
  await writeFile(path.join(runDir, "summary.md"), "Seat-plan audit: **failed**. Collection or image capture did not complete. This is not evidence of catalog removal or a clean audit. No baseline or annotations were changed.\n");
}

// Preserve repository-relative links in a portable, explicit-allowlist bundle.
// Never upload an entire work directory, browser profile, HAR, trace, or cache.
const bundleRoot = path.join(runDir, "bundle");
const evidenceDir = path.join(bundleRoot, path.relative(REPO_ROOT, runDir));
await mkdir(evidenceDir, { recursive: true });
for (const name of ["catalog.json", "candidate.json", "drift.json", "report.html", "summary.md"]) {
  await copyIfPresent(path.join(runDir, name), path.join(evidenceDir, name));
}
for (const relative of [
  "docs/data/seat-plan-baseline.json", "docs/data/branch-status.json", "docs/data/seat-plan-retirements.json",
  "docs/seat-plan-inventory.md", "docs/branch-inventory.md", "src/data/seatPlanFingerprints.ts",
]) await copyIfPresent(path.join(REPO_ROOT, relative), path.join(bundleRoot, relative));
for (const name of await readdir(path.join(REPO_ROOT, "src/data/seatPlans"))) {
  if (name.endsWith(".ts")) await copyIfPresent(path.join(REPO_ROOT, "src/data/seatPlans", name), path.join(bundleRoot, "src/data/seatPlans", name));
}
// Include only image bytes referenced by current or reviewed SHA-256 evidence.
// A fresh runner may not have the old artwork; record that gap explicitly.
const imageIndex = [];
for (const [label, file] of [["reviewed", "docs/data/seat-plan-baseline.json"], ["current", path.relative(REPO_ROOT, path.join(runDir, "candidate.json"))]]) {
  let data;
  try { data = await readJson(path.join(REPO_ROOT, file)); } catch { continue; }
  for (const area of data.areas) {
    const hash = area.image?.sha256;
    if (!/^[a-f0-9]{64}$/.test(hash ?? "")) continue;
    let imagePath;
    for (const extension of [".png", ".bin"]) {
      const name = `${hash}${extension}`;
      if (await copyIfPresent(path.join(IMAGE_CACHE, name), path.join(bundleRoot, "images", name))) {
        imagePath = `images/${name}`;
        break;
      }
    }
    imageIndex.push({ evidence: label, branchId: area.branchId, areaId: area.areaId, sha256: hash, path: imagePath ?? null });
  }
}
await writeFile(path.join(bundleRoot, "image-index.json"), `${JSON.stringify(imageIndex, null, 2)}\n`);
await writeFile(path.join(bundleRoot, "README.txt"), `Open ${path.relative(bundleRoot, evidenceDir)}/report.html after extracting the complete bundle.\nIf absent, read summary.md: collection or image capture failed.\nimage-index.json lists available evidence; null paths mean old artwork was not available on this runner.\n`);
const archive = path.join(runDir, "seat-plan-audit.tar.gz");
const tarCode = await runProcess("tar", ["-czf", archive, "-C", bundleRoot, "."]);
if (tarCode !== 0) throw new Error("Could not package audit evidence.");
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `artifact=${archive}\nstatus=${status}\n`);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, await readFile(path.join(runDir, "summary.md"), "utf8"));
console.log(`Audit ${status}; evidence bundle: ${path.relative(REPO_ROOT, archive)}`);
process.exitCode = exitCode;

async function copyIfPresent(source, target) {
  try { await mkdir(path.dirname(target), { recursive: true }); await copyFile(source, target); return true; }
  catch (error) { if (error.code === "ENOENT") return false; throw error; }
}
function run(argv) { return runProcess(process.execPath, argv); }
function runProcess(command, argv) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, argv, { cwd: REPO_ROOT, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => resolve(code ?? 1));
  });
}
