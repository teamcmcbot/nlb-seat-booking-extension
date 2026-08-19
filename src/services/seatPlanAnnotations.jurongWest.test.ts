import { describe, expect, it } from "vitest";
import {
  JURONG_WEST_LEVEL_3_QUIET_READING_SEAT_PLAN,
  JURONG_WEST_LEVEL_3_STAIRWELL_SEAT_PLAN,
  JURONG_WEST_LIBRARY_SEAT_PLANS,
} from "../data/seatPlans/jurongWestLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const QUIET_READING_SEATS = [
  "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9",
  "S10", "S11", "S12", "S13", "S14", "S15", "S16", "S17", "S18",
] as const;

const STAIRWELL_SEATS = [
  "S19", "S20", "S21", "S22", "S23", "S24", "S25", "S26", "S27", "S28",
  "S29", "S30", "S31", "S32", "S33", "S34", "S35", "S36", "S37", "S38",
  "S39", "S40", "S41", "S42", "S43", "S44", "S45", "S46", "S47", "S48",
  "S49", "S50", "S51", "S52", "S53", "S54", "S55", "S56", "S57", "S58",
] as const;

function seat(name: string): Seat {
  return {
    id: `jurong-west-${name}`,
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
    branchCode: "JWPL",
    branchName: "Jurong West Library",
    name,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: seatNames.map(seat),
  };
}

function hotspot(definition: SeatPlanDefinition, seatName: string) {
  const match = definition.hotspots.find(
    (candidate) => candidate.seatName === seatName,
  );
  expect(match).toBeDefined();
  return match!;
}

const CASES = [
  {
    definition: JURONG_WEST_LEVEL_3_QUIET_READING_SEAT_PLAN,
    areaName: "Beside Quiet Reading Area, Level 3",
    expectedSeats: QUIET_READING_SEATS,
  },
  {
    definition: JURONG_WEST_LEVEL_3_STAIRWELL_SEAT_PLAN,
    areaName: "Beside Stairwell, Level 3",
    expectedSeats: STAIRWELL_SEATS,
  },
] as const;

describe("Jurong West Library seat-plan annotations", () => {
  it.each(CASES)(
    "provides complete exact coverage for $areaName",
    ({ definition, expectedSeats }) => {
      const names = definition.hotspots.map((candidate) => candidate.seatName);
      expect(definition.coverage).toBe("complete");
      expect(names).toHaveLength(expectedSeats.length);
      expect(names).toEqual(expectedSeats);
      expect(new Set(names).size).toBe(expectedSeats.length);
    },
  );

  it.each(CASES)(
    "resolves $areaName against the matching catalog",
    ({ definition, areaName, expectedSeats }) => {
      const resolution = resolveSeatPlan(
        areaFor(definition, areaName, expectedSeats),
        definition.mapPath,
        { width: definition.imageWidth, height: definition.imageHeight },
        JURONG_WEST_LIBRARY_SEAT_PLANS,
      );

      expect(resolution.status).toBe("ready");
      if (resolution.status === "ready") {
        expect(resolution.hotspots).toHaveLength(expectedSeats.length);
        expect(resolution.hotspots.map((candidate) => candidate.seat.name)).toEqual(
          expectedSeats,
        );
      }
    },
  );

  it("preserves the quiet-reading row's left-to-right S1 through S18 order", () => {
    const positions = QUIET_READING_SEATS.map(
      (seatName) => hotspot(JURONG_WEST_LEVEL_3_QUIET_READING_SEAT_PLAN, seatName).x,
    );
    expect(positions).toEqual([...positions].sort((left, right) => left - right));
    expect(hotspot(JURONG_WEST_LEVEL_3_QUIET_READING_SEAT_PLAN, "S1").x).toBe(39);
    expect(hotspot(JURONG_WEST_LEVEL_3_QUIET_READING_SEAT_PLAN, "S18").x).toBe(718);
  });

  it("preserves the stairwell's alternating pairs and right-to-left numbering", () => {
    const topRow = [
      "S58", "S55", "S54", "S51", "S50", "S47", "S46", "S43", "S42", "S39",
      "S38", "S35", "S34", "S31", "S30", "S27", "S26", "S23", "S22", "S19",
    ] as const;
    const bottomRow = [
      "S57", "S56", "S53", "S52", "S49", "S48", "S45", "S44", "S41", "S40",
      "S37", "S36", "S33", "S32", "S29", "S28", "S25", "S24", "S21", "S20",
    ] as const;

    for (const row of [topRow, bottomRow]) {
      const positions = row.map(
        (seatName) => hotspot(JURONG_WEST_LEVEL_3_STAIRWELL_SEAT_PLAN, seatName).x,
      );
      expect(positions).toEqual([...positions].sort((left, right) => left - right));
    }

    expect(hotspot(JURONG_WEST_LEVEL_3_STAIRWELL_SEAT_PLAN, "S19").y).toBeLessThan(
      hotspot(JURONG_WEST_LEVEL_3_STAIRWELL_SEAT_PLAN, "S20").y,
    );
    expect(hotspot(JURONG_WEST_LEVEL_3_STAIRWELL_SEAT_PLAN, "S58").y).toBeLessThan(
      hotspot(JURONG_WEST_LEVEL_3_STAIRWELL_SEAT_PLAN, "S57").y,
    );
  });
});
