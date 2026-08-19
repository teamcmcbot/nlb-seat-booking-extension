import { describe, expect, it } from "vitest";
import {
  TAMPINES_LEVEL_5_CO_WORKING_LOUNGE_SEAT_PLAN,
  TAMPINES_LEVEL_5_OUTSIDE_STUDY_LOUNGE_SEAT_PLAN,
  TAMPINES_LEVEL_5_SG_COLLECTION_SEAT_PLAN,
  TAMPINES_LEVEL_5_STUDY_AREA_SEAT_PLAN,
  TAMPINES_LEVEL_5_STUDY_LOUNGE_SEAT_PLAN,
} from "../data/seatPlans/tampinesLibraryLevel5";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

function seat(name: string): Seat {
  return {
    id: `tampines-${name}`,
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
): Area {
  return {
    id: definition.areaId,
    branchId: definition.branchId,
    branchCode: "TRL",
    branchName: "Tampines Library",
    name: areaName,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: seatNames.map(seat),
  };
}

const cases = [
  [
    TAMPINES_LEVEL_5_CO_WORKING_LOUNGE_SEAT_PLAN,
    "Co-Working Lounge, Level 5",
    [
      "S137", "S138", "S139", "S140", "S141", "S142", "S143", "S144",
      "S145", "S146", "S147", "S148", "S149", "S150", "S151", "S152",
      "S153", "S154", "S155", "S156", "S157", "S158", "S159", "S160",
      "S161", "S162", "S163", "S164", "S165", "S166",
    ],
  ],
  [
    TAMPINES_LEVEL_5_OUTSIDE_STUDY_LOUNGE_SEAT_PLAN,
    "Outside Study Lounge, Level 5",
    [
      "S69", "S70", "S71", "S72", "S73", "S74", "S75", "S76", "S77",
      "S78", "S79", "S80", "S81", "S82", "S83", "S84", "S85", "S86",
      "S87", "S88", "S89", "S90", "S91", "S92",
    ],
  ],
  [
    TAMPINES_LEVEL_5_SG_COLLECTION_SEAT_PLAN,
    "SG Collection, Level 5",
    [
      "S93", "S94", "S95", "S96", "S97", "S98", "S99", "S100", "S101",
      "S102", "S103", "S104", "S105", "S106", "S107", "S108", "S109",
      "S110", "S111", "S112",
    ],
  ],
  [
    TAMPINES_LEVEL_5_STUDY_AREA_SEAT_PLAN,
    "Study Area, Level 5",
    [
      "S113", "S114", "S115", "S116", "S117", "S118", "S119", "S120",
      "S121", "S122", "S123", "S124", "S125", "S126", "S127", "S128",
      "S129", "S130", "S131", "S132", "S133", "S134", "S135", "S136",
    ],
  ],
  [
    TAMPINES_LEVEL_5_STUDY_LOUNGE_SEAT_PLAN,
    "Study Lounge, Level 5",
    [
      "S29", "S30", "S31", "S32", "S33", "S34", "S35", "S36", "S37",
      "S38", "S39", "S40", "S41", "S42", "S43", "S44", "S45", "S46",
      "S47", "S48", "S49", "S50", "S51", "S52", "S53", "S54", "S55",
      "S56", "S57", "S58", "S59", "S60", "S61", "S62", "S63", "S64",
      "S65", "S66", "S67", "S68",
    ],
  ],
] as const;

function byName(definition: SeatPlanDefinition, seatName: string) {
  const result = definition.hotspots.find((hotspot) => hotspot.seatName === seatName);
  expect(result).toBeDefined();
  return result!;
}

describe("Tampines Library Level 5 seat-plan annotations", () => {
  it.each(cases)(
    "has exact complete coverage for area %s",
    (definition, _areaName, expected) => {
      expect(definition.coverage).toBe("complete");
      expect(definition.hotspots).toHaveLength(expected.length);
      expect(
        definition.hotspots
          .map(({ seatName }) => seatName)
          .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))),
      ).toEqual(expected);
      expect(new Set(definition.hotspots.map(({ seatName }) => seatName)).size).toBe(
        expected.length,
      );
    },
  );

  it.each(cases)(
    "resolves area %s against its matching synthetic catalog",
    (definition, areaName, expected) => {
      const resolution = resolveSeatPlan(
        areaFor(definition, areaName, expected),
        definition.mapPath,
        { width: definition.imageWidth, height: definition.imageHeight },
        [definition],
      );
      expect(resolution.status).toBe("ready");
      if (resolution.status === "ready") {
        expect(
          resolution.hotspots
            .map(({ seat }) => seat.name)
            .sort((a, b) => Number(a.slice(1)) - Number(b.slice(1))),
        ).toEqual(expected);
      }
    },
  );

  it("preserves the Co-Working Lounge visual groups and excludes meeting room S167", () => {
    const plan = TAMPINES_LEVEL_5_CO_WORKING_LOUNGE_SEAT_PLAN;
    expect(plan.hotspots.some(({ seatName }) => seatName === "S167")).toBe(false);
    expect(byName(plan, "S137").x).toBeLessThan(byName(plan, "S141").x);
    expect(byName(plan, "S142").y).toBeLessThan(byName(plan, "S148").y);
    expect(byName(plan, "S161").x).toBeLessThan(byName(plan, "S163").x);
    expect(byName(plan, "S164").y).toBeGreaterThan(byName(plan, "S161").y);
    expect(byName(plan, "S158").x).toBeLessThan(byName(plan, "S157").x);
    expect(byName(plan, "S160").y).toBeGreaterThan(byName(plan, "S158").y);
  });

  it("preserves paired-table ordering outside the Study Lounge", () => {
    const plan = TAMPINES_LEVEL_5_OUTSIDE_STUDY_LOUNGE_SEAT_PLAN;
    expect(byName(plan, "S69").x).toBeLessThan(byName(plan, "S70").x);
    expect(byName(plan, "S69").y).toBeLessThan(byName(plan, "S79").y);
    expect(byName(plan, "S81").y).toBeLessThan(byName(plan, "S91").y);
    expect(byName(plan, "S80").y).toBeLessThan(byName(plan, "S81").y);
  });

  it("preserves alternating top/bottom numbering in SG Collection and Study Area", () => {
    for (const plan of [
      TAMPINES_LEVEL_5_SG_COLLECTION_SEAT_PLAN,
      TAMPINES_LEVEL_5_STUDY_AREA_SEAT_PLAN,
    ]) {
      const first = Number(plan.hotspots[0].seatName.slice(1));
      expect(byName(plan, `S${first}`).y).toBeLessThan(byName(plan, `S${first + 1}`).y);
      expect(byName(plan, `S${first + 2}`).x).toBeGreaterThan(byName(plan, `S${first}`).x);
      expect(byName(plan, `S${first + 2}`).y).toBe(byName(plan, `S${first}`).y);
    }
  });

  it("preserves all four Study Lounge top-to-bottom paired blocks", () => {
    const plan = TAMPINES_LEVEL_5_STUDY_LOUNGE_SEAT_PLAN;
    for (const [first, last] of [
      [29, 38],
      [39, 48],
      [49, 58],
      [59, 68],
    ] as const) {
      expect(byName(plan, `S${first}`).x).toBeLessThan(byName(plan, `S${first + 1}`).x);
      expect(byName(plan, `S${first}`).y).toBeLessThan(byName(plan, `S${last}`).y);
    }
  });
});
