import { describe, expect, it } from "vitest";
import {
  PUNGGOL_LEVEL_3_ADULTS_TEENS_CHINESE_FICTION_ZONE_SEAT_PLAN,
  PUNGGOL_LEVEL_3_LONG_STUDY_SPACE_SEAT_PLAN,
  PUNGGOL_LEVEL_3_STUDY_ZONE_SEAT_PLAN,
} from "../data/seatPlans/punggolLibraryLevel3";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

function seatNames(first: number, last: number): string[] {
  return Array.from({ length: last - first + 1 }, (_, index) => `S${first + index}`);
}

function seat(name: string): Seat {
  return {
    id: `punggol-level-3-${name}`,
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
    branchCode: "PRL",
    branchName: "Punggol Library",
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
  expectedSeatNames: readonly string[];
}[] = [
  {
    label: "Adults Teens Chinese Fiction Zone",
    areaName: "Adults Teens Chinese Fiction Zone, Level 3",
    definition:
      PUNGGOL_LEVEL_3_ADULTS_TEENS_CHINESE_FICTION_ZONE_SEAT_PLAN,
    expectedSeatNames: seatNames(87, 99),
  },
  {
    label: "Long Study Space",
    areaName: "Long Study Space, Level 3",
    definition: PUNGGOL_LEVEL_3_LONG_STUDY_SPACE_SEAT_PLAN,
    expectedSeatNames: seatNames(100, 135),
  },
  {
    label: "Study Zone",
    areaName: "Study Zone, Level 3",
    definition: PUNGGOL_LEVEL_3_STUDY_ZONE_SEAT_PLAN,
    expectedSeatNames: seatNames(1, 86),
  },
];

describe("Punggol Library Level 3 seat-plan annotations", () => {
  it.each(cases)("has exact complete coverage for $label", (testCase) => {
    const hotspotNames = testCase.definition.hotspots.map(
      (candidate) => candidate.seatName,
    );

    expect(testCase.definition.coverage).toBe("complete");
    expect(hotspotNames).toHaveLength(testCase.expectedSeatNames.length);
    expect(new Set(hotspotNames).size).toBe(testCase.expectedSeatNames.length);
    expect(new Set(hotspotNames)).toEqual(new Set(testCase.expectedSeatNames));
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
      expect(new Set(resolution.hotspots.map(({ seat: resolvedSeat }) => resolvedSeat.name))).toEqual(
        new Set(testCase.expectedSeatNames),
      );
    }
  });

  it("keeps the Adults Teens Chinese Fiction row ordered left-to-right", () => {
    expect(hotspot(
      PUNGGOL_LEVEL_3_ADULTS_TEENS_CHINESE_FICTION_ZONE_SEAT_PLAN,
      "S87",
    )).toMatchObject({ x: 157, y: 231 });
    expect(hotspot(
      PUNGGOL_LEVEL_3_ADULTS_TEENS_CHINESE_FICTION_ZONE_SEAT_PLAN,
      "S99",
    )).toMatchObject({ x: 1130, y: 231 });
  });

  it("preserves the alternating Long Study Space row directions", () => {
    const definition = PUNGGOL_LEVEL_3_LONG_STUDY_SPACE_SEAT_PLAN;

    expect(hotspot(definition, "S100")).toMatchObject({ x: 61, y: 207 });
    expect(hotspot(definition, "S105")).toMatchObject({ x: 385, y: 207 });
    expect(hotspot(definition, "S135")).toMatchObject({ x: 61, y: 286 });
    expect(hotspot(definition, "S130")).toMatchObject({ x: 385, y: 286 });
    expect(hotspot(definition, "S112")).toMatchObject({ x: 968, y: 207 });
    expect(hotspot(definition, "S117")).toMatchObject({ x: 1292, y: 207 });
    expect(hotspot(definition, "S123")).toMatchObject({ x: 968, y: 286 });
    expect(hotspot(definition, "S118")).toMatchObject({ x: 1292, y: 286 });
  });

  it("preserves Study Zone bank endpoints and alternating directions", () => {
    const definition = PUNGGOL_LEVEL_3_STUDY_ZONE_SEAT_PLAN;

    expect(hotspot(definition, "S1")).toMatchObject({ x: 166, y: 210 });
    expect(hotspot(definition, "S16")).toMatchObject({ x: 1467, y: 210 });
    expect(hotspot(definition, "S17")).toMatchObject({ x: 1553, y: 210 });
    expect(hotspot(definition, "S28")).toMatchObject({ x: 420, y: 288 });
    expect(hotspot(definition, "S21")).toMatchObject({ x: 1023, y: 288 });
    expect(hotspot(definition, "S29")).toMatchObject({ x: 416, y: 410 });
    expect(hotspot(definition, "S36")).toMatchObject({ x: 1019, y: 410 });
    expect(hotspot(definition, "S65")).toMatchObject({ x: 685, y: 701 });
    expect(hotspot(definition, "S61")).toMatchObject({ x: 1029, y: 701 });
    expect(hotspot(definition, "S86")).toMatchObject({ x: 416, y: 924 });
    expect(hotspot(definition, "S85")).toMatchObject({ x: 506, y: 924 });
    expect(hotspot(definition, "S84")).toMatchObject({ x: 594, y: 924 });
    expect(hotspot(definition, "S81")).toMatchObject({ x: 856, y: 924 });
    expect(hotspot(definition, "S80")).toMatchObject({ x: 942, y: 924 });
    expect(hotspot(definition, "S79")).toMatchObject({ x: 1121, y: 924 });
    expect(hotspot(definition, "S74")).toMatchObject({ x: 1552, y: 924 });
  });
});
