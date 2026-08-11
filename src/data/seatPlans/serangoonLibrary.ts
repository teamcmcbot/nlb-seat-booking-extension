import type { SeatPlanDefinition } from "../../models/seatPlan";

/** Manually verified against the observed 1246 × 339 NLB plan revision. */
export const SERANGOON_LEVEL_4_ENGLISH_COLLECTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "28", areaId: "53", mapPath: "srpl-4-englishgeneralcollection-sp-full.png",
  imageWidth: 1246, imageHeight: 339, coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 111, y: 220, width: 59, height: 55 },
    { seatName: "S2", x: 184, y: 220, width: 58, height: 55 },
    { seatName: "S3", x: 255, y: 220, width: 59, height: 55 },
    { seatName: "S4", x: 327, y: 220, width: 59, height: 55 },
    { seatName: "S5", x: 399, y: 220, width: 59, height: 55 },
    { seatName: "S6", x: 470, y: 220, width: 59, height: 55 },
    { seatName: "S7", x: 542, y: 220, width: 59, height: 55 },
    { seatName: "S8", x: 648, y: 220, width: 59, height: 55 },
    { seatName: "S9", x: 720, y: 220, width: 59, height: 55 },
    { seatName: "S10", x: 791, y: 220, width: 59, height: 55 },
  ],
};

/** Manually verified against the observed 934 × 282 NLB plan revision. */
export const SERANGOON_LEVEL_4_CHINESE_CHILDREN_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "28", areaId: "54", mapPath: "srpl-4-childrencollection-sp-full.png",
  imageWidth: 934, imageHeight: 282, coverage: "complete",
  hotspots: [
    { seatName: "S11", x: 145, y: 181, width: 29, height: 35 },
    { seatName: "S12", x: 202, y: 181, width: 29, height: 35 },
    { seatName: "S13", x: 259, y: 181, width: 29, height: 35 },
    { seatName: "S14", x: 316, y: 181, width: 29, height: 35 },
    { seatName: "S15", x: 374, y: 181, width: 29, height: 35 },
    { seatName: "S16", x: 431, y: 181, width: 29, height: 35 },
    { seatName: "S17", x: 514, y: 181, width: 29, height: 35 },
    { seatName: "S18", x: 571, y: 181, width: 29, height: 35 },
    { seatName: "S19", x: 628, y: 181, width: 29, height: 35 },
    { seatName: "S20", x: 685, y: 181, width: 29, height: 35 },
    { seatName: "S21", x: 742, y: 181, width: 29, height: 35 },
  ],
};

export const SERANGOON_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  SERANGOON_LEVEL_4_ENGLISH_COLLECTION_SEAT_PLAN,
  SERANGOON_LEVEL_4_CHINESE_CHILDREN_SEAT_PLAN,
];
