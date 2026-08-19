import { describe, expect, it } from "vitest";
import {
  BEDOK_LEVEL_2_ADULT_NON_FICTION_SEAT_PLAN,
  BEDOK_LEVEL_2_LARGE_PRINT_AV_SEAT_PLAN,
  BEDOK_LEVEL_2_LEARNING_ZONE_SEAT_PLAN,
  BEDOK_LEVEL_3_TEENS_FICTION_SEAT_PLAN,
} from "../data/seatPlans/bedokLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

function seat(name: string): Seat {
  return {
    id: `bedok-${name}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function areaFor(
  definition: SeatPlanDefinition,
  areaName: string,
  seatNames: readonly string[],
): Area {
  return {
    id: definition.areaId,
    branchId: definition.branchId,
    branchCode: "BEPL",
    branchName: "Bedok Library",
    name: areaName,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: seatNames.map(seat),
  };
}

const cases: readonly {
  label: string;
  definition: SeatPlanDefinition;
  areaName: string;
  expectedSeatNames: readonly string[];
}[] = [
  {
    label: "Adult Non-Fiction, Level 2",
    definition: BEDOK_LEVEL_2_ADULT_NON_FICTION_SEAT_PLAN,
    areaName: "Adult Non-Fiction, Level 2",
    expectedSeatNames: [
      "S1",
      "S2",
      "S3",
      "S4",
      "S5",
      "S6",
      "S7",
      "S8",
      "S9",
      "S10",
      "S11",
      "S12",
      "S13",
      "S14",
      "S15",
      "S16",
      "S17",
    ],
  },
  {
    label: "Large Print & AV, Level 2",
    definition: BEDOK_LEVEL_2_LARGE_PRINT_AV_SEAT_PLAN,
    areaName: "Large Print & AV, Level 2",
    expectedSeatNames: ["S26", "S27", "S28", "S29", "S30", "S31", "S32"],
  },
  {
    label: "Learning Zone, Level 2",
    definition: BEDOK_LEVEL_2_LEARNING_ZONE_SEAT_PLAN,
    areaName: "Learning Zone, Level 2",
    expectedSeatNames: ["S18", "S19", "S20", "S21", "S22", "S23", "S24", "S25"],
  },
  {
    label: "Teens' Fiction, Level 3",
    definition: BEDOK_LEVEL_3_TEENS_FICTION_SEAT_PLAN,
    areaName: "Teens' Fiction, Level 3",
    expectedSeatNames: [
      "S33",
      "S34",
      "S35",
      "S36",
      "S37",
      "S38",
      "S39",
      "S40",
      "S41",
      "S42",
      "S43",
      "S44",
      "S45",
      "S46",
      "S47",
      "S48",
      "S49",
      "S50",
      "S51",
      "S52",
      "S53",
      "S54",
      "S55",
      "S56",
      "S57",
      "S58",
      "S59",
      "S60",
      "S61",
      "S62",
      "S63",
      "S64",
      "S65",
      "S66",
      "S67",
      "S68",
    ],
  },
];

describe("Bedok Library seat-plan annotations", () => {
  it.each(cases)("has complete verified coverage for $label", (testCase) => {
    expect(testCase.definition.coverage).toBe("complete");
    expect(testCase.definition.hotspots).toHaveLength(
      testCase.expectedSeatNames.length,
    );
    expect(
      testCase.definition.hotspots.map((hotspot) => hotspot.seatName),
    ).toEqual(testCase.expectedSeatNames);
  });

  it.each(cases)("resolves $label against the matching catalog", (testCase) => {
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
      expect(resolution.hotspots.map((hotspot) => hotspot.seat.name)).toEqual(
        testCase.expectedSeatNames,
      );
    }
  });
});
