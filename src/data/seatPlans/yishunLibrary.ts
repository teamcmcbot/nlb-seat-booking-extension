import type { SeatPlanDefinition } from "../../models/seatPlan";

/** Manually verified against the observed 1280 × 720 NLB plan revision. */
export const YISHUN_DIGITAL_LEARNING_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "32", areaId: "101", mapPath: "yipl-4-digitallearningzone-sp-full.png",
  imageWidth: 1280, imageHeight: 720, coverage: "complete",
  hotspots: [
    { seatName: "S32", x: 279, y: 309, width: 57, height: 53 },
    { seatName: "S33", x: 349, y: 310, width: 57, height: 53 },
    { seatName: "S34", x: 420, y: 309, width: 58, height: 53 },
    { seatName: "S35", x: 493, y: 310, width: 57, height: 53 },
    { seatName: "S36", x: 561, y: 309, width: 57, height: 53 },
    { seatName: "S37", x: 628, y: 309, width: 57, height: 53 },
    { seatName: "S38", x: 696, y: 310, width: 57, height: 53 },
    { seatName: "S39", x: 765, y: 309, width: 57, height: 53 },
    { seatName: "S40", x: 835, y: 309, width: 57, height: 53 },
    { seatName: "S41", x: 903, y: 309, width: 57, height: 53 },
  ],
};

/** Manually verified against the observed 1280 × 720 NLB plan revision. */
export const YISHUN_LEVEL_4_ENGLISH_FICTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "32", areaId: "76", mapPath: "yipl-4-englishfiction-sp-full.png",
  imageWidth: 1280, imageHeight: 720, coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 274, y: 310, width: 55, height: 47 },
    { seatName: "S2", x: 340, y: 310, width: 55, height: 47 },
    { seatName: "S3", x: 409, y: 310, width: 55, height: 47 },
    { seatName: "S4", x: 530, y: 310, width: 55, height: 47 },
    { seatName: "S5", x: 597, y: 310, width: 55, height: 47 },
    { seatName: "S6", x: 666, y: 310, width: 55, height: 47 },
    { seatName: "S7", x: 803, y: 309, width: 55, height: 47 },
    { seatName: "S8", x: 870, y: 310, width: 55, height: 47 },
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
    { seatName: "S18", x: 294, y: 327, width: 38, height: 38 },
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
