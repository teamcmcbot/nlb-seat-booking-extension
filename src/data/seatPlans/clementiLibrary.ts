import type { SeatPlanDefinition } from "../../models/seatPlan";

/**
 * Manually verified against the observed 775 × 304 NLB plan revision.
 */
export const CLEMENTI_LEVEL_5_TAMIL_COLLECTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "13",
  areaId: "30",
  mapPath: "cmpl-5-tamilcollection-sp-full.png",
  imageWidth: 775,
  imageHeight: 304,
  coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 85, y: 184, width: 36, height: 44 },
    { seatName: "S2", x: 156, y: 184, width: 36, height: 44 },
    { seatName: "S3", x: 227, y: 184, width: 36, height: 44 },
    { seatName: "S4", x: 298, y: 184, width: 36, height: 44 },
    { seatName: "S5", x: 367, y: 184, width: 36, height: 44 },
    { seatName: "S6", x: 439, y: 184, width: 36, height: 44 },
    { seatName: "S7", x: 508, y: 184, width: 36, height: 44 },
    { seatName: "S8", x: 578, y: 184, width: 36, height: 44 },
    { seatName: "S9", x: 648, y: 184, width: 36, height: 44 },
  ],
};

export const CLEMENTI_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  CLEMENTI_LEVEL_5_TAMIL_COLLECTION_SEAT_PLAN,
];
