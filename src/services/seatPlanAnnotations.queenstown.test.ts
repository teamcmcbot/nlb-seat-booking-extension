import { describe, expect, it } from "vitest";
import {
  QUEENSTOWN_LEVEL_2_QUIET_READING_ROOM_SEAT_PLAN,
  QUEENSTOWN_LEVEL_2_SINGAPORE_COLLECTION_SEAT_PLAN,
  QUEENSTOWN_LIBRARY_SEAT_PLANS,
} from "../data/seatPlans/queenstownLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import { resolveSeatPlan } from "./seatPlanAnnotations";

const names = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, index) => `S${start + index}`);

function hotspot(plan: SeatPlanDefinition, seatName: string) {
  const match = plan.hotspots.find((candidate) => candidate.seatName === seatName);
  expect(match).toBeDefined();
  return match!;
}

function area(plan: SeatPlanDefinition): Area {
  const seats: Seat[] = plan.hotspots.map(({ seatName }) => ({
    id: `queenstown-${seatName}`,
    code: "",
    name: seatName,
    disabled: false,
    availableSlots: [],
  }));
  return {
    id: plan.areaId,
    branchId: plan.branchId,
    branchCode: "QUPL",
    branchName: "Queenstown Public Library",
    name: "Level 2 seat area",
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats,
  };
}

describe("Queenstown Public Library seat-plan annotations", () => {
  it.each([
    [QUEENSTOWN_LEVEL_2_QUIET_READING_ROOM_SEAT_PLAN, "49", "qupl-2-quietreading-sp-full.png", 3832, 703, names(31, 50)],
    [QUEENSTOWN_LEVEL_2_SINGAPORE_COLLECTION_SEAT_PLAN, "48", "qupl-2-singaporecollection-sp-full.png", 4246, 691, names(1, 30)],
  ])("identifies area %s with its exact complete seat set", (plan, areaId, mapPath, width, height, expected) => {
    expect(plan).toMatchObject({ branchId: "25", areaId, mapPath, imageWidth: width, imageHeight: height, coverage: "complete" });
    expect(plan.hotspots).toHaveLength(expected.length);
    expect(new Set(plan.hotspots.map(({ seatName }) => seatName))).toEqual(new Set(expected));
  });

  it.each(QUEENSTOWN_LIBRARY_SEAT_PLANS)("keeps $mapPath hotspots in bounds and non-overlapping", (plan) => {
    for (const [index, current] of plan.hotspots.entries()) {
      expect(current.x).toBeGreaterThanOrEqual(0);
      expect(current.y).toBeGreaterThanOrEqual(0);
      expect(current.width).toBeGreaterThan(0);
      expect(current.height).toBeGreaterThan(0);
      expect(current.x + current.width).toBeLessThanOrEqual(plan.imageWidth);
      expect(current.y + current.height).toBeLessThanOrEqual(plan.imageHeight);
      for (const candidate of plan.hotspots.slice(index + 1)) {
        expect(current.x + current.width <= candidate.x || candidate.x + candidate.width <= current.x || current.y + current.height <= candidate.y || candidate.y + candidate.height <= current.y).toBe(true);
      }
    }
  });

  it("preserves the quiet-room singles and paired-table directions", () => {
    const plan = QUEENSTOWN_LEVEL_2_QUIET_READING_ROOM_SEAT_PLAN;
    expect(["S50", "S49", "S48", "S47"].map((name) => hotspot(plan, name).x)).toEqual([130, 502, 877, 1251]);
    expect(hotspot(plan, "S46").y).toBeLessThan(hotspot(plan, "S45").y);
    expect(hotspot(plan, "S31").y).toBeLessThan(hotspot(plan, "S32").y);
  });

  it("preserves Singapore Collection table ordering and endpoints", () => {
    const plan = QUEENSTOWN_LEVEL_2_SINGAPORE_COLLECTION_SEAT_PLAN;
    expect(hotspot(plan, "S30")).toMatchObject({ x: 20, y: 20 });
    expect(hotspot(plan, "S27").x).toBeGreaterThan(hotspot(plan, "S30").x);
    expect(hotspot(plan, "S29").y).toBeGreaterThan(hotspot(plan, "S30").y);
    expect(hotspot(plan, "S2").x).toBeLessThan(hotspot(plan, "S1").x);
  });

  it.each(QUEENSTOWN_LIBRARY_SEAT_PLANS)("resolves $mapPath as ready", (plan) => {
    const resolution = resolveSeatPlan(area(plan), plan.mapPath, { width: plan.imageWidth, height: plan.imageHeight }, [plan]);
    expect(resolution.status).toBe("ready");
  });
});
