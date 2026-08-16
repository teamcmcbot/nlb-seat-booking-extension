import { describe, expect, it } from "vitest";
import type { Catalog } from "../models/catalog";
import {
  discoverBranchSeatPlanMetadata,
  sanitizedSeatPlanCatalog,
} from "./seatPlanMaintenance";

describe("seat-plan maintenance export", () => {
  it("exports only normalized catalog and map identity fields", () => {
    const catalog: Catalog = {
      branches: [
        {
          id: "2",
          code: "JRL",
          name: "Jurong Library",
          areas: [
            {
              id: "40",
              branchId: "2",
              branchCode: "JRL",
              branchName: "Jurong Library",
              name: "English Fiction, Level 2",
              floor: "2",
              intervalMinutes: 60,
              minBookingMinutes: 60,
              maxBookingMinutes: 240,
              areaMapUrls: ["jrl-2-englishfiction-sp-full.png"],
              seats: [
                {
                  id: "seat-1",
                  code: "",
                  name: "S1",
                  disabled: false,
                  availableSlots: [{ time: "09:00", isAvailable: true }],
                },
              ],
            },
          ],
        },
      ],
      bookingRules: {
        advanceBookingDays: 1,
        allowAdvanceBooking: true,
      },
      holidays: [],
    };

    const snapshot = sanitizedSeatPlanCatalog(
      catalog,
      "2026-08-11T00:00:00.000Z",
      { "2:40": ["jrl-2-englishfiction-sp-full.png?revision=2"] },
      { "2:40": { "seat-1": "discovered-code" } },
      undefined,
      { extensionVersion: "1.3.0", mode: "catalog" },
    );

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      exportMetadata: {
        extensionVersion: "1.3.0",
        mode: "catalog",
      },
      branches: [
        {
          id: "2",
          areas: [
            {
              id: "40",
              areaMapUrls: [
                "jrl-2-englishfiction-sp-full.png",
                "jrl-2-englishfiction-sp-full.png?revision=2",
              ],
              seats: [
                {
                  id: "seat-1",
                  code: "discovered-code",
                  name: "S1",
                  disabled: false,
                },
              ],
            },
          ],
        },
      ],
    });
    expect(JSON.stringify(snapshot)).not.toContain("availableSlots");
    expect(JSON.stringify(snapshot)).not.toContain("bookingRules");
  });

  it("discovers maps sequentially without treating available seats as a catalog", async () => {
    const catalog: Catalog = {
      branches: [
        {
          id: "2",
          name: "Jurong Library",
          areas: [area("40", "S1"), area("41", "S2")],
        },
      ],
      bookingRules: {
        advanceBookingDays: 1,
        allowAdvanceBooking: true,
      },
      holidays: [],
    };
    let active = 0;
    let maximumActive = 0;
    const startTimes: string[] = [];
    const discovery = await discoverBranchSeatPlanMetadata(
      catalog,
      "2",
      async (query) => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        startTimes.push(query.startTime);
        await Promise.resolve();
        active -= 1;
        return {
          areas: catalog.branches[0].areas.map((area) => ({
            id: area.id,
            areaMapUrls: [`area-${area.id}-sp.png`],
            seats: [
              {
                id: `seat-${area.id}`,
                name: area.id === "40" ? "S1" : "S2",
                code: `code-${area.id}`,
              },
            ],
          })),
        };
      },
      new Date("2026-08-12T08:00:00+08:00"),
    );

    expect(maximumActive).toBe(1);
    expect(startTimes).toEqual(["2026-08-13T09:00"]);
    expect(discovery.report).toMatchObject({
      requested: true,
      scope: "branch",
      branchId: "2",
      requestCount: 1,
      attempted: 2,
      succeeded: 2,
      failed: [],
    });
    expect(discovery.maps).toEqual({
      "2:40": ["area-40-sp.png"],
      "2:41": ["area-41-sp.png"],
    });
    expect(discovery.seatCodes["2:40"]).toMatchObject({
      "seat-40": "code-40",
      s1: "code-40",
    });
  });

  it("falls back to the latest current-day slot when the future response has no exact-area map", async () => {
    const catalog: Catalog = {
      branches: [
        {
          id: "26",
          name: "Sembawang Public Library",
          areas: [
            {
              ...area("51", "S1"),
              branchId: "26",
              branchName: "Sembawang Public Library",
            },
          ],
        },
      ],
      bookingRules: {
        advanceBookingDays: 1,
        allowAdvanceBooking: true,
      },
      holidays: [],
    };
    const startTimes: string[] = [];
    const discovery = await discoverBranchSeatPlanMetadata(
      catalog,
      "26",
      async (query) => {
        startTimes.push(query.startTime);
        return query.startTime.startsWith("2026-08-13")
          ? {
              found: false,
              areas: [
                {
                  areaId: 50,
                  areaMapUrls: ["sbpl-5-adultsection-sp-full.png"],
                },
              ],
            }
          : {
              found: false,
              areas: [
                {
                  areaId: 51,
                  areaMapUrls: ["sbpl-5-readinglounge-sp-full.png"],
                },
              ],
            };
      },
      new Date("2026-08-12T08:00:00+08:00"),
    );

    expect(startTimes).toEqual([
      "2026-08-13T09:00",
      "2026-08-12T20:00",
    ]);
    expect(discovery.maps["26:51"]).toEqual([
      "sbpl-5-readinglounge-sp-full.png",
    ]);
    expect(discovery.report).toMatchObject({
      attempted: 1,
      succeeded: 1,
      failed: [],
    });
  });

  it("uses a released future holiday date for metadata discovery", async () => {
    const catalog: Catalog = {
      branches: [
        {
          id: "2",
          name: "Jurong Library",
          areas: [area("40", "S1")],
        },
      ],
      bookingRules: {
        advanceBookingDays: 1,
        allowAdvanceBooking: true,
      },
      holidays: [
        {
          name: "Observed closure",
          startDate: "2026-08-13",
          endDate: "2026-08-13",
          excludedBranches: [],
        },
      ],
    };
    const startTimes: string[] = [];

    await discoverBranchSeatPlanMetadata(
      catalog,
      "2",
      async (query) => {
        startTimes.push(query.startTime);
        return {
          areas: [{ areaId: "40", areaMapUrls: ["area-sp.png"] }],
        };
      },
      new Date("2026-08-12T13:00:00+08:00"),
    );

    expect(startTimes).toEqual(["2026-08-13T09:00"]);
  });

  it("reports discovery failure when neither probe returns an exact-area map", async () => {
    const catalog: Catalog = {
      branches: [
        {
          id: "26",
          name: "Sembawang Public Library",
          areas: [
            {
              ...area("51", "S1"),
              branchId: "26",
              branchName: "Sembawang Public Library",
            },
          ],
        },
      ],
      bookingRules: {
        advanceBookingDays: 1,
        allowAdvanceBooking: true,
      },
      holidays: [],
    };

    const discovery = await discoverBranchSeatPlanMetadata(
      catalog,
      "26",
      async () => ({
        found: false,
        areas: [
          {
            areaId: 50,
            areaMapUrls: ["sbpl-5-adultsection-sp-full.png"],
          },
        ],
      }),
      new Date("2026-08-12T08:00:00+08:00"),
    );

    expect(discovery.maps).toEqual({});
    expect(discovery.report).toMatchObject({
      attempted: 1,
      succeeded: 0,
      failed: [
        {
          branchId: "26",
          areaId: "51",
          message: "No exact-area areaMapUrls were returned by the branch probe.",
        },
      ],
    });
  });
});

function area(id: string, seatName: string) {
  return {
    id,
    branchId: "2",
    branchName: "Jurong Library",
    name: `Area ${id}`,
    openingTime: "09:00",
    closingTime: "21:00",
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: [
      {
        id: `seat-${id}`,
        code: "",
        name: seatName,
        disabled: false,
        availableSlots: [],
      },
    ],
  };
}
