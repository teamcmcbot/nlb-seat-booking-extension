import { describe, expect, it } from "vitest";
import {
  CHOA_CHU_KANG_LEVEL_4_ADULT_ZONE_SEAT_PLAN,
  CHOA_CHU_KANG_LEVEL_4_STUDY_MULTIMEDIA_ZONE_SEAT_PLAN,
} from "../data/seatPlans/choaChuKangLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const ADULT_ZONE_SEAT_NAMES = [
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
] as const;

const STUDY_MULTIMEDIA_ZONE_SEAT_NAMES = [
  "S17",
  "S18",
  "S19",
  "S20",
  "S21",
  "S22",
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
] as const;

function seat(name: string): Seat {
  return {
    id: `choa-chu-kang-${name}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function areaFor(
  definition: SeatPlanDefinition,
  name: string,
  seatNames: readonly string[],
): Area {
  return {
    id: definition.areaId,
    branchId: definition.branchId,
    branchCode: "CCKPL",
    branchName: "Choa Chu Kang Library",
    name,
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
    label: "Adult Zone, Level 4",
    definition: CHOA_CHU_KANG_LEVEL_4_ADULT_ZONE_SEAT_PLAN,
    areaName: "Adult Zone, Level 4",
    expectedSeatNames: ADULT_ZONE_SEAT_NAMES,
  },
  {
    label: "Study & Multimedia Zone, Level 4",
    definition: CHOA_CHU_KANG_LEVEL_4_STUDY_MULTIMEDIA_ZONE_SEAT_PLAN,
    areaName: "Study & Multimedia Zone, Level 4",
    expectedSeatNames: STUDY_MULTIMEDIA_ZONE_SEAT_NAMES,
  },
];

describe("Choa Chu Kang Library seat-plan annotations", () => {
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
