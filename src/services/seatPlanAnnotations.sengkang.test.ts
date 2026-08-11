import { describe, expect, it } from "vitest";
import { SENGKANG_LEVEL_3_READING_LOUNGE_SEAT_PLAN, SENGKANG_LIBRARY_SEAT_PLANS } from "../data/seatPlans/sengkangLibrary";
import type { Area } from "../models/catalog";
import { resolveSeatPlan } from "./seatPlanAnnotations";

describe("Sengkang Library seat-plan annotations", () => {
  const expected = Array.from({ length: 10 }, (_, index) => `S${index + 1}`);
  it("covers the exact ten-seat perimeter and resolves it", () => {
    const definition = SENGKANG_LEVEL_3_READING_LOUNGE_SEAT_PLAN;
    expect(new Set(definition.hotspots.map(({ seatName }) => seatName))).toEqual(new Set(expected));
    const area: Area = { id: "52", branchId: "27", branchCode: "SKPL", branchName: "Sengkang Library", name: "Reading Lounge, Level 3", intervalMinutes: 60, minBookingMinutes: 60, maxBookingMinutes: 240, areaMapUrls: [], seats: expected.map((name) => ({ id: name, code: "", name, disabled: false, availableSlots: [] })) };
    expect(resolveSeatPlan(area, definition.mapPath, { width: 1194, height: 645 }, SENGKANG_LIBRARY_SEAT_PLANS).status).toBe("ready");
  });
  it("preserves the clockwise top-to-bottom transition", () => {
    const byName = Object.fromEntries(SENGKANG_LEVEL_3_READING_LOUNGE_SEAT_PLAN.hotspots.map((hotspot) => [hotspot.seatName, hotspot]));
    expect(byName.S2.y).toBeLessThan(byName.S1.y);
    expect(byName.S5.y).toBeGreaterThan(byName.S4.y);
    expect(byName.S10.x).toBeLessThan(byName.S9.x);
  });
});
