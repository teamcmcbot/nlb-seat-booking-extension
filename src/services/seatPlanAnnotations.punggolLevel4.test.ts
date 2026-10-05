import { describe, expect, it } from "vitest";
import {
  PUNGGOL_LEVEL_4_BESIDE_CHINESE_NON_FICTION_SEAT_PLAN,
  PUNGGOL_LEVEL_4_LAUNCH_AND_CO_WORKING_ZONE_SEAT_PLAN,
  PUNGGOL_LEVEL_4_LONG_STUDY_SPACE_SEAT_PLAN,
} from "../data/seatPlans/punggolLibraryLevel4";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

function seat(name: string, id?: string): Seat {
  return {
    id: id ?? `punggol-level-4-${name}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function areaFor(
  definition: SeatPlanDefinition,
  areaName: string,
  seatNames: readonly string[],
  seatIds: Readonly<Record<string, string>> = {},
): Area {
  return {
    id: definition.areaId,
    branchId: definition.branchId,
    branchCode: "PRL",
    branchName: "Punggol Library",
    name: areaName,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: seatNames.map((name) => seat(name, seatIds[name])),
  };
}

const besideChineseSeatNames = [
  "S173", "S174", "S175", "S176", "S177", "S178", "S179", "S180",
  "S181", "S182", "S183", "S184", "S185", "S186", "S187",
] as const;

const launchSeatNames = [
  "S136", "S137", "S138", "S139", "S140", "S141", "S142", "S143",
  "S144", "S145", "S146", "S147", "S148", "S149", "S150", "S151",
  "S152", "S153", "S154", "S155", "S156", "S157", "S158", "S159",
  "S160", "S161", "S162", "S163", "S164", "S165", "S166", "S167",
  "S168", "S169", "S170", "S171", "S172",
] as const;

const longSeatNames = [
  "S188", "S189", "S190", "S191", "S192", "S193", "S194", "S195",
  "S196", "S197", "S198", "S199", "S200", "S201", "S202", "S203",
  "S204", "S205", "S206", "S207", "S208", "S209", "S210", "S211",
  "S212", "S213", "S214", "S215", "S216", "S217", "S218", "S219",
  "S220", "S221", "S222", "S223", "S224", "S225", "S226", "S227",
  "S228", "S229", "S230", "S231", "S232", "S233", "S234", "S235",
] as const;

const longCatalogSeatIds = {
  S224: "2501",
  S225: "2502",
  S226: "2503",
  S227: "2504",
  S228: "2505",
  S229: "2506",
  S230: "2507",
  S231: "2508",
  S232: "2509",
  S233: "2510",
  S234: "2511",
  S235: "2512",
} as const;

const cases: readonly {
  definition: SeatPlanDefinition;
  areaName: string;
  expectedSeatNames: readonly string[];
  catalogSeatNames?: readonly string[];
  expectedSeatIds?: Readonly<Record<string, string>>;
  expectedCoverage?: SeatPlanDefinition["coverage"];
}[] = [
  {
    definition: PUNGGOL_LEVEL_4_BESIDE_CHINESE_NON_FICTION_SEAT_PLAN,
    areaName: "Beside Chinese Non-Fiction, Level 4",
    expectedSeatNames: besideChineseSeatNames,
  },
  {
    definition: PUNGGOL_LEVEL_4_LAUNCH_AND_CO_WORKING_ZONE_SEAT_PLAN,
    areaName: "Launch and Co-Working Zone, Level 4",
    expectedSeatNames: launchSeatNames,
  },
  {
    definition: PUNGGOL_LEVEL_4_LONG_STUDY_SPACE_SEAT_PLAN,
    areaName: "Long Study Space, Level 4",
    expectedSeatNames: longSeatNames,
    expectedSeatIds: longCatalogSeatIds,
  },
];

function hotspot(definition: SeatPlanDefinition, seatName: string) {
  const match = definition.hotspots.find((candidate) => candidate.seatName === seatName);
  expect(match).toBeDefined();
  return match!;
}

describe("Punggol Library Level 4 seat-plan annotations", () => {
  it.each(cases)("has reviewed expected coverage for $areaName", (testCase) => {
    expect(testCase.definition.coverage).toBe(testCase.expectedCoverage ?? "complete");
    expect(testCase.definition.hotspots).toHaveLength(testCase.expectedSeatNames.length);
    expect(new Set(testCase.definition.hotspots.map(({ seatName }) => seatName))).toEqual(
      new Set(testCase.expectedSeatNames),
    );
  });

  it.each(cases)("resolves $areaName against the matching catalog", (testCase) => {
    const resolution = resolveSeatPlan(
      areaFor(
        testCase.definition,
        testCase.areaName,
        testCase.catalogSeatNames ?? testCase.expectedSeatNames,
        testCase.expectedSeatIds,
      ),
      testCase.definition.mapPath,
      { width: testCase.definition.imageWidth, height: testCase.definition.imageHeight },
      [testCase.definition],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(new Set(resolution.hotspots.map(({ seat }) => seat.name))).toEqual(
        new Set(testCase.expectedSeatNames),
      );
    }
  });

  it("keeps Beside Chinese Non-Fiction ordered S173–S187 from left to right", () => {
    const plan = PUNGGOL_LEVEL_4_BESIDE_CHINESE_NON_FICTION_SEAT_PLAN;
    const seats = besideChineseSeatNames.map((seatName) => hotspot(plan, seatName));
    expect(seats.map(({ x }) => x)).toEqual([...seats.map(({ x }) => x)].sort((a, b) => a - b));
    expect(hotspot(plan, "S173").x).toBe(208);
    expect(hotspot(plan, "S187").x).toBe(1424);
  });

  it("preserves the co-working table-side and standalone-seat directions", () => {
    const plan = PUNGGOL_LEVEL_4_LAUNCH_AND_CO_WORKING_ZONE_SEAT_PLAN;
    const yValues = (names: readonly string[]) => names.map((name) => hotspot(plan, name).y);

    expect(yValues(["S136", "S137", "S138", "S139", "S140", "S141", "S142", "S143", "S144"]))
      .toEqual([...yValues(["S136", "S137", "S138", "S139", "S140", "S141", "S142", "S143", "S144"])].sort((a, b) => a - b));
    expect(yValues(["S153", "S152", "S151", "S150", "S149", "S148", "S147", "S146", "S145"]))
      .toEqual([...yValues(["S153", "S152", "S151", "S150", "S149", "S148", "S147", "S146", "S145"])].sort((a, b) => a - b));
    expect(yValues(["S167", "S168", "S169"])).toEqual([710, 1087, 1463]);
    expect(hotspot(plan, "S172").x).toBeLessThan(hotspot(plan, "S170").x);
    expect(hotspot(plan, "S166").x).toBeLessThan(hotspot(plan, "S164").x);
  });

  it("preserves each long-study top row left-to-right and bottom row right-to-left", () => {
    const plan = PUNGGOL_LEVEL_4_LONG_STUDY_SPACE_SEAT_PLAN;
    const blocks = [
      { top: ["S188", "S189", "S190", "S191", "S192", "S193"], bottom: ["S230", "S231", "S232", "S233", "S234", "S235"] },
      { top: ["S194", "S195", "S196", "S197", "S198", "S199"], bottom: ["S224", "S225", "S226", "S227", "S228", "S229"] },
      { top: ["S200", "S201", "S202", "S203", "S204", "S205"], bottom: ["S218", "S219", "S220", "S221", "S222", "S223"] },
      { top: ["S206", "S207", "S208", "S209", "S210", "S211"], bottom: ["S212", "S213", "S214", "S215", "S216", "S217"] },
    ] as const;

    for (const block of blocks) {
      const topX = block.top.map((name) => hotspot(plan, name).x);
      const bottomX = block.bottom.map((name) => hotspot(plan, name).x);
      expect(topX).toEqual([...topX].sort((a, b) => a - b));
      expect(bottomX).toEqual([...bottomX].sort((a, b) => b - a));
    }
    expect(hotspot(plan, "S188").x).toBe(36);
    expect(hotspot(plan, "S211").x).toBe(1211);
    expect(hotspot(plan, "S212").x).toBe(1205);
    expect(hotspot(plan, "S235").x).toBe(38);
  });

  it("pins the added long-study seats to their catalog IDs", () => {
    const plan = PUNGGOL_LEVEL_4_LONG_STUDY_SPACE_SEAT_PLAN;
    const mappedAddedSeatNames = [
      "S224", "S225", "S226", "S227", "S228", "S229",
      "S230", "S231", "S232", "S233", "S234", "S235",
    ] as const;
    for (const seatName of mappedAddedSeatNames) {
      expect(hotspot(plan, seatName).expectedSeatId).toBe(longCatalogSeatIds[seatName]);
    }
  });

  it("uses the reviewed right-to-left sequence for the duplicate printed S228 labels", () => {
    const plan = PUNGGOL_LEVEL_4_LONG_STUDY_SPACE_SEAT_PLAN;
    expect(hotspot(plan, "S228")).toMatchObject({
      expectedSeatId: "2505",
      x: 396,
    });
    expect(hotspot(plan, "S229")).toMatchObject({
      expectedSeatId: "2506",
      x: 349,
    });
    expect(hotspot(plan, "S228").x).toBeGreaterThan(hotspot(plan, "S229").x);
  });

  it("places long-study hotspots on the blue seat tabs, not the green table cells", () => {
    const plan = PUNGGOL_LEVEL_4_LONG_STUDY_SPACE_SEAT_PLAN;
    const topRow = longSeatNames.slice(0, 24).map((seatName) => hotspot(plan, seatName));
    const bottomRow = longSeatNames.slice(24).map((seatName) => hotspot(plan, seatName));

    expect(topRow.every(({ y, height }) => y >= 226 && y + height <= 250)).toBe(true);
    expect(bottomRow.every(({ y, height }) => y >= 304 && y + height <= 329)).toBe(true);
  });
});
