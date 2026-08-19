import type { AvailabilityQuery } from "../api/availability";
import type { Area, Seat } from "../models/catalog";
import {
  extractAreaMapUrls,
  extractAvailableSeatIdentities,
  extractAvailableSeatKeys,
  seatMatchKeys,
  type HourSlot,
} from "./availability";

export type SeatAvailability = Record<string, Record<string, boolean>>;

export type CurrentDayReferenceEvidence =
  | { status: "usable"; availability: SeatAvailability }
  | { status: "unusable" }
  | { status: "inapplicable" };

interface ExactIntervalProgress {
  availability: SeatAvailability;
  completed: number;
  total: number;
}

export interface ExactIntervalScanResult extends ExactIntervalProgress {
  failed: number;
  firstError?: unknown;
  mapUrls: string[];
  seatCodes: Record<string, string>;
}

interface ExactIntervalScanOptions {
  area: Area;
  seats: Seat[];
  slots: HourSlot[];
  signal: AbortSignal;
  search: (
    query: AvailabilityQuery,
    signal: AbortSignal,
  ) => Promise<unknown>;
  onProgress?: (progress: ExactIntervalProgress) => void;
}

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function referenceTime(value: string) {
  return value.match(/(?:T|\s)?(\d{1,2}:\d{2})/)?.[1] ?? value.slice(0, 5);
}

function identityKey(value: string) {
  return value.trim().toLowerCase();
}

function cloneAvailability(availability: SeatAvailability) {
  return Object.fromEntries(
    Object.entries(availability).map(([seatId, slots]) => [
      seatId,
      { ...slots },
    ]),
  );
}

export function currentDayReferenceEvidence(
  area: Area | undefined,
  displayedSeats: Seat[],
  slots: HourSlot[],
  date: string,
  now: Date,
): CurrentDayReferenceEvidence {
  if (!area || date !== localDateValue(now)) {
    return { status: "inapplicable" };
  }

  const timelineTimes = new Set(slots.map((slot) => referenceTime(slot.label)));
  const hasMatchingAreaEvidence = area.seats.some((seat) =>
    seat.availableSlots.some((slot) =>
      timelineTimes.has(referenceTime(slot.time)),
    ),
  );
  if (!hasMatchingAreaEvidence) {
    return { status: "unusable" };
  }

  const availability: SeatAvailability = {};
  for (const seat of displayedSeats) {
    const slotsByTime = new Map(
      seat.availableSlots.map((slot) => [referenceTime(slot.time), slot]),
    );
    for (const slot of slots) {
      const referenceSlot = slotsByTime.get(referenceTime(slot.label));
      if (!referenceSlot) {
        continue;
      }
      availability[seat.id] = {
        ...availability[seat.id],
        [slot.key]: !seat.disabled && referenceSlot.isAvailable,
      };
    }
  }
  return { status: "usable", availability };
}

export async function scanExactAreaIntervals({
  area,
  seats,
  slots,
  signal,
  search,
  onProgress,
}: ExactIntervalScanOptions): Promise<ExactIntervalScanResult> {
  const availability: SeatAvailability = {};
  const mapUrls = new Set<string>();
  const seatCodes: Record<string, string> = {};
  let completed = 0;
  let failed = 0;
  let firstError: unknown;

  for (const slot of slots) {
    if (signal.aborted) {
      break;
    }
    try {
      const payload = await search(
        {
          branchId: area.branchId,
          areaId: area.id,
          startTime: slot.startTime,
          durationMinutes: slot.minutes,
        },
        signal,
      );
      extractAreaMapUrls(payload, area.id).forEach((map) => mapUrls.add(map));
      for (const availableSeat of extractAvailableSeatIdentities(
        payload,
        area.id,
      )) {
        if (availableSeat.id) {
          seatCodes[identityKey(availableSeat.id)] = availableSeat.code;
        }
        if (availableSeat.name) {
          seatCodes[identityKey(availableSeat.name)] = availableSeat.code;
        }
      }

      const availableKeys = extractAvailableSeatKeys(payload, area.id);
      for (const seat of seats) {
        availability[seat.id] = {
          ...availability[seat.id],
          [slot.key]:
            !seat.disabled &&
            seatMatchKeys(seat).some((key) => availableKeys.has(key)),
        };
      }
    } catch (error) {
      if (signal.aborted) {
        break;
      }
      failed += 1;
      firstError ??= error;
    }
    completed += 1;
    onProgress?.({
      availability: cloneAvailability(availability),
      completed,
      total: slots.length,
    });
  }

  return {
    availability,
    completed,
    total: slots.length,
    failed,
    firstError,
    mapUrls: [...mapUrls],
    seatCodes,
  };
}

export function selectedDateAfterRollover(
  previousDate: string,
  currentDate: string,
  selectedDate: string,
) {
  return selectedDate === previousDate ? currentDate : selectedDate;
}
