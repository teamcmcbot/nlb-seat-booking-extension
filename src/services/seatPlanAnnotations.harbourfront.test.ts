import { describe, expect, it } from "vitest";
import {
  HARBOURFRONT_LEVEL_3_ADULT_COLLECTION_SEAT_PLAN,
  HARBOURFRONT_LEVEL_3_READING_LOUNGE_1_BOTTOM_TIER_SEAT_PLAN,
  HARBOURFRONT_LEVEL_3_READING_LOUNGE_1_MIDDLE_TIER_SEAT_PLAN,
  HARBOURFRONT_LEVEL_3_READING_LOUNGE_1_UPPER_TIER_SEAT_PLAN,
  HARBOURFRONT_LEVEL_3_SINGAPORE_COLLECTION_SEAT_PLAN,
} from "../data/seatPlans/harbourfrontLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

function seat(name: string): Seat {
  return {
    id: `harbourfront-${name}`,
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
    branchCode: "HBPL",
    branchName: "Harbourfront Library",
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
    label: "Adult Collection, Level 3",
    definition: HARBOURFRONT_LEVEL_3_ADULT_COLLECTION_SEAT_PLAN,
    areaName: "Adult Collection, Level 3",
    expectedSeatNames: [
      "S31",
      "S32",
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
    ],
  },
  {
    label: "Reading Lounge 1 Bottom Tier, Level 3",
    definition:
      HARBOURFRONT_LEVEL_3_READING_LOUNGE_1_BOTTOM_TIER_SEAT_PLAN,
    areaName: "Reading Lounge 1 Bottom Tier, Level 3",
    expectedSeatNames: ["S24", "S25", "S26", "S27", "S28", "S29", "S30"],
  },
  {
    label: "Reading Lounge 1 Middle Tier, Level 3",
    definition:
      HARBOURFRONT_LEVEL_3_READING_LOUNGE_1_MIDDLE_TIER_SEAT_PLAN,
    areaName: "Reading Lounge 1 Middle Tier, Level 3",
    expectedSeatNames: [
      "S10",
      "S11",
      "S12",
      "S13",
      "S14",
      "S15",
      "S16",
      "S17",
      "S18",
      "S19",
      "S20",
      "S21",
      "S22",
      "S23",
    ],
  },
  {
    label: "Reading Lounge 1 Upper Tier, Level 3",
    definition:
      HARBOURFRONT_LEVEL_3_READING_LOUNGE_1_UPPER_TIER_SEAT_PLAN,
    areaName: "Reading Lounge 1 Upper Tier, Level 3",
    expectedSeatNames: ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9"],
  },
  {
    label: "Singapore Collection, Level 3",
    definition: HARBOURFRONT_LEVEL_3_SINGAPORE_COLLECTION_SEAT_PLAN,
    areaName: "Singapore Collection, Level 3",
    expectedSeatNames: [
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
    ],
  },
];

describe("Harbourfront Library seat-plan annotations", () => {
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
