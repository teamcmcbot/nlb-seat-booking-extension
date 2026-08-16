import { execFile } from "node:child_process";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const repositoryRoot = path.resolve(import.meta.dirname, "..");

describe("seat-plan audit evidence", () => {
  it("accepts a routine catalog export without map discovery", async () => {
    const result = await runAudit({
      exportMetadata: { extensionVersion: "1.3.0", mode: "catalog" },
    });

    expect(result.status).toBe("clean");
    expect(result.evidenceIssues).toEqual([]);
  });

  it("marks failed targeted branch discovery as incomplete", async () => {
    const result = await runAudit(
      {
        exportMetadata: {
          extensionVersion: "1.3.0",
          mode: "targeted-discovery",
        },
        mapDiscovery: {
          requested: true,
          scope: "branch",
          branchId: "10",
          requestCount: 2,
          attempted: 2,
          succeeded: 1,
          failed: [
            {
              branchId: "10",
              areaId: "28",
              message: "No exact-area map was returned.",
            },
          ],
        },
      },
      3,
    );

    expect(result.status).toBe("incomplete");
    expect(result.evidenceIssues).toHaveLength(1);
  });
});

async function runAudit(catalogEvidence: object, expectedExit = 0) {
  const directory = await mkdtemp(path.join(tmpdir(), "seat-plan-audit-"));
  const baseline = JSON.parse(
    await readFile(
      path.join(repositoryRoot, "docs/data/seat-plan-baseline.json"),
      "utf8",
    ),
  ) as Record<string, unknown>;
  const snapshotPath = path.join(directory, "candidate.json");
  const reportPath = path.join(directory, "drift.json");
  await writeFile(
    snapshotPath,
    `${JSON.stringify({
      ...baseline,
      catalogSource: "sanitized-get-account-info",
      catalogEvidence,
    })}\n`,
  );

  try {
    await execFileAsync(process.execPath, [
      "scripts/seat-plan-audit.mjs",
      "--snapshot",
      snapshotPath,
      "--output",
      reportPath,
    ], { cwd: repositoryRoot });
    expect(expectedExit).toBe(0);
  } catch (error) {
    expect((error as { code?: number }).code).toBe(expectedExit);
  }
  return JSON.parse(await readFile(reportPath, "utf8")) as {
    status: string;
    evidenceIssues: unknown[];
  };
}
