import type { Area, BookingRules } from "../models/catalog";
import {
  buildHourSlots,
  type HourSlot,
} from "./availability";

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() + days);
  return result;
}

function timeMinutes(value?: string) {
  const match = value?.match(/(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : undefined;
}

function currentMinutes(now: Date) {
  return now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
}

function effectiveReleaseTime(rules: BookingRules) {
  return rules.allowAdvanceBooking && rules.privilegeUserBookingReleaseTime
    ? rules.privilegeUserBookingReleaseTime
    : rules.bookingReleaseTime;
}

export interface BookableDateRange {
  min: string;
  max: string;
  hasDates: boolean;
}

export function getBookableDateRange(
  area: Area,
  rules: BookingRules,
  now: Date,
): BookableDateRange {
  const today = localDateValue(now);
  const closing = timeMinutes(area.closingTime);
  const lastBookingStart =
    closing === undefined ? undefined : closing - area.minBookingMinutes;
  const minimumOffset =
    lastBookingStart !== undefined && currentMinutes(now) >= lastBookingStart
      ? 1
      : 0;

  const release = timeMinutes(effectiveReleaseTime(rules));
  const releasedToday =
    release === undefined || currentMinutes(now) >= release;
  const maximumOffset =
    rules.advanceBookingDays > 0
      ? Math.max(
          0,
          rules.advanceBookingDays - (releasedToday ? 0 : 1),
        )
      : 0;

  const min = localDateValue(addDays(now, minimumOffset));
  const max = localDateValue(addDays(now, maximumOffset));

  return {
    min,
    max,
    hasDates: min <= max && max >= today,
  };
}

export function getBookableSlots(
  area: Area,
  date: string,
  now: Date,
): HourSlot[] {
  const slots = buildHourSlots(
    date,
    area.openingTime,
    area.closingTime,
    area.intervalMinutes,
  );

  if (date !== localDateValue(now)) {
    return slots;
  }

  const nowMinutes = currentMinutes(now);
  return slots.filter((slot) => {
    const start = timeMinutes(slot.label);
    return start !== undefined && start > nowMinutes;
  });
}

export function durationOptions(
  area: Area,
  slots: HourSlot[],
  selectedStartIndex: number,
) {
  if (selectedStartIndex < 0) {
    return [];
  }

  const remainingMinutes =
    (slots.length - selectedStartIndex) * area.intervalMinutes;
  const maximum = Math.min(area.maxBookingMinutes, remainingMinutes);
  const options: number[] = [];

  for (
    let duration = area.minBookingMinutes;
    duration <= maximum;
    duration += area.intervalMinutes
  ) {
    options.push(duration);
  }

  return options;
}

export function preferredDuration(
  availableDurations: number[],
  remainingQuotaMinutes?: number,
) {
  if (availableDurations.length === 0) {
    return undefined;
  }

  const target =
    remainingQuotaMinutes !== undefined && remainingQuotaMinutes > 0
      ? remainingQuotaMinutes
      : 240;

  return (
    availableDurations.filter((duration) => duration <= target).at(-1) ??
    availableDurations[0]
  );
}

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours} hour${hours === 1 ? "" : "s"}`);
  }
  if (remainder > 0) {
    parts.push(`${remainder} min`);
  }

  return parts.join(" ") || "0 min";
}
