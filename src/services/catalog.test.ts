import { describe, expect, it } from "vitest";
import { extractCatalog } from "./catalog";

function payloadWithHoliday(startTime: unknown, endTime: unknown) {
  return {
    accountInfo: { allowAdvanceBooking: false },
    settings: {
      system: { advanceBookingDays: 1 },
      holidays: [
        {
          name: "NationalDay2026",
          startTime,
          endTime,
          excludedBranches: [2, "JRL"],
        },
      ],
      menus: {
        branchMenus: [
          {
            id: 2,
            code: "JRL",
            name: "Jurong Library",
            areas: [
              {
                id: 43,
                name: "Study Area",
                facilityId: 1,
                seats: [],
              },
            ],
          },
        ],
      },
    },
  };
}

describe("catalog holiday normalization", () => {
  it("normalizes midnight timestamps as inclusive calendar dates", () => {
    const catalog = extractCatalog(
      payloadWithHoliday(
        "2026-08-09T00:00:00",
        "2026-08-09T00:00:00",
      ),
    );

    expect(catalog.holidays).toEqual([
      {
        name: "NationalDay2026",
        startDate: "2026-08-09",
        endDate: "2026-08-09",
        excludedBranches: ["2", "JRL"],
      },
    ]);
    expect(catalog.branches[0]).toMatchObject({ id: "2", code: "JRL" });
  });

  it("does not infer partial-day hours from holiday timestamp clocks", () => {
    const catalog = extractCatalog(
      payloadWithHoliday("2026-08-09T16:00:00", "2026-08-09T18:00:00"),
    );

    expect(catalog.holidays[0]).toMatchObject({
      startDate: "2026-08-09",
      endDate: "2026-08-09",
    });
  });

  it("discards malformed and reversed holiday ranges", () => {
    expect(extractCatalog(payloadWithHoliday("invalid", "2026-08-09")).holidays)
      .toEqual([]);
    expect(
      extractCatalog(
        payloadWithHoliday("2026-08-10", "2026-08-09"),
      ).holidays,
    ).toEqual([]);
  });
});

describe("catalog map normalization", () => {
  it("consumes areaMapUrls and ignores the unsupported mapUrls alias", () => {
    const payload = payloadWithHoliday("2026-08-09", "2026-08-09");
    const area = payload.settings.menus.branchMenus[0].areas[0] as Record<
      string,
      unknown
    >;
    area.areaMapUrls = ["expected-sp-full.png"];
    area.mapUrls = ["ignored-sp-full.png"];

    expect(extractCatalog(payload).branches[0].areas[0].areaMapUrls).toEqual([
      "expected-sp-full.png",
    ]);
  });
});
