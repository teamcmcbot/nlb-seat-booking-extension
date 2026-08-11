import { describe, expect, it } from "vitest";
import {
  WOODLANDS_LEVEL_2_ZONE_F_SEAT_PLAN,
  WOODLANDS_LEVEL_2_ZONE_G_SEAT_PLAN,
  WOODLANDS_LEVEL_2_ZONE_H_SEAT_PLAN,
  WOODLANDS_LEVEL_3_ZONE_J_SEAT_PLAN,
  WOODLANDS_LIBRARY_ZONES_FJ_SEAT_PLANS,
} from "../data/seatPlans/woodlandsLibraryZonesFJ";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const ZONE_F_SEATS = [
  "S101", "S102", "S103", "S104", "S105", "S106", "S107", "S108",
  "S109", "S110", "S111", "S112", "S113", "S114", "S115", "S116",
  "S117", "S118", "S119", "S120", "S121", "S122", "S123", "S124",
  "S125", "S126", "S127", "S128", "S129", "S130", "S131", "S132",
  "S133",
] as const;

const ZONE_G_SEATS = [
  "S134", "S135", "S136", "S137", "S138", "S139", "S140", "S141",
  "S142", "S143", "S144", "S145", "S146", "S147", "S148", "S149",
  "S150", "S151", "S152", "S153", "S154", "S155", "S156", "S157",
] as const;

const ZONE_H_SEATS = [
  "S158", "S159", "S160", "S161", "S162", "S163", "S164",
] as const;

const ZONE_J_SEATS = [
  "S165", "S166", "S167", "S168", "S169", "S170",
] as const;

function seat(name: string, index: number): Seat {
  return {
    id: `woodlands-seat-${name}-${index + 1}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function area(areaId: string, name: string, seats: Seat[]): Area {
  return {
    id: areaId,
    branchId: "31",
    branchCode: "WRL",
    branchName: "Woodlands Library",
    name,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats,
  };
}

function hotspot(definition: SeatPlanDefinition, seatName: string) {
  const match = definition.hotspots.find(
    (candidate) => candidate.seatName === seatName,
  );
  expect(match).toBeDefined();
  return match!;
}

function expectIncreasingX(
  definition: SeatPlanDefinition,
  seatNames: readonly string[],
) {
  const positions = seatNames.map((seatName) => hotspot(definition, seatName).x);
  expect(positions).toEqual([...positions].sort((left, right) => left - right));
}

const CASES = [
  {
    definition: WOODLANDS_LEVEL_2_ZONE_F_SEAT_PLAN,
    areaName: "Work & Study Zone F, Level 2",
    expectedSeats: ZONE_F_SEATS,
    imageSize: { width: 974, height: 570 },
  },
  {
    definition: WOODLANDS_LEVEL_2_ZONE_G_SEAT_PLAN,
    areaName: "Work & Study Zone G, Level 2",
    expectedSeats: ZONE_G_SEATS,
    imageSize: { width: 979, height: 554 },
  },
  {
    definition: WOODLANDS_LEVEL_2_ZONE_H_SEAT_PLAN,
    areaName: "Work & Study Zone H, Level 2",
    expectedSeats: ZONE_H_SEATS,
    imageSize: { width: 745, height: 469 },
  },
  {
    definition: WOODLANDS_LEVEL_3_ZONE_J_SEAT_PLAN,
    areaName: "Work & Study Zone J, Level 3",
    expectedSeats: ZONE_J_SEATS,
    imageSize: { width: 929, height: 527 },
  },
] as const;

describe("Woodlands Library Zones F through J seat-plan annotations", () => {
  it.each(CASES)(
    "provides complete exact coverage for $areaName",
    ({ definition, areaName, expectedSeats, imageSize }) => {
      const hotspotNames = definition.hotspots.map(
        (candidate) => candidate.seatName,
      );

      expect(definition.coverage).toBe("complete");
      expect(hotspotNames).toHaveLength(expectedSeats.length);
      expect(hotspotNames).toEqual(expectedSeats);
      expect(new Set(hotspotNames).size).toBe(expectedSeats.length);

      const catalogSeats = expectedSeats.map(seat);
      const resolution = resolveSeatPlan(
        area(definition.areaId, areaName, catalogSeats),
        definition.mapPath,
        imageSize,
        WOODLANDS_LIBRARY_ZONES_FJ_SEAT_PLANS,
      );

      expect(resolution.status).toBe("ready");
      if (resolution.status === "ready") {
        expect(resolution.hotspots).toHaveLength(expectedSeats.length);
        expect(
          resolution.hotspots.map((candidate) => candidate.seat.name),
        ).toEqual(expectedSeats);
      }
    },
  );

  it("preserves Zone F's visible row and paired-desk ordering", () => {
    expectIncreasingX(WOODLANDS_LEVEL_2_ZONE_F_SEAT_PLAN, [
      "S101", "S102", "S103", "S104", "S105", "S106", "S107", "S108",
      "S109", "S110", "S111",
    ]);
    expectIncreasingX(WOODLANDS_LEVEL_2_ZONE_F_SEAT_PLAN, [
      "S112", "S113", "S114", "S115", "S116",
    ]);
    expectIncreasingX(WOODLANDS_LEVEL_2_ZONE_F_SEAT_PLAN, [
      "S117", "S118", "S119", "S120", "S121",
    ]);
    expect(hotspot(WOODLANDS_LEVEL_2_ZONE_F_SEAT_PLAN, "S124").y).toBeGreaterThan(
      hotspot(WOODLANDS_LEVEL_2_ZONE_F_SEAT_PLAN, "S122").y,
    );
    expect(hotspot(WOODLANDS_LEVEL_2_ZONE_F_SEAT_PLAN, "S125").y).toBeGreaterThan(
      hotspot(WOODLANDS_LEVEL_2_ZONE_F_SEAT_PLAN, "S123").y,
    );
    expectIncreasingX(WOODLANDS_LEVEL_2_ZONE_F_SEAT_PLAN, [
      "S122", "S123", "S126", "S127", "S130", "S131",
    ]);
  });

  it("preserves Zone G's paired columns and top-to-bottom numbering", () => {
    for (const [left, right] of [
      ["S134", "S135"], ["S136", "S137"], ["S138", "S139"],
      ["S140", "S141"], ["S142", "S143"], ["S144", "S145"],
      ["S146", "S147"], ["S148", "S149"], ["S150", "S151"],
      ["S152", "S153"], ["S154", "S155"], ["S156", "S157"],
    ] as const) {
      expect(hotspot(WOODLANDS_LEVEL_2_ZONE_G_SEAT_PLAN, left).x).toBeLessThan(
        hotspot(WOODLANDS_LEVEL_2_ZONE_G_SEAT_PLAN, right).x,
      );
    }

    expect(hotspot(WOODLANDS_LEVEL_2_ZONE_G_SEAT_PLAN, "S148").y).toBeGreaterThan(
      hotspot(WOODLANDS_LEVEL_2_ZONE_G_SEAT_PLAN, "S134").y,
    );
    expect(hotspot(WOODLANDS_LEVEL_2_ZONE_G_SEAT_PLAN, "S156").y).toBeGreaterThan(
      hotspot(WOODLANDS_LEVEL_2_ZONE_G_SEAT_PLAN, "S150").y,
    );
  });

  it("preserves the left-to-right order in Zones H and J", () => {
    expectIncreasingX(WOODLANDS_LEVEL_2_ZONE_H_SEAT_PLAN, ZONE_H_SEATS);
    expectIncreasingX(WOODLANDS_LEVEL_3_ZONE_J_SEAT_PLAN, ZONE_J_SEATS);

    const s164 = hotspot(WOODLANDS_LEVEL_2_ZONE_H_SEAT_PLAN, "S164");
    expect(s164.y + s164.height).toBeLessThanOrEqual(164);
  });
});
