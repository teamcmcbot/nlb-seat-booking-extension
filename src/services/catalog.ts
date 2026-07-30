import type {
  Area,
  BookingRules,
  Branch,
  Catalog,
  Seat,
} from "../models/catalog";

type JsonRecord = Record<string, unknown>;

const AREA_COLLECTION_NAMES = ["area", "areas", "arealist"];
const SEAT_COLLECTION_NAMES = ["seat", "seats", "seatlist"];

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function field(record: JsonRecord, names: string[]): unknown {
  const wanted = new Set(names.map(normalizeKey));
  const entry = Object.entries(record).find(([key]) =>
    wanted.has(normalizeKey(key)),
  );
  return entry?.[1];
}

function stringField(record: JsonRecord, names: string[]) {
  const value = field(record, names);

  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return String(value);
}

function numberField(record: JsonRecord, names: string[]) {
  const value = field(record, names);
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function booleanField(record: JsonRecord, names: string[]) {
  const value = field(record, names);
  return typeof value === "boolean" ? value : false;
}

function arrayField(record: JsonRecord, names: string[]) {
  const value = field(record, names);
  return Array.isArray(value) ? value : [];
}

function stringArrayField(record: JsonRecord, names: string[]) {
  return arrayField(record, names).filter(
    (value): value is string => typeof value === "string",
  );
}

function compareSeatNames(left: Seat, right: Seat) {
  return left.name.localeCompare(right.name, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

function mergeSeat(existing: Seat | undefined, candidate: Seat) {
  if (!existing) {
    return candidate;
  }

  return {
    ...existing,
    ...candidate,
    code: candidate.code || existing.code,
    name: candidate.name || existing.name,
    disabled: existing.disabled || candidate.disabled,
  };
}

function extractSeats(area: JsonRecord): Seat[] {
  const seen = new Set<string>();

  return arrayField(area, SEAT_COLLECTION_NAMES)
    .filter(isRecord)
    .map((seat): Seat | undefined => {
      const id = stringField(seat, ["id", "seatId"]);
      const name = stringField(seat, ["name", "seatName"]);
      const code = stringField(seat, ["code", "seatCode"]) ?? "";

      if (!id || !name) {
        return undefined;
      }

      const identity = `${id}:${code}:${name}`;
      if (seen.has(identity)) {
        return undefined;
      }
      seen.add(identity);

      return {
        id,
        code,
        name,
        disabled: booleanField(seat, ["disabled", "isDisabled"]),
      };
    })
    .filter((seat): seat is Seat => Boolean(seat))
    .sort(compareSeatNames);
}

interface ParentBranch {
  id?: string;
  name?: string;
}

function mergeAreas(existing: Area | undefined, candidate: Area): Area {
  if (!existing) {
    return candidate;
  }

  const preferred =
    candidate.seats.length +
      candidate.areaMapUrls.length +
      Number(Boolean(candidate.openingTime)) +
      Number(Boolean(candidate.closingTime)) >=
    existing.seats.length +
      existing.areaMapUrls.length +
      Number(Boolean(existing.openingTime)) +
      Number(Boolean(existing.closingTime))
      ? candidate
      : existing;
  const secondary = preferred === candidate ? existing : candidate;
  const seats = new Map<string, Seat>();
  [...secondary.seats, ...preferred.seats].forEach((seat) => {
    seats.set(seat.id, mergeSeat(seats.get(seat.id), seat));
  });

  return {
    ...secondary,
    ...preferred,
    branchName: preferred.branchName.startsWith("Library ")
      ? secondary.branchName
      : preferred.branchName,
    facilityId: preferred.facilityId ?? secondary.facilityId,
    facilityCode: preferred.facilityCode ?? secondary.facilityCode,
    openingTime: preferred.openingTime ?? secondary.openingTime,
    closingTime: preferred.closingTime ?? secondary.closingTime,
    areaMapUrls: [
      ...new Set([...existing.areaMapUrls, ...candidate.areaMapUrls]),
    ],
    seats: [...seats.values()].sort(compareSeatNames),
  };
}

function parentBranchFor(record: JsonRecord): ParentBranch {
  return {
    id: stringField(record, ["branchId", "id"]),
    name: stringField(record, ["branchName", "name"]),
  };
}

function areaFromRecord(
  area: JsonRecord,
  parentBranch: ParentBranch,
): Area | undefined {
  const id = stringField(area, ["id", "areaId"]);
  const name = stringField(area, ["name", "areaName"]);
  const branchId =
    stringField(area, ["branchId"]) ?? parentBranch.id;
  const branchName =
    stringField(area, ["branchName", "libraryName"]) ?? parentBranch.name;
  const facilityId = stringField(area, ["facilityId"]);

  if (!id || !name || !branchId || facilityId === "2") {
    return undefined;
  }

  return {
    id,
    name,
    branchId,
    branchName: branchName ?? `Library ${branchId}`,
    facilityId,
    facilityCode: stringField(area, ["facilityCode"]),
    floor: stringField(area, ["floor", "floorName", "level"]),
    openingTime: stringField(area, [
      "openingTime",
      "openTime",
      "startTime",
    ]),
    closingTime: stringField(area, [
      "closingTime",
      "closeTime",
      "endTime",
    ]),
    intervalMinutes:
      numberField(area, [
        "bookingTimeslotInMinutes",
        "bookingTimeSlotInMinutes",
        "timeslotInMinutes",
      ]) ?? 60,
    minBookingMinutes:
      numberField(area, ["minBookingMinutes", "minimumBookingMinutes"]) ?? 60,
    maxBookingMinutes:
      numberField(area, ["maxBookingMinutes", "maximumBookingMinutes"]) ?? 240,
    areaMapUrls: stringArrayField(area, ["areaMapUrls", "mapUrls"]),
    seats: extractSeats(area),
  };
}

function findRecordWithField(
  payload: unknown,
  targetField: string,
): JsonRecord | undefined {
  const target = normalizeKey(targetField);
  const visited = new WeakSet<object>();

  function visit(value: unknown, depth: number): JsonRecord | undefined {
    if (!value || typeof value !== "object" || depth > 12) {
      return undefined;
    }

    if (visited.has(value)) {
      return undefined;
    }
    visited.add(value);

    if (Array.isArray(value)) {
      for (const item of value) {
        const result = visit(item, depth + 1);
        if (result) {
          return result;
        }
      }
      return undefined;
    }

    const record = value as JsonRecord;
    if (Object.keys(record).some((key) => normalizeKey(key) === target)) {
      return record;
    }

    for (const child of Object.values(record)) {
      const result = visit(child, depth + 1);
      if (result) {
        return result;
      }
    }

    return undefined;
  }

  return visit(payload, 0);
}

function extractBookingRules(payload: unknown): BookingRules {
  const system = findRecordWithField(payload, "advanceBookingDays") ?? {};
  const account = findRecordWithField(payload, "allowAdvanceBooking") ?? {};

  return {
    advanceBookingDays:
      numberField(system, ["advanceBookingDays"]) ?? 1,
    bookingReleaseTime: stringField(system, ["bookingReleaseTime"]),
    privilegeUserBookingReleaseTime: stringField(system, [
      "privilegeUserBookingReleaseTime",
    ]),
    allowAdvanceBooking: booleanField(account, ["allowAdvanceBooking"]),
  };
}

function attachAreaMapMetadata(
  payload: unknown,
  areasByIdentity: Map<string, Area>,
) {
  const visited = new WeakSet<object>();

  function visit(value: unknown, depth: number) {
    if (!value || typeof value !== "object" || depth > 12) {
      return;
    }

    if (visited.has(value)) {
      return;
    }
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }

    const record = value as JsonRecord;
    const maps = stringArrayField(record, ["areaMapUrls", "mapUrls"]);
    const areaId = stringField(record, ["areaId", "id"]);
    const branchId = stringField(record, ["branchId"]);

    if (maps.length > 0 && areaId) {
      for (const [identity, area] of areasByIdentity) {
        if (
          area.id === areaId &&
          (!branchId || area.branchId === branchId)
        ) {
          areasByIdentity.set(identity, {
            ...area,
            areaMapUrls: [...new Set([...area.areaMapUrls, ...maps])],
          });
        }
      }
    }

    Object.values(record).forEach((child) => visit(child, depth + 1));
  }

  visit(payload, 0);
}

export function extractCatalog(payload: unknown): Catalog {
  const areasByIdentity = new Map<string, Area>();
  const visited = new WeakSet<object>();

  function visit(value: unknown, depth: number) {
    if (!value || typeof value !== "object" || depth > 12) {
      return;
    }

    if (visited.has(value)) {
      return;
    }
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, depth + 1));
      return;
    }

    const record = value as JsonRecord;
    const parentBranch = parentBranchFor(record);

    for (const [key, childValue] of Object.entries(record)) {
      if (
        Array.isArray(childValue) &&
        AREA_COLLECTION_NAMES.includes(normalizeKey(key))
      ) {
        childValue.filter(isRecord).forEach((areaRecord) => {
          const area = areaFromRecord(areaRecord, parentBranch);
          if (area) {
            const identity = `${area.branchId}:${area.id}`;
            areasByIdentity.set(
              identity,
              mergeAreas(areasByIdentity.get(identity), area),
            );
          }
        });
      }

      visit(childValue, depth + 1);
    }
  }

  visit(payload, 0);
  attachAreaMapMetadata(payload, areasByIdentity);

  const branchesById = new Map<string, Branch>();

  for (const area of areasByIdentity.values()) {
    const branch = branchesById.get(area.branchId) ?? {
      id: area.branchId,
      name: area.branchName,
      areas: [],
    };
    branch.areas.push(area);
    branchesById.set(area.branchId, branch);
  }

  const branches = [...branchesById.values()]
    .map((branch) => ({
      ...branch,
      areas: branch.areas.sort((left, right) =>
        left.name.localeCompare(right.name, undefined, {
          numeric: true,
          sensitivity: "base",
        }),
      ),
    }))
    .sort((left, right) => left.name.localeCompare(right.name));

  return {
    branches,
    bookingRules: extractBookingRules(payload),
  };
}
