import type { SeatPlanDefinition } from "../../models/seatPlan";

/**
 * Manually verified against the observed 657 × 811 NLB plan revision.
 * Each hotspot covers one visible blue seat label and excludes nearby desks.
 */
export const BUKIT_BATOK_LEVEL_2_STUDY_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "9",
  areaId: "97",
  mapPath: "bbpl-2-studyzone-sp-full.png",
  imageWidth: 657,
  imageHeight: 811,
  coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 278, y: 51, width: 28, height: 32 },
    { seatName: "S2", x: 241, y: 51, width: 28, height: 32 },
    { seatName: "S3", x: 205, y: 51, width: 28, height: 32 },
    { seatName: "S4", x: 169, y: 51, width: 28, height: 32 },
    { seatName: "S5", x: 84, y: 99, width: 34, height: 33 },
    { seatName: "S6", x: 84, y: 135, width: 34, height: 33 },
    { seatName: "S7", x: 84, y: 170, width: 34, height: 33 },
    { seatName: "S8", x: 84, y: 206, width: 34, height: 33 },
    { seatName: "S9", x: 84, y: 241, width: 34, height: 33 },
    { seatName: "S10", x: 84, y: 276, width: 34, height: 33 },
    { seatName: "S11", x: 84, y: 433, width: 34, height: 34 },
    { seatName: "S12", x: 84, y: 469, width: 34, height: 33 },
    { seatName: "S13", x: 84, y: 504, width: 34, height: 34 },
    { seatName: "S14", x: 84, y: 540, width: 34, height: 33 },
    { seatName: "S15", x: 84, y: 575, width: 34, height: 33 },
    { seatName: "S16", x: 84, y: 610, width: 34, height: 34 },
    { seatName: "S17", x: 84, y: 645, width: 34, height: 34 },
    { seatName: "S18", x: 84, y: 679, width: 34, height: 34 },
    { seatName: "S19", x: 224, y: 736, width: 33, height: 32 },
    { seatName: "S20", x: 224, y: 700, width: 33, height: 32 },
    { seatName: "S21", x: 321, y: 736, width: 34, height: 32 },
    { seatName: "S22", x: 321, y: 700, width: 34, height: 32 },
    { seatName: "S23", x: 469, y: 736, width: 34, height: 32 },
    { seatName: "S24", x: 469, y: 700, width: 34, height: 32 },
    { seatName: "S25", x: 566, y: 736, width: 34, height: 32 },
    { seatName: "S26", x: 566, y: 700, width: 34, height: 32 },
  ],
};
