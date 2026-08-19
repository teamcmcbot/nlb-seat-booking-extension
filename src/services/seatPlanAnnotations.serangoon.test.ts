import { describe, expect, it } from "vitest";
import { SERANGOON_LEVEL_4_CHINESE_CHILDREN_SEAT_PLAN, SERANGOON_LEVEL_4_ENGLISH_COLLECTION_SEAT_PLAN, SERANGOON_LIBRARY_SEAT_PLANS } from "../data/seatPlans/serangoonLibrary";
import type { Area } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const cases = [
  [SERANGOON_LEVEL_4_ENGLISH_COLLECTION_SEAT_PLAN, "Near Adult English General Collection, Level 4", Array.from({ length: 10 }, (_, i) => `S${i + 1}`)],
  [SERANGOON_LEVEL_4_CHINESE_CHILDREN_SEAT_PLAN, "Near Chinese Children Collection, Level 4", Array.from({ length: 11 }, (_, i) => `S${i + 11}`)],
] as const;

function areaFor(definition: SeatPlanDefinition, name: string, names: readonly string[]): Area {
  return { id: definition.areaId, branchId: definition.branchId, branchCode: "SRPL", branchName: "Serangoon Library", name, intervalMinutes: 60, minBookingMinutes: 60, maxBookingMinutes: 240, areaMapUrls: [], seats: names.map((seatName) => ({ id: seatName, code: "", name: seatName, disabled: false, availableSlots: [] })) };
}

describe("Serangoon Library seat-plan annotations", () => {
  it.each(cases)("covers and resolves %s", (definition, areaName, names) => {
    expect(new Set(definition.hotspots.map(({ seatName }) => seatName))).toEqual(new Set(names));
    expect(resolveSeatPlan(areaFor(definition, areaName, names), definition.mapPath, { width: definition.imageWidth, height: definition.imageHeight }, SERANGOON_LIBRARY_SEAT_PLANS).status).toBe("ready");
  });
  it("preserves both left-to-right rows and the pillar gaps", () => {
    const english = SERANGOON_LEVEL_4_ENGLISH_COLLECTION_SEAT_PLAN.hotspots;
    const children = SERANGOON_LEVEL_4_CHINESE_CHILDREN_SEAT_PLAN.hotspots;
    expect(english.find(({ seatName }) => seatName === "S7")!.x).toBeLessThan(english.find(({ seatName }) => seatName === "S8")!.x);
    expect(children.find(({ seatName }) => seatName === "S16")!.x).toBeLessThan(children.find(({ seatName }) => seatName === "S17")!.x);
    expect(english.map(({ x }) => x)).toEqual([...english.map(({ x }) => x)].sort((a, b) => a - b));
  });
});
