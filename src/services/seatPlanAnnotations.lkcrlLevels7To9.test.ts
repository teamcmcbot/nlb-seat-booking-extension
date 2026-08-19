import { describe, expect, it } from "vitest";
import {
  LKCRL_LEVEL_7_EXPRESS_SEATS_ZONE_A_SEAT_PLAN,
  LKCRL_LEVEL_7_LAUNCH_HOT_DESK_ZONE_SEAT_PLAN,
  LKCRL_LEVEL_8_EXPRESS_SEATS_ZONE_B_SEAT_PLAN,
  LKCRL_LEVEL_9_EXPRESS_SEATS_ZONE_C_SEAT_PLAN,
  LKCRL_LEVELS_7_TO_9_SEAT_PLANS,
} from "../data/seatPlans/lkcrlLevels7To9";
import type { Area, Seat } from "../models/catalog";
import type {
  SeatHotspotDefinition,
  SeatPlanDefinition,
} from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const range = (prefix: string, start: number, end: number) =>
  Array.from(
    { length: end - start + 1 },
    (_, index) => `${prefix}${start + index}`,
  );

const ZONE_A_SEATS = range("ES", 1, 59);
const ZONE_B_SEATS = range("ES", 60, 89);
const ZONE_C_SEATS = range("ES", 501, 567);
const HOT_DESK_SEATS = range("HD", 1, 48);

function seat(name: string): Seat {
  return {
    id: `lkcrl-${name}`,
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
    branchCode: "LKCRL",
    branchName: "Lee Kong Chian Reference Library",
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
    label: "Express Seats Zone A, Level 7",
    definition: LKCRL_LEVEL_7_EXPRESS_SEATS_ZONE_A_SEAT_PLAN,
    expectedSeatNames: ZONE_A_SEATS,
  },
  {
    label: "Express Seats Zone B, Level 8",
    definition: LKCRL_LEVEL_8_EXPRESS_SEATS_ZONE_B_SEAT_PLAN,
    expectedSeatNames: ZONE_B_SEATS,
  },
  {
    label: "Express Seats Zone C, Level 9",
    definition: LKCRL_LEVEL_9_EXPRESS_SEATS_ZONE_C_SEAT_PLAN,
    expectedSeatNames: ZONE_C_SEATS,
  },
  {
    label: "Launch Hot Desk Zone, Level 7",
    definition: LKCRL_LEVEL_7_LAUNCH_HOT_DESK_ZONE_SEAT_PLAN,
    expectedSeatNames: HOT_DESK_SEATS,
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

describe("LKCRL Levels 7 to 9 seat-plan annotations", () => {
  it("exports all four definitions in area order", () => {
    expect(LKCRL_LEVELS_7_TO_9_SEAT_PLANS).toEqual(
      cases.map((testCase) => testCase.definition),
    );
    expect(LKCRL_LEVELS_7_TO_9_SEAT_PLANS.map(({ areaId }) => areaId)).toEqual([
      "7", "8", "9", "94",
    ]);
  });

  it.each(cases)("has exact complete coverage for $label", (testCase) => {
    expect(testCase.definition.coverage).toBe("complete");
    expect(testCase.definition.hotspots).toHaveLength(
      testCase.expectedSeatNames.length,
    );
    expect(testCase.definition.hotspots.map(({ seatName }) => seatName)).toEqual(
      testCase.expectedSeatNames,
    );
    expect(new Set(testCase.definition.hotspots.map(({ seatName }) => seatName)).size).toBe(
      testCase.expectedSeatNames.length,
    );
  });

  it.each(cases)("keeps every $label hotspot valid", (testCase) => {
    for (const [index, current] of testCase.definition.hotspots.entries()) {
      expect(Number.isInteger(current.x)).toBe(true);
      expect(Number.isInteger(current.y)).toBe(true);
      expect(Number.isInteger(current.width)).toBe(true);
      expect(Number.isInteger(current.height)).toBe(true);
      expect(current.x).toBeGreaterThanOrEqual(0);
      expect(current.y).toBeGreaterThanOrEqual(0);
      expect(current.x + current.width).toBeLessThanOrEqual(
        testCase.definition.imageWidth,
      );
      expect(current.y + current.height).toBeLessThanOrEqual(
        testCase.definition.imageHeight,
      );

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

  it("preserves Zone A's visible table-edge numbering", () => {
    const definition = LKCRL_LEVEL_7_EXPRESS_SEATS_ZONE_A_SEAT_PLAN;
    expectLeftToRight(definition, ["ES1", "ES2", "ES3", "ES4", "ES5", "ES6"]);
    expectLeftToRight(definition, ["ES30", "ES29", "ES28", "ES27", "ES26", "ES25"]);
    expectTopToBottom(definition, ["ES41", "ES42", "ES43", "ES44", "ES45"]);
    expectTopToBottom(definition, ["ES54", "ES55", "ES56", "ES57", "ES58", "ES59"]);
    expect(hotspot(definition, "ES33").x).toBeLessThan(hotspot(definition, "ES34").x);
    expect(hotspot(definition, "ES53").x).toBeLessThan(hotspot(definition, "ES52").x);
  });

  it("preserves Zone B's horizontal and vertical endpoints", () => {
    const definition = LKCRL_LEVEL_8_EXPRESS_SEATS_ZONE_B_SEAT_PLAN;
    expectTopToBottom(definition, ["ES68", "ES69", "ES70", "ES71", "ES72", "ES73"]);
    expectTopToBottom(definition, ["ES65", "ES64", "ES63", "ES62", "ES61", "ES60"]);
    expectLeftToRight(definition, ["ES89", "ES74", "ES75", "ES76", "ES77", "ES78"]);
    expectLeftToRight(definition, ["ES86", "ES85", "ES84", "ES83", "ES82", "ES81"]);
  });

  it("preserves Zone C's five visible table groups", () => {
    const definition = LKCRL_LEVEL_9_EXPRESS_SEATS_ZONE_C_SEAT_PLAN;
    expectTopToBottom(definition, ["ES505", "ES504", "ES503", "ES502", "ES501"]);
    expectLeftToRight(definition, ["ES515", "ES516", "ES517", "ES518", "ES519", "ES520"]);
    expectLeftToRight(definition, ["ES543", "ES542", "ES541", "ES540", "ES539", "ES538"]);
    expectLeftToRight(definition, ["ES546", "ES547", "ES548", "ES549"]);
    expectLeftToRight(definition, ["ES558", "ES559", "ES560", "ES561", "ES562", "ES563", "ES564", "ES565"]);
  });

  it("preserves all sixteen hot-desk columns and excludes BZ stations", () => {
    const definition = LKCRL_LEVEL_7_LAUNCH_HOT_DESK_ZONE_SEAT_PLAN;
    for (const column of [
      ["HD10", "HD11", "HD12"], ["HD9", "HD8", "HD7"],
      ["HD4", "HD5", "HD6"], ["HD3", "HD2", "HD1"],
      ["HD22", "HD23", "HD24"], ["HD21", "HD20", "HD19"],
      ["HD16", "HD17", "HD18"], ["HD15", "HD14", "HD13"],
      ["HD34", "HD35", "HD36"], ["HD33", "HD32", "HD31"],
      ["HD28", "HD29", "HD30"], ["HD27", "HD26", "HD25"],
      ["HD46", "HD47", "HD48"], ["HD45", "HD44", "HD43"],
      ["HD40", "HD41", "HD42"], ["HD39", "HD38", "HD37"],
    ]) {
      expectTopToBottom(definition, column);
    }
    expect(definition.hotspots.some(({ seatName }) => seatName.startsWith("BZ"))).toBe(false);
  });

  it("uses live unpadded catalog identities for single-digit ES and HD seats", () => {
    expect(
      LKCRL_LEVEL_7_EXPRESS_SEATS_ZONE_A_SEAT_PLAN.hotspots
        .slice(0, 9)
        .map(({ seatName }) => seatName),
    ).toEqual(range("ES", 1, 9));
    expect(
      LKCRL_LEVEL_7_LAUNCH_HOT_DESK_ZONE_SEAT_PLAN.hotspots.some(
        ({ seatName }) => seatName === "HD1",
      ),
    ).toBe(true);
    expect(
      LKCRL_LEVEL_7_LAUNCH_HOT_DESK_ZONE_SEAT_PLAN.hotspots.some(
        ({ seatName }) => seatName === "HD01",
      ),
    ).toBe(false);
  });
});
