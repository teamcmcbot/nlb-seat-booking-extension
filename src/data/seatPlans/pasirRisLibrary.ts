import type { SeatPlanDefinition } from "../../models/seatPlan";

/** Manually verified against the observed 769 × 618 NLB plan revision. */
export const PASIR_RIS_LEVEL_4_QUIET_READING_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "24", areaId: "47", mapPath: "prpl-4-quietreading-sp-full.png",
  imageWidth: 769, imageHeight: 618, coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 61, y: 496, width: 54, height: 55 },
    { seatName: "S2", x: 61, y: 440, width: 54, height: 55 },
    { seatName: "S3", x: 61, y: 384, width: 54, height: 55 },
    { seatName: "S4", x: 61, y: 328, width: 54, height: 55 },
    { seatName: "S5", x: 61, y: 272, width: 54, height: 55 },
    { seatName: "S6", x: 233, y: 129, width: 55, height: 53 },
    { seatName: "S7", x: 289, y: 129, width: 54, height: 53 },
    { seatName: "S8", x: 344, y: 129, width: 55, height: 53 },
    { seatName: "S9", x: 400, y: 129, width: 55, height: 53 },
    { seatName: "S10", x: 456, y: 129, width: 54, height: 53 },
    { seatName: "S11", x: 511, y: 129, width: 55, height: 53 },
    { seatName: "S12", x: 567, y: 129, width: 55, height: 53 },
    { seatName: "S13", x: 623, y: 129, width: 55, height: 53 },
  ],
};

export const PASIR_RIS_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  PASIR_RIS_LEVEL_4_QUIET_READING_SEAT_PLAN,
];
