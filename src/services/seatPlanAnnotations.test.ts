import { describe, expect, it } from "vitest";
import { SEAT_PLAN_DEFINITIONS } from "../data/seatPlans";
import { JURONG_LEVEL_3_ESCALATOR_SEAT_PLAN } from "../data/seatPlans/jurongLibrary";
import type { Area, Seat } from "../models/catalog";
import type { SeatPlanDefinition } from "../models/seatPlan";
import {
  resolveSeatPlan,
  selectSeatPlanPath,
} from "./seatPlanAnnotations";

function seat(name: string, id = name): Seat {
  return {
    id,
    code: "",
    name,
    disabled: false,
    availableSlots: [],
  };
}

function area(seats: Seat[]): Area {
  return {
    id: "43",
    branchId: "2",
    branchCode: "JRL",
    branchName: "Jurong Library",
    name: "Study Area Near Escalator, Level 3",
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats,
  };
}

const mapPath = "plan.png?revision=1";
const baseDefinition: SeatPlanDefinition = {
  branchId: "2",
  areaId: "43",
  mapPath,
  imageWidth: 100,
  imageHeight: 80,
  coverage: "complete",
  hotspots: [
    { seatName: "S1", x: 5, y: 10, width: 20, height: 20 },
    { seatName: "S2", x: 30, y: 10, width: 20, height: 20 },
  ],
};

describe("seat-plan annotations", () => {
  it("prefers the reviewed map instead of a neighboring observed map", () => {
    expect(
      selectSeatPlanPath(
        area([seat("S1"), seat("S2")]),
        ["neighbor-sp-full.png"],
        [baseDefinition],
      ),
    ).toBe(mapPath);
    expect(
      selectSeatPlanPath(
        { branchId: "26", id: "51" },
        ["sbpl-5-adultsection-sp-full.png"],
      ),
    ).toBe("sbpl-5-readinglounge-sp-full.png");
  });

  it("uses the observed seat plan for an unreviewed area", () => {
    expect(
      selectSeatPlanPath(area([seat("S1")]), ["floor.png", "area-sp.png"], []),
    ).toBe("area-sp.png");
  });

  it("registers every reviewed plan exactly once", () => {
    const keys = SEAT_PLAN_DEFINITIONS.map(
      (definition) =>
        `${definition.branchId}:${definition.areaId}:${definition.mapPath}`,
    );

    expect(SEAT_PLAN_DEFINITIONS).toHaveLength(83);
    expect(new Set(keys).size).toBe(83);
    expect(
      SEAT_PLAN_DEFINITIONS.reduce(
        (total, definition) => total + definition.hotspots.length,
        0,
      ),
    ).toBe(2080);
  });

  it("resolves verified hotspots to current catalog seats", () => {
    const resolution = resolveSeatPlan(
      area([seat("S1", "1"), seat("S2", "2")]),
      `/seatbooking/img/areas/${mapPath}`,
      { width: 100, height: 80 },
      [baseDefinition],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(resolution.hotspots.map((hotspot) => hotspot.seat.id)).toEqual([
        "1",
        "2",
      ]);
    }
  });

  it("requires an exact map revision and image size", () => {
    expect(
      resolveSeatPlan(
        area([seat("S1"), seat("S2")]),
        "plan.png?revision=2",
        { width: 100, height: 80 },
        [baseDefinition],
      ).status,
    ).toBe("unmapped");
    expect(
      resolveSeatPlan(
        area([seat("S1"), seat("S2")]),
        mapPath,
        { width: 101, height: 80 },
        [baseDefinition],
      ),
    ).toMatchObject({
      status: "invalid",
      reason: "image-size-mismatch",
    });
  });

  it("requires a matching fingerprint when image evidence includes one", () => {
    const key = `2:43:${mapPath}`;
    const matchingFingerprint = "a".repeat(64);
    expect(
      resolveSeatPlan(
        area([seat("S1"), seat("S2")]),
        mapPath,
        { width: 100, height: 80, sha256: matchingFingerprint },
        [baseDefinition],
        { [key]: matchingFingerprint },
      ).status,
    ).toBe("ready");
    expect(
      resolveSeatPlan(
        area([seat("S1"), seat("S2")]),
        mapPath,
        { width: 100, height: 80, sha256: "b".repeat(64) },
        [baseDefinition],
        { [key]: matchingFingerprint },
      ),
    ).toMatchObject({
      status: "invalid",
      reason: "image-fingerprint-mismatch",
    });
    expect(
      resolveSeatPlan(
        area([seat("S1"), seat("S2")]),
        mapPath,
        { width: 100, height: 80, sha256: matchingFingerprint },
        [baseDefinition],
        {},
      ),
    ).toMatchObject({
      status: "invalid",
      reason: "image-fingerprint-missing",
    });
  });

  it("rejects duplicate, overlapping, and out-of-bounds hotspots", () => {
    expect(
      resolveSeatPlan(
        area([seat("S1")]),
        mapPath,
        { width: 100, height: 80 },
        [
          {
            ...baseDefinition,
            hotspots: [
              baseDefinition.hotspots[0],
              {
                ...baseDefinition.hotspots[0],
                x: 60,
              },
            ],
          },
        ],
      ),
    ).toMatchObject({ status: "invalid", reason: "duplicate-seat" });
    expect(
      resolveSeatPlan(
        area([seat("S1"), seat("S2")]),
        mapPath,
        { width: 100, height: 80 },
        [
          {
            ...baseDefinition,
            hotspots: [
              baseDefinition.hotspots[0],
              { seatName: "S2", x: 20, y: 20, width: 20, height: 20 },
            ],
          },
        ],
      ),
    ).toMatchObject({ status: "invalid", reason: "invalid-definition" });
    expect(
      resolveSeatPlan(
        area([seat("S1")]),
        mapPath,
        { width: 100, height: 80 },
        [
          {
            ...baseDefinition,
            coverage: "partial",
            hotspots: [
              { seatName: "S1", x: 90, y: 10, width: 20, height: 20 },
            ],
          },
        ],
      ),
    ).toMatchObject({ status: "invalid", reason: "invalid-definition" });
  });

  it("rejects missing, ambiguous, and changed seat identities", () => {
    expect(
      resolveSeatPlan(
        area([seat("S1")]),
        mapPath,
        { width: 100, height: 80 },
        [baseDefinition],
      ),
    ).toMatchObject({ status: "invalid", reason: "unknown-seat" });
    expect(
      resolveSeatPlan(
        area([seat("S1", "1"), seat("S1", "2"), seat("S2", "3")]),
        mapPath,
        { width: 100, height: 80 },
        [baseDefinition],
      ),
    ).toMatchObject({ status: "invalid", reason: "ambiguous-seat" });
    expect(
      resolveSeatPlan(
        area([seat("S1", "changed")]),
        mapPath,
        { width: 100, height: 80 },
        [
          {
            ...baseDefinition,
            coverage: "partial",
            hotspots: [
              {
                ...baseDefinition.hotspots[0],
                expectedSeatId: "original",
              },
            ],
          },
        ],
      ),
    ).toMatchObject({ status: "invalid", reason: "seat-id-mismatch" });
  });

  it("allows intentionally partial maps but verifies complete coverage", () => {
    expect(
      resolveSeatPlan(
        area([seat("S1"), seat("S2")]),
        mapPath,
        { width: 100, height: 80 },
        [
          {
            ...baseDefinition,
            coverage: "partial",
            hotspots: [baseDefinition.hotspots[0]],
          },
        ],
      ).status,
    ).toBe("ready");
    expect(
      resolveSeatPlan(
        area([seat("S1"), seat("S2"), seat("S3")]),
        mapPath,
        { width: 100, height: 80 },
        [baseDefinition],
      ),
    ).toMatchObject({ status: "invalid", reason: "coverage-mismatch" });
  });

  it("rejects ambiguous definitions", () => {
    expect(
      resolveSeatPlan(
        area([seat("S1"), seat("S2")]),
        mapPath,
        { width: 100, height: 80 },
        [baseDefinition, { ...baseDefinition }],
      ),
    ).toMatchObject({ status: "invalid", reason: "ambiguous-definition" });
  });

  it("validates the complete Jurong Level 3 escalator map", () => {
    const seats = Array.from({ length: 30 }, (_, index) =>
      seat(`S${359 + index}`, String(723 + index)),
    );
    const resolution = resolveSeatPlan(
      area(seats),
      JURONG_LEVEL_3_ESCALATOR_SEAT_PLAN.mapPath,
      { width: 1824, height: 1208 },
      [JURONG_LEVEL_3_ESCALATOR_SEAT_PLAN],
    );

    expect(resolution.status).toBe("ready");
    if (resolution.status === "ready") {
      expect(resolution.hotspots).toHaveLength(30);
      expect(resolution.hotspots.map((hotspot) => hotspot.seat.name)).toEqual(
        seats.map((catalogSeat) => catalogSeat.name),
      );
    }
  });
});
