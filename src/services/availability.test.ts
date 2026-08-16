import { describe, expect, it } from "vitest";
import {
  extractAreaMapUrls,
  extractAvailableSeatIdentities,
  extractAvailableSeatKeys,
} from "./availability";

const multiAreaPayload = {
  found: false,
  areas: [
    {
      areaId: 50,
      areaName: "Adult Section",
      areaMapUrls: ["sbpl-5-adultsection-sp-full.png"],
      availableSeats: [
        { seatId: "adult-seat", seatCode: "A1", seatName: "A1" },
      ],
    },
    {
      areaId: 51,
      areaName: "Reading Lounge",
      areaMapUrls: [
        "sbpl-5-readinglounge-fp.png",
        "sbpl-5-readinglounge-sp-full.png",
      ],
      availableSeats: [
        { seatId: "lounge-seat", seatCode: "S1", seatName: "S1" },
      ],
    },
  ],
};

describe("availability response extraction", () => {
  it("scopes maps and seats to the exact requested area", () => {
    expect(extractAreaMapUrls(multiAreaPayload, "51")).toEqual([
      "sbpl-5-readinglounge-fp.png",
      "sbpl-5-readinglounge-sp-full.png",
    ]);
    expect(extractAvailableSeatIdentities(multiAreaPayload, "51")).toEqual([
      { id: "lounge-seat", code: "S1", name: "S1" },
    ]);
    expect([...extractAvailableSeatKeys(multiAreaPayload, "51")]).toEqual([
      "lounge-seat",
      "s1",
    ]);
  });

  it("does not fall back to a neighboring area's only map collection", () => {
    const adultOnlyPayload = { areas: [multiAreaPayload.areas[0]] };

    expect(extractAreaMapUrls(adultOnlyPayload, "51")).toEqual([]);
    expect(extractAvailableSeatIdentities(adultOnlyPayload, "51")).toEqual(
      [],
    );
    expect([...extractAvailableSeatKeys(adultOnlyPayload, "51")]).toEqual([]);
  });

  it("ignores areaImageUrls and mapUrls for SearchAvailableAreas maps", () => {
    const payload = {
      areas: [
        {
          areaId: 51,
          areaImageUrls: ["reading-lounge-thumbnail.png"],
          mapUrls: ["unsupported-alias-sp.png"],
        },
      ],
    };

    expect(extractAreaMapUrls(payload, "51")).toEqual([]);
  });
});
