import type { SeatHotspotDefinition, SeatPlanDefinition } from "../../models/seatPlan";

function hotspot(
  seatName: string,
  x: number,
  y: number,
  width: number,
  height: number,
): SeatHotspotDefinition {
  return { seatName, x, y, width, height };
}

function pairedTable(
  firstSeatNumber: number,
  rows: number,
  leftX: number,
  rightX: number,
  firstY: number,
  rowStep: number,
  width: number,
  height: number,
): SeatHotspotDefinition[] {
  return Array.from({ length: rows }, (_, row) => [
    hotspot(`S${firstSeatNumber + row * 2}`, leftX, firstY + row * rowStep, width, height),
    hotspot(`S${firstSeatNumber + row * 2 + 1}`, rightX, firstY + row * rowStep, width, height),
  ]).flat();
}

/** Manually verified against the observed 3783 × 1884 NLB plan revision. */
export const TAMPINES_LEVEL_5_CO_WORKING_LOUNGE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "1",
  areaId: "95",
  mapPath: "trl-5-coworking-lounge-sp-full.png",
  imageWidth: 3783,
  imageHeight: 1884,
  coverage: "complete",
  hotspots: [
    hotspot("S137", 2225, 180, 145, 145),
    hotspot("S138", 2475, 180, 145, 145),
    hotspot("S139", 2745, 180, 145, 145),
    hotspot("S140", 3010, 180, 145, 145),
    hotspot("S141", 3280, 180, 145, 145),
    hotspot("S142", 3450, 350, 130, 140),
    hotspot("S143", 3450, 595, 130, 140),
    hotspot("S144", 3450, 810, 130, 140),
    hotspot("S145", 3450, 1040, 130, 140),
    hotspot("S146", 3450, 1270, 130, 140),
    hotspot("S147", 3450, 1505, 130, 140),
    hotspot("S148", 3450, 1715, 130, 140),
    hotspot("S149", 3180, 1340, 125, 125),
    hotspot("S150", 2635, 1340, 125, 125),
    hotspot("S151", 3180, 1580, 125, 125),
    hotspot("S152", 2635, 1580, 125, 125),
    hotspot("S153", 2425, 1340, 125, 125),
    hotspot("S154", 1885, 1340, 125, 125),
    hotspot("S155", 2425, 1580, 125, 125),
    hotspot("S156", 1885, 1580, 125, 125),
    hotspot("S157", 1550, 1340, 125, 125),
    hotspot("S158", 1005, 1340, 125, 125),
    hotspot("S159", 1550, 1580, 125, 125),
    hotspot("S160", 1005, 1580, 125, 125),
    hotspot("S161", 2040, 585, 170, 150),
    hotspot("S162", 2325, 585, 170, 150),
    hotspot("S163", 2610, 585, 170, 150),
    hotspot("S164", 2195, 840, 170, 150),
    hotspot("S165", 2480, 840, 170, 150),
    hotspot("S166", 2765, 840, 170, 150),
  ],
};

/** Manually verified against the observed 1273 × 2098 NLB plan revision. */
export const TAMPINES_LEVEL_5_OUTSIDE_STUDY_LOUNGE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "1",
  areaId: "81",
  mapPath: "trl-5-outsidestudylounge-sp-full.png",
  imageWidth: 1273,
  imageHeight: 2098,
  coverage: "complete",
  hotspots: [
    ...pairedTable(69, 6, 405, 705, 35, 160, 100, 115),
    ...pairedTable(81, 6, 405, 705, 1080, 160, 100, 115),
  ],
};

/** Manually verified against the observed 568 × 811 NLB plan revision. */
export const TAMPINES_LEVEL_5_SG_COLLECTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "1",
  areaId: "82",
  mapPath: "trl-5-sgcollection-sp-full.png",
  imageWidth: 568,
  imageHeight: 811,
  coverage: "complete",
  hotspots: [
    hotspot("S93", 132, 145, 42, 50),
    hotspot("S94", 132, 278, 42, 50),
    hotspot("S95", 218, 145, 42, 50),
    hotspot("S96", 218, 278, 42, 50),
    hotspot("S97", 303, 145, 44, 50),
    hotspot("S98", 303, 278, 44, 50),
    hotspot("S99", 389, 145, 43, 50),
    hotspot("S100", 389, 278, 43, 50),
    hotspot("S101", 171, 365, 43, 50),
    hotspot("S102", 171, 496, 43, 50),
    hotspot("S103", 256, 365, 43, 50),
    hotspot("S104", 256, 496, 43, 50),
    hotspot("S105", 341, 365, 43, 50),
    hotspot("S106", 341, 496, 43, 50),
    hotspot("S107", 173, 577, 43, 50),
    hotspot("S108", 173, 710, 43, 50),
    hotspot("S109", 259, 577, 43, 50),
    hotspot("S110", 259, 710, 43, 50),
    hotspot("S111", 344, 577, 43, 50),
    hotspot("S112", 344, 710, 43, 50),
  ],
};

/** Manually verified against the observed 3769 × 1876 NLB plan revision. */
export const TAMPINES_LEVEL_5_STUDY_AREA_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "1",
  areaId: "56",
  mapPath: "trl-5-studyarea-sp-full.png",
  imageWidth: 3769,
  imageHeight: 1876,
  coverage: "complete",
  hotspots: [
    hotspot("S113", 450, 585, 135, 145),
    hotspot("S114", 450, 1040, 135, 145),
    hotspot("S115", 660, 585, 135, 145),
    hotspot("S116", 660, 1040, 135, 145),
    hotspot("S117", 870, 585, 135, 145),
    hotspot("S118", 870, 1040, 135, 145),
    hotspot("S119", 1260, 585, 135, 145),
    hotspot("S120", 1260, 1040, 135, 145),
    hotspot("S121", 1470, 585, 135, 145),
    hotspot("S122", 1470, 1040, 135, 145),
    hotspot("S123", 1680, 585, 135, 145),
    hotspot("S124", 1680, 1040, 135, 145),
    hotspot("S125", 2040, 585, 135, 145),
    hotspot("S126", 2040, 1040, 135, 145),
    hotspot("S127", 2250, 585, 135, 145),
    hotspot("S128", 2250, 1040, 135, 145),
    hotspot("S129", 2460, 585, 135, 145),
    hotspot("S130", 2460, 1040, 135, 145),
    hotspot("S131", 2820, 585, 135, 145),
    hotspot("S132", 2820, 1040, 135, 145),
    hotspot("S133", 3030, 585, 135, 145),
    hotspot("S134", 3030, 1040, 135, 145),
    hotspot("S135", 3240, 585, 135, 145),
    hotspot("S136", 3240, 1040, 135, 145),
  ],
};

/** Manually verified against the observed 1273 × 2098 NLB plan revision. */
export const TAMPINES_LEVEL_5_STUDY_LOUNGE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "1",
  areaId: "1",
  mapPath: "trl-5-studylounge-sp-full.png",
  imageWidth: 1273,
  imageHeight: 2098,
  coverage: "complete",
  hotspots: [
    ...pairedTable(29, 5, 120, 430, 145, 170, 100, 115),
    ...pairedTable(39, 5, 175, 485, 1120, 165, 100, 115),
    ...pairedTable(49, 5, 685, 990, 145, 170, 100, 115),
    ...pairedTable(59, 5, 805, 1110, 1120, 165, 100, 115),
  ],
};

export const TAMPINES_LIBRARY_LEVEL_5_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  TAMPINES_LEVEL_5_CO_WORKING_LOUNGE_SEAT_PLAN,
  TAMPINES_LEVEL_5_OUTSIDE_STUDY_LOUNGE_SEAT_PLAN,
  TAMPINES_LEVEL_5_SG_COLLECTION_SEAT_PLAN,
  TAMPINES_LEVEL_5_STUDY_AREA_SEAT_PLAN,
  TAMPINES_LEVEL_5_STUDY_LOUNGE_SEAT_PLAN,
];
