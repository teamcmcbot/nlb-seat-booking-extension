import type {
  SeatHotspotDefinition,
  SeatPlanDefinition,
} from "../../models/seatPlan";

function horizontalSeatRow(
  firstSeat: number,
  count: number,
  x: number,
  y: number,
  step: number,
  width: number,
  height: number,
  direction: 1 | -1 = 1,
): SeatHotspotDefinition[] {
  return Array.from({ length: count }, (_, index) => ({
    seatName: `S${firstSeat + direction * index}`,
    x: Math.round(x + step * index),
    y,
    width,
    height,
  }));
}

/** Manually verified against the observed 1249 x 330 NLB plan revision. */
export const PUNGGOL_LEVEL_3_ADULTS_TEENS_CHINESE_FICTION_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "33",
  areaId: "84",
  mapPath: "prl-3-at-chinese-fiction-zone-sp-full.png",
  imageWidth: 1249,
  imageHeight: 330,
  coverage: "complete",
  hotspots: horizontalSeatRow(87, 13, 157, 231, 81.1, 50, 43),
};

/**
 * Manually verified against the observed 1372 x 466 NLB plan revision.
 * Each table bank is numbered left-to-right on top and right-to-left below.
 */
export const PUNGGOL_LEVEL_3_LONG_STUDY_SPACE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "33",
  areaId: "85",
  mapPath: "prl-3-long-study-space-sp-full.png",
  imageWidth: 1372,
  imageHeight: 466,
  coverage: "complete",
  hotspots: [
    ...horizontalSeatRow(100, 6, 61, 207, 64.8, 43, 32),
    ...horizontalSeatRow(135, 6, 61, 286, 64.8, 43, 32, -1),
    ...horizontalSeatRow(106, 6, 513, 207, 64.8, 43, 32),
    ...horizontalSeatRow(129, 6, 513, 286, 64.8, 43, 32, -1),
    ...horizontalSeatRow(112, 6, 968, 207, 64.8, 43, 32),
    ...horizontalSeatRow(123, 6, 968, 286, 64.8, 43, 32, -1),
  ],
};

/**
 * Manually verified against the observed 1755 x 1040 NLB plan revision.
 * Compact rectangles cover only individual blue seat shapes. Paired table
 * banks alternate between descending top rows and ascending bottom rows.
 */
export const PUNGGOL_LEVEL_3_STUDY_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "33",
  areaId: "83",
  mapPath: "prl-3-study-zone-sp-full.png",
  imageWidth: 1755,
  imageHeight: 1040,
  coverage: "complete",
  hotspots: [
    ...horizontalSeatRow(1, 15, 166, 210, 86.2, 44, 44),
    ...horizontalSeatRow(16, 2, 1467, 210, 86.2, 44, 44),

    ...horizontalSeatRow(28, 8, 420, 288, 86.1, 44, 45, -1),
    ...horizontalSeatRow(20, 3, 1201, 288, 86.1, 44, 45, -1),
    ...horizontalSeatRow(29, 8, 416, 410, 86.1, 44, 46),
    ...horizontalSeatRow(37, 3, 1200, 410, 86.1, 44, 46),

    ...horizontalSeatRow(48, 6, 598, 497, 86.1, 45, 46, -1),
    ...horizontalSeatRow(42, 3, 1201, 497, 86.1, 44, 46, -1),
    ...horizontalSeatRow(49, 6, 596, 620, 86.1, 45, 46),
    ...horizontalSeatRow(55, 3, 1200, 620, 86.1, 44, 46),

    ...horizontalSeatRow(65, 5, 685, 701, 86.1, 45, 49, -1),
    ...horizontalSeatRow(60, 3, 1200, 701, 86.1, 44, 49, -1),
    ...horizontalSeatRow(66, 5, 684, 825, 86.1, 45, 47),
    ...horizontalSeatRow(71, 3, 1199, 825, 86.1, 44, 47),

    ...horizontalSeatRow(86, 1, 416, 924, 86.1, 44, 49, -1),
    ...horizontalSeatRow(85, 1, 506, 924, 86.1, 44, 49, -1),
    ...horizontalSeatRow(84, 3, 594, 924, 86.1, 44, 49, -1),
    ...horizontalSeatRow(81, 2, 856, 924, 86.1, 44, 49, -1),
    ...horizontalSeatRow(79, 6, 1121, 924, 86.1, 44, 49, -1),
  ],
};

export const PUNGGOL_LIBRARY_LEVEL_3_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  PUNGGOL_LEVEL_3_ADULTS_TEENS_CHINESE_FICTION_ZONE_SEAT_PLAN,
  PUNGGOL_LEVEL_3_LONG_STUDY_SPACE_SEAT_PLAN,
  PUNGGOL_LEVEL_3_STUDY_ZONE_SEAT_PLAN,
];
