import { describe, expect, it } from "vitest";
import {
  LKCRL_LEVEL_11_EXPRESS_SEATS_ZONE_D1_SEAT_PLAN,
  LKCRL_LEVEL_11_EXPRESS_SEATS_ZONE_D2_SEAT_PLAN,
} from "../data/seatPlans/lkcrlLevel11";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

function seatNames(first: number, last: number): string[] {
  return Array.from(
    { length: last - first + 1 },
    (_, index) => `ES${first + index}`,
  );
}

function seat(name: string): Seat {
  return {
    id: `lkcrl-level-11-${name}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function areaFor(
  definition: SeatPlanDefinition,
  areaName: string,
  expectedSeatNames: readonly string[],
): Area {
  return {
    id: definition.areaId,
    branchId: definition.branchId,
    branchCode: "LKCRL11",
    branchName: "Lee Kong Chian Reference Library Level 11",
    name: areaName,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: expectedSeatNames.map(seat),
  };
}

function hotspot(definition: SeatPlanDefinition, seatName: string) {
  const result = definition.hotspots.find(
    (candidate) => candidate.seatName === seatName,
  );
  expect(result).toBeDefined();
  return result;
}

const cases: readonly {
  label: string;
  areaName: string;
  definition: SeatPlanDefinition;
  areaId: string;
  mapPath: string;
  imageWidth: number;
  imageHeight: number;
  expectedSeatNames: readonly string[];
}[] = [
  {
    label: "Express Seats Zone D1",
    areaName: "Express Seats Zone D1",
    definition: LKCRL_LEVEL_11_EXPRESS_SEATS_ZONE_D1_SEAT_PLAN,
    areaId: "6",
    mapPath: "lkcrl11-11-zoned1-sp-full.png",
    imageWidth: 1447,
    imageHeight: 642,
    expectedSeatNames: seatNames(751, 817),
  },
  {
    label: "Express Seats Zone D2",
    areaName: "Express Seats Zone D2",
    definition: LKCRL_LEVEL_11_EXPRESS_SEATS_ZONE_D2_SEAT_PLAN,
    areaId: "10",
    mapPath: "lkcrl11-11-zoned2-sp-full.png",
    imageWidth: 905,
    imageHeight: 305,
    expectedSeatNames: seatNames(821, 848),
  },
];

describe("Lee Kong Chian Reference Library Level 11 seat-plan annotations", () => {
  it.each(cases)("has the expected identity for $label", (testCase) => {
    expect(testCase.definition).toMatchObject({
      branchId: "16",
      areaId: testCase.areaId,
      mapPath: testCase.mapPath,
      imageWidth: testCase.imageWidth,
      imageHeight: testCase.imageHeight,
      coverage: "complete",
    });
  });

  it.each(cases)("has exact complete coverage for $label", (testCase) => {
    const hotspotNames = testCase.definition.hotspots.map(
      (candidate) => candidate.seatName,
    );

    expect(hotspotNames).toHaveLength(testCase.expectedSeatNames.length);
    expect(new Set(hotspotNames).size).toBe(testCase.expectedSeatNames.length);
    expect(new Set(hotspotNames)).toEqual(new Set(testCase.expectedSeatNames));
  });

  it.each(cases)("has valid, non-overlapping geometry for $label", (testCase) => {
    for (const [index, candidate] of testCase.definition.hotspots.entries()) {
      expect(candidate.x).toBeGreaterThanOrEqual(0);
      expect(candidate.y).toBeGreaterThanOrEqual(0);
      expect(candidate.width).toBeGreaterThan(0);
      expect(candidate.height).toBeGreaterThan(0);
      expect(candidate.x + candidate.width).toBeLessThanOrEqual(
        testCase.definition.imageWidth,
      );
      expect(candidate.y + candidate.height).toBeLessThanOrEqual(
        testCase.definition.imageHeight,
      );

      for (const other of testCase.definition.hotspots.slice(index + 1)) {
        const separated =
          candidate.x + candidate.width <= other.x ||
          other.x + other.width <= candidate.x ||
          candidate.y + candidate.height <= other.y ||
          other.y + other.height <= candidate.y;
        expect(separated).toBe(true);
      }
    }
  });

  it.each(cases)("resolves $label against its matching area", (testCase) => {
    const resolution = resolveSeatPlan(
      areaFor(
        testCase.definition,
        testCase.areaName,
        testCase.expectedSeatNames,
      ),
      testCase.definition.mapPath,
      {
        width: testCase.definition.imageWidth,
        height: testCase.definition.imageHeight,
      },
      [testCase.definition],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(resolution.hotspots).toHaveLength(testCase.expectedSeatNames.length);
    }
  });

  it("preserves Zone D1 visual ordering and direction reversals", () => {
    const definition = LKCRL_LEVEL_11_EXPRESS_SEATS_ZONE_D1_SEAT_PLAN;

    expect(hotspot(definition, "ES751")).toMatchObject({ x: 63, y: 437 });
    expect(hotspot(definition, "ES755")).toMatchObject({ x: 63, y: 305 });
    expect(hotspot(definition, "ES756")).toMatchObject({ x: 93, y: 270 });
    expect(hotspot(definition, "ES762")).toMatchObject({ x: 157, y: 437 });
    expect(hotspot(definition, "ES769")).toMatchObject({ x: 459, y: 276 });
    expect(hotspot(definition, "ES772")).toMatchObject({ x: 608, y: 276 });
    expect(hotspot(definition, "ES777")).toMatchObject({ x: 459, y: 378 });
    expect(hotspot(definition, "ES774")).toMatchObject({ x: 608, y: 378 });
    expect(hotspot(definition, "ES810")).toMatchObject({ x: 1301, y: 269 });
    expect(hotspot(definition, "ES817")).toMatchObject({ x: 1300, y: 362 });
  });

  it("preserves Zone D2 clockwise table numbering", () => {
    const definition = LKCRL_LEVEL_11_EXPRESS_SEATS_ZONE_D2_SEAT_PLAN;

    expect(hotspot(definition, "ES821")).toMatchObject({ x: 252, y: 194 });
    expect(hotspot(definition, "ES823")).toMatchObject({ x: 275, y: 155 });
    expect(hotspot(definition, "ES827")).toMatchObject({ x: 357, y: 155 });
    expect(hotspot(definition, "ES830")).toMatchObject({ x: 357, y: 213 });
    expect(hotspot(definition, "ES834")).toMatchObject({ x: 275, y: 213 });
    expect(hotspot(definition, "ES835")).toMatchObject({ x: 414, y: 194 });
    expect(hotspot(definition, "ES841")).toMatchObject({ x: 519, y: 155 });
    expect(hotspot(definition, "ES848")).toMatchObject({ x: 437, y: 213 });
  });
});
