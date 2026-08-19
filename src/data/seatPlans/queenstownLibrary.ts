import type { SeatHotspotDefinition, SeatPlanDefinition } from "../../models/seatPlan";

function seat(seatNumber: number, x: number, y: number, width: number, height: number): SeatHotspotDefinition {
  return { seatName: `S${seatNumber}`, x, y, width, height };
}

/** Manually verified against the observed 3832 × 703 NLB plan revision. */
export const QUEENSTOWN_LEVEL_2_QUIET_READING_ROOM_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "25",
  areaId: "49",
  mapPath: "qupl-2-quietreading-sp-full.png",
  imageWidth: 3832,
  imageHeight: 703,
  coverage: "complete",
  hotspots: [
    seat(50, 130, 132, 145, 153),
    seat(49, 502, 132, 145, 153),
    seat(48, 877, 132, 145, 153),
    seat(47, 1251, 132, 145, 153),
    seat(46, 1794, 44, 151, 153), seat(45, 1794, 231, 151, 153),
    seat(43, 2147, 42, 151, 153), seat(44, 2147, 229, 151, 153),
    seat(42, 2394, 39, 151, 153), seat(41, 2394, 226, 151, 153),
    seat(39, 2650, 39, 151, 153), seat(40, 2650, 226, 151, 153),
    seat(38, 2890, 39, 151, 153), seat(37, 2890, 226, 151, 153),
    seat(35, 3144, 39, 151, 153), seat(36, 3144, 226, 151, 153),
    seat(34, 3397, 39, 151, 153), seat(33, 3397, 226, 151, 153),
    seat(31, 3653, 39, 153, 153), seat(32, 3653, 226, 153, 153),
  ],
};

function fourSeatTable(
  leftX: number,
  rightX: number,
  topLeft: number,
  topRight: number,
  bottomLeft: number,
  bottomRight: number,
): SeatHotspotDefinition[] {
  return [
    seat(topLeft, leftX, 20, 150, 153),
    seat(topRight, rightX, 20, 126, 153),
    seat(bottomLeft, leftX, 214, 150, 153),
    seat(bottomRight, rightX, 214, 126, 153),
  ];
}

/** Manually verified against the observed 4246 × 691 NLB plan revision. */
export const QUEENSTOWN_LEVEL_2_SINGAPORE_COLLECTION_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "25",
  areaId: "48",
  mapPath: "qupl-2-singaporecollection-sp-full.png",
  imageWidth: 4246,
  imageHeight: 691,
  coverage: "complete",
  hotspots: [
    ...fourSeatTable(20, 278, 30, 27, 29, 28),
    ...fourSeatTable(511, 769, 26, 23, 25, 24),
    ...fourSeatTable(1021, 1279, 22, 19, 21, 20),
    ...fourSeatTable(1508, 1766, 18, 15, 17, 16),
    ...fourSeatTable(2006, 2264, 14, 11, 13, 12),
    ...fourSeatTable(2497, 2755, 10, 7, 9, 8),
    ...fourSeatTable(2982, 3242, 6, 3, 5, 4),
    seat(2, 3557, 28, 145, 153),
    seat(1, 3947, 28, 145, 153),
  ],
};

export const QUEENSTOWN_LIBRARY_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  QUEENSTOWN_LEVEL_2_QUIET_READING_ROOM_SEAT_PLAN,
  QUEENSTOWN_LEVEL_2_SINGAPORE_COLLECTION_SEAT_PLAN,
];
