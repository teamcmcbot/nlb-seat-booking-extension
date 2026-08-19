import type { SeatPlanDefinition } from "../../models/seatPlan";

/** Manually verified against the observed 852 × 293 NLB plan revision. */
export const SEMBAWANG_LEVEL_5_ADULT_SECTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "26", areaId: "50", mapPath: "sbpl-5-adultsection-sp-full.png",
  imageWidth: 852, imageHeight: 293, coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 103, y: 179, width: 32, height: 36 },
    { seatName: "S2", x: 167, y: 179, width: 32, height: 36 },
    { seatName: "S3", x: 231, y: 179, width: 32, height: 36 },
    { seatName: "S4", x: 295, y: 179, width: 32, height: 36 },
    { seatName: "S5", x: 513, y: 180, width: 32, height: 36 },
    { seatName: "S6", x: 576, y: 180, width: 32, height: 36 },
    { seatName: "S7", x: 640, y: 180, width: 32, height: 36 },
    { seatName: "S8", x: 704, y: 180, width: 32, height: 36 },
  ],
};

/** Manually verified against the observed 511 × 468 NLB plan revision. */
export const SEMBAWANG_LEVEL_5_READING_LOUNGE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "26", areaId: "51", mapPath: "sbpl-5-readinglounge-sp-full.png",
  imageWidth: 511, imageHeight: 468, coverage: "complete",
  hotspots: [
    { seatName: "S9", x: 153, y: 357, width: 55, height: 57 },
    { seatName: "S10", x: 153, y: 283, width: 55, height: 57 },
  ],
};

export const SEMBAWANG_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  SEMBAWANG_LEVEL_5_ADULT_SECTION_SEAT_PLAN,
  SEMBAWANG_LEVEL_5_READING_LOUNGE_SEAT_PLAN,
];
