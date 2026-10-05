import type { SeatPlanDefinition } from "../../models/seatPlan";

/**
 * Manually verified against the observed 1338 × 499 NLB plan revision.
 */
export const BEDOK_LEVEL_2_ADULT_NON_FICTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "7",
  areaId: "19",
  mapPath: "bepl-2-adultnonfiction-sp-full.png",
  imageWidth: 1338,
  imageHeight: 499,
  coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 67, y: 368, width: 65, height: 60 },
    { seatName: "S2", x: 164, y: 368, width: 65, height: 60 },
    { seatName: "S3", x: 268, y: 368, width: 65, height: 60 },
    { seatName: "S4", x: 334, y: 368, width: 65, height: 60 },
    { seatName: "S5", x: 400, y: 368, width: 65, height: 60 },
    { seatName: "S6", x: 466, y: 368, width: 65, height: 60 },
    { seatName: "S7", x: 532, y: 368, width: 65, height: 60 },
    { seatName: "S8", x: 620, y: 368, width: 65, height: 60 },
    { seatName: "S9", x: 686, y: 368, width: 65, height: 60 },
    { seatName: "S10", x: 752, y: 368, width: 65, height: 60 },
    { seatName: "S11", x: 818, y: 368, width: 65, height: 60 },
    { seatName: "S12", x: 884, y: 368, width: 65, height: 60 },
    { seatName: "S13", x: 973, y: 368, width: 62, height: 60 },
    { seatName: "S14", x: 1037, y: 368, width: 63, height: 60 },
    { seatName: "S15", x: 1103, y: 368, width: 64, height: 60 },
    { seatName: "S16", x: 1169, y: 368, width: 65, height: 60 },
    { seatName: "S17", x: 1236, y: 368, width: 65, height: 60 },
  ],
};

/**
 * Manually verified against the observed 905 × 404 NLB plan revision.
 * The compact hotspots follow the visible parts of seats obscured by tables.
 */
export const BEDOK_LEVEL_2_LARGE_PRINT_AV_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "7",
  areaId: "21",
  mapPath: "bepl-2-largeprint-sp-full.png",
  imageWidth: 905,
  imageHeight: 404,
  coverage: "complete",
  hotspots: [
    { seatName: "S26", x: 119, y: 235, width: 31, height: 27 },
    { seatName: "S27", x: 211, y: 235, width: 31, height: 27 },
    { seatName: "S28", x: 317, y: 235, width: 33, height: 27 },
    { seatName: "S29", x: 409, y: 235, width: 32, height: 27 },
    { seatName: "S30", x: 517, y: 235, width: 31, height: 27 },
    { seatName: "S31", x: 690, y: 190, width: 143, height: 39 },
    { seatName: "S32", x: 690, y: 235, width: 143, height: 39 },
  ],
};

/**
 * Manually verified against the observed 461 × 502 NLB plan revision.
 */
export const BEDOK_LEVEL_2_LEARNING_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "7",
  areaId: "20",
  mapPath: "bepl-2-learningzone-sp-full.png",
  imageWidth: 461,
  imageHeight: 502,
  coverage: "complete",
  hotspots: [
    { seatName: "S18", x: 120, y: 139, width: 36, height: 41 },
    { seatName: "S19", x: 120, y: 244, width: 36, height: 43 },
    { seatName: "S20", x: 120, y: 319, width: 36, height: 40 },
    { seatName: "S21", x: 120, y: 423, width: 36, height: 42 },
    { seatName: "S22", x: 325, y: 139, width: 35, height: 41 },
    { seatName: "S23", x: 325, y: 244, width: 35, height: 43 },
    { seatName: "S24", x: 325, y: 319, width: 35, height: 40 },
    { seatName: "S25", x: 325, y: 423, width: 35, height: 42 },
  ],
};

/**
 * Manually verified against the observed 1280 × 720 NLB plan revision.
 */
export const BEDOK_LEVEL_3_TEENS_FICTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "7",
  areaId: "22",
  mapPath: "bepl-3-teensfiction-sp-full.png",
  imageWidth: 1280,
  imageHeight: 720,
  coverage: "complete",
  hotspots: [
    { seatName: "S33", x: 210, y: 301, width: 42, height: 37 },
    { seatName: "S34", x: 255, y: 301, width: 41, height: 37 },
    { seatName: "S35", x: 299, y: 301, width: 42, height: 37 },
    { seatName: "S36", x: 343, y: 301, width: 42, height: 37 },
    { seatName: "S37", x: 387, y: 301, width: 42, height: 37 },
    { seatName: "S38", x: 537, y: 301, width: 43, height: 37 },
    { seatName: "S39", x: 581, y: 301, width: 43, height: 37 },
    { seatName: "S40", x: 625, y: 301, width: 43, height: 37 },
    { seatName: "S41", x: 669, y: 301, width: 43, height: 37 },
    { seatName: "S42", x: 714, y: 301, width: 43, height: 37 },
    { seatName: "S43", x: 836, y: 301, width: 41, height: 37 },
    { seatName: "S44", x: 880, y: 301, width: 43, height: 37 },
    { seatName: "S45", x: 924, y: 301, width: 43, height: 37 },
    { seatName: "S46", x: 968, y: 301, width: 43, height: 37 },
    { seatName: "S47", x: 1013, y: 301, width: 40, height: 37 },
    { seatName: "S48", x: 792, y: 338, width: 46, height: 34 },
    { seatName: "S49", x: 844, y: 345, width: 46, height: 40 },
    { seatName: "S50", x: 897, y: 369, width: 43, height: 38 },
    { seatName: "S51", x: 935, y: 407, width: 43, height: 41 },
    { seatName: "S52", x: 808, y: 407, width: 45, height: 38 },
    { seatName: "S53", x: 762, y: 400, width: 44, height: 36 },
    { seatName: "S54", x: 710, y: 401, width: 46, height: 38 },
    { seatName: "S55", x: 692, y: 457, width: 41, height: 44 },
    { seatName: "S56", x: 733, y: 473, width: 48, height: 39 },
    { seatName: "S57", x: 788, y: 475, width: 44, height: 36 },
    { seatName: "S58", x: 834, y: 465, width: 49, height: 41 },
    { seatName: "S59", x: 906, y: 487, width: 46, height: 44 },
    { seatName: "S60", x: 845, y: 526, width: 46, height: 37 },
    { seatName: "S61", x: 761, y: 536, width: 46, height: 35 },
    { seatName: "S62", x: 679, y: 531, width: 42, height: 37 },
    { seatName: "S63", x: 721, y: 562, width: 40, height: 35 },
    { seatName: "S64", x: 807, y: 563, width: 44, height: 32 },
    { seatName: "S65", x: 896, y: 552, width: 46, height: 37 },
    { seatName: "S66", x: 356, y: 364, width: 47, height: 43 },
    { seatName: "S67", x: 483, y: 377, width: 47, height: 37 },
    { seatName: "S68", x: 374, y: 450, width: 45, height: 44 },
  ],
};

export const BEDOK_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  BEDOK_LEVEL_2_ADULT_NON_FICTION_SEAT_PLAN,
  BEDOK_LEVEL_2_LARGE_PRINT_AV_SEAT_PLAN,
  BEDOK_LEVEL_2_LEARNING_ZONE_SEAT_PLAN,
  BEDOK_LEVEL_3_TEENS_FICTION_SEAT_PLAN,
];
