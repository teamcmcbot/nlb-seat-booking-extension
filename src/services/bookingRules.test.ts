import { describe, expect, it } from "vitest";
import type {
  Area,
  BookingRules,
  HolidayClosure,
} from "../models/catalog";
import {
  getBookableDateRange,
  getTimelineSlots,
  holidayClosureForDate,
} from "./bookingRules";

const area: Area = {
  id: "43",
  branchId: "2",
  branchCode: "JRL",
  branchName: "Jurong Library",
  name: "Study Area",
  openingTime: "2020-09-20T10:00:00",
  closingTime: "2020-09-20T20:30:00",
  intervalMinutes: 60,
  minBookingMinutes: 60,
  maxBookingMinutes: 240,
  areaMapUrls: [],
  seats: [],
};

const rules: BookingRules = {
  advanceBookingDays: 1,
  bookingReleaseTime: "2020-01-01T12:00:00+08:00",
  privilegeUserBookingReleaseTime: "2020-01-01T11:00:00+08:00",
  allowAdvanceBooking: false,
};

const nationalDay: HolidayClosure = {
  name: "NationalDay2026",
  startDate: "2026-08-09",
  endDate: "2026-08-09",
  excludedBranches: [],
};

describe("holiday closure booking rules", () => {
  it("keeps a closed current date selectable before tomorrow is released", () => {
    const range = getBookableDateRange(
      area,
      rules,
      new Date(2026, 7, 9, 9, 40),
      [nationalDay],
    );

    expect(range).toMatchObject({
      min: "2026-08-09",
      max: "2026-08-09",
      hasDates: true,
      selectableDates: ["2026-08-09"],
    });
    expect(range.closedDates).toEqual([
      { date: "2026-08-09", holiday: nationalDay },
    ]);
  });

  it("offers the next calendar date only after the normal release time", () => {
    const range = getBookableDateRange(
      area,
      rules,
      new Date(2026, 7, 9, 12, 0),
      [nationalDay],
    );

    expect(range).toMatchObject({
      min: "2026-08-09",
      max: "2026-08-10",
      hasDates: true,
      selectableDates: ["2026-08-09", "2026-08-10"],
    });
  });

  it("does not skip the holiday to extend the released date range", () => {
    const range = getBookableDateRange(
      area,
      rules,
      new Date(2026, 7, 8, 20, 0),
      [nationalDay],
    );

    expect(range.hasDates).toBe(true);
    expect(range.selectableDates).toEqual(["2026-08-09"]);
  });

  it("keeps normal timeline slots available for holiday rendering", () => {
    expect(
      getTimelineSlots(
        area,
        "2026-08-09",
        new Date(2026, 7, 9, 9, 40),
      ),
    ).toHaveLength(10);
  });

  it("keeps an excluded branch open by either ID or code", () => {
    expect(
      holidayClosureForDate(area, "2026-08-09", [
        { ...nationalDay, excludedBranches: ["JRL"] },
      ]),
    ).toBeUndefined();
    expect(
      holidayClosureForDate(area, "2026-08-09", [
        { ...nationalDay, excludedBranches: ["2"] },
      ]),
    ).toBeUndefined();
  });

  it("treats both endpoints of a holiday range as full local dates", () => {
    const closure = {
      ...nationalDay,
      startDate: "2026-08-08",
      endDate: "2026-08-09",
    };

    expect(holidayClosureForDate(area, "2026-08-08", [closure])).toBe(closure);
    expect(holidayClosureForDate(area, "2026-08-09", [closure])).toBe(closure);
    expect(holidayClosureForDate(area, "2026-08-10", [closure])).toBeUndefined();
  });
});
