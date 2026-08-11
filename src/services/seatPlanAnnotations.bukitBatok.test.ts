import { describe, expect, it } from "vitest";
import { BUKIT_BATOK_LEVEL_2_STUDY_ZONE_SEAT_PLAN } from "../data/seatPlans/bukitBatokLibrary";
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
  "S25",
  "S26",
] as const;

function seat(name: string, index: number): Seat {
  return {
    id: `bukit-batok-seat-${index + 1}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function studyZoneArea(seats: Seat[]): Area {
  return {
    id: "97",
    branchId: "9",
    branchCode: "BBPL",
    branchName: "Bukit Batok Library",
    name: "Study Zone, Level 2",
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats,
  };
}

describe("Bukit Batok Library seat-plan annotations", () => {
  it("provides complete verified coverage for Study Zone, Level 2", () => {
    const hotspotNames = BUKIT_BATOK_LEVEL_2_STUDY_ZONE_SEAT_PLAN.hotspots.map(
      (hotspot) => hotspot.seatName,
    );

    expect(BUKIT_BATOK_LEVEL_2_STUDY_ZONE_SEAT_PLAN.coverage).toBe("complete");
    expect(hotspotNames).toHaveLength(26);
    expect(hotspotNames).toEqual(EXPECTED_SEAT_NAMES);

    const catalogSeats = EXPECTED_SEAT_NAMES.map(seat);
    const resolution = resolveSeatPlan(
      studyZoneArea(catalogSeats),
      BUKIT_BATOK_LEVEL_2_STUDY_ZONE_SEAT_PLAN.mapPath,
      { width: 657, height: 811 },
      [BUKIT_BATOK_LEVEL_2_STUDY_ZONE_SEAT_PLAN],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(resolution.hotspots).toHaveLength(26);
      expect(resolution.hotspots.map((hotspot) => hotspot.seat.name)).toEqual(
        EXPECTED_SEAT_NAMES,
      );
    }
  });
});
