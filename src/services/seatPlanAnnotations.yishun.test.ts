import { describe, expect, it } from "vitest";
import { YISHUN_DIGITAL_LEARNING_ZONE_SEAT_PLAN, YISHUN_LEVEL_4_ENGLISH_FICTION_SEAT_PLAN, YISHUN_LEVEL_4_MALAY_COLLECTION_SEAT_PLAN, YISHUN_LIBRARY_SEAT_PLANS } from "../data/seatPlans/yishunLibrary";
import type { Area } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const cases = [
  [YISHUN_DIGITAL_LEARNING_ZONE_SEAT_PLAN, "Digital Learning Zone, Level 4", Array.from({ length: 10 }, (_, i) => `S${i + 32}`)],
  [YISHUN_LEVEL_4_ENGLISH_FICTION_SEAT_PLAN, "English Fiction, Level 4", Array.from({ length: 8 }, (_, i) => `S${i + 1}`)],
  [YISHUN_LEVEL_4_MALAY_COLLECTION_SEAT_PLAN, "Malay Collection, Level 4", Array.from({ length: 23 }, (_, i) => `S${i + 9}`)],
] as const;

function areaFor(definition: SeatPlanDefinition, name: string, names: readonly string[]): Area {
  return { id: definition.areaId, branchId: definition.branchId, branchCode: "YIPL", branchName: "Yishun Library", name, intervalMinutes: 60, minBookingMinutes: 60, maxBookingMinutes: 240, areaMapUrls: [], seats: names.map((seatName) => ({ id: seatName, code: "", name: seatName, disabled: false, availableSlots: [] })) };
}

describe("Yishun Library seat-plan annotations", () => {
  it.each(cases)("covers and resolves %s", (definition, areaName, names) => {
    expect(new Set(definition.hotspots.map(({ seatName }) => seatName))).toEqual(new Set(names));
    expect(resolveSeatPlan(areaFor(definition, areaName, names), definition.mapPath, { width: definition.imageWidth, height: definition.imageHeight }, YISHUN_LIBRARY_SEAT_PLANS).status).toBe("ready");
  });
  it("preserves straight-row endpoints and Malay Collection perimeter orientation", () => {
    const digital = YISHUN_DIGITAL_LEARNING_ZONE_SEAT_PLAN.hotspots;
    const english = YISHUN_LEVEL_4_ENGLISH_FICTION_SEAT_PLAN.hotspots;
    expect(digital.find(({ seatName }) => seatName === "S32")!.x).toBeLessThan(digital.find(({ seatName }) => seatName === "S41")!.x);
    expect(english.find(({ seatName }) => seatName === "S1")!.x).toBeLessThan(english.find(({ seatName }) => seatName === "S8")!.x);
    const malay = Object.fromEntries(YISHUN_LEVEL_4_MALAY_COLLECTION_SEAT_PLAN.hotspots.map((hotspot) => [hotspot.seatName, hotspot]));
    expect(malay.S9.y).toBeLessThan(malay.S15.y);
    expect(malay.S21.y).toBeLessThan(malay.S27.y);
    expect(malay.S30.x).toBeLessThan(malay.S23.x);
  });
});
