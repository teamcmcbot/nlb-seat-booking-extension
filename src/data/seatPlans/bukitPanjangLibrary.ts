import type { SeatPlanDefinition } from "../../models/seatPlan";

/**
 * Manually verified against the observed 1225 × 883 NLB plan revision.
 * Hotspots use source-image pixels and cover every labelled seat marker.
 */
export const BUKIT_PANJANG_ADULT_NON_FICTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "10",
  areaId: "28",
  mapPath: "bppl-3-adultnonfiction-sp-full.png",
  imageWidth: 1225,
  imageHeight: 883,
  coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 662, y: 203, width: 45, height: 45 },
    { seatName: "S2", x: 744, y: 240, width: 45, height: 40 },
    { seatName: "S3", x: 511, y: 346, width: 45, height: 43 },
    { seatName: "S4", x: 552, y: 391, width: 43, height: 41 },
    { seatName: "S5", x: 608, y: 416, width: 43, height: 40 },
    { seatName: "S6", x: 669, y: 425, width: 43, height: 40 },
    { seatName: "S7", x: 727, y: 405, width: 42, height: 40 },
    { seatName: "S8", x: 289, y: 407, width: 40, height: 43 },
    { seatName: "S9", x: 322, y: 458, width: 43, height: 40 },
    { seatName: "S10", x: 360, y: 498, width: 47, height: 40 },
    { seatName: "S11", x: 411, y: 522, width: 49, height: 40 },
    { seatName: "S12", x: 468, y: 541, width: 48, height: 39 },
    { seatName: "S13", x: 525, y: 540, width: 43, height: 40 },
    { seatName: "S14", x: 743, y: 575, width: 48, height: 40 },
    { seatName: "S15", x: 808, y: 581, width: 43, height: 40 },
    { seatName: "S16", x: 881, y: 576, width: 47, height: 40 },
    { seatName: "S17", x: 951, y: 544, width: 47, height: 40 },
    { seatName: "S18", x: 1006, y: 511, width: 50, height: 40 },
  ],
};

/**
 * Manually verified against the observed 1015 × 561 NLB plan revision.
 * Hotspots use source-image pixels and cover every labelled seat marker.
 */
export const BUKIT_PANJANG_TEENS_FICTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "10",
  areaId: "29",
  mapPath: "bppl-3-teensfiction-sp-full.png",
  imageWidth: 1015,
  imageHeight: 561,
  coverage: "complete",
  hotspots: [
    { seatName: "S19", x: 855, y: 402, width: 130, height: 31 },
    { seatName: "S20", x: 518, y: 403, width: 130, height: 30 },
    { seatName: "S21", x: 847, y: 300, width: 130, height: 29 },
    { seatName: "S22", x: 514, y: 298, width: 131, height: 29 },
    { seatName: "S23", x: 343, y: 273, width: 129, height: 30 },
    { seatName: "S24", x: 29, y: 272, width: 129, height: 29 },
    { seatName: "S25", x: 371, y: 161, width: 130, height: 28 },
    { seatName: "S26", x: 29, y: 156, width: 129, height: 28 },
  ],
};
