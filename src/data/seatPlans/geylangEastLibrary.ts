import type { SeatPlanDefinition } from "../../models/seatPlan";

/**
 * Manually verified against the observed 486 × 721 NLB plan revision.
 */
export const GEYLANG_EAST_LEVEL_2_CHINESE_COLLECTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "14",
  areaId: "33",
  mapPath: "gepl-2-chinesecollection-sp-full.png",
  imageWidth: 486,
  imageHeight: 721,
  coverage: "complete",
  hotspots: [
    { seatName: "S33", x: 209, y: 650, width: 60, height: 58 },
    { seatName: "S34", x: 208, y: 540, width: 60, height: 58 },
    { seatName: "S35", x: 204, y: 462, width: 60, height: 57 },
    { seatName: "S36", x: 203, y: 354, width: 59, height: 57 },
    { seatName: "S37", x: 201, y: 278, width: 59, height: 57 },
    { seatName: "S38", x: 200, y: 169, width: 59, height: 57 },
  ],
};

/**
 * Manually verified against the observed 705 × 499 NLB plan revision.
 */
export const GEYLANG_EAST_LEVEL_2_ENGLISH_FICTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "14",
  areaId: "98",
  mapPath: "gepl-2-english-fiction-sp-full.png",
  imageWidth: 705,
  imageHeight: 499,
  coverage: "complete",
  hotspots: [{ seatName: "S39", x: 319, y: 330, width: 47, height: 56 }],
};

/**
 * Manually verified against the observed 1174 × 682 NLB plan revision.
 * Rectangles follow visible blue portions of rotated seats where tables obscure
 * part of the chair shape.
 */
export const GEYLANG_EAST_LEVEL_2_MAGAZINE_COLLECTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "14",
  areaId: "31",
  mapPath: "gepl-2-magazine-collection-sp-full.png",
  imageWidth: 1174,
  imageHeight: 682,
  coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 454, y: 165, width: 65, height: 58 },
    { seatName: "S2", x: 563, y: 165, width: 64, height: 58 },
    { seatName: "S3", x: 673, y: 165, width: 64, height: 58 },
    { seatName: "S4", x: 781, y: 165, width: 65, height: 58 },
    { seatName: "S5", x: 948, y: 219, width: 61, height: 61 },
    { seatName: "S6", x: 971, y: 390, width: 58, height: 67 },
    { seatName: "S7", x: 742, y: 225, width: 67, height: 74 },
    { seatName: "S8", x: 769, y: 326, width: 63, height: 64 },
    { seatName: "S9", x: 635, y: 249, width: 68, height: 71 },
    { seatName: "S10", x: 659, y: 344, width: 65, height: 70 },
    { seatName: "S11", x: 528, y: 275, width: 66, height: 70 },
    { seatName: "S12", x: 554, y: 367, width: 65, height: 71 },
    { seatName: "S13", x: 420, y: 302, width: 66, height: 65 },
    { seatName: "S14", x: 444, y: 405, width: 64, height: 59 },
    { seatName: "S15", x: 817, y: 526, width: 64, height: 59 },
    { seatName: "S16", x: 786, y: 421, width: 68, height: 69 },
    { seatName: "S17", x: 709, y: 550, width: 64, height: 58 },
    { seatName: "S18", x: 684, y: 445, width: 67, height: 69 },
    { seatName: "S19", x: 603, y: 569, width: 65, height: 63 },
    { seatName: "S20", x: 578, y: 469, width: 67, height: 67 },
    { seatName: "S21", x: 497, y: 589, width: 65, height: 66 },
    { seatName: "S22", x: 470, y: 495, width: 65, height: 66 },
  ],
};

/**
 * Manually verified against the observed 816 × 726 NLB plan revision.
 * Rectangles follow visible blue portions of rotated seats where tables obscure
 * part of the chair shape.
 */
export const GEYLANG_EAST_LEVEL_2_NEAR_MULTIMEDIA_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "14",
  areaId: "32",
  mapPath: "gepl-2-nearmultimedia-sp-full.png",
  imageWidth: 816,
  imageHeight: 726,
  coverage: "complete",
  hotspots: [
    { seatName: "S23", x: 687, y: 639, width: 57, height: 62 },
    { seatName: "S24", x: 571, y: 639, width: 57, height: 62 },
    { seatName: "S25", x: 473, y: 638, width: 61, height: 57 },
    { seatName: "S26", x: 377, y: 599, width: 65, height: 62 },
    { seatName: "S27", x: 298, y: 570, width: 62, height: 58 },
    { seatName: "S28", x: 219, y: 497, width: 67, height: 65 },
    { seatName: "S29", x: 166, y: 442, width: 62, height: 53 },
    { seatName: "S30", x: 120, y: 340, width: 57, height: 69 },
    { seatName: "S31", x: 87, y: 275, width: 61, height: 54 },
    { seatName: "S32", x: 88, y: 158, width: 60, height: 57 },
  ],
};

/**
 * Manually verified against the observed 918 × 562 NLB plan revision.
 */
export const GEYLANG_EAST_LEVEL_2_QUIET_READING_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "14",
  areaId: "34",
  mapPath: "gepl-2-quietreading-sp-full.png",
  imageWidth: 918,
  imageHeight: 562,
  coverage: "complete",
  hotspots: [
    { seatName: "S40", x: 249, y: 234, width: 56, height: 60 },
    { seatName: "S41", x: 365, y: 234, width: 55, height: 60 },
    { seatName: "S42", x: 249, y: 168, width: 56, height: 58 },
    { seatName: "S43", x: 365, y: 168, width: 55, height: 58 },
    { seatName: "S44", x: 516, y: 167, width: 55, height: 59 },
    { seatName: "S45", x: 630, y: 167, width: 56, height: 59 },
    { seatName: "S46", x: 516, y: 234, width: 55, height: 60 },
    { seatName: "S47", x: 630, y: 234, width: 56, height: 60 },
    { seatName: "S48", x: 257, y: 455, width: 61, height: 57 },
    { seatName: "S49", x: 257, y: 341, width: 61, height: 57 },
    { seatName: "S50", x: 327, y: 455, width: 60, height: 57 },
    { seatName: "S51", x: 327, y: 341, width: 60, height: 57 },
    { seatName: "S52", x: 557, y: 455, width: 60, height: 57 },
    { seatName: "S53", x: 557, y: 341, width: 60, height: 57 },
    { seatName: "S54", x: 626, y: 455, width: 60, height: 57 },
    { seatName: "S55", x: 626, y: 341, width: 60, height: 57 },
  ],
};

/**
 * Manually verified against the observed 841 × 411 NLB plan revision.
 */
export const GEYLANG_EAST_LEVEL_2_YOUNG_PEOPLE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "14",
  areaId: "35",
  mapPath: "gepl-2-youngpeople-sp-full.png",
  imageWidth: 841,
  imageHeight: 411,
  coverage: "complete",
  hotspots: [
    { seatName: "S56", x: 97, y: 282, width: 62, height: 57 },
    { seatName: "S57", x: 228, y: 223, width: 57, height: 57 },
    { seatName: "S58", x: 349, y: 223, width: 57, height: 57 },
    { seatName: "S59", x: 430, y: 223, width: 57, height: 57 },
    { seatName: "S60", x: 551, y: 223, width: 57, height: 57 },
    { seatName: "S61", x: 630, y: 223, width: 59, height: 57 },
    { seatName: "S62", x: 751, y: 223, width: 57, height: 57 },
  ],
};

export const GEYLANG_EAST_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  GEYLANG_EAST_LEVEL_2_CHINESE_COLLECTION_SEAT_PLAN,
  GEYLANG_EAST_LEVEL_2_ENGLISH_FICTION_SEAT_PLAN,
  GEYLANG_EAST_LEVEL_2_MAGAZINE_COLLECTION_SEAT_PLAN,
  GEYLANG_EAST_LEVEL_2_NEAR_MULTIMEDIA_SEAT_PLAN,
  GEYLANG_EAST_LEVEL_2_QUIET_READING_SEAT_PLAN,
  GEYLANG_EAST_LEVEL_2_YOUNG_PEOPLE_SEAT_PLAN,
];
