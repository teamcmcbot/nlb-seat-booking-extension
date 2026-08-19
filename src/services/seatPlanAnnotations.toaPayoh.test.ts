import { describe, expect, it } from "vitest";
import {
  TOA_PAYOH_LEVEL_2_BESIDE_SEATING_AREA_SEAT_PLAN,
  TOA_PAYOH_LEVEL_2_ENGLISH_FICTION_SEAT_PLAN,
  TOA_PAYOH_LEVEL_2_MAGAZINE_LOUNGE_SEAT_PLAN,
  TOA_PAYOH_LEVEL_2_NEAR_LIFT_LOBBY_SEAT_PLAN,
  TOA_PAYOH_LEVEL_2_NEAR_MULTIMEDIA_STATIONS_SEAT_PLAN,
  TOA_PAYOH_LEVEL_3_AUDIO_VISUAL_COLLECTION_SEAT_PLAN,
} from "../data/seatPlans/toaPayohLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

function seatNames(first: number, last: number): string[] {
  return Array.from({ length: last - first + 1 }, (_, index) => `S${first + index}`);
}

function seat(name: string): Seat {
  return {
    id: `toa-payoh-${name}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function areaFor(
  definition: SeatPlanDefinition,
  areaName: string,
  expectedSeatNames: readonly string[],
): Area {
  return {
    id: definition.areaId,
    branchId: definition.branchId,
    branchCode: "TPPL",
    branchName: "Toa Payoh Library",
    name: areaName,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: expectedSeatNames.map(seat),
  };
}

function hotspot(definition: SeatPlanDefinition, seatName: string) {
  const result = definition.hotspots.find(
    (candidate) => candidate.seatName === seatName,
  );
  expect(result).toBeDefined();
  return result!;
}

const cases: readonly {
  label: string;
  areaName: string;
  definition: SeatPlanDefinition;
  expectedSeatNames: readonly string[];
}[] = [
  {
    label: "Audio Visual Collection",
    areaName: "Audio Visual Collection, Level 3",
    definition: TOA_PAYOH_LEVEL_3_AUDIO_VISUAL_COLLECTION_SEAT_PLAN,
    expectedSeatNames: seatNames(49, 60),
  },
  {
    label: "Beside Seating Area",
    areaName: "Beside Seating Area, Level 2",
    definition: TOA_PAYOH_LEVEL_2_BESIDE_SEATING_AREA_SEAT_PLAN,
    expectedSeatNames: seatNames(23, 44),
  },
  {
    label: "English Fiction",
    areaName: "English Fiction, Level 2",
    definition: TOA_PAYOH_LEVEL_2_ENGLISH_FICTION_SEAT_PLAN,
    expectedSeatNames: seatNames(1, 12),
  },
  {
    label: "Magazine Lounge",
    areaName: "Magazine Lounge, Level 2",
    definition: TOA_PAYOH_LEVEL_2_MAGAZINE_LOUNGE_SEAT_PLAN,
    expectedSeatNames: [
      "S48A", "S48B", "S48C", "S48D", "S48E",
      "S48F", "S48G", "S48H", "S48I", "S48J",
      "S48K", "S48L", "S48M", "S48N", "S48O",
    ],
  },
  {
    label: "Near Lift Lobby",
    areaName: "Near Lift Lobby, Level 2",
    definition: TOA_PAYOH_LEVEL_2_NEAR_LIFT_LOBBY_SEAT_PLAN,
    expectedSeatNames: seatNames(45, 48),
  },
  {
    label: "Near Multimedia Stations",
    areaName: "Near Multimedia Stations, Level 2",
    definition: TOA_PAYOH_LEVEL_2_NEAR_MULTIMEDIA_STATIONS_SEAT_PLAN,
    expectedSeatNames: seatNames(13, 22),
  },
];

describe("Toa Payoh Library seat-plan annotations", () => {
  it.each(cases)("has exact complete coverage for $label", (testCase) => {
    const actualNames = testCase.definition.hotspots.map(({ seatName }) => seatName);

    expect(testCase.definition.coverage).toBe("complete");
    expect(actualNames).toHaveLength(testCase.expectedSeatNames.length);
    expect(new Set(actualNames)).toEqual(new Set(testCase.expectedSeatNames));
  });

  it.each(cases)("has in-bounds, non-overlapping hotspots for $label", (testCase) => {
    const { definition } = testCase;

    for (const [index, hotspotA] of definition.hotspots.entries()) {
      expect(hotspotA.x).toBeGreaterThanOrEqual(0);
      expect(hotspotA.y).toBeGreaterThanOrEqual(0);
      expect(hotspotA.x + hotspotA.width).toBeLessThanOrEqual(definition.imageWidth);
      expect(hotspotA.y + hotspotA.height).toBeLessThanOrEqual(definition.imageHeight);

      for (const hotspotB of definition.hotspots.slice(index + 1)) {
        const overlaps =
          hotspotA.x < hotspotB.x + hotspotB.width &&
          hotspotA.x + hotspotA.width > hotspotB.x &&
          hotspotA.y < hotspotB.y + hotspotB.height &&
          hotspotA.y + hotspotA.height > hotspotB.y;
        expect(overlaps, `${hotspotA.seatName} overlaps ${hotspotB.seatName}`).toBe(false);
      }
    }
  });

  it.each(cases)("resolves $label against its matching area", (testCase) => {
    const resolution = resolveSeatPlan(
      areaFor(testCase.definition, testCase.areaName, testCase.expectedSeatNames),
      testCase.definition.mapPath,
      {
        width: testCase.definition.imageWidth,
        height: testCase.definition.imageHeight,
      },
      [testCase.definition],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(new Set(resolution.hotspots.map(({ seat: resolvedSeat }) => resolvedSeat.name))).toEqual(
        new Set(testCase.expectedSeatNames),
      );
    }
  });

  it("preserves odd-above and even-below table ordering", () => {
    const definitions = [
      TOA_PAYOH_LEVEL_3_AUDIO_VISUAL_COLLECTION_SEAT_PLAN,
      TOA_PAYOH_LEVEL_2_BESIDE_SEATING_AREA_SEAT_PLAN,
      TOA_PAYOH_LEVEL_2_ENGLISH_FICTION_SEAT_PLAN,
    ];

    for (const definition of definitions) {
      for (const top of definition.hotspots.filter(({ seatName }) => Number(seatName.slice(1)) % 2 === 1)) {
        const bottom = hotspot(definition, `S${Number(top.seatName.slice(1)) + 1}`);
        expect(bottom.x).toBe(top.x);
        expect(bottom.y).toBeGreaterThan(top.y);
      }
    }
  });

  it("keeps Magazine Lounge labels ordered S48A through S48O left-to-right", () => {
    const hotspots = TOA_PAYOH_LEVEL_2_MAGAZINE_LOUNGE_SEAT_PLAN.hotspots;
    expect(hotspots.map(({ seatName }) => seatName)).toEqual(cases[3].expectedSeatNames);
    expect(hotspot(TOA_PAYOH_LEVEL_2_MAGAZINE_LOUNGE_SEAT_PLAN, "S48A")).toMatchObject({ x: 95, y: 234 });
    expect(hotspot(TOA_PAYOH_LEVEL_2_MAGAZINE_LOUNGE_SEAT_PLAN, "S48O")).toMatchObject({ x: 1104, y: 234 });
  });

  it("preserves Near Lift Lobby positions around the table", () => {
    const definition = TOA_PAYOH_LEVEL_2_NEAR_LIFT_LOBBY_SEAT_PLAN;
    expect(hotspot(definition, "S45")).toMatchObject({ x: 164, y: 194 });
    expect(hotspot(definition, "S46")).toMatchObject({ x: 164, y: 408 });
    expect(hotspot(definition, "S47")).toMatchObject({ x: 278, y: 194 });
    expect(hotspot(definition, "S48")).toMatchObject({ x: 278, y: 408 });
  });

  it("preserves descending Near Multimedia Stations rows", () => {
    const definition = TOA_PAYOH_LEVEL_2_NEAR_MULTIMEDIA_STATIONS_SEAT_PLAN;
    const left = ["S21", "S19", "S17", "S15", "S13"];
    const right = ["S22", "S20", "S18", "S16", "S14"];

    expect(definition.hotspots.filter((_, index) => index % 2 === 0).map(({ seatName }) => seatName)).toEqual(left);
    expect(definition.hotspots.filter((_, index) => index % 2 === 1).map(({ seatName }) => seatName)).toEqual(right);
    for (let index = 0; index < left.length; index += 1) {
      expect(hotspot(definition, right[index]).y).toBe(hotspot(definition, left[index]).y);
      expect(hotspot(definition, right[index]).x).toBeGreaterThan(hotspot(definition, left[index]).x);
    }
  });
});
