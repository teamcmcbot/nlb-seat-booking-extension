import type { SeatPlanDefinition } from "../../models/seatPlan";

/**
 * Manually verified against the observed 959 x 202 NLB plan revision.
 */
export const CHOA_CHU_KANG_LEVEL_4_ADULT_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "4",
  areaId: "4",
  mapPath: "cckpl-4-adultzone-sp-full.png",
  imageWidth: 959,
  imageHeight: 202,
  coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 909, y: 130, width: 29, height: 27 },
    { seatName: "S2", x: 858, y: 130, width: 29, height: 27 },
    { seatName: "S3", x: 807, y: 130, width: 29, height: 27 },
    { seatName: "S4", x: 718, y: 130, width: 29, height: 27 },
    { seatName: "S5", x: 666, y: 130, width: 29, height: 27 },
    { seatName: "S6", x: 615, y: 130, width: 29, height: 27 },
    { seatName: "S7", x: 564, y: 130, width: 29, height: 27 },
    { seatName: "S8", x: 513, y: 130, width: 29, height: 27 },
    { seatName: "S9", x: 420, y: 130, width: 29, height: 27 },
    { seatName: "S10", x: 369, y: 130, width: 29, height: 27 },
    { seatName: "S11", x: 318, y: 130, width: 29, height: 27 },
    { seatName: "S12", x: 267, y: 130, width: 29, height: 27 },
    { seatName: "S13", x: 171, y: 130, width: 29, height: 27 },
    { seatName: "S14", x: 120, y: 130, width: 29, height: 27 },
    { seatName: "S15", x: 69, y: 130, width: 29, height: 27 },
    { seatName: "S16", x: 18, y: 130, width: 29, height: 27 },
  ],
};

/**
 * Manually verified against the observed 1357 x 802 NLB plan revision.
 */
export const CHOA_CHU_KANG_LEVEL_4_STUDY_MULTIMEDIA_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "4",
  areaId: "5",
  mapPath: "cckpl-4-studyzone-sp-full.png",
  imageWidth: 1357,
  imageHeight: 802,
  coverage: "complete",
  hotspots: [
    { seatName: "S17", x: 91, y: 560, width: 50, height: 42 },
    { seatName: "S18", x: 141, y: 602, width: 50, height: 42 },
    { seatName: "S19", x: 185, y: 453, width: 50, height: 42 },
    { seatName: "S20", x: 239, y: 498, width: 50, height: 42 },
    { seatName: "S21", x: 298, y: 466, width: 50, height: 42 },
    { seatName: "S22", x: 367, y: 520, width: 50, height: 42 },
    { seatName: "S23", x: 427, y: 563, width: 50, height: 42 },
    { seatName: "S24", x: 390, y: 358, width: 50, height: 42 },
    { seatName: "S25", x: 456, y: 408, width: 50, height: 42 },
    { seatName: "S26", x: 524, y: 459, width: 50, height: 42 },
    { seatName: "S27", x: 693, y: 508, width: 50, height: 42 },
    { seatName: "S28", x: 753, y: 554, width: 50, height: 42 },
    { seatName: "S29", x: 782, y: 396, width: 50, height: 42 },
    { seatName: "S30", x: 842, y: 444, width: 50, height: 42 },
    { seatName: "S31", x: 1065, y: 529, width: 50, height: 42 },
    { seatName: "S32", x: 1149, y: 421, width: 50, height: 42 },
    { seatName: "S33", x: 63, y: 243, width: 67, height: 65 },
    { seatName: "S34", x: 164, y: 243, width: 68, height: 65 },
    { seatName: "S35", x: 264, y: 243, width: 68, height: 65 },
    { seatName: "S36", x: 364, y: 243, width: 68, height: 65 },
    { seatName: "S37", x: 466, y: 243, width: 68, height: 65 },
    { seatName: "S38", x: 565, y: 243, width: 68, height: 65 },
    { seatName: "S39", x: 665, y: 243, width: 68, height: 65 },
    { seatName: "S40", x: 767, y: 243, width: 68, height: 65 },
    { seatName: "S41", x: 868, y: 243, width: 68, height: 65 },
    { seatName: "S42", x: 972, y: 243, width: 68, height: 65 },
    { seatName: "S43", x: 1072, y: 243, width: 68, height: 65 },
    { seatName: "S44", x: 1174, y: 243, width: 68, height: 65 },
  ],
};

export const CHOA_CHU_KANG_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  CHOA_CHU_KANG_LEVEL_4_ADULT_ZONE_SEAT_PLAN,
  CHOA_CHU_KANG_LEVEL_4_STUDY_MULTIMEDIA_ZONE_SEAT_PLAN,
];
