import type {
  Area,
  BookingRules,
  HolidayClosure,
} from "../models/catalog";
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
  selectableDates: string[];
  closedDates: Array<{
    date: string;
    holiday: HolidayClosure;
  }>;
}

function normalizedBranchIdentity(value: string) {
  return value.trim().toLowerCase();
}

export function holidayClosureForDate(
  area: Pick<Area, "branchId" | "branchCode">,
  date: string,
  holidays: HolidayClosure[],
) {
  const branchIdentities = new Set(
    [area.branchId, area.branchCode]
      .filter((value): value is string => Boolean(value))
      .map(normalizedBranchIdentity),
  );

  return holidays.find((holiday) => {
    if (date < holiday.startDate || date > holiday.endDate) {
      return false;
    }

    return !holiday.excludedBranches.some((branch) =>
      branchIdentities.has(normalizedBranchIdentity(branch)),
    );
  });
}

export function getBookableDateRange(
  area: Area,
  rules: BookingRules,
  now: Date,
  holidays: HolidayClosure[] = [],
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

  const rangeMin = localDateValue(addDays(now, minimumOffset));
  const rangeMax = localDateValue(addDays(now, maximumOffset));
  const selectableDates: string[] = [];
  const closedDates: BookableDateRange["closedDates"] = [];

  for (let offset = minimumOffset; offset <= maximumOffset; offset += 1) {
    const candidate = localDateValue(addDays(now, offset));
    const holiday = holidayClosureForDate(area, candidate, holidays);

    selectableDates.push(candidate);
    if (holiday) {
      closedDates.push({ date: candidate, holiday });
    }
  }

  const min = selectableDates[0] ?? rangeMin;
  const max = selectableDates.at(-1) ?? rangeMax;

  return {
    min,
    max,
    hasDates: selectableDates.length > 0 && min <= max && max >= today,
    selectableDates,
    closedDates,
  };
}

export function getTimelineSlots(
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
