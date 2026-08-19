import type { SeatPlanDefinition } from "../../models/seatPlan";

/**
 * Manually verified against the observed 3770 × 1879 NLB plan revision.
 */
export const TAMPINES_LEVEL_4_MMS_AREA_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "1",
  areaId: "80",
  mapPath: "trl-4-mmsarea-sp-full.png",
  imageWidth: 3770,
  imageHeight: 1879,
  coverage: "complete",
  hotspots: [
    { seatName: "S25", x: 1337, y: 527, width: 214, height: 230 },
    { seatName: "S26", x: 1833, y: 534, width: 204, height: 223 },
    { seatName: "S27", x: 2338, y: 527, width: 216, height: 230 },
    { seatName: "S28", x: 2808, y: 529, width: 207, height: 228 },
  ],
};

/**
 * Manually verified against the observed 970 × 564 NLB plan revision.
 */
export const TAMPINES_LEVEL_4_NEAR_MULTIMEDIA_STATIONS_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "1",
  areaId: "55",
  mapPath: "trl-4-nearmultimedia-sp-full.png",
  imageWidth: 970,
  imageHeight: 564,
  coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 109, y: 270, width: 37, height: 43 },
    { seatName: "S2", x: 109, y: 376, width: 37, height: 43 },
    { seatName: "S3", x: 156, y: 271, width: 38, height: 42 },
    { seatName: "S4", x: 156, y: 376, width: 38, height: 43 },
    { seatName: "S5", x: 201, y: 271, width: 39, height: 42 },
    { seatName: "S6", x: 201, y: 376, width: 39, height: 43 },
    { seatName: "S7", x: 248, y: 271, width: 43, height: 42 },
    { seatName: "S8", x: 248, y: 376, width: 43, height: 43 },
    { seatName: "S9", x: 388, y: 271, width: 38, height: 43 },
    { seatName: "S10", x: 389, y: 377, width: 37, height: 43 },
    { seatName: "S11", x: 436, y: 272, width: 37, height: 42 },
    { seatName: "S12", x: 436, y: 377, width: 37, height: 43 },
    { seatName: "S13", x: 481, y: 272, width: 38, height: 42 },
    { seatName: "S14", x: 481, y: 377, width: 38, height: 43 },
    { seatName: "S15", x: 529, y: 272, width: 38, height: 42 },
    { seatName: "S16", x: 529, y: 377, width: 38, height: 43 },
    { seatName: "S17", x: 661, y: 272, width: 38, height: 42 },
    { seatName: "S18", x: 661, y: 377, width: 38, height: 43 },
    { seatName: "S19", x: 709, y: 272, width: 38, height: 42 },
    { seatName: "S20", x: 709, y: 377, width: 38, height: 43 },
    { seatName: "S21", x: 755, y: 272, width: 38, height: 42 },
    { seatName: "S22", x: 755, y: 377, width: 38, height: 43 },
    { seatName: "S23", x: 802, y: 272, width: 39, height: 42 },
    { seatName: "S24", x: 802, y: 377, width: 39, height: 43 },
  ],
};

export const TAMPINES_LIBRARY_LEVEL_4_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  TAMPINES_LEVEL_4_MMS_AREA_SEAT_PLAN,
  TAMPINES_LEVEL_4_NEAR_MULTIMEDIA_STATIONS_SEAT_PLAN,
];
