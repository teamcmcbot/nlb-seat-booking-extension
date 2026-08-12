import { describe, expect, it } from "vitest";
import type { Catalog } from "../models/catalog";
import {
  discoverSeatPlanMetadata,
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
    );

    expect(snapshot).toMatchObject({
      schemaVersion: 1,
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
    const discovery = await discoverSeatPlanMetadata(
      catalog,
      async (query) => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        await Promise.resolve();
        active -= 1;
        return {
          areas: [
            {
              id: query.areaId,
              areaMapUrls: [`area-${query.areaId}-sp.png`],
              seats: [
                {
                  id: `seat-${query.areaId}`,
                  name: query.areaId === "40" ? "S1" : "S2",
                  code: `code-${query.areaId}`,
                },
              ],
            },
          ],
        };
      },
      new Date("2026-08-12T08:00:00+08:00"),
    );

    expect(maximumActive).toBe(1);
    expect(discovery.report).toMatchObject({
      requested: true,
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
