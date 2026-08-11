import { describe, expect, it } from "vitest";
import { PASIR_RIS_LEVEL_4_QUIET_READING_SEAT_PLAN, PASIR_RIS_LIBRARY_SEAT_PLANS } from "../data/seatPlans/pasirRisLibrary";
import type { Area } from "../models/catalog";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const expected = Array.from({ length: 13 }, (_, index) => `S${index + 1}`);

describe("Pasir Ris Library seat-plan annotations", () => {
  it("covers the exact S1–S13 set and preserves both runs", () => {
    const definition = PASIR_RIS_LEVEL_4_QUIET_READING_SEAT_PLAN;
    expect(new Set(definition.hotspots.map(({ seatName }) => seatName))).toEqual(new Set(expected));
    expect(definition.hotspots).toHaveLength(13);
    expect(definition.hotspots.find(({ seatName }) => seatName === "S1")!.y)
      .toBeGreaterThan(definition.hotspots.find(({ seatName }) => seatName === "S5")!.y);
    expect(definition.hotspots.find(({ seatName }) => seatName === "S6")!.x)
      .toBeLessThan(definition.hotspots.find(({ seatName }) => seatName === "S13")!.x);
  });

  it("resolves against a complete matching catalog", () => {
    const definition = PASIR_RIS_LEVEL_4_QUIET_READING_SEAT_PLAN;
    const area: Area = { id: "47", branchId: "24", branchCode: "PRPL", branchName: "Pasir Ris Library", name: "Quiet Reading Lounge, Level 4", intervalMinutes: 60, minBookingMinutes: 60, maxBookingMinutes: 240, areaMapUrls: [], seats: expected.map((name) => ({ id: name, code: "", name, disabled: false, availableSlots: [] })) };
    expect(resolveSeatPlan(area, definition.mapPath, { width: 769, height: 618 }, PASIR_RIS_LIBRARY_SEAT_PLANS).status).toBe("ready");
  });
});
