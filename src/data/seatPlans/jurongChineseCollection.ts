import type {
  SeatHotspotDefinition,
  SeatPlanDefinition,
} from "../../models/seatPlan";

function descendingRangeBand(
  firstSeat: number,
  count: number,
  x: number,
  y: number,
  totalWidth: number,
  height: number,
): SeatHotspotDefinition[] {
  return Array.from({ length: count }, (_, index) => {
    const left = Math.round(x + (totalWidth * index) / count);
    const right = Math.round(x + (totalWidth * (index + 1)) / count);
    return {
      seatName: `S${firstSeat - index}`,
      x: left + 1,
      y,
      width: right - left - 2,
      height,
    };
  });
}

/**
 * Verified against the observed 1988 × 1141 NLB plan revision.
 *
 * S291-S308 use their individually printed chair labels. The bottom run is
 * represented by the plan as one continuous S358-to-S309 range, so its 50
 * equal hit regions follow that displayed left-to-right descending order.
 */
export const JURONG_LEVEL_3_CHINESE_COLLECTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "2",
  areaId: "42",
  mapPath: "jrl-3-chinesecollection-sp-full.png?t=20221130",
  imageWidth: 1988,
  imageHeight: 1141,
  coverage: "complete",
  mappingBasis: "hybrid-range-order",
  hotspots: [
    { seatName: "S291", x: 175, y: 741, width: 60, height: 58 },
    { seatName: "S292", x: 175, y: 639, width: 61, height: 57 },
    { seatName: "S293", x: 175, y: 538, width: 56, height: 57 },
    { seatName: "S294", x: 175, y: 443, width: 56, height: 57 },
    { seatName: "S295", x: 384, y: 346, width: 57, height: 56 },
    { seatName: "S296", x: 454, y: 346, width: 58, height: 55 },
    { seatName: "S297", x: 551, y: 346, width: 57, height: 55 },
    { seatName: "S298", x: 622, y: 346, width: 57, height: 55 },
    { seatName: "S299", x: 719, y: 346, width: 57, height: 56 },
    { seatName: "S300", x: 789, y: 346, width: 58, height: 56 },
    { seatName: "S301", x: 1356, y: 343, width: 57, height: 56 },
    { seatName: "S302", x: 1461, y: 343, width: 58, height: 56 },
    { seatName: "S303", x: 1565, y: 343, width: 57, height: 56 },
    { seatName: "S304", x: 1668, y: 343, width: 58, height: 56 },
    { seatName: "S305", x: 1800, y: 417, width: 57, height: 55 },
    { seatName: "S306", x: 1717, y: 502, width: 55, height: 58 },
    { seatName: "S307", x: 1800, y: 615, width: 57, height: 55 },
    { seatName: "S308", x: 1715, y: 691, width: 56, height: 57 },
    // Extend the equal range regions through both the 48 decorative chair
    // symbols and the green band. The source artwork omits two chair symbols,
    // so these regions intentionally do not align one-to-one with every icon.
    ...descendingRangeBand(358, 50, 16, 925, 1946, 166),
  ],
};
