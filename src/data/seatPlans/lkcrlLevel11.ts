import type {
  SeatHotspotDefinition,
  SeatPlanDefinition,
} from "../../models/seatPlan";

type Bounds = readonly [x: number, y: number, width: number, height: number];

function seat(seatNumber: number, bounds: Bounds): SeatHotspotDefinition {
  const [x, y, width, height] = bounds;
  return { seatName: `ES${seatNumber}`, x, y, width, height };
}

function seatRow(
  firstSeat: number,
  xPositions: readonly number[],
  y: number,
  width: number,
  height: number,
  direction: 1 | -1 = 1,
): SeatHotspotDefinition[] {
  return xPositions.map((x, index) =>
    seat(firstSeat + direction * index, [x, y, width, height]),
  );
}

function seatColumn(
  firstSeat: number,
  x: number,
  yPositions: readonly number[],
  width: number,
  height: number,
): SeatHotspotDefinition[] {
  return yPositions.map((y, index) =>
    seat(firstSeat + index, [x, y, width, height]),
  );
}

/**
 * Ten-seat rectangular table: one seat on each short side, four above, and
 * four below. Numbering runs clockwise, so the lower row reads right-to-left.
 */
function rectangularTenSeatBank(
  firstSeat: number,
  leftX: number,
  rowXs: readonly number[],
  rightX: number,
): SeatHotspotDefinition[] {
  return [
    seat(firstSeat, [leftX, 329, 33, 30]),
    ...seatRow(firstSeat + 1, rowXs, 276, 38, 35),
    seat(firstSeat + 5, [rightX, 328, 31, 29]),
    ...seatRow(firstSeat + 9, rowXs, 378, 38, 35, -1),
  ];
}

/**
 * Fourteen-seat rectangular table: two seats on each short side, five above,
 * and five below. Numbering runs clockwise around the table.
 */
function rectangularFourteenSeatBank(
  firstSeat: number,
  leftX: number,
  rowXs: readonly number[],
  rightX: number,
): SeatHotspotDefinition[] {
  return [
    seat(firstSeat, [leftX, 194, 17, 16]),
    seat(firstSeat + 1, [leftX - 1, 175, 17, 16]),
    ...seatRow(firstSeat + 2, rowXs, 155, 16, 17),
    seat(firstSeat + 7, [rightX, 176, 17, 16]),
    seat(firstSeat + 8, [rightX, 196, 17, 16]),
    ...seatRow(firstSeat + 13, rowXs, 213, 16, 17, -1),
  ];
}

/** Manually verified against the observed 1447 x 642 NLB plan revision. */
export const LKCRL_LEVEL_11_EXPRESS_SEATS_ZONE_D1_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "16",
  areaId: "6",
  mapPath: "lkcrl11-11-zoned1-sp-full.png",
  imageWidth: 1447,
  imageHeight: 642,
  coverage: "complete",
  hotspots: [
    ...seatColumn(751, 63, [437, 402, 370, 336, 305], 27, 26),
    ...seatRow(756, [93, 125], 270, 26, 27),
    ...seatColumn(758, 157, [305, 337, 370, 402, 437], 27, 26),

    seat(763, [226, 385, 29, 29]),
    seat(764, [223, 313, 32, 30]),
    seat(765, [266, 264, 38, 35]),
    seat(766, [320, 314, 31, 30]),
    seat(767, [320, 387, 31, 27]),

    ...rectangularTenSeatBank(768, 419, [459, 509, 561, 608], 655),
    ...rectangularTenSeatBank(778, 716, [756, 806, 858, 904], 952),

    ...seatColumn(788, 1010, [436, 401, 369, 336, 304], 28, 26),
    seat(793, [1057, 269, 26, 28]),
    ...seatColumn(794, 1104, [304, 336, 370, 402, 436], 28, 26),

    ...seatColumn(799, 1142, [436, 401, 369, 336, 304], 29, 26),
    seat(804, [1187, 269, 26, 28]),
    ...seatColumn(805, 1236, [304, 336, 370, 402, 437], 28, 26),

    ...seatRow(810, [1301, 1335], 269, 26, 28),
    seat(812, [1334, 362, 26, 28]),
    seat(813, [1334, 402, 26, 27]),
    seat(814, [1334, 495, 26, 27]),
    seat(815, [1299, 495, 27, 27]),
    seat(816, [1300, 402, 26, 27]),
    seat(817, [1300, 362, 26, 28]),
  ],
};

/** Manually verified against the observed 905 x 305 NLB plan revision. */
export const LKCRL_LEVEL_11_EXPRESS_SEATS_ZONE_D2_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "16",
  areaId: "10",
  mapPath: "lkcrl11-11-zoned2-sp-full.png",
  imageWidth: 905,
  imageHeight: 305,
  coverage: "complete",
  hotspots: [
    ...rectangularFourteenSeatBank(
      821,
      252,
      [275, 295, 315, 338, 357],
      378,
    ),
    ...rectangularFourteenSeatBank(
      835,
      414,
      [437, 458, 478, 500, 519],
      540,
    ),
  ],
};

export const LKCRL_LEVEL_11_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  LKCRL_LEVEL_11_EXPRESS_SEATS_ZONE_D1_SEAT_PLAN,
  LKCRL_LEVEL_11_EXPRESS_SEATS_ZONE_D2_SEAT_PLAN,
];
