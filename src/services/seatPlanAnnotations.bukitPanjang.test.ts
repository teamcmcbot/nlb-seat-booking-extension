import { describe, expect, it } from "vitest";
import {
  BUKIT_PANJANG_ADULT_NON_FICTION_SEAT_PLAN,
  BUKIT_PANJANG_TEENS_FICTION_SEAT_PLAN,
} from "../data/seatPlans/bukitPanjangLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const ADULT_NON_FICTION_SEAT_NAMES = [
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
] as const;

const TEENS_FICTION_SEAT_NAMES = [
  "S19",
  "S20",
  "S21",
  "S22",
  "S23",
  "S24",
  "S25",
  "S26",
] as const;

function seat(name: string): Seat {
  return {
    id: `bukit-panjang-${name}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function area(
  definition: SeatPlanDefinition,
  name: string,
  seatNames: readonly string[],
): Area {
  return {
    id: definition.areaId,
    branchId: definition.branchId,
    branchCode: "BPPL",
    branchName: "Bukit Panjang Library",
    name,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: seatNames.map(seat),
  };
}

function expectCompletePlan(
  definition: SeatPlanDefinition,
  areaName: string,
  expectedSeatNames: readonly string[],
) {
  expect(definition.coverage).toBe("complete");
  expect(definition.hotspots).toHaveLength(expectedSeatNames.length);
  expect(definition.hotspots.map((hotspot) => hotspot.seatName)).toEqual(
    expectedSeatNames,
  );

  const resolution = resolveSeatPlan(
    area(definition, areaName, expectedSeatNames),
    `/seatbooking/img/areas/${definition.mapPath}`,
    { width: definition.imageWidth, height: definition.imageHeight },
    [definition],
  );

  expect(resolution.status).toBe("ready");
  if (resolution.status === "ready") {
    expect(resolution.hotspots).toHaveLength(expectedSeatNames.length);
    expect(resolution.hotspots.map((hotspot) => hotspot.seat.name)).toEqual(
      expectedSeatNames,
    );
  }
}

describe("Bukit Panjang Library seat-plan annotations", () => {
  it("maps all 18 Adult Non-Fiction seats", () => {
    expectCompletePlan(
      BUKIT_PANJANG_ADULT_NON_FICTION_SEAT_PLAN,
      "Adult Non-Fiction, Level 4",
      ADULT_NON_FICTION_SEAT_NAMES,
    );
  });

  it("maps all 8 Teens' Fiction seats", () => {
    expectCompletePlan(
      BUKIT_PANJANG_TEENS_FICTION_SEAT_PLAN,
      "Teens' Fiction, Level 4",
      TEENS_FICTION_SEAT_NAMES,
    );
  });
});
