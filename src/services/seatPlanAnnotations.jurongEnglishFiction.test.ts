import { describe, expect, it } from "vitest";
import { JURONG_LEVEL_2_ENGLISH_FICTION_SEAT_PLAN } from "../data/seatPlans/jurongEnglishFiction";
import type { Area, Seat } from "../models/catalog";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const ENGLISH_FICTION_SEAT_NAMES = [
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
  "S27",
  "S28",
  "S29",
  "S30",
  "S31",
  "S32",
  "S33",
  "S34",
  "S35",
  "S36",
  "S37",
  "S38",
  "S39",
  "S40",
  "S41",
  "S42",
  "S43",
  "S44",
  "S45",
  "S46",
  "S47",
  "S48",
  "S49",
  "S50",
  "S51",
  "S52",
] as const;

function seat(name: string): Seat {
  return {
    id: `jurong-english-fiction-${name}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function englishFictionArea(): Area {
  return {
    id: "40",
    branchId: "2",
    branchCode: "JRL",
    branchName: "Jurong Library",
    name: "English Fiction, Level 2",
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: ENGLISH_FICTION_SEAT_NAMES.map(seat),
  };
}

describe("Jurong Library English Fiction seat-plan annotation", () => {
  it("maps every seat from S1 through S52", () => {
    const definition = JURONG_LEVEL_2_ENGLISH_FICTION_SEAT_PLAN;

    expect(definition.coverage).toBe("complete");
    expect(definition.hotspots).toHaveLength(52);
    expect(definition.hotspots.map((hotspot) => hotspot.seatName)).toEqual(
      ENGLISH_FICTION_SEAT_NAMES,
    );

    const resolution = resolveSeatPlan(
      englishFictionArea(),
      `/seatbooking/img/areas/${definition.mapPath}`,
      { width: definition.imageWidth, height: definition.imageHeight },
      [definition],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(resolution.hotspots).toHaveLength(52);
      expect(resolution.hotspots.map((hotspot) => hotspot.seat.name)).toEqual(
        ENGLISH_FICTION_SEAT_NAMES,
      );
    }
  });
});
