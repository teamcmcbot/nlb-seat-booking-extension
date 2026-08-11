import { describe, expect, it } from "vitest";
import { JURONG_LEVEL_3_STUDY_AREA_SEAT_PLAN } from "../data/seatPlans/jurongStudyArea";
import type { Area, Seat } from "../models/catalog";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const VERIFIED_VISIBLE_RANGES = [
  [93, 96],
  [97, 100],
  [101, 124],
  [125, 148],
  [149, 172],
  [173, 196],
  [197, 220],
  [221, 244],
  [245, 265],
  [266, 286],
  [287, 290],
] as const;

const EXPECTED_SEAT_NAMES = VERIFIED_VISIBLE_RANGES.flatMap(([first, last]) =>
  Array.from({ length: last - first + 1 }, (_, index) => `S${first + index}`),
);

function bySeatNumber(left: string, right: string) {
  return Number(left.slice(1)) - Number(right.slice(1));
}

function hotspot(seatName: string) {
  const match = JURONG_LEVEL_3_STUDY_AREA_SEAT_PLAN.hotspots.find(
    (candidate) => candidate.seatName === seatName,
  );
  expect(match).toBeDefined();
  return match;
}

function seat(name: string, index: number): Seat {
  return {
    id: `jurong-study-area-seat-${index + 1}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function studyArea(seats: Seat[]): Area {
  return {
    id: "2",
    branchId: "2",
    branchCode: "JRL",
    branchName: "Jurong Library",
    name: "Study Area, Level 3",
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats,
  };
}

describe("Jurong Library Level 3 Study Area seat-plan annotations", () => {
  it("provides complete verified coverage for all 198 labelled seats", () => {
    const hotspotNames = JURONG_LEVEL_3_STUDY_AREA_SEAT_PLAN.hotspots.map(
      (hotspot) => hotspot.seatName,
    );

    expect(JURONG_LEVEL_3_STUDY_AREA_SEAT_PLAN.coverage).toBe("complete");
    expect(JURONG_LEVEL_3_STUDY_AREA_SEAT_PLAN.mapPath).toBe(
      "jrl-3-studyarea-sp-full.png?t=20221130",
    );
    expect(hotspotNames).toHaveLength(198);
    expect(new Set(hotspotNames).size).toBe(198);
    expect([...hotspotNames].sort(bySeatNumber)).toEqual(EXPECTED_SEAT_NAMES);

    expect(hotspot("S148")).toMatchObject({ x: 232, y: 527 });
    expect(hotspot("S125")).toMatchObject({ x: 1068, y: 527 });
    expect(hotspot("S196")).toMatchObject({ x: 232, y: 410 });
    expect(hotspot("S173")).toMatchObject({ x: 1068, y: 410 });
    expect(hotspot("S244")).toMatchObject({ x: 232, y: 291 });
    expect(hotspot("S221")).toMatchObject({ x: 1068, y: 291 });
    expect(hotspot("S286")).toMatchObject({ x: 348, y: 177 });
    expect(hotspot("S266")).toMatchObject({ x: 1072, y: 177 });

    const catalogSeats = EXPECTED_SEAT_NAMES.map(seat);
    const resolution = resolveSeatPlan(
      studyArea(catalogSeats),
      JURONG_LEVEL_3_STUDY_AREA_SEAT_PLAN.mapPath,
      { width: 1126, height: 844 },
      [JURONG_LEVEL_3_STUDY_AREA_SEAT_PLAN],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(resolution.hotspots).toHaveLength(198);
      expect(
        resolution.hotspots
          .map((resolvedHotspot) => resolvedHotspot.seat.name)
          .sort(bySeatNumber),
      ).toEqual(EXPECTED_SEAT_NAMES);
    }
  });
});
