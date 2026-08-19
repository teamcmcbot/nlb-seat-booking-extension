import { describe, expect, it } from "vitest";
import { CLEMENTI_LEVEL_5_TAMIL_COLLECTION_SEAT_PLAN } from "../data/seatPlans/clementiLibrary";
import type { Area, Seat } from "../models/catalog";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const EXPECTED_SEAT_NAMES = [
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
  "S7",
  "S8",
  "S9",
] as const;

function seat(name: string): Seat {
  return {
    id: `clementi-${name}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function tamilCollectionArea(): Area {
  return {
    id: "30",
    branchId: "13",
    branchCode: "CMPL",
    branchName: "Clementi Library",
    name: "Tamil Collection, Level 5",
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: EXPECTED_SEAT_NAMES.map(seat),
  };
}

describe("Clementi Library seat-plan annotations", () => {
  it("has complete verified coverage for the Tamil Collection", () => {
    expect(CLEMENTI_LEVEL_5_TAMIL_COLLECTION_SEAT_PLAN.coverage).toBe(
      "complete",
    );
    expect(CLEMENTI_LEVEL_5_TAMIL_COLLECTION_SEAT_PLAN.hotspots).toHaveLength(
      EXPECTED_SEAT_NAMES.length,
    );
    expect(
      CLEMENTI_LEVEL_5_TAMIL_COLLECTION_SEAT_PLAN.hotspots.map(
        (hotspot) => hotspot.seatName,
      ),
    ).toEqual(EXPECTED_SEAT_NAMES);
  });

  it("resolves the Tamil Collection against the matching catalog", () => {
    const definition = CLEMENTI_LEVEL_5_TAMIL_COLLECTION_SEAT_PLAN;
    const resolution = resolveSeatPlan(
      tamilCollectionArea(),
      definition.mapPath,
      {
        width: definition.imageWidth,
        height: definition.imageHeight,
      },
      [definition],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(resolution.hotspots).toHaveLength(EXPECTED_SEAT_NAMES.length);
      expect(resolution.hotspots.map((hotspot) => hotspot.seat.name)).toEqual(
        EXPECTED_SEAT_NAMES,
      );
    }
  });
});
