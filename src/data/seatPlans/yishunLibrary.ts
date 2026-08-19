import type { SeatPlanDefinition } from "../../models/seatPlan";

/** Manually verified against the observed 355 × 214 NLB plan revision. */
export const YISHUN_DIGITAL_LEARNING_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "32", areaId: "101", mapPath: "yipl-4-digitallearningzone-sp-full.png",
  imageWidth: 355, imageHeight: 214, coverage: "complete",
  hotspots: [
    { seatName: "S32", x: 51, y: 158, width: 22, height: 27 },
    { seatName: "S33", x: 78, y: 158, width: 22, height: 27 },
    { seatName: "S34", x: 105, y: 158, width: 22, height: 27 },
    { seatName: "S35", x: 132, y: 158, width: 22, height: 27 },
    { seatName: "S36", x: 159, y: 158, width: 22, height: 27 },
    { seatName: "S37", x: 185, y: 158, width: 22, height: 27 },
    { seatName: "S38", x: 212, y: 158, width: 22, height: 27 },
    { seatName: "S39", x: 239, y: 158, width: 22, height: 27 },
    { seatName: "S40", x: 266, y: 158, width: 22, height: 27 },
    { seatName: "S41", x: 293, y: 158, width: 22, height: 27 },
  ],
};

/** Manually verified against the observed 1129 × 448 NLB plan revision. */
export const YISHUN_LEVEL_4_ENGLISH_FICTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "32", areaId: "76", mapPath: "yipl-4-englishfiction-sp-full.png",
  imageWidth: 1129, imageHeight: 448, coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 134, y: 241, width: 63, height: 57 },
    { seatName: "S2", x: 205, y: 241, width: 63, height: 57 },
    { seatName: "S3", x: 274, y: 241, width: 63, height: 57 },
    { seatName: "S4", x: 463, y: 241, width: 63, height: 57 },
    { seatName: "S5", x: 533, y: 241, width: 63, height: 57 },
    { seatName: "S6", x: 602, y: 241, width: 63, height: 57 },
    { seatName: "S7", x: 839, y: 241, width: 63, height: 57 },
    { seatName: "S8", x: 909, y: 241, width: 63, height: 57 },
  ],
};

/** Manually verified against the observed 507 × 563 NLB plan revision. */
export const YISHUN_LEVEL_4_MALAY_COLLECTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "32", areaId: "77", mapPath: "yipl-4-malaycollection-sp-full.png",
  imageWidth: 507, imageHeight: 563, coverage: "complete",
  hotspots: [
    { seatName: "S9", x: 389, y: 176, width: 38, height: 38 },
    { seatName: "S10", x: 429, y: 213, width: 38, height: 38 },
    { seatName: "S11", x: 395, y: 296, width: 38, height: 38 },
    { seatName: "S12", x: 391, y: 347, width: 38, height: 38 },
    { seatName: "S13", x: 408, y: 421, width: 38, height: 38 },
    { seatName: "S14", x: 376, y: 476, width: 38, height: 38 },
    { seatName: "S15", x: 299, y: 490, width: 38, height: 38 },
    { seatName: "S16", x: 254, y: 446, width: 38, height: 38 },
    { seatName: "S17", x: 254, y: 374, width: 38, height: 38 },
    { seatName: "S18", x: 299, y: 327, width: 38, height: 38 },
    { seatName: "S19", x: 320, y: 283, width: 38, height: 38 },
    { seatName: "S20", x: 326, y: 197, width: 38, height: 38 },
    { seatName: "S21", x: 120, y: 168, width: 38, height: 38 },
    { seatName: "S22", x: 174, y: 187, width: 38, height: 38 },
    { seatName: "S23", x: 207, y: 253, width: 38, height: 38 },
    { seatName: "S24", x: 174, y: 323, width: 38, height: 38 },
    { seatName: "S25", x: 151, y: 379, width: 38, height: 38 },
    { seatName: "S26", x: 166, y: 460, width: 38, height: 38 },
    { seatName: "S27", x: 66, y: 471, width: 38, height: 38 },
    { seatName: "S28", x: 80, y: 370, width: 38, height: 38 },
    { seatName: "S29", x: 65, y: 304, width: 38, height: 38 },
    { seatName: "S30", x: 45, y: 253, width: 38, height: 38 },
    { seatName: "S31", x: 66, y: 195, width: 38, height: 38 },
  ],
};

export const YISHUN_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  YISHUN_DIGITAL_LEARNING_ZONE_SEAT_PLAN,
  YISHUN_LEVEL_4_ENGLISH_FICTION_SEAT_PLAN,
  YISHUN_LEVEL_4_MALAY_COLLECTION_SEAT_PLAN,
];
