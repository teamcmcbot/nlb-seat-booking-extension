import { chromium } from "playwright";
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { access } from "node:fs/promises";
import { REPO_ROOT, parseArgs, readJson, writeJson } from "./seat-plan-tools.mjs";
import { browserJson } from "./seat-plan-browser-json.mjs";
import { collectorRequestPolicy } from "./seat-plan-collector-network.mjs";
import { COLLECTOR_VERSION } from "./seat-plan-export-provenance.mjs";

const ORIGIN = "https://www.nlb.gov.sg";
const ACCOUNT = "/seatbooking/api/accounts/GetAccountInfo";
const SEARCH = "/seatbooking/api/areas/SearchAvailableAreas";
const args = parseArgs(process.argv.slice(2));
if (!args.output || Object.keys(args).some((key) => !["output", "branch", "channel", "headless"].includes(key)) ||
    (args.branch !== undefined && !/^\d+$/.test(args.branch)) ||
    (args.channel !== undefined && args.channel !== "chrome")) {
  throw new Error("Usage: npm run seat-plans:collect -- --output <new-catalog.json> [--branch <numeric-id>] [--channel chrome] [--headless]");
}
const output = path.resolve(REPO_ROOT, args.output);
// A failed run must never leave an old catalog looking like fresh evidence.
try { await access(output); throw new Error("Output already exists; choose a fresh catalog path."); }
catch (error) { if (error.code !== "ENOENT") throw error; }
process.env.TZ = "Asia/Singapore";
const compiled = await build({
  entryPoints: [path.join(REPO_ROOT, "scripts/seat-plan-collector-contract.ts")],
  bundle: true, platform: "node", format: "esm", target: "node22", write: false,
});
const { anonymousCatalog, catalogCounts, sanitizedSeatPlanCatalog, discoverBranchSeatPlanMetadata } =
  await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString("base64")}`);
const packageMetadata = await readJson(path.join(REPO_ROOT, "package.json"));
const metadata = {
  source: "anonymous-browser", collectorVersion: COLLECTOR_VERSION,
  repositoryVersion: packageMetadata.version,
  sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: REPO_ROOT, encoding: "utf8" }).trim(),
  sourceDirty: execFileSync("git", ["status", "--porcelain"], { cwd: REPO_ROOT, encoding: "utf8" }).trim().length > 0,
  anonymous: true, mode: args.branch ? "targeted-discovery" : "catalog",
};
let browser;
let context;
let phase = "browser startup";
try {
  browser = await chromium.launch({ headless: Boolean(args.headless), ...(args.channel ? { channel: args.channel } : {}) });
  context = await browser.newContext({ timezoneId: "Asia/Singapore", locale: "en-SG", serviceWorkers: "block", acceptDownloads: false });
  const policy = collectorRequestPolicy();
  // No account mutation, login navigation, or unbounded native UI API traffic.
  await context.route("**/*", async (route) => {
    const request = route.request();
    return policy.allow(request.url(), request.method(), request.resourceType()) ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);
  phase = "anonymous GetAccountInfo during page initialization";
  // Reuse NLB's own startup request: no second account refresh is needed.
  const accountResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return url.origin === ORIGIN && url.pathname === ACCOUNT;
  }).catch(() => null);
  await page.goto(`${ORIGIN}/seatbooking/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
  const response = await accountResponse;
  if (!response || response.status() !== 200 || !response.headers()["content-type"]?.includes("application/json")) {
    throw new Error("No successful anonymous JSON catalog response.");
  }
  phase = "catalog validation";
  const catalog = anonymousCatalog(await response.json());
  const counts = catalogCounts(catalog);
  console.log(`Anonymous catalog: ${counts.branches} branches, ${counts.areas} areas, ${counts.seats} seats.`);
  let discovery;
  if (args.branch) {
    phase = "targeted anonymous map discovery";
    discovery = await discoverBranchSeatPlanMetadata(catalog, args.branch, async (query) => {
      const parameters = new URLSearchParams({ Mode: "OffsiteMode", BranchId: query.branchId,
        StartTime: query.startTime, DurationInMinutes: String(query.durationMinutes) });
      const url = `${ORIGIN}${SEARCH}?${parameters}`;
      policy.permitSearch(url);
      const result = await page.evaluate(browserJson, url);
      policy.permitSearch(undefined);
      console.log(`Anonymous SearchAvailableAreas: HTTP ${result.status}${result.failure ? ` (${result.failure})` : ""}; branch ${args.branch}.`);
      if (!Object.hasOwn(result, "payload")) throw new Error(`Anonymous discovery failed (HTTP ${result.status}).`);
      return result.payload;
    }, new Date());
  }
  const snapshot = sanitizedSeatPlanCatalog(catalog, new Date().toISOString(), discovery?.maps,
    discovery?.seatCodes, discovery?.report, metadata);
  snapshot.collectionScope = catalog.collectionScope;
  await writeJson(output, snapshot);
  const { accounts, searches } = policy.counts();
  console.log(`Saved sanitized catalog; requests: ${accounts} GetAccountInfo, ${searches} SearchAvailableAreas.`);
  if (discovery?.report.failed.length) {
    console.log(`Discovery incomplete for ${discovery.report.failed.length} area(s); evidence saved for review.`);
    process.exitCode = 3;
  }
} catch (error) {
  if (phase === "catalog validation" && /^(Anonymous catalog|Collector requires|Catalog normalization)/.test(error.message)) console.error(error.message);
  // Do not print browser exceptions, headers, response bodies, or session state.
  console.error(`Anonymous collection failed during ${phase}. No catalog was saved. Check NLB access and the documented browser prerequisites; do not treat this as catalog removal.`);
  process.exitCode = 1;
} finally {
  await context?.close();
  await browser?.close();
}
