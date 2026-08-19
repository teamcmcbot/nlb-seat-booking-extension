import type { SeatPlanDefinition } from "../../models/seatPlan";

/**
 * Manually verified against the observed 1537 x 391 NLB plan revision.
 * The exact map revision and image dimensions are validated before any
 * hotspot becomes interactive.
 */
export const CENTRAL_LIBRARY_B1_READING_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "11",
  areaId: "90",
  mapPath: "cll-b1-reading-zone-sp-full.png",
  imageWidth: 1537,
  imageHeight: 391,
  coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 15, y: 293, width: 54, height: 52 },
    { seatName: "S2", x: 94, y: 293, width: 55, height: 52 },
    { seatName: "S3", x: 185, y: 293, width: 54, height: 52 },
    { seatName: "S4", x: 249, y: 293, width: 54, height: 52 },
    { seatName: "S5", x: 314, y: 293, width: 54, height: 52 },
    { seatName: "S6", x: 378, y: 293, width: 54, height: 52 },
    { seatName: "S7", x: 442, y: 293, width: 54, height: 52 },
    { seatName: "S8", x: 506, y: 293, width: 54, height: 52 },
    { seatName: "S9", x: 570, y: 293, width: 54, height: 52 },
    { seatName: "S10", x: 662, y: 293, width: 54, height: 52 },
    { seatName: "S11", x: 726, y: 293, width: 54, height: 52 },
    { seatName: "S12", x: 790, y: 293, width: 54, height: 52 },
    { seatName: "S13", x: 854, y: 293, width: 54, height: 52 },
    { seatName: "S14", x: 919, y: 293, width: 54, height: 52 },
    { seatName: "S15", x: 983, y: 293, width: 54, height: 52 },
    { seatName: "S16", x: 1047, y: 293, width: 54, height: 52 },
    { seatName: "S17", x: 1203, y: 293, width: 59, height: 52 },
    { seatName: "S18", x: 1272, y: 293, width: 55, height: 52 },
    { seatName: "S19", x: 1336, y: 293, width: 55, height: 52 },
    { seatName: "S20", x: 1401, y: 293, width: 54, height: 52 },
    { seatName: "S21", x: 1465, y: 293, width: 57, height: 52 },
  ],
};

/**
 * Manually verified against the observed 1173 x 394 NLB plan revision.
 * The exact map revision and image dimensions are validated before any
 * hotspot becomes interactive.
 */
export const CENTRAL_LIBRARY_B1_STUDY_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "11",
  areaId: "91",
  mapPath: "cll-b1-study-zone-sp-full.png",
  imageWidth: 1173,
  imageHeight: 394,
  coverage: "complete",
  hotspots: [
    { seatName: "S22", x: 98, y: 272, width: 72, height: 86 },
    { seatName: "S23", x: 231, y: 272, width: 73, height: 86 },
    { seatName: "S24", x: 364, y: 272, width: 73, height: 86 },
    { seatName: "S25", x: 499, y: 272, width: 72, height: 86 },
    { seatName: "S26", x: 634, y: 272, width: 72, height: 86 },
    { seatName: "S27", x: 772, y: 272, width: 73, height: 86 },
    { seatName: "S28", x: 908, y: 272, width: 73, height: 86 },
    { seatName: "S29", x: 1042, y: 272, width: 73, height: 86 },
  ],
};
