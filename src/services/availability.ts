import type { Seat } from "../models/catalog";

type JsonRecord = Record<string, unknown>;

function normalizeKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stringField(record: JsonRecord, names: string[]) {
  const wanted = new Set(names.map(normalizeKey));
  const entry = Object.entries(record).find(([key]) =>
    wanted.has(normalizeKey(key)),
  );
  const value = entry?.[1];
  return value === undefined || value === null ? undefined : String(value);
}

function stringArrayField(record: JsonRecord, names: string[]) {
  const wanted = new Set(names.map(normalizeKey));
  const entry = Object.entries(record).find(([key]) =>
    wanted.has(normalizeKey(key)),
  );
  return Array.isArray(entry?.[1])
    ? entry[1].filter(
        (value): value is string => typeof value === "string",
      )
    : [];
}

export function seatMatchKeys(seat: Seat) {
  return [seat.id, seat.code, seat.name]
    .filter(Boolean)
    .map((value) => value.toLowerCase());
}

export function extractAvailableSeatKeys(payload: unknown) {
  const keys = new Set<string>();
  const visited = new WeakSet<object>();

  function visit(value: unknown, insideSeatCollection: boolean, depth: number) {
    if (!value || typeof value !== "object" || depth > 12) {
      return;
    }

    if (visited.has(value)) {
      return;
    }
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((item) =>
        visit(item, insideSeatCollection, depth + 1),
      );
      return;
    }

    const record = value as JsonRecord;

    if (insideSeatCollection) {
      [
        stringField(record, ["id", "seatId"]),
        stringField(record, ["code", "seatCode"]),
        stringField(record, ["name", "seatName"]),
      ]
        .filter((item): item is string => Boolean(item))
        .forEach((item) => keys.add(item.toLowerCase()));
    }

    Object.entries(record).forEach(([key, childValue]) => {
      const normalizedKey = normalizeKey(key);
      const isSeatCollection =
        normalizedKey === "seat" ||
        normalizedKey === "seats" ||
        normalizedKey === "seatlist" ||
        normalizedKey === "availableseats";
      visit(childValue, insideSeatCollection || isSeatCollection, depth + 1);
    });
  }

  visit(payload, false, 0);
  return keys;
}

interface AvailableSeatIdentity {
  id?: string;
  code: string;
  name?: string;
}

export function extractAvailableSeatIdentities(payload: unknown) {
  const seats = new Map<string, AvailableSeatIdentity>();
  const visited = new WeakSet<object>();

  function visit(value: unknown, insideSeatCollection: boolean, depth: number) {
    if (!value || typeof value !== "object" || depth > 12) {
      return;
    }

    if (visited.has(value)) {
      return;
    }
    visited.add(value);

    if (Array.isArray(value)) {
      value.forEach((item) =>
        visit(item, insideSeatCollection, depth + 1),
      );
      return;
    }

    const record = value as JsonRecord;

    if (insideSeatCollection) {
      const id = stringField(record, ["id", "seatId"]);
      const code = stringField(record, ["code", "seatCode"]);
      const name = stringField(record, ["name", "seatName"]);

      if (code && (id || name)) {
        seats.set(`${id ?? ""}:${name ?? ""}:${code}`, {
          id,
          code,
          name,
        });
      }
    }

    Object.entries(record).forEach(([key, childValue]) => {
      const normalizedKey = normalizeKey(key);
      const isSeatCollection =
        normalizedKey === "seat" ||
        normalizedKey === "seats" ||
        normalizedKey === "seatlist" ||
        normalizedKey === "availableseats";
      visit(childValue, insideSeatCollection || isSeatCollection, depth + 1);
    });
  }

  visit(payload, false, 0);
  return [...seats.values()];
}

export function extractAreaMapUrls(payload: unknown, areaId: string) {
  const exactMatches = new Set<string>();
  const fallbackCollections: string[][] = [];
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

    if (maps.length > 0) {
      fallbackCollections.push(maps);
      const recordAreaId = stringField(record, ["id", "areaId"]);

      if (recordAreaId === areaId) {
        maps.forEach((map) => exactMatches.add(map));
      }
    }

    Object.values(record).forEach((child) => visit(child, depth + 1));
  }

  visit(payload, 0);
  return exactMatches.size > 0
    ? [...exactMatches]
    : fallbackCollections.length === 1
      ? fallbackCollections[0]
      : [];
}

function parseMinutes(value?: string) {
  const match = value?.match(/(\d{1,2}):(\d{2})/);
  if (!match) {
    return undefined;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function formatTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}`;
}

export interface HourSlot {
  key: string;
  label: string;
  startTime: string;
  minutes: number;
}

export function buildHourSlots(
  date: string,
  openingTime?: string,
  closingTime?: string,
  intervalMinutes = 60,
): HourSlot[] {
  const opening = parseMinutes(openingTime);
  const closing = parseMinutes(closingTime);

  if (
    opening === undefined ||
    closing === undefined ||
    closing <= opening
  ) {
    return [];
  }

  const safeInterval = intervalMinutes > 0 ? intervalMinutes : 60;
  const slots: HourSlot[] = [];

  for (
    let minutes = opening;
    minutes + safeInterval <= closing;
    minutes += safeInterval
  ) {
    const time = formatTime(minutes);
    slots.push({
      key: `${date}T${time}`,
      label: time,
      startTime: `${date}T${time}`,
      minutes: safeInterval,
    });
  }

  return slots;
}
