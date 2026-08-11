import { describe, expect, it } from "vitest";
import {
  BISHAN_LEVEL_3_MOTHER_TONGUE_SEAT_PLAN,
  BISHAN_LEVEL_3_SINGAPORE_COLLECTION_SEAT_PLAN,
  BISHAN_LEVEL_4_YOUNG_PEOPLE_SEAT_PLAN,
} from "../data/seatPlans/bishanLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const MOTHER_TONGUE_SEATS = [
  "S37", "S36", "S34", "S35", "S33", "S32", "S30", "S31",
  "S29", "S28", "S26", "S27", "S25", "S24", "S22", "S23",
  "S21", "S20", "S18", "S19", "S17", "S16", "S14", "S15",
] as const;

const SINGAPORE_COLLECTION_SEATS = [
  "S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10",
  "S11", "S12", "S13",
] as const;

const YOUNG_PEOPLE_SEATS = [
  "S85", "S82", "S83", "S88", "S87", "S89", "S86", "S80", "S79",
  "S81", "S78", "S92", "S91", "S93", "S90", "S76", "S75", "S77",
  "S74", "S72", "S71", "S73", "S70", "S68", "S67", "S69", "S66",
  "S64", "S63", "S65", "S62", "S60", "S59", "S61", "S58", "S96",
  "S95", "S97", "S94", "S56", "S55", "S57", "S54", "S52", "S51",
  "S53", "S50", "S48", "S47", "S49", "S46", "S44", "S43", "S45",
  "S42", "S40", "S39", "S41", "S38", "S100", "S99", "S101", "S98",
] as const;

function seat(name: string, index: number): Seat {
  return {
    id: `bishan-seat-${index}`,
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
    branchCode: "BIPL",
    branchName: "Bishan Library",
    name,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: seatNames.map(seat),
  };
}

describe("Bishan Library seat-plan annotations", () => {
  it.each([
    {
      definition: BISHAN_LEVEL_3_MOTHER_TONGUE_SEAT_PLAN,
      areaName: "Mother Tongue Collection, Level 3",
      seatNames: MOTHER_TONGUE_SEATS,
      expectedCount: 24,
    },
    {
      definition: BISHAN_LEVEL_3_SINGAPORE_COLLECTION_SEAT_PLAN,
      areaName: "Singapore Collection, Level 3",
      seatNames: SINGAPORE_COLLECTION_SEATS,
      expectedCount: 13,
    },
    {
      definition: BISHAN_LEVEL_4_YOUNG_PEOPLE_SEAT_PLAN,
      areaName: "Young People's Collection, Level 4",
      seatNames: YOUNG_PEOPLE_SEATS,
      expectedCount: 63,
    },
  ])(
    "resolves complete coverage for $areaName",
    ({ definition, areaName, seatNames, expectedCount }) => {
      expect(definition.coverage).toBe("complete");
      expect(definition.hotspots).toHaveLength(expectedCount);
      expect(definition.hotspots.map((hotspot) => hotspot.seatName)).toEqual(
        seatNames,
      );

      const matchingArea = area(definition, areaName, seatNames);
      const resolution = resolveSeatPlan(
        matchingArea,
        definition.mapPath,
        { width: definition.imageWidth, height: definition.imageHeight },
        [definition],
      );

      expect(resolution.status).toBe("ready");
      if (resolution.status === "ready") {
        expect(resolution.hotspots).toHaveLength(expectedCount);
        expect(resolution.hotspots.map((hotspot) => hotspot.seat.name)).toEqual(
          seatNames,
        );
      }
    },
  );
});
