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
    expect(result.coverage.observed).toEqual(result.coverage.configured);
    expect(result.coverage.images).toMatchObject({
      configured: 83,
      checked: 83,
      changed: [],
      missing: [],
    });
    expect(result.html).toContain('href="candidate.json"');
    expect(result.html).toContain('href="drift.json"');
    expect(result.html).toContain("No branches or areas were added or removed.");
    expect(result.html).toContain("83 of 83 configured seat-plan images");
  });

  it("treats routine URL omissions and first-observed seat codes as non-drift evidence", async () => {
    const result = await runAudit(
      { exportMetadata: { extensionVersion: "1.3.0", mode: "catalog" } },
      0,
      (snapshot) => {
        const area = snapshot.areas.find(
          (candidate) => candidate.branchId === "2" && candidate.areaId === "43",
        );
        area.observedMapUrls = [];
        area.seats[0].code = "JRL.3.StudyAreaEscalator.359";
      },
    );

    expect(result.status).toBe("clean");
    expect(result.changes).toEqual([]);
  });

  it("reports map URLs only when exact targeted branch discovery returned them", async () => {
    const result = await runAudit(
      {
        exportMetadata: {
          extensionVersion: "1.3.0",
          mode: "targeted-discovery",
        },
        mapDiscovery: {
          requested: true,
          scope: "branch",
          branchId: "2",
          requestCount: 1,
          attempted: 5,
          succeeded: 5,
          failed: [],
        },
      },
      2,
      (snapshot) => {
        const area = snapshot.areas.find(
          (candidate) => candidate.branchId === "2" && candidate.areaId === "43",
        );
        area.observedMapUrls = ["jrl-3-studyareaescalator-replacement.png"];
      },
    );

    expect(result.status).toBe("drift");
    expect(result.changes).toEqual([
      expect.objectContaining({
        severity: "enrichment",
        type: "map-urls",
        key: "2:43",
      }),
    ]);
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

  it("reports new branches and areas with their names", async () => {
    const result = await runAudit(
      { exportMetadata: { extensionVersion: "1.3.0", mode: "catalog" } },
      2,
      (snapshot) => {
        snapshot.areas.push({
          ...snapshot.areas[0],
          branchId: "999",
          branchCode: "NEW",
          branchName: "New Library",
          areaId: "1",
          areaName: "New Study Area",
        });
      },
    );

    expect(result.coverage.observed.branches).toBe(result.coverage.configured.branches + 1);
    expect(result.coverage.observed.areas).toBe(result.coverage.configured.areas + 1);
    expect(result.changes).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: "branch-added", key: "999" }),
      expect.objectContaining({ type: "area-added", key: "999:1" }),
    ]));
    expect(result.html).toContain("New Library / New Study Area");
  });

  it("lists changed seat-plan fingerprints in the HTML report", async () => {
    const result = await runAudit(
      { exportMetadata: { extensionVersion: "1.3.0", mode: "catalog" } },
      2,
      (snapshot) => {
        snapshot.areas[0].image.sha256 = "f".repeat(64);
      },
    );

    expect(result.coverage.images.changed).toHaveLength(1);
    expect(result.html).toContain("image-sha256");
    expect(result.html).toContain("1 changed; 0 missing");
  });
});

interface AuditArea {
  branchId: string;
  branchCode?: string;
  branchName?: string;
  areaId: string;
  areaName?: string;
  observedMapUrls: string[];
  image: { sha256: string };
  seats: Array<{ code?: string }>;
}

async function runAudit(
  catalogEvidence: object,
  expectedExit = 0,
  mutate?: (snapshot: { areas: AuditArea[] }) => void,
) {
  const directory = await mkdtemp(path.join(tmpdir(), "seat-plan-audit-"));
  const baseline = JSON.parse(
    await readFile(
      path.join(repositoryRoot, "docs/data/seat-plan-baseline.json"),
      "utf8",
    ),
  ) as Record<string, unknown>;
  const snapshotPath = path.join(directory, "candidate.json");
  const reportPath = path.join(directory, "drift.json");
  const htmlPath = path.join(directory, "report.html");
  const snapshot = {
    ...baseline,
    catalogSource: "sanitized-get-account-info",
    catalogEvidence,
  } as unknown as { areas: AuditArea[] };
  mutate?.(snapshot);
  await writeFile(
    snapshotPath,
    `${JSON.stringify(snapshot)}\n`,
  );

  try {
    await execFileAsync(process.execPath, [
      "scripts/seat-plan-audit.mjs",
      "--snapshot",
      snapshotPath,
      "--output",
      reportPath,
      "--html",
      htmlPath,
    ], { cwd: repositoryRoot });
    expect(expectedExit).toBe(0);
  } catch (error) {
    expect((error as { code?: number }).code).toBe(expectedExit);
  }
  return {
    ...JSON.parse(await readFile(reportPath, "utf8")),
    html: await readFile(htmlPath, "utf8"),
  } as {
    status: string;
    evidenceIssues: unknown[];
    changes: Array<Record<string, unknown>>;
    coverage: {
      observed: { branches: number; areas: number; seats: number };
      configured: { branches: number; areas: number; seats: number };
      images: { configured: number; checked: number; changed: unknown[]; missing: unknown[] };
    };
    html: string;
  };
}
