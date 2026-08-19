import type { Seat } from "./catalog";

export interface SeatHotspotBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SeatHotspotDefinition extends SeatHotspotBounds {
  seatName: string;
  expectedSeatId?: string;
}

export interface SeatPlanDefinition {
  branchId: string;
  areaId: string;
  mapPath: string;
  imageWidth: number;
  imageHeight: number;
  coverage: "partial" | "complete";
  mappingBasis?: "range-order" | "hybrid-range-order";
  hotspots: readonly SeatHotspotDefinition[];
}

export interface SeatPlanImageEvidence {
  width: number;
  height: number;
  sha256?: string;
}

export interface ResolvedSeatHotspot {
  seat: Seat;
  bounds: SeatHotspotBounds;
}

export type SeatPlanInvalidReason =
  | "ambiguous-definition"
  | "invalid-definition"
  | "image-size-mismatch"
  | "image-fingerprint-missing"
  | "image-fingerprint-mismatch"
  | "duplicate-seat"
  | "unknown-seat"
  | "ambiguous-seat"
  | "seat-id-mismatch"
  | "coverage-mismatch";

export type SeatPlanResolution =
  | { status: "unmapped" }
  | { status: "pending"; definition: SeatPlanDefinition }
  | {
      status: "ready";
      definition: SeatPlanDefinition;
      hotspots: ResolvedSeatHotspot[];
    }
  | {
      status: "invalid";
      reason: SeatPlanInvalidReason;
      definition?: SeatPlanDefinition;
    };
