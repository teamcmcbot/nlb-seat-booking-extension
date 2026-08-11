import { describe, expect, it } from "vitest";
import {
  GEYLANG_EAST_LEVEL_2_CHINESE_COLLECTION_SEAT_PLAN,
  GEYLANG_EAST_LEVEL_2_ENGLISH_FICTION_SEAT_PLAN,
  GEYLANG_EAST_LEVEL_2_MAGAZINE_COLLECTION_SEAT_PLAN,
  GEYLANG_EAST_LEVEL_2_NEAR_MULTIMEDIA_SEAT_PLAN,
  GEYLANG_EAST_LEVEL_2_QUIET_READING_SEAT_PLAN,
  GEYLANG_EAST_LEVEL_2_YOUNG_PEOPLE_SEAT_PLAN,
} from "../data/seatPlans/geylangEastLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

function seat(name: string): Seat {
  return {
    id: `geylang-east-${name}`,
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
    branchCode: "GEPL",
    branchName: "Geylang East Library",
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
    label: "Chinese Collection, Level 2",
    definition: GEYLANG_EAST_LEVEL_2_CHINESE_COLLECTION_SEAT_PLAN,
    areaName: "Chinese Collection, Level 2",
    expectedSeatNames: ["S33", "S34", "S35", "S36", "S37", "S38"],
  },
  {
    label: "English Fiction Collection, Level 2",
    definition: GEYLANG_EAST_LEVEL_2_ENGLISH_FICTION_SEAT_PLAN,
    areaName: "English Fiction Collection, Level 2",
    expectedSeatNames: ["S39"],
  },
  {
    label: "Magazine Collection, Level 2",
    definition: GEYLANG_EAST_LEVEL_2_MAGAZINE_COLLECTION_SEAT_PLAN,
    areaName: "Magazine Collection, Level 2",
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
      "S18",
      "S19",
      "S20",
      "S21",
      "S22",
    ],
  },
  {
    label: "Near Multimedia Stations, Level 2",
    definition: GEYLANG_EAST_LEVEL_2_NEAR_MULTIMEDIA_SEAT_PLAN,
    areaName: "Near Multimedia Stations, Level 2",
    expectedSeatNames: [
      "S23",
      "S24",
      "S25",
      "S26",
      "S27",
      "S28",
      "S29",
      "S30",
      "S31",
      "S32",
    ],
  },
  {
    label: "Quiet Reading Room, Level 2",
    definition: GEYLANG_EAST_LEVEL_2_QUIET_READING_SEAT_PLAN,
    areaName: "Quiet Reading Room, Level 2",
    expectedSeatNames: [
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
    ],
  },
  {
    label: "Young People's Collection, Level 2",
    definition: GEYLANG_EAST_LEVEL_2_YOUNG_PEOPLE_SEAT_PLAN,
    areaName: "Young People's Collection, Level 2",
    expectedSeatNames: ["S56", "S57", "S58", "S59", "S60", "S61", "S62"],
  },
];

describe("Geylang East Library seat-plan annotations", () => {
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
