import { describe, expect, it } from "vitest";
import type { Area, Seat } from "../models/catalog";
import type { HourSlot } from "./availability";
import {
  currentDayReferenceEvidence,
  scanExactAreaIntervals,
  selectedDateAfterRollover,
} from "./availabilityScan";

const slots: HourSlot[] = [
  {
    key: "2026-08-14T10:00",
    label: "10:00",
    startTime: "2026-08-14T10:00",
    minutes: 60,
  },
  {
    key: "2026-08-14T11:00",
    label: "11:00",
    startTime: "2026-08-14T11:00",
    minutes: 60,
  },
];

describe("current-day reference evidence", () => {
  it("classifies the overnight 01:00 placeholder as unusable", () => {
    const area = testArea([
      testSeat("1", "S1", [{ time: "01:00", isAvailable: false }]),
      testSeat("2", "S2", [{ time: "01:00", isAvailable: false }]),
    ]);

    expect(
      currentDayReferenceEvidence(
        area,
        area.seats,
        slots,
        "2026-08-14",
        new Date("2026-08-14T00:30:00+08:00"),
      ),
    ).toEqual({ status: "unusable" });
  });

  it("keeps matching false daytime evidence authoritative", () => {
    const area = testArea([
      testSeat("1", "S1", [{ time: "10:00", isAvailable: false }]),
    ]);

    expect(
      currentDayReferenceEvidence(
        area,
        area.seats,
        slots,
        "2026-08-14",
        new Date("2026-08-14T08:00:00+08:00"),
      ),
    ).toEqual({
      status: "usable",
      availability: { "1": { "2026-08-14T10:00": false } },
    });
  });

  it("does not trigger fallback when another seat proves the area matrix is usable", () => {
    const area = testArea([
      testSeat("1", "S1", [{ time: "01:00", isAvailable: false }]),
      testSeat("2", "S2", [{ time: "10:00", isAvailable: true }]),
    ]);

    expect(
      currentDayReferenceEvidence(
        area,
        [area.seats[0]],
        slots,
        "2026-08-14",
        new Date("2026-08-14T08:00:00+08:00"),
      ),
    ).toEqual({ status: "usable", availability: {} });
  });
});

describe("exact interval availability scan", () => {
  it("runs sequential exact-area requests and records true and false results", async () => {
    const area = testArea([testSeat("1", "S1", [])]);
    let active = 0;
    let maximumActive = 0;
    const startTimes: string[] = [];

    const result = await scanExactAreaIntervals({
      area,
      seats: area.seats,
      slots,
      signal: new AbortController().signal,
      search: async (query) => {
        active += 1;
        maximumActive = Math.max(maximumActive, active);
        startTimes.push(query.startTime);
        await Promise.resolve();
        active -= 1;
        return {
          areas: [
            {
              areaId: "43",
              areaMapUrls: ["jrl-study-sp.png"],
              availableSeats:
                query.startTime.endsWith("10:00")
                  ? [{ id: "1", name: "S1", code: "JRL.S1" }]
                  : [],
            },
          ],
        };
      },
    });

    expect(maximumActive).toBe(1);
    expect(startTimes).toEqual([
      "2026-08-14T10:00",
      "2026-08-14T11:00",
    ]);
    expect(result.availability).toEqual({
      "1": {
        "2026-08-14T10:00": true,
        "2026-08-14T11:00": false,
      },
    });
    expect(result.mapUrls).toEqual(["jrl-study-sp.png"]);
    expect(result.seatCodes).toMatchObject({ "1": "JRL.S1", s1: "JRL.S1" });
    expect(result.failed).toBe(0);
  });

  it("leaves a failed interval unknown while retaining successful evidence", async () => {
    const area = testArea([testSeat("1", "S1", [])]);
    const progress: number[] = [];

    const result = await scanExactAreaIntervals({
      area,
      seats: area.seats,
      slots,
      signal: new AbortController().signal,
      search: async (query) => {
        if (query.startTime.endsWith("10:00")) {
          throw new Error("temporary failure");
        }
        return { areas: [{ areaId: "43", availableSeats: [] }] };
      },
      onProgress: ({ completed }) => progress.push(completed),
    });

    expect(result.failed).toBe(1);
    expect(result.availability).toEqual({
      "1": { "2026-08-14T11:00": false },
    });
    expect(progress).toEqual([1, 2]);
  });

  it("stops after the active scan is aborted", async () => {
    const area = testArea([testSeat("1", "S1", [])]);
    const controller = new AbortController();
    let requests = 0;

    const result = await scanExactAreaIntervals({
      area,
      seats: area.seats,
      slots,
      signal: controller.signal,
      search: async () => {
        requests += 1;
        controller.abort();
        throw new DOMException("Canceled", "AbortError");
      },
    });

    expect(requests).toBe(1);
    expect(result.completed).toBe(0);
    expect(result.availability).toEqual({});
  });
});

describe("local-date rollover", () => {
  it("moves yesterday's selection to today without changing another future selection", () => {
    expect(
      selectedDateAfterRollover("2026-08-14", "2026-08-15", "2026-08-14"),
    ).toBe("2026-08-15");
    expect(
      selectedDateAfterRollover("2026-08-14", "2026-08-15", "2026-08-16"),
    ).toBe("2026-08-16");
  });
});

function testArea(seats: Seat[]): Area {
  return {
    id: "43",
    branchId: "2",
    branchName: "Jurong Library",
    name: "Study Area",
    openingTime: "10:00",
    closingTime: "12:00",
    intervalMinutes: 60,
    minBookingMinutes: 60,
    maxBookingMinutes: 240,
    areaMapUrls: [],
    seats,
  };
}

function testSeat(
  id: string,
  name: string,
  availableSlots: Seat["availableSlots"],
): Seat {
  return {
    id,
    code: "",
    name,
    disabled: false,
    availableSlots,
  };
}
