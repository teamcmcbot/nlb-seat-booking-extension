import { describe, expect, it } from "vitest";
import {
  CENTRAL_LIBRARY_B1_READING_ZONE_SEAT_PLAN,
  CENTRAL_LIBRARY_B1_STUDY_ZONE_SEAT_PLAN,
} from "../data/seatPlans/centralLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const READING_ZONE_SEAT_NAMES = [
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
] as const;

const STUDY_ZONE_SEAT_NAMES = [
  "S22",
  "S23",
  "S24",
  "S25",
  "S26",
  "S27",
  "S28",
  "S29",
] as const;

function seat(name: string): Seat {
  return {
    id: `central-${name}`,
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
    branchCode: "CLL",
    branchName: "Central Public Library",
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
  area: Area,
  expectedSeatNames: readonly string[],
) {
  expect(definition.coverage).toBe("complete");
  expect(definition.hotspots).toHaveLength(expectedSeatNames.length);
  expect(definition.hotspots.map((hotspot) => hotspot.seatName)).toEqual(
    expectedSeatNames,
  );

  const resolution = resolveSeatPlan(
    area,
    definition.mapPath,
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

describe("Central Public Library seat-plan annotations", () => {
  it("maps every Reading Zone seat from S1 through S21", () => {
    expectCompletePlan(
      CENTRAL_LIBRARY_B1_READING_ZONE_SEAT_PLAN,
      areaFor(
        CENTRAL_LIBRARY_B1_READING_ZONE_SEAT_PLAN,
        "Reading Zone, Level B1",
        READING_ZONE_SEAT_NAMES,
      ),
      READING_ZONE_SEAT_NAMES,
    );
  });

  it("maps every Study Zone seat from S22 through S29", () => {
    expectCompletePlan(
      CENTRAL_LIBRARY_B1_STUDY_ZONE_SEAT_PLAN,
      areaFor(
        CENTRAL_LIBRARY_B1_STUDY_ZONE_SEAT_PLAN,
        "Study Zone, Level B1",
        STUDY_ZONE_SEAT_NAMES,
      ),
      STUDY_ZONE_SEAT_NAMES,
    );
  });
});
