import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  actionPlanFor,
  findOperationalContext,
} from "./seat-plan-drift-actions.mjs";

const repositoryRoot = path.resolve(import.meta.dirname, "..");

describe("seat-plan drift actions", () => {
  it.each([
    ["branch-added", "Investigate and onboard added branch"],
    ["branch-removed", "Investigate and resolve removed branch"],
    ["area-added", "Investigate and onboard added area"],
    ["area-removed", "Investigate and resolve removed area"],
    ["seat-added", "Review added seat"],
    ["seat-removed", "Review removed seat"],
    ["seat-name", "Review seat rename"],
    ["seat-id", "Review seat identity change"],
    ["seat-disabled", "Review disabled-seat state"],
    ["map-path", "Review map association"],
    ["image-sha256", "Review changed map artwork"],
    ["image-width", "Rebuild annotation for resized map"],
    ["branch-name", "Review catalog metadata change"],
    ["area-floor", "Review catalog metadata change"],
  ])("provides a concrete action plan for %s", (type, title) => {
    const plan = actionPlanFor({ type, key: "1:1" });

    expect(plan.title).toBe(title);
    expect(plan.dispositions.length).toBeGreaterThan(0);
    expect(plan.investigation.length).toBeGreaterThan(0);
    expect(plan.resolution.length).toBeGreaterThan(0);
  });

  it("matches Queenstown context by stable branch ID", async () => {
    const inventory = JSON.parse(
      await readFile(
        path.join(repositoryRoot, "docs/data/branch-status.json"),
        "utf8",
      ),
    );

    const context = findOperationalContext(
      {
        type: "branch-removed",
        key: "25",
        branch: { branchId: "25", branchName: "Unexpected name" },
      },
      inventory,
    );

    expect(context).toMatchObject({
      branchName: "Queenstown Library",
      expectedCatalogState: "absent",
      recommendedDisposition: "retired",
    });
    expect(context.sources).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "nlb-locations" }),
      expect.objectContaining({ id: "branch-inventory" }),
    ]));
  });

  it("matches Ang Mo Kio context by normalized branch name without authorizing identity", async () => {
    const inventory = JSON.parse(
      await readFile(
        path.join(repositoryRoot, "docs/data/branch-status.json"),
        "utf8",
      ),
    );

    const context = findOperationalContext(
      {
        type: "branch-added",
        key: "unknown-live-id",
        branch: {
          branchId: "unknown-live-id",
          branchName: "Ang Mo Kio Public Library",
        },
      },
      inventory,
    );

    expect(context).toMatchObject({
      branchName: "Ang Mo Kio Library",
      expectedReopenDate: "2026-11-20",
      evidenceLevel: "user-reported",
    });
    expect(context.branchId).toBeUndefined();
  });
});
