import { describe, expect, it } from "vitest";
import {
  ANG_MO_KIO_ZONE_1_SEAT_PLAN,
  ANG_MO_KIO_ZONE_2_SEAT_PLAN,
  ANG_MO_KIO_ZONE_3_SEAT_PLAN,
  ANG_MO_KIO_ZONE_4_SEAT_PLAN,
} from "../data/seatPlans/angMoKioLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

function expectedSeats(first: number, last: number): Seat[] {
  return Array.from({ length: last - first + 1 }, (_, index) => {
    const seatNumber = first + index;
    return {
      id: String(2512 + seatNumber),
      code: "",
      name: `S${seatNumber}`,
      disabled: false,
      availableSlots: [],
    };
  });
}

function areaFor(
  definition: SeatPlanDefinition,
  areaName: string,
  seats: readonly Seat[],
): Area {
  return {
    id: definition.areaId,
    branchId: definition.branchId,
    branchCode: "AMPL",
    branchName: "Ang Mo Kio Library",
    name: areaName,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [definition.mapPath],
    seats: [...seats],
  };
}

const cases = [
  {
    label: "Zone 1",
    areaName: "Zone 1 (MMS Zone), Level 4",
    definition: ANG_MO_KIO_ZONE_1_SEAT_PLAN,
    seats: expectedSeats(1, 8),
  },
  {
    label: "Zone 2",
    areaName: "Zone 2 (Between MMS Zone and Adult Collection), Level 4",
    definition: ANG_MO_KIO_ZONE_2_SEAT_PLAN,
    seats: expectedSeats(9, 38),
  },
  {
    label: "Zone 3",
    areaName: "Zone 3 (Adult collection), Level 4",
    definition: ANG_MO_KIO_ZONE_3_SEAT_PLAN,
    seats: expectedSeats(39, 45),
  },
  {
    label: "Zone 4",
    areaName: "Zone 4 (Study Zone), Level 4",
    definition: ANG_MO_KIO_ZONE_4_SEAT_PLAN,
    seats: expectedSeats(46, 94),
  },
] as const;

function hotspot(definition: SeatPlanDefinition, seatName: string) {
  const result = definition.hotspots.find(
    (candidate) => candidate.seatName === seatName,
  );
  expect(result).toBeDefined();
  return result!;
}

describe("Ang Mo Kio Library seat-plan annotations", () => {
  it("uses larger centered click targets throughout Zone 2", () => {
    expect(ANG_MO_KIO_ZONE_2_SEAT_PLAN.hotspots).toHaveLength(30);
    for (const seatHotspot of ANG_MO_KIO_ZONE_2_SEAT_PLAN.hotspots) {
      expect(seatHotspot).toMatchObject({ width: 48, height: 48 });
    }
  });

  it.each(cases)("has exact catalog identity coverage for $label", (testCase) => {
    expect(testCase.definition.coverage).toBe("complete");
    expect(
      testCase.definition.hotspots.map(({ seatName, expectedSeatId }) => ({
        seatName,
        expectedSeatId,
      })),
    ).toEqual(
      testCase.seats.map(({ name, id }) => ({
        seatName: name,
        expectedSeatId: id,
      })),
    );
  });

  it.each(cases)("has in-bounds, non-overlapping hotspots for $label", (testCase) => {
    const { definition } = testCase;

    for (const [index, hotspotA] of definition.hotspots.entries()) {
      expect(hotspotA.x).toBeGreaterThanOrEqual(0);
      expect(hotspotA.y).toBeGreaterThanOrEqual(0);
      expect(hotspotA.x + hotspotA.width).toBeLessThanOrEqual(definition.imageWidth);
      expect(hotspotA.y + hotspotA.height).toBeLessThanOrEqual(definition.imageHeight);

      for (const hotspotB of definition.hotspots.slice(index + 1)) {
        const overlaps =
          hotspotA.x < hotspotB.x + hotspotB.width &&
          hotspotA.x + hotspotA.width > hotspotB.x &&
          hotspotA.y < hotspotB.y + hotspotB.height &&
          hotspotA.y + hotspotA.height > hotspotB.y;
        expect(overlaps, `${hotspotA.seatName} overlaps ${hotspotB.seatName}`).toBe(false);
      }
    }
  });

  it.each(cases)("resolves $label against the matching catalog IDs", (testCase) => {
    const resolution = resolveSeatPlan(
      areaFor(testCase.definition, testCase.areaName, testCase.seats),
      testCase.definition.mapPath,
      {
        width: testCase.definition.imageWidth,
        height: testCase.definition.imageHeight,
      },
      [testCase.definition],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(resolution.hotspots.map(({ seat }) => seat.id)).toEqual(
        testCase.seats.map(({ id }) => id),
      );
    }
  });

  it("preserves the Zone 4 desk rows and accessibility gap", () => {
    const plan = ANG_MO_KIO_ZONE_4_SEAT_PLAN;
    const topRow = Array.from({ length: 19 }, (_, index) =>
      hotspot(plan, `S${46 + index}`),
    );

    expect(topRow.map(({ x }) => x)).toEqual(
      [...topRow.map(({ x }) => x)].sort((left, right) => left - right),
    );
    expect(hotspot(plan, "S89").x).toBe(hotspot(plan, "S90").x);
    expect(hotspot(plan, "S91").x).toBeGreaterThan(hotspot(plan, "S90").x);
    expect(hotspot(plan, "S92").x).toBeGreaterThan(hotspot(plan, "S91").x);
    expect(hotspot(plan, "S94").y).toBeGreaterThan(hotspot(plan, "S93").y);
  });
});
