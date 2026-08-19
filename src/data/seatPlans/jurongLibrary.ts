import type { SeatPlanDefinition } from "../../models/seatPlan";

/**
 * Manually verified against the observed 1824 × 1208 NLB plan revision.
 * The exact map revision and image dimensions are validated before any
 * hotspot becomes interactive.
 */
export const JURONG_LEVEL_3_ESCALATOR_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "2",
  areaId: "43",
  mapPath: "jrl-3-studyareaescalator-sp-full.png?t=20221130",
  imageWidth: 1824,
  imageHeight: 1208,
  coverage: "complete",
  hotspots: [
    { seatName: "S359", x: 178, y: 1006, width: 78, height: 78 },
    { seatName: "S360", x: 177, y: 912, width: 77, height: 78 },
    { seatName: "S361", x: 177, y: 818, width: 77, height: 77 },
    { seatName: "S362", x: 176, y: 723, width: 80, height: 77 },
    { seatName: "S363", x: 178, y: 571, width: 80, height: 77 },
    { seatName: "S364", x: 177, y: 477, width: 80, height: 77 },
    { seatName: "S365", x: 177, y: 383, width: 80, height: 77 },
    { seatName: "S366", x: 176, y: 288, width: 79, height: 77 },
    { seatName: "S367", x: 852, y: 334, width: 77, height: 76 },
    { seatName: "S368", x: 957, y: 334, width: 78, height: 76 },
    { seatName: "S369", x: 1061, y: 334, width: 77, height: 76 },
    { seatName: "S370", x: 1164, y: 334, width: 78, height: 76 },
    { seatName: "S371", x: 1282, y: 334, width: 77, height: 76 },
    { seatName: "S372", x: 1387, y: 334, width: 78, height: 76 },
    { seatName: "S373", x: 1491, y: 334, width: 77, height: 76 },
    { seatName: "S374", x: 1594, y: 334, width: 78, height: 76 },
    { seatName: "S375", x: 1408, y: 481, width: 77, height: 76 },
    { seatName: "S376", x: 1565, y: 616, width: 82, height: 83 },
    { seatName: "S377", x: 1601, y: 798, width: 77, height: 78 },
    { seatName: "S378", x: 1549, y: 958, width: 85, height: 85 },
    { seatName: "S379", x: 1410, y: 1068, width: 77, height: 76 },
    { seatName: "S380", x: 1270, y: 966, width: 86, height: 86 },
    { seatName: "S381", x: 1218, y: 811, width: 77, height: 79 },
    { seatName: "S382", x: 1247, y: 623, width: 83, height: 84 },
    { seatName: "S383", x: 880, y: 616, width: 82, height: 83 },
    { seatName: "S384", x: 916, y: 797, width: 78, height: 79 },
    { seatName: "S385", x: 865, y: 958, width: 84, height: 85 },
    { seatName: "S386", x: 585, y: 966, width: 86, height: 86 },
    { seatName: "S387", x: 533, y: 811, width: 77, height: 79 },
    { seatName: "S388", x: 562, y: 623, width: 83, height: 84 },
  ],
};
