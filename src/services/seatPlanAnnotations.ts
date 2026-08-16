import { SEAT_PLAN_DEFINITIONS } from "../data/seatPlans";
import { SEAT_PLAN_FINGERPRINTS } from "../data/seatPlanFingerprints";
import type { Area } from "../models/catalog";
import type {
  ResolvedSeatHotspot,
  SeatPlanDefinition,
  SeatPlanImageEvidence,
  SeatPlanInvalidReason,
  SeatPlanResolution,
} from "../models/seatPlan";

function mapPathKey(path: string) {
  return path
    .trim()
    .replace(/^\/+/, "")
    .replace(/^seatbooking\/img\/areas\//, "");
}

function fingerprintKey(definition: SeatPlanDefinition) {
  return `${definition.branchId}:${definition.areaId}:${mapPathKey(definition.mapPath)}`;
}

export function selectSeatPlanPath(
  area: Pick<Area, "branchId" | "id">,
  observedPaths: readonly string[],
  definitions: readonly SeatPlanDefinition[] = SEAT_PLAN_DEFINITIONS,
) {
  const reviewedDefinitions = definitions.filter(
    (definition) =>
      definition.branchId === area.branchId && definition.areaId === area.id,
  );
  const observedReviewedDefinitions = reviewedDefinitions.filter((definition) =>
    observedPaths.some(
      (path) => mapPathKey(path) === mapPathKey(definition.mapPath),
    ),
  );

  if (observedReviewedDefinitions.length === 1) {
    return observedReviewedDefinitions[0].mapPath;
  }

  if (reviewedDefinitions.length === 1) {
    return reviewedDefinitions[0].mapPath;
  }

  return (
    observedPaths.find((path) => path.toLowerCase().includes("-sp")) ??
    observedPaths[1] ??
    observedPaths[0]
  );
}

function invalid(
  reason: SeatPlanInvalidReason,
  definition?: SeatPlanDefinition,
): SeatPlanResolution {
  return { status: "invalid", reason, definition };
}

function validBounds(definition: SeatPlanDefinition) {
  if (
    !Number.isInteger(definition.imageWidth) ||
    !Number.isInteger(definition.imageHeight) ||
    definition.imageWidth <= 0 ||
    definition.imageHeight <= 0 ||
    definition.hotspots.length === 0
  ) {
    return false;
  }

  const validHotspots = definition.hotspots.every((hotspot) => {
    const values = [hotspot.x, hotspot.y, hotspot.width, hotspot.height];
    return (
      values.every(Number.isFinite) &&
      hotspot.seatName.trim().length > 0 &&
      hotspot.x >= 0 &&
      hotspot.y >= 0 &&
      hotspot.width > 0 &&
      hotspot.height > 0 &&
      hotspot.x + hotspot.width <= definition.imageWidth &&
      hotspot.y + hotspot.height <= definition.imageHeight
    );
  });

  if (!validHotspots) {
    return false;
  }

  return definition.hotspots.every((hotspot, index) =>
    definition.hotspots.slice(index + 1).every(
      (candidate) =>
        hotspot.x + hotspot.width <= candidate.x ||
        candidate.x + candidate.width <= hotspot.x ||
        hotspot.y + hotspot.height <= candidate.y ||
        candidate.y + candidate.height <= hotspot.y,
    ),
  );
}

export function resolveSeatPlan(
  area: Area,
  mapPath: string,
  imageEvidence?: SeatPlanImageEvidence,
  definitions: readonly SeatPlanDefinition[] = SEAT_PLAN_DEFINITIONS,
  fingerprints: Readonly<Record<string, string>> = SEAT_PLAN_FINGERPRINTS,
): SeatPlanResolution {
  const wantedPath = mapPathKey(mapPath);
  const matches = definitions.filter(
    (definition) =>
      definition.branchId === area.branchId &&
      definition.areaId === area.id &&
      mapPathKey(definition.mapPath) === wantedPath,
  );

  if (matches.length === 0) {
    return { status: "unmapped" };
  }

  if (matches.length > 1) {
    return invalid("ambiguous-definition");
  }

  const definition = matches[0];
  if (!validBounds(definition)) {
    return invalid("invalid-definition", definition);
  }

  if (!imageEvidence) {
    return { status: "pending", definition };
  }

  if (
    imageEvidence.width !== definition.imageWidth ||
    imageEvidence.height !== definition.imageHeight
  ) {
    return invalid("image-size-mismatch", definition);
  }

  if (imageEvidence.sha256) {
    const expectedFingerprint = fingerprints[fingerprintKey(definition)];
    if (!expectedFingerprint) {
      return invalid("image-fingerprint-missing", definition);
    }
    if (expectedFingerprint !== imageEvidence.sha256.toLowerCase()) {
      return invalid("image-fingerprint-mismatch", definition);
    }
  }

  const seenNames = new Set<string>();
  const seenSeatIds = new Set<string>();
  const hotspots: ResolvedSeatHotspot[] = [];

  for (const hotspot of definition.hotspots) {
    if (seenNames.has(hotspot.seatName)) {
      return invalid("duplicate-seat", definition);
    }
    seenNames.add(hotspot.seatName);

    const matchingSeats = area.seats.filter(
      (seat) => seat.name === hotspot.seatName,
    );
    if (matchingSeats.length === 0) {
      return invalid("unknown-seat", definition);
    }
    if (matchingSeats.length > 1) {
      return invalid("ambiguous-seat", definition);
    }

    const seat = matchingSeats[0];
    if (hotspot.expectedSeatId && hotspot.expectedSeatId !== seat.id) {
      return invalid("seat-id-mismatch", definition);
    }
    if (seenSeatIds.has(seat.id)) {
      return invalid("duplicate-seat", definition);
    }
    seenSeatIds.add(seat.id);

    hotspots.push({
      seat,
      bounds: {
        x: hotspot.x,
        y: hotspot.y,
        width: hotspot.width,
        height: hotspot.height,
      },
    });
  }

  if (
    definition.coverage === "complete" &&
    (hotspots.length !== area.seats.length ||
      area.seats.some((seat) => !seenSeatIds.has(seat.id)))
  ) {
    return invalid("coverage-mismatch", definition);
  }

  return { status: "ready", definition, hotspots };
}
