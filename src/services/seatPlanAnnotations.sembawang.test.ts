import { describe, expect, it } from "vitest";
import { SEMBAWANG_LEVEL_5_ADULT_SECTION_SEAT_PLAN, SEMBAWANG_LEVEL_5_READING_LOUNGE_SEAT_PLAN, SEMBAWANG_LIBRARY_SEAT_PLANS } from "../data/seatPlans/sembawangLibrary";
import type { Area } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const cases = [
  [SEMBAWANG_LEVEL_5_ADULT_SECTION_SEAT_PLAN, "Adult Section, Level 5", Array.from({ length: 8 }, (_, i) => `S${i + 1}`)],
  [SEMBAWANG_LEVEL_5_READING_LOUNGE_SEAT_PLAN, "Reading Lounge, Level 5", ["S9", "S10"]],
] as const;

function areaFor(definition: SeatPlanDefinition, name: string, names: readonly string[]): Area {
  return { id: definition.areaId, branchId: definition.branchId, branchCode: "SBPL", branchName: "Sembawang Library", name, intervalMinutes: 60, minBookingMinutes: 60, maxBookingMinutes: 240, areaMapUrls: [], seats: names.map((seatName) => ({ id: seatName, code: "", name: seatName, disabled: false, availableSlots: [] })) };
}

describe("Sembawang Library seat-plan annotations", () => {
  it.each(cases)("covers and resolves %s", (definition, areaName, names) => {
    expect(new Set(definition.hotspots.map(({ seatName }) => seatName))).toEqual(new Set(names));
    expect(resolveSeatPlan(areaFor(definition, areaName, names), definition.mapPath, { width: definition.imageWidth, height: definition.imageHeight }, SEMBAWANG_LIBRARY_SEAT_PLANS).status).toBe("ready");
  });

  it("preserves the two adult rows and vertical reading-lounge order", () => {
    expect(SEMBAWANG_LEVEL_5_ADULT_SECTION_SEAT_PLAN.hotspots.find(({ seatName }) => seatName === "S4")!.x).toBeLessThan(SEMBAWANG_LEVEL_5_ADULT_SECTION_SEAT_PLAN.hotspots.find(({ seatName }) => seatName === "S5")!.x);
    expect(SEMBAWANG_LEVEL_5_READING_LOUNGE_SEAT_PLAN.hotspots.find(({ seatName }) => seatName === "S10")!.y).toBeLessThan(SEMBAWANG_LEVEL_5_READING_LOUNGE_SEAT_PLAN.hotspots.find(({ seatName }) => seatName === "S9")!.y);
  });
});
