import type {
  SeatHotspotDefinition,
  SeatPlanDefinition,
} from "../../models/seatPlan";

const CHAIR_X_POSITIONS = [
  22, 48, 73, 96, 122, 147, 171, 196, 222, 246,
  271, 296, 320, 346, 371, 395, 421, 446, 470, 495,
  521, 545, 570, 596, 621, 646, 671, 694, 720, 745,
  769, 794, 819, 844, 869, 894, 919, 945, 970, 994,
] as const;

function descendingChairRow(): SeatHotspotDefinition[] {
  return CHAIR_X_POSITIONS.map((x, index) => ({
    seatName: `S${92 - index}`,
    x,
    y: 205,
    width: 21,
    height: 20,
  }));
}

/**
 * Verified against the observed 1034 × 308 NLB plan revision.
 *
 * The artwork labels the 40-chair row through the endpoints S92 and S53 and
 * the intermediate marker S73. Seat identities therefore descend from left
 * to right in the explicit range order shown by the arrows.
 */
export const JURONG_LEVEL_2_ENGLISH_NON_FICTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "2",
  areaId: "41",
  mapPath: "jrl-2-englishnonfiction-sp-full.png",
  imageWidth: 1034,
  imageHeight: 308,
  coverage: "complete",
  mappingBasis: "range-order",
  hotspots: descendingChairRow(),
};
