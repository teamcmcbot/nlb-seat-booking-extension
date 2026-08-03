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
