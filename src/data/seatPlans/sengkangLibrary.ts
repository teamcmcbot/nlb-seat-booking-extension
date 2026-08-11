import type { SeatPlanDefinition } from "../../models/seatPlan";

/** Manually verified against the observed 1194 × 645 NLB plan revision. */
export const SENGKANG_LEVEL_3_READING_LOUNGE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "27", areaId: "52", mapPath: "skpl-3-readinglounge-sp-full.png",
  imageWidth: 1194, imageHeight: 645, coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 278, y: 253, width: 82, height: 73 },
    { seatName: "S2", x: 445, y: 174, width: 85, height: 82 },
    { seatName: "S3", x: 753, y: 205, width: 72, height: 72 },
    { seatName: "S4", x: 940, y: 205, width: 79, height: 78 },
    { seatName: "S5", x: 985, y: 452, width: 70, height: 76 },
    { seatName: "S6", x: 834, y: 448, width: 72, height: 76 },
    { seatName: "S7", x: 626, y: 508, width: 71, height: 67 },
    { seatName: "S8", x: 447, y: 510, width: 81, height: 78 },
    { seatName: "S9", x: 214, y: 480, width: 81, height: 86 },
    { seatName: "S10", x: 73, y: 336, width: 75, height: 71 },
  ],
};

export const SENGKANG_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  SENGKANG_LEVEL_3_READING_LOUNGE_SEAT_PLAN,
];
