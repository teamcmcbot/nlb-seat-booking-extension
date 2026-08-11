import { describe, expect, it } from "vitest";
import { JURONG_LEVEL_3_CHINESE_COLLECTION_SEAT_PLAN } from "../data/seatPlans/jurongChineseCollection";
import { JURONG_LEVEL_2_ENGLISH_NON_FICTION_SEAT_PLAN } from "../data/seatPlans/jurongEnglishNonFiction";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const ascendingNames = (first: number, last: number) =>
  Array.from({ length: last - first + 1 }, (_, index) => `S${first + index}`);

const descendingNames = (first: number, last: number) =>
  Array.from({ length: first - last + 1 }, (_, index) => `S${first - index}`);

function seat(name: string): Seat {
  return {
    id: `jurong-range-${name}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function areaFor(
  definition: SeatPlanDefinition,
  name: string,
  seatNames: readonly string[],
): Area {
  return {
    id: definition.areaId,
    branchId: definition.branchId,
    branchCode: "JRL",
    branchName: "Jurong Library",
    name,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats: seatNames.map(seat),
  };
}

function expectValidGeometry(definition: SeatPlanDefinition) {
  for (const [index, current] of definition.hotspots.entries()) {
    expect(current.x).toBeGreaterThanOrEqual(0);
    expect(current.y).toBeGreaterThanOrEqual(0);
    expect(current.width).toBeGreaterThan(0);
    expect(current.height).toBeGreaterThan(0);
    expect(current.x + current.width).toBeLessThanOrEqual(definition.imageWidth);
    expect(current.y + current.height).toBeLessThanOrEqual(definition.imageHeight);

    for (const other of definition.hotspots.slice(index + 1)) {
      const overlaps =
        current.x < other.x + other.width &&
        current.x + current.width > other.x &&
        current.y < other.y + other.height &&
        current.y + current.height > other.y;
      expect(overlaps, `${current.seatName} overlaps ${other.seatName}`).toBe(false);
    }
  }
}

describe("Jurong range and hybrid seat-plan annotations", () => {
  it("maps the English Non-Fiction range S92 to S53 from left to right", () => {
    const definition = JURONG_LEVEL_2_ENGLISH_NON_FICTION_SEAT_PLAN;
    const expected = descendingNames(92, 53);

    expect(definition).toMatchObject({
      branchId: "2",
      areaId: "41",
      mapPath: "jrl-2-englishnonfiction-sp-full.png",
      imageWidth: 1034,
      imageHeight: 308,
      coverage: "complete",
      mappingBasis: "range-order",
    });
    expect(definition.hotspots.map(({ seatName }) => seatName)).toEqual(expected);
    expect(definition.hotspots[0]).toMatchObject({ seatName: "S92", x: 22 });
    expect(definition.hotspots[19]).toMatchObject({ seatName: "S73", x: 495 });
    expect(definition.hotspots.at(-1)).toMatchObject({ seatName: "S53", x: 994 });
    expectValidGeometry(definition);

    expect(
      resolveSeatPlan(
        areaFor(definition, "English Non-Fiction, Level 2", expected),
        definition.mapPath,
        { width: definition.imageWidth, height: definition.imageHeight },
        [definition],
      ).status,
    ).toBe("ready");
  });

  it("combines labelled S291-S308 with the inferred S358-S309 range", () => {
    const definition = JURONG_LEVEL_3_CHINESE_COLLECTION_SEAT_PLAN;
    const expected = ascendingNames(291, 358);
    const hotspotNames = definition.hotspots.map(({ seatName }) => seatName);

    expect(definition).toMatchObject({
      branchId: "2",
      areaId: "42",
      mapPath: "jrl-3-chinesecollection-sp-full.png?t=20221130",
      imageWidth: 1988,
      imageHeight: 1141,
      coverage: "complete",
      mappingBasis: "hybrid-range-order",
    });
    expect(definition.hotspots).toHaveLength(68);
    expect(new Set(hotspotNames)).toEqual(new Set(expected));
    expect(definition.hotspots.slice(0, 18).map(({ seatName }) => seatName)).toEqual(
      ascendingNames(291, 308),
    );
    expect(definition.hotspots.slice(18).map(({ seatName }) => seatName)).toEqual(
      descendingNames(358, 309),
    );
    expect(definition.hotspots[18]).toMatchObject({ seatName: "S358", x: 17 });
    expect(definition.hotspots[48]).toMatchObject({ seatName: "S328", x: 1185 });
    expect(definition.hotspots.at(-1)).toMatchObject({ seatName: "S309", x: 1924 });
    expect(definition.hotspots.slice(18).every(({ y, height }) => y === 925 && height === 166))
      .toBe(true);
    expectValidGeometry(definition);

    expect(
      resolveSeatPlan(
        areaFor(definition, "Chinese Collection, Level 3", expected),
        definition.mapPath,
        { width: definition.imageWidth, height: definition.imageHeight },
        [definition],
      ).status,
    ).toBe("ready");
  });
});
