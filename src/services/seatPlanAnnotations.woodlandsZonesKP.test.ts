import { describe, expect, it } from "vitest";
import {
  WOODLANDS_LEVEL_3_ZONE_K_SEAT_PLAN,
  WOODLANDS_LEVEL_3_ZONE_L_SEAT_PLAN,
  WOODLANDS_LEVEL_3_ZONE_M_SEAT_PLAN,
  WOODLANDS_LEVEL_3_ZONE_N_SEAT_PLAN,
  WOODLANDS_LEVEL_3_ZONE_P_SEAT_PLAN,
  WOODLANDS_LIBRARY_ZONES_KP_SEAT_PLANS,
} from "../data/seatPlans/woodlandsLibraryZonesKP";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const ZONE_K_SEATS = [
  "S171", "S172", "S173", "S174", "S175", "S176", "S177", "S178",
  "S179", "S180", "S181", "S182", "S183", "S184", "S185", "S186",
  "S187", "S188", "S189", "S190", "S191", "S192", "S193", "S194",
  "S195", "S196", "S197", "S198", "S199", "S200",
] as const;

const ZONE_L_SEATS = [
  "S201", "S202", "S203", "S204", "S205", "S206", "S207", "S208",
  "S209", "S210", "S211", "S212", "S213", "S214", "S215", "S216",
  "S217", "S218", "S219", "S220", "S221", "S222", "S223", "S224",
  "S225", "S226", "S227", "S228", "S229", "S230", "S231", "S232",
  "S233", "S234",
] as const;

const ZONE_M_SEATS = [
  "S235", "S236", "S237", "S238", "S239", "S240", "S241", "S242",
  "S243", "S244", "S245", "S246", "S247", "S248", "S249", "S250",
  "S251", "S252", "S253", "S254", "S255", "S256", "S257", "S258",
  "S259", "S260", "S261", "S262", "S263", "S264", "S265", "S266",
  "S267", "S268", "S269", "S270", "S271", "S272", "S273", "S274",
  "S275", "S276", "S277", "S278", "S279", "S280", "S281", "S282",
] as const;

const ZONE_N_SEATS = [
  "S283", "S284", "S285", "S286", "S287", "S288", "S289", "S290",
  "S291", "S292", "S293", "S294", "S295", "S296", "S297", "S298",
] as const;

const ZONE_P_SEATS = [
  "S299", "S300", "S301", "S302", "S303",
  "S304", "S305", "S306", "S307", "S308",
] as const;

function seat(name: string, index: number): Seat {
  return {
    id: `woodlands-seat-${name}-${index + 1}`,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function area(areaId: string, name: string, seats: Seat[]): Area {
  return {
    id: areaId,
    branchId: "31",
    branchCode: "WRL",
    branchName: "Woodlands Library",
    name,
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats,
  };
}

function hotspot(definition: SeatPlanDefinition, seatName: string) {
  const match = definition.hotspots.find(
    (candidate) => candidate.seatName === seatName,
  );
  expect(match).toBeDefined();
  return match!;
}

function expectIncreasingX(
  definition: SeatPlanDefinition,
  seatNames: readonly string[],
) {
  const positions = seatNames.map((seatName) => hotspot(definition, seatName).x);
  expect(positions).toEqual([...positions].sort((left, right) => left - right));
}

const CASES = [
  {
    definition: WOODLANDS_LEVEL_3_ZONE_K_SEAT_PLAN,
    areaName: "Work & Study Zone K, Level 3",
    expectedSeats: ZONE_K_SEATS,
    imageSize: { width: 1039, height: 564 },
  },
  {
    definition: WOODLANDS_LEVEL_3_ZONE_L_SEAT_PLAN,
    areaName: "Work & Study Zone L, Level 3",
    expectedSeats: ZONE_L_SEATS,
    imageSize: { width: 980, height: 532 },
  },
  {
    definition: WOODLANDS_LEVEL_3_ZONE_M_SEAT_PLAN,
    areaName: "Work & Study Zone M, Level 3",
    expectedSeats: ZONE_M_SEATS,
    imageSize: { width: 1040, height: 531 },
  },
  {
    definition: WOODLANDS_LEVEL_3_ZONE_N_SEAT_PLAN,
    areaName: "Work & Study Zone N, Level 3",
    expectedSeats: ZONE_N_SEATS,
    imageSize: { width: 1004, height: 494 },
  },
  {
    definition: WOODLANDS_LEVEL_3_ZONE_P_SEAT_PLAN,
    areaName: "Work & Study Zone P, Level 3",
    expectedSeats: ZONE_P_SEATS,
    imageSize: { width: 786, height: 486 },
  },
] as const;

describe("Woodlands Library Zones K through P seat-plan annotations", () => {
  it.each(CASES)(
    "provides complete exact coverage for $areaName",
    ({ definition, areaName, expectedSeats, imageSize }) => {
      const hotspotNames = definition.hotspots.map(
        (candidate) => candidate.seatName,
      );

      expect(definition.coverage).toBe("complete");
      expect(hotspotNames).toHaveLength(expectedSeats.length);
      expect(hotspotNames).toEqual(expectedSeats);
      expect(new Set(hotspotNames).size).toBe(expectedSeats.length);

      const resolution = resolveSeatPlan(
        area(definition.areaId, areaName, expectedSeats.map(seat)),
        definition.mapPath,
        imageSize,
        WOODLANDS_LIBRARY_ZONES_KP_SEAT_PLANS,
      );

      expect(resolution.status).toBe("ready");
      if (resolution.status === "ready") {
        expect(resolution.hotspots).toHaveLength(expectedSeats.length);
        expect(
          resolution.hotspots.map((candidate) => candidate.seat.name),
        ).toEqual(expectedSeats);
      }
    },
  );

  it("preserves Zone K's four visible left-to-right rows", () => {
    expectIncreasingX(WOODLANDS_LEVEL_3_ZONE_K_SEAT_PLAN, ZONE_K_SEATS.slice(0, 10));
    expectIncreasingX(WOODLANDS_LEVEL_3_ZONE_K_SEAT_PLAN, ZONE_K_SEATS.slice(10, 16));
    expectIncreasingX(WOODLANDS_LEVEL_3_ZONE_K_SEAT_PLAN, ZONE_K_SEATS.slice(16, 23));
    expectIncreasingX(WOODLANDS_LEVEL_3_ZONE_K_SEAT_PLAN, ZONE_K_SEATS.slice(23));

    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_K_SEAT_PLAN, "S171").x).toBe(30);
    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_K_SEAT_PLAN, "S200").x).toBe(931);
  });

  it("preserves Zone L's alternating table-side rows", () => {
    for (const row of [
      ZONE_L_SEATS.slice(0, 10),
      ZONE_L_SEATS.slice(10, 16),
      ZONE_L_SEATS.slice(16, 22),
      ZONE_L_SEATS.slice(22, 28),
      ZONE_L_SEATS.slice(28),
    ]) {
      expectIncreasingX(WOODLANDS_LEVEL_3_ZONE_L_SEAT_PLAN, row);
    }

    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_L_SEAT_PLAN, "S201").y).toBeLessThan(
      hotspot(WOODLANDS_LEVEL_3_ZONE_L_SEAT_PLAN, "S211").y,
    );
    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_L_SEAT_PLAN, "S229").y).toBeGreaterThan(
      hotspot(WOODLANDS_LEVEL_3_ZONE_L_SEAT_PLAN, "S223").y,
    );
  });

  it("preserves Zone M's table groups and generated-range endpoints", () => {
    for (const row of [
      ["S235", "S236", "S237", "S238", "S239", "S240"],
      ["S241", "S242", "S243", "S244", "S245", "S246"],
      ["S247", "S248", "S249", "S250", "S251", "S252"],
      ["S253", "S254", "S255", "S256", "S257", "S258"],
      ["S259", "S260"], ["S261", "S262"], ["S263", "S264"],
      ["S265", "S266"], ["S267", "S268"], ["S269", "S270"],
      ["S271", "S272"], ["S273", "S274"], ["S275", "S276"],
      ["S277", "S278"], ["S279", "S280"], ["S281", "S282"],
    ] as const) {
      expectIncreasingX(WOODLANDS_LEVEL_3_ZONE_M_SEAT_PLAN, row);
    }

    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_M_SEAT_PLAN, "S235")).toMatchObject({
      x: 27,
      y: 130,
    });
    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_M_SEAT_PLAN, "S282")).toMatchObject({
      x: 924,
      y: 439,
    });
    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_M_SEAT_PLAN, "S243")).toMatchObject({
      x: 148,
      y: 248,
    });
    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_M_SEAT_PLAN, "S244")).toMatchObject({
      x: 203,
      y: 248,
    });
    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_M_SEAT_PLAN, "S255")).toMatchObject({
      x: 149,
      y: 439,
    });
    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_M_SEAT_PLAN, "S256")).toMatchObject({
      x: 204,
      y: 439,
    });
  });

  it("preserves Zone N's left/right pairs and top-to-bottom direction", () => {
    for (const [topLeft, topRight, bottomLeft, bottomRight] of [
      ["S283", "S284", "S285", "S286"],
      ["S287", "S288", "S289", "S290"],
      ["S291", "S292", "S293", "S294"],
      ["S295", "S296", "S297", "S298"],
    ] as const) {
      expect(hotspot(WOODLANDS_LEVEL_3_ZONE_N_SEAT_PLAN, topLeft).x).toBeLessThan(
        hotspot(WOODLANDS_LEVEL_3_ZONE_N_SEAT_PLAN, topRight).x,
      );
      expect(hotspot(WOODLANDS_LEVEL_3_ZONE_N_SEAT_PLAN, bottomLeft).x).toBeLessThan(
        hotspot(WOODLANDS_LEVEL_3_ZONE_N_SEAT_PLAN, bottomRight).x,
      );
      expect(hotspot(WOODLANDS_LEVEL_3_ZONE_N_SEAT_PLAN, bottomLeft).y).toBeGreaterThan(
        hotspot(WOODLANDS_LEVEL_3_ZONE_N_SEAT_PLAN, topLeft).y,
      );
    }
  });

  it("preserves Zone P's left-to-right sequence and keeps S308 above the icon", () => {
    expectIncreasingX(WOODLANDS_LEVEL_3_ZONE_P_SEAT_PLAN, ZONE_P_SEATS);
    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_P_SEAT_PLAN, "S299").x).toBe(62);
    expect(hotspot(WOODLANDS_LEVEL_3_ZONE_P_SEAT_PLAN, "S308").x).toBe(659);

    const s308 = hotspot(WOODLANDS_LEVEL_3_ZONE_P_SEAT_PLAN, "S308");
    expect(s308.y + s308.height).toBeLessThanOrEqual(171);
  });
});
