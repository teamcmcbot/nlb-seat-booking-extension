import { describe, expect, it } from "vitest";
import {
  TAMPINES_LEVEL_4_MMS_AREA_SEAT_PLAN,
  TAMPINES_LEVEL_4_NEAR_MULTIMEDIA_STATIONS_SEAT_PLAN,
} from "../data/seatPlans/tampinesLibraryLevel4";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const MMS_SEATS = ["S25", "S26", "S27", "S28"] as const;
const NEAR_MULTIMEDIA_SEATS = [
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
  "S23",
  "S24",
] as const;

function seat(name: string): Seat {
  return {
    id: `tampines-${name}`,
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
    branchCode: "TRL",
    branchName: "Tampines Library",
    name: areaName,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: seatNames.map(seat),
  };
}

const cases: readonly {
  definition: SeatPlanDefinition;
  areaName: string;
  expectedSeatNames: readonly string[];
}[] = [
  {
    definition: TAMPINES_LEVEL_4_MMS_AREA_SEAT_PLAN,
    areaName: "MMS Area, Level 4",
    expectedSeatNames: MMS_SEATS,
  },
  {
    definition: TAMPINES_LEVEL_4_NEAR_MULTIMEDIA_STATIONS_SEAT_PLAN,
    areaName: "Near Multimedia Stations, Level 4",
    expectedSeatNames: NEAR_MULTIMEDIA_SEATS,
  },
];

describe("Tampines Library Level 4 seat-plan annotations", () => {
  it.each(cases)("has complete exact coverage for $areaName", (testCase) => {
    expect(testCase.definition.coverage).toBe("complete");
    expect(testCase.definition.hotspots).toHaveLength(
      testCase.expectedSeatNames.length,
    );
    expect(
      testCase.definition.hotspots.map((hotspot) => hotspot.seatName),
    ).toEqual(testCase.expectedSeatNames);
  });

  it("keeps MMS seats S25-S28 ordered from left to right", () => {
    const hotspots = TAMPINES_LEVEL_4_MMS_AREA_SEAT_PLAN.hotspots;

    expect(hotspots.map((hotspot) => hotspot.seatName)).toEqual(MMS_SEATS);
    expect(hotspots.map((hotspot) => hotspot.x)).toEqual([
      1337, 1833, 2338, 2808,
    ]);
  });

  it("keeps odd seats above and even seats below each multimedia table", () => {
    const byName = new Map(
      TAMPINES_LEVEL_4_NEAR_MULTIMEDIA_STATIONS_SEAT_PLAN.hotspots.map(
        (hotspot) => [hotspot.seatName, hotspot],
      ),
    );
    const tablePairs = [
      ["S1", "S2"],
      ["S3", "S4"],
      ["S5", "S6"],
      ["S7", "S8"],
      ["S9", "S10"],
      ["S11", "S12"],
      ["S13", "S14"],
      ["S15", "S16"],
      ["S17", "S18"],
      ["S19", "S20"],
      ["S21", "S22"],
      ["S23", "S24"],
    ] as const;

    for (const [topSeat, bottomSeat] of tablePairs) {
      expect(
        Math.abs(byName.get(topSeat)!.x - byName.get(bottomSeat)!.x),
      ).toBeLessThanOrEqual(1);
      expect(byName.get(topSeat)!.y).toBeLessThan(byName.get(bottomSeat)!.y);
    }

    expect(["S1", "S3", "S5", "S7"].map((name) => byName.get(name)!.x)).toEqual([
      109, 156, 201, 248,
    ]);
    expect(["S9", "S11", "S13", "S15"].map((name) => byName.get(name)!.x)).toEqual([
      388, 436, 481, 529,
    ]);
    expect(["S17", "S19", "S21", "S23"].map((name) => byName.get(name)!.x)).toEqual([
      661, 709, 755, 802,
    ]);
  });

  it.each(cases)("resolves $areaName against the matching catalog", (testCase) => {
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
      expect(resolution.hotspots.map((hotspot) => hotspot.seat.name)).toEqual(
        testCase.expectedSeatNames,
      );
    }
  });
});
