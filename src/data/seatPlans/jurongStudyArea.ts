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
): SeatHotspotDefinition[] {
  return Array.from({ length: count }, (_, index) => ({
    seatName: `S${firstSeat + index}`,
    x: Math.round(x + step * index),
    y,
    width,
    height,
  }));
}

function descendingHorizontalSeatRow(
  firstSeat: number,
  count: number,
  x: number,
  y: number,
  step: number,
  width: number,
  height: number,
): SeatHotspotDefinition[] {
  return Array.from({ length: count }, (_, index) => ({
    seatName: `S${firstSeat - index}`,
    x: Math.round(x + step * index),
    y,
    width,
    height,
  }));
}

/**
 * Manually verified against the observed 1126 x 844 NLB plan revision.
 *
 * The plan visibly labels every seat from S93 through S290. Compact source-
 * pixel rectangles cover the individual blue seat shapes without extending
 * into an adjacent seat or table.
 */
export const JURONG_LEVEL_3_STUDY_AREA_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "2",
  areaId: "2",
  mapPath: "jrl-3-studyarea-sp-full.png?t=20221130",
  imageWidth: 1126,
  imageHeight: 844,
  coverage: "complete",
  hotspots: [
    { seatName: "S93", x: 103, y: 800, width: 34, height: 38 },
    { seatName: "S94", x: 103, y: 746, width: 34, height: 37 },
    { seatName: "S95", x: 103, y: 699, width: 34, height: 34 },
    { seatName: "S96", x: 103, y: 645, width: 34, height: 37 },
    { seatName: "S97", x: 559, y: 779, width: 35, height: 36 },
    { seatName: "S98", x: 615, y: 779, width: 35, height: 36 },
    { seatName: "S99", x: 559, y: 695, width: 35, height: 36 },
    { seatName: "S100", x: 615, y: 695, width: 35, height: 36 },
    ...horizontalSeatRow(101, 24, 232, 592, 36.35, 34, 32),
    ...descendingHorizontalSeatRow(148, 24, 232, 527, 36.35, 34, 34),
    ...horizontalSeatRow(149, 24, 232, 475, 36.35, 34, 29),
    ...descendingHorizontalSeatRow(196, 24, 232, 410, 36.35, 34, 34),
    ...horizontalSeatRow(197, 24, 232, 356, 36.35, 34, 32),
    ...descendingHorizontalSeatRow(244, 24, 232, 291, 36.35, 34, 34),
    ...horizontalSeatRow(245, 21, 348, 242, 36.2, 34, 31),
    ...descendingHorizontalSeatRow(286, 21, 348, 177, 36.2, 34, 34),
    { seatName: "S287", x: 871, y: 126, width: 35, height: 34 },
    { seatName: "S288", x: 926, y: 75, width: 35, height: 31 },
    { seatName: "S289", x: 871, y: 51, width: 35, height: 31 },
    { seatName: "S290", x: 926, y: 0, width: 35, height: 29 },
  ],
};
