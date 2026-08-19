import { describe, expect, it } from "vitest";
import {
  WOODLANDS_LEVEL_1_ZONE_A_SEAT_PLAN,
  WOODLANDS_LEVEL_1_ZONE_B_SEAT_PLAN,
  WOODLANDS_LEVEL_2_ZONE_C_SEAT_PLAN,
  WOODLANDS_LEVEL_2_ZONE_D_SEAT_PLAN,
  WOODLANDS_LEVEL_2_ZONE_E_SEAT_PLAN,
  WOODLANDS_LIBRARY_ZONES_A_E_SEAT_PLANS,
} from "../data/seatPlans/woodlandsLibraryZonesAE";
import type { Area, Seat } from "../models/catalog";
import type {
  SeatHotspotDefinition,
  SeatPlanDefinition,
} from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const ZONE_A_SEATS = [
  "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8",
  "S9", "S10", "S11", "S12", "S13", "S14", "S15", "S16",
] as const;
const ZONE_B_SEATS = ["S17", "S18", "S19", "S20", "S21", "S22"] as const;
const ZONE_C_SEATS = [
  "S23", "S24", "S25", "S26", "S27", "S28", "S29", "S30",
  "S31", "S32", "S33", "S34", "S35", "S36", "S37", "S38",
  "S39", "S40", "S41", "S42", "S43", "S44", "S45", "S46",
  "S47", "S48", "S49", "S50", "S51", "S52", "S53", "S54",
  "S55", "S56", "S57", "S58", "S59", "S60", "S61", "S62",
  "S63", "S64",
] as const;
const ZONE_D_SEATS = [
  "S65", "S66", "S67", "S68", "S69", "S70", "S71", "S72",
  "S73", "S74", "S75", "S76", "S77", "S78", "S79", "S80",
  "S81", "S82", "S83", "S84", "S85", "S86", "S87", "S88",
  "S89", "S90", "S91", "S92", "S93", "S94",
] as const;
const ZONE_E_SEATS = ["S95", "S96", "S97", "S98", "S99", "S100"] as const;

function seat(name: string): Seat {
  return {
    id: `woodlands-${name}`,
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
    branchCode: "WRL",
    branchName: "Woodlands Library",
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
  expectedSeatNames: readonly string[];
}[] = [
  {
    label: "Work & Study Zone A, Level 1",
    definition: WOODLANDS_LEVEL_1_ZONE_A_SEAT_PLAN,
    expectedSeatNames: ZONE_A_SEATS,
  },
  {
    label: "Work & Study Zone B, Level 1",
    definition: WOODLANDS_LEVEL_1_ZONE_B_SEAT_PLAN,
    expectedSeatNames: ZONE_B_SEATS,
  },
  {
    label: "Work & Study Zone C, Level 2",
    definition: WOODLANDS_LEVEL_2_ZONE_C_SEAT_PLAN,
    expectedSeatNames: ZONE_C_SEATS,
  },
  {
    label: "Work & Study Zone D, Level 2",
    definition: WOODLANDS_LEVEL_2_ZONE_D_SEAT_PLAN,
    expectedSeatNames: ZONE_D_SEATS,
  },
  {
    label: "Work & Study Zone E, Level 2",
    definition: WOODLANDS_LEVEL_2_ZONE_E_SEAT_PLAN,
    expectedSeatNames: ZONE_E_SEATS,
  },
];

function hotspot(
  definition: SeatPlanDefinition,
  seatName: string,
): SeatHotspotDefinition {
  const match = definition.hotspots.find((item) => item.seatName === seatName);
  expect(match, `missing hotspot ${seatName}`).toBeDefined();
  return match!;
}

function expectLeftToRight(
  definition: SeatPlanDefinition,
  seatNames: readonly string[],
) {
  const xs = seatNames.map((seatName) => hotspot(definition, seatName).x);
  expect(xs).toEqual([...xs].sort((left, right) => left - right));
}

function expectTopToBottom(
  definition: SeatPlanDefinition,
  seatNames: readonly string[],
) {
  const ys = seatNames.map((seatName) => hotspot(definition, seatName).y);
  expect(ys).toEqual([...ys].sort((top, bottom) => top - bottom));
}

describe("Woodlands Library Zones A-E seat-plan annotations", () => {
  it("exports the five area definitions in area order", () => {
    expect(WOODLANDS_LIBRARY_ZONES_A_E_SEAT_PLANS).toEqual(
      cases.map((testCase) => testCase.definition),
    );
    expect(WOODLANDS_LIBRARY_ZONES_A_E_SEAT_PLANS.map(({ areaId }) => areaId)).toEqual([
      "62", "63", "64", "65", "66",
    ]);
  });

  it.each(cases)("has exact complete coverage for $label", (testCase) => {
    expect(testCase.definition.coverage).toBe("complete");
    expect(testCase.definition.hotspots).toHaveLength(testCase.expectedSeatNames.length);
    expect(testCase.definition.hotspots.map(({ seatName }) => seatName)).toEqual(
      testCase.expectedSeatNames,
    );
    expect(new Set(testCase.definition.hotspots.map(({ seatName }) => seatName)).size).toBe(
      testCase.expectedSeatNames.length,
    );
  });

  it.each(cases)("keeps every $label hotspot in bounds and non-overlapping", (testCase) => {
    for (const [index, current] of testCase.definition.hotspots.entries()) {
      expect(current.x).toBeGreaterThanOrEqual(0);
      expect(current.y).toBeGreaterThanOrEqual(0);
      expect(current.x + current.width).toBeLessThanOrEqual(testCase.definition.imageWidth);
      expect(current.y + current.height).toBeLessThanOrEqual(testCase.definition.imageHeight);

      for (const other of testCase.definition.hotspots.slice(index + 1)) {
        const overlaps =
          current.x < other.x + other.width &&
          current.x + current.width > other.x &&
          current.y < other.y + other.height &&
          current.y + current.height > other.y;
        expect(overlaps, `${current.seatName} overlaps ${other.seatName}`).toBe(false);
      }
    }
  });

  it.each(cases)("resolves $label against its matching catalog", (testCase) => {
    const resolution = resolveSeatPlan(
      areaFor(testCase.definition, testCase.label, testCase.expectedSeatNames),
      `/seatbooking/img/areas/${testCase.definition.mapPath}`,
      {
        width: testCase.definition.imageWidth,
        height: testCase.definition.imageHeight,
      },
      [testCase.definition],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(resolution.hotspots.map(({ seat }) => seat.name)).toEqual(
        testCase.expectedSeatNames,
      );
    }
  });

  it("preserves Zone A's four top-to-bottom columns", () => {
    for (const column of [
      ["S1", "S2", "S3", "S4"],
      ["S5", "S6", "S7", "S8"],
      ["S9", "S10", "S11", "S12"],
      ["S13", "S14", "S15", "S16"],
    ]) {
      expectTopToBottom(WOODLANDS_LEVEL_1_ZONE_A_SEAT_PLAN, column);
    }
    expect(hotspot(WOODLANDS_LEVEL_1_ZONE_A_SEAT_PLAN, "S1").x).toBeLessThan(
      hotspot(WOODLANDS_LEVEL_1_ZONE_A_SEAT_PLAN, "S5").x,
    );
    expect(hotspot(WOODLANDS_LEVEL_1_ZONE_A_SEAT_PLAN, "S9").x).toBeLessThan(
      hotspot(WOODLANDS_LEVEL_1_ZONE_A_SEAT_PLAN, "S13").x,
    );
  });

  it("preserves Zone B's two descending diagonal seat runs", () => {
    for (const diagonal of [["S17", "S18", "S19"], ["S20", "S21", "S22"]]) {
      expectTopToBottom(WOODLANDS_LEVEL_1_ZONE_B_SEAT_PLAN, diagonal);
      const xs = diagonal.map((seatName) => hotspot(WOODLANDS_LEVEL_1_ZONE_B_SEAT_PLAN, seatName).x);
      expect(xs).toEqual([...xs].sort((left, right) => right - left));
    }
  });

  it("preserves the labelled row endpoints in Zones C, D, and E", () => {
    expectLeftToRight(WOODLANDS_LEVEL_2_ZONE_C_SEAT_PLAN, ["S31", "S32", "S33", "S34", "S35", "S36"]);
    expectLeftToRight(WOODLANDS_LEVEL_2_ZONE_C_SEAT_PLAN, ["S53", "S54", "S55", "S56", "S57", "S58"]);
    expectLeftToRight(WOODLANDS_LEVEL_2_ZONE_D_SEAT_PLAN, ["S65", "S66", "S67", "S68", "S69", "S70", "S71", "S72", "S73", "S74"]);
    expectLeftToRight(WOODLANDS_LEVEL_2_ZONE_D_SEAT_PLAN, ["S88", "S89", "S90", "S91", "S92", "S93", "S94"]);
    expectLeftToRight(WOODLANDS_LEVEL_2_ZONE_E_SEAT_PLAN, ZONE_E_SEATS);
  });
});
