import type { SeatPlanDefinition } from "../../models/seatPlan";

/**
 * Manually verified against the observed 796 x 273 NLB plan revision.
 * The plan visibly labels S1 through S18 from left to right.
 */
export const JURONG_WEST_LEVEL_3_QUIET_READING_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "15",
  areaId: "44",
  mapPath: "jwpl-3-quietreading-sp-full.png",
  imageWidth: 796,
  imageHeight: 273,
  coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 39, y: 183, width: 31, height: 39 },
    { seatName: "S2", x: 78, y: 183, width: 31, height: 39 },
    { seatName: "S3", x: 118, y: 183, width: 31, height: 39 },
    { seatName: "S4", x: 158, y: 183, width: 31, height: 39 },
    { seatName: "S5", x: 198, y: 183, width: 31, height: 39 },
    { seatName: "S6", x: 238, y: 183, width: 31, height: 39 },
    { seatName: "S7", x: 278, y: 183, width: 31, height: 39 },
    { seatName: "S8", x: 318, y: 183, width: 31, height: 39 },
    { seatName: "S9", x: 358, y: 183, width: 31, height: 39 },
    { seatName: "S10", x: 398, y: 183, width: 31, height: 39 },
    { seatName: "S11", x: 438, y: 183, width: 31, height: 39 },
    { seatName: "S12", x: 478, y: 183, width: 31, height: 39 },
    { seatName: "S13", x: 518, y: 183, width: 31, height: 39 },
    { seatName: "S14", x: 558, y: 183, width: 31, height: 39 },
    { seatName: "S15", x: 598, y: 183, width: 31, height: 39 },
    { seatName: "S16", x: 638, y: 183, width: 31, height: 39 },
    { seatName: "S17", x: 678, y: 183, width: 31, height: 39 },
    { seatName: "S18", x: 718, y: 183, width: 31, height: 39 },
  ],
};

/**
 * Manually verified against the observed 842 x 254 NLB plan revision.
 * The plan alternates paired seats around narrow tables from S19 at the
 * upper-right through S58 at the upper-left.
 */
export const JURONG_WEST_LEVEL_3_STAIRWELL_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "15",
  areaId: "45",
  mapPath: "jwpl-3-stairwell-sp-full.png",
  imageWidth: 842,
  imageHeight: 254,
  coverage: "complete",
  hotspots: [
    { seatName: "S19", x: 796, y: 125, width: 28, height: 34 },
    { seatName: "S20", x: 796, y: 166, width: 28, height: 34 },
    { seatName: "S21", x: 749, y: 166, width: 28, height: 34 },
    { seatName: "S22", x: 749, y: 125, width: 28, height: 34 },
    { seatName: "S23", x: 716, y: 125, width: 28, height: 34 },
    { seatName: "S24", x: 716, y: 166, width: 28, height: 34 },
    { seatName: "S25", x: 668, y: 166, width: 28, height: 34 },
    { seatName: "S26", x: 668, y: 125, width: 28, height: 34 },
    { seatName: "S27", x: 635, y: 125, width: 28, height: 34 },
    { seatName: "S28", x: 635, y: 166, width: 28, height: 34 },
    { seatName: "S29", x: 587, y: 166, width: 28, height: 34 },
    { seatName: "S30", x: 587, y: 125, width: 28, height: 34 },
    { seatName: "S31", x: 554, y: 125, width: 28, height: 34 },
    { seatName: "S32", x: 554, y: 166, width: 28, height: 34 },
    { seatName: "S33", x: 506, y: 166, width: 28, height: 34 },
    { seatName: "S34", x: 506, y: 125, width: 28, height: 34 },
    { seatName: "S35", x: 473, y: 125, width: 28, height: 34 },
    { seatName: "S36", x: 473, y: 166, width: 28, height: 34 },
    { seatName: "S37", x: 425, y: 166, width: 28, height: 34 },
    { seatName: "S38", x: 425, y: 125, width: 28, height: 34 },
    { seatName: "S39", x: 392, y: 125, width: 28, height: 34 },
    { seatName: "S40", x: 392, y: 166, width: 28, height: 34 },
    { seatName: "S41", x: 344, y: 166, width: 28, height: 34 },
    { seatName: "S42", x: 344, y: 125, width: 28, height: 34 },
    { seatName: "S43", x: 311, y: 125, width: 28, height: 34 },
    { seatName: "S44", x: 311, y: 166, width: 28, height: 34 },
    { seatName: "S45", x: 263, y: 166, width: 28, height: 34 },
    { seatName: "S46", x: 263, y: 125, width: 28, height: 34 },
    { seatName: "S47", x: 230, y: 125, width: 28, height: 34 },
    { seatName: "S48", x: 230, y: 166, width: 28, height: 34 },
    { seatName: "S49", x: 182, y: 166, width: 28, height: 34 },
    { seatName: "S50", x: 182, y: 125, width: 28, height: 34 },
    { seatName: "S51", x: 149, y: 125, width: 28, height: 34 },
    { seatName: "S52", x: 149, y: 166, width: 28, height: 34 },
    { seatName: "S53", x: 101, y: 166, width: 28, height: 34 },
    { seatName: "S54", x: 101, y: 125, width: 28, height: 34 },
    { seatName: "S55", x: 68, y: 125, width: 28, height: 34 },
    { seatName: "S56", x: 68, y: 166, width: 28, height: 34 },
    { seatName: "S57", x: 20, y: 166, width: 28, height: 34 },
    { seatName: "S58", x: 20, y: 125, width: 28, height: 34 },
  ],
};

export const JURONG_WEST_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  JURONG_WEST_LEVEL_3_QUIET_READING_SEAT_PLAN,
  JURONG_WEST_LEVEL_3_STAIRWELL_SEAT_PLAN,
];
