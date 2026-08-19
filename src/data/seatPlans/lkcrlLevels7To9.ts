import type {
  SeatHotspotDefinition,
  SeatPlanDefinition,
} from "../../models/seatPlan";

function es(
  number: number,
  x: number,
  y: number,
  width = 24,
  height = 24,
): SeatHotspotDefinition {
  return {
    // The artwork pads ES01-ES09, but the live catalog uses ES1-ES9.
    seatName: `ES${number}`,
    x,
    y,
    width,
    height,
  };
}

function hd(
  number: number,
  x: number,
  y: number,
  width = 94,
  height = 90,
): SeatHotspotDefinition {
  return {
    // The artwork pads HD01-HD09, but the live catalog uses HD1-HD9.
    seatName: `HD${number}`,
    x,
    y,
    width,
    height,
  };
}

/**
 * Manually verified against the observed 1251 x 556 NLB plan revision.
 * The four table banks are ordered independently around their table edges.
 */
export const LKCRL_LEVEL_7_EXPRESS_SEATS_ZONE_A_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "17",
  areaId: "7",
  mapPath: "lkcrl7to9-7-zonea-sp-full.png",
  imageWidth: 1251,
  imageHeight: 556,
  coverage: "complete",
  hotspots: [
    es(1, 655, 323), es(2, 683, 323), es(3, 711, 323),
    es(4, 739, 323), es(5, 770, 323), es(6, 798, 324),
    es(7, 827, 299, 25, 23), es(8, 826, 271, 25, 23),
    es(9, 798, 243), es(10, 770, 242), es(11, 740, 242),
    es(12, 712, 242), es(13, 684, 242), es(14, 655, 242),
    es(15, 626, 269), es(16, 626, 297, 25, 23),

    es(17, 385, 320), es(18, 414, 320), es(19, 442, 320),
    es(20, 470, 320), es(21, 501, 320), es(22, 528, 321),
    es(23, 558, 296), es(24, 557, 268),
    es(25, 528, 239), es(26, 501, 239), es(27, 471, 239),
    es(28, 443, 239), es(29, 414, 239), es(30, 386, 239),
    es(31, 356, 266, 25), es(32, 357, 294),

    es(33, 235, 409), es(34, 262, 409, 23, 25),
    es(35, 288, 353, 23, 23), es(36, 287, 324),
    es(37, 288, 295, 23, 23), es(38, 288, 267, 23, 23),
    es(39, 261, 238, 23), es(40, 232, 238),
    es(41, 207, 267, 22, 23), es(42, 207, 295, 22, 23),
    es(43, 206, 323, 23), es(44, 207, 352, 22, 23),
    es(45, 207, 380, 23, 23),

    es(46, 144, 415, 24, 23), es(47, 144, 384, 24, 24),
    es(48, 144, 354, 24, 23), es(49, 144, 326, 24, 23),
    es(50, 145, 297, 24, 23), es(51, 144, 269, 25, 23),
    es(52, 117, 239, 23), es(53, 89, 239, 23),
    es(54, 63, 269, 25, 23), es(55, 63, 296, 25),
    es(56, 63, 326), es(57, 63, 353), es(58, 63, 384),
    es(59, 63, 414, 24, 23),
  ],
};

/** Manually verified against the observed 1267 x 585 NLB plan revision. */
export const LKCRL_LEVEL_8_EXPRESS_SEATS_ZONE_B_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "17",
  areaId: "8",
  mapPath: "lkcrl7to9-8-zoneb-sp-full.png",
  imageWidth: 1267,
  imageHeight: 585,
  coverage: "complete",
  hotspots: [
    es(60, 893, 454, 25, 23), es(61, 893, 424, 25, 23),
    es(62, 893, 393, 25), es(63, 893, 366, 25, 23),
    es(64, 894, 336), es(65, 894, 309),
    es(66, 865, 279, 23), es(67, 836, 279),
    es(68, 813, 308), es(69, 813, 336), es(70, 812, 365),
    es(71, 812, 393), es(72, 812, 424), es(73, 812, 454),

    es(74, 423, 397), es(75, 451, 398), es(76, 479, 397),
    es(77, 509, 398), es(78, 537, 398),
    es(79, 567, 373), es(80, 566, 345),
    es(81, 537, 317), es(82, 510, 317), es(83, 479, 316),
    es(84, 452, 317), es(85, 423, 316), es(86, 395, 316),
    es(87, 365, 344, 25, 23), es(88, 366, 371),
    es(89, 394, 397),
  ],
};

/** Manually verified against the observed 1440 x 771 NLB plan revision. */
export const LKCRL_LEVEL_9_EXPRESS_SEATS_ZONE_C_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "17",
  areaId: "9",
  mapPath: "lkcrl7to9-9-zonec-sp-full.png",
  imageWidth: 1440,
  imageHeight: 771,
  coverage: "complete",
  hotspots: [
    es(501, 81, 453, 27, 26), es(502, 81, 417, 27),
    es(503, 81, 385, 27), es(504, 82, 352, 27),
    es(505, 82, 320, 27, 26),
    es(506, 111, 285, 27, 28), es(507, 144, 286, 26, 27),
    es(508, 175, 321, 27, 26), es(509, 175, 352, 27),
    es(510, 174, 386, 28, 26), es(511, 174, 418, 28, 26),
    es(512, 174, 453, 28, 26),

    es(513, 330, 353, 27), es(514, 329, 322, 28, 26),
    es(515, 363, 290, 26, 27), es(516, 396, 290, 26, 27),
    es(517, 428, 291, 26, 27), es(518, 460, 290, 27, 28),
    es(519, 495, 291, 27), es(520, 527, 290, 26, 28),
    es(521, 560, 324, 27, 26), es(522, 560, 355, 28, 26),
    es(523, 526, 384, 26, 28), es(524, 495, 384, 26, 27),
    es(525, 460, 384, 27, 27), es(526, 428, 383, 26, 28),
    es(527, 395, 383, 26, 28), es(528, 362, 383, 27, 28),

    es(529, 724, 352, 28, 27), es(530, 724, 321, 27, 26),
    es(531, 757, 289, 27, 28), es(532, 795, 289, 26, 28),
    es(533, 832, 290, 26, 27), es(534, 871, 290, 27, 27),
    es(535, 910, 290, 26, 27), es(536, 954, 323, 28, 26),
    es(537, 955, 354, 27), es(538, 921, 383, 26, 28),
    es(539, 889, 383, 27, 28), es(540, 854, 383, 27),
    es(541, 822, 383, 26, 28), es(542, 790, 382, 26, 28),
    es(543, 757, 382, 26, 28),

    es(544, 997, 531, 32, 29), es(545, 996, 493, 32, 30),
    es(546, 1035, 461, 37, 35), es(547, 1076, 461, 38, 35),
    es(548, 1118, 461, 38, 35), es(549, 1160, 460, 37, 35),
    es(550, 1205, 495, 31, 29), es(551, 1206, 533, 31, 29),
    es(552, 1160, 563, 38, 34), es(553, 1118, 562, 37, 35),
    es(554, 1075, 562, 38, 35), es(555, 1033, 562, 38, 35),

    es(556, 425, 688, 33, 30), es(557, 425, 653, 33, 29),
    es(558, 465, 612, 37, 35), es(559, 509, 611, 37, 35),
    es(560, 554, 611, 37, 35), es(561, 598, 611, 37, 35),
    es(562, 640, 612, 38, 35), es(563, 683, 611, 37, 35),
    es(564, 726, 611, 38, 35), es(565, 768, 610, 38, 35),
    es(566, 808, 653, 31, 30), es(567, 809, 688, 30, 28),
  ],
};

/**
 * Manually verified against the observed 2765 x 2383 NLB plan revision.
 * This area exposes catalog seats HD1-HD48 (printed as HD01-HD48 on the map).
 * The separately labelled BZ01-BZ15 stations visible on the same floor plan
 * are not part of its 48-seat catalog.
 */
export const LKCRL_LEVEL_7_LAUNCH_HOT_DESK_ZONE_SEAT_PLAN: SeatPlanDefinition = {
  branchId: "17",
  areaId: "94",
  mapPath: "lkcrl7to9-7-hot-desk-zone-sp.png",
  imageWidth: 2765,
  imageHeight: 2383,
  coverage: "complete",
  hotspots: [
    hd(1, 943, 1873, 93, 89), hd(2, 943, 1752, 94, 89),
    hd(3, 945, 1633, 93, 89), hd(4, 695, 1633, 93, 90),
    hd(5, 694, 1752, 93, 89), hd(6, 694, 1872, 93),
    hd(7, 519, 1873, 93, 89), hd(8, 519, 1752, 94, 89),
    hd(9, 521, 1633, 93, 89), hd(10, 270, 1633),
    hd(11, 270, 1752, 93, 89), hd(12, 269, 1872, 94),

    hd(13, 942, 1435, 93, 89), hd(14, 942, 1314, 93),
    hd(15, 944, 1195, 93), hd(16, 693, 1196, 94, 89),
    hd(17, 693, 1314, 93, 89), hd(18, 692, 1434, 93),
    hd(19, 518, 1435, 93, 89), hd(20, 518, 1314, 93),
    hd(21, 519, 1195, 94), hd(22, 269, 1196, 93, 89),
    hd(23, 269, 1314, 93, 89), hd(24, 268, 1434, 93),

    hd(25, 942, 1002, 93), hd(26, 942, 882, 93, 89),
    hd(27, 944, 763, 93, 89), hd(28, 693, 763),
    hd(29, 692, 882, 94, 89), hd(30, 692, 1002, 93, 89),
    hd(31, 518, 1002, 93), hd(32, 518, 882, 93, 89),
    hd(33, 519, 763, 94, 89), hd(34, 269, 763, 93, 89),
    hd(35, 269, 881, 93), hd(36, 268, 1002, 93, 89),

    hd(37, 942, 563, 93, 89), hd(38, 942, 442, 93, 89),
    hd(39, 944, 323, 93, 89), hd(40, 693, 323),
    hd(41, 693, 442, 93, 89), hd(42, 692, 562, 93),
    hd(43, 518, 563, 93, 89), hd(44, 518, 442, 93, 89),
    hd(45, 519, 323, 94, 89), hd(46, 269, 323, 93),
    hd(47, 269, 442, 93, 89), hd(48, 268, 562, 93),
  ],
};

export const LKCRL_LEVELS_7_TO_9_SEAT_PLANS: readonly SeatPlanDefinition[] = [
  LKCRL_LEVEL_7_EXPRESS_SEATS_ZONE_A_SEAT_PLAN,
  LKCRL_LEVEL_8_EXPRESS_SEATS_ZONE_B_SEAT_PLAN,
  LKCRL_LEVEL_9_EXPRESS_SEATS_ZONE_C_SEAT_PLAN,
  LKCRL_LEVEL_7_LAUNCH_HOT_DESK_ZONE_SEAT_PLAN,
];
