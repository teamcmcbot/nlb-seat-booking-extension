import { describe, expect, it } from "vitest";
import type { FavouriteSeat } from "../models/catalog";
import {
  firstAreaWithFavouriteSeat,
  guestFavouritesNeedingCopy,
} from "./favourites";

function favourite(
  branchId: string,
  areaId: string,
  seatId: string,
): FavouriteSeat {
  return {
    branchId,
    areaId,
    seatId,
    seatCode: `code-${seatId}`,
    seatName: seatId,
  };
}

const branch = {
  id: "library-2",
  areas: [
    { id: "area-2a", seats: [{ id: "seat-4" }] },
    { id: "area-2b", seats: [{ id: "seat-5" }] },
  ],
};

describe("firstAreaWithFavouriteSeat", () => {
  it("uses branch area order when more than one area has favourites", () => {
    expect(
      firstAreaWithFavouriteSeat(branch, [
        favourite("library-2", "area-2b", "seat-5"),
        favourite("library-2", "area-2a", "seat-4"),
      ]),
    ).toBe("area-2a");
  });

  it("ignores favourites belonging to another library", () => {
    expect(
      firstAreaWithFavouriteSeat(branch, [
        favourite("library-1", "area-2a", "seat-4"),
      ]),
    ).toBe("");
  });

  it("ignores stale areas and seats that are absent from the catalog", () => {
    expect(
      firstAreaWithFavouriteSeat(branch, [
        favourite("library-2", "missing-area", "seat-4"),
        favourite("library-2", "area-2a", "missing-seat"),
      ]),
    ).toBe("");
  });

  it("returns an empty selection when the library is cleared", () => {
    expect(
      firstAreaWithFavouriteSeat(undefined, [
        favourite("library-2", "area-2a", "seat-4"),
      ]),
    ).toBe("");
  });
});

describe("guestFavouritesNeedingCopy", () => {
  const guestSeat1 = favourite("library-2", "area-2a", "seat-4");
  const guestSeat2 = favourite("library-2", "area-2b", "seat-5");

  it("offers all Guest favourites before an account has made a choice", () => {
    expect(guestFavouritesNeedingCopy([guestSeat1], [], undefined)).toEqual([
      guestSeat1,
    ]);
  });

  it("offers a Guest favourite added after the previous copy", () => {
    expect(
      guestFavouritesNeedingCopy([guestSeat1, guestSeat2], [guestSeat1], {
        decision: "copied",
        acknowledgedFavouriteKeys: [
          `${guestSeat1.branchId}:${guestSeat1.areaId}:${guestSeat1.seatId}`,
        ],
      }),
    ).toEqual([guestSeat2]);
  });

  it("does not re-offer acknowledged or already-present favourites", () => {
    expect(
      guestFavouritesNeedingCopy([guestSeat1, guestSeat2], [guestSeat2], {
        decision: "copied",
        acknowledgedFavouriteKeys: [
          `${guestSeat1.branchId}:${guestSeat1.areaId}:${guestSeat1.seatId}`,
        ],
      }),
    ).toEqual([]);
  });

  it("keeps future Guest additions separate after an explicit opt-out", () => {
    expect(
      guestFavouritesNeedingCopy([guestSeat1, guestSeat2], [], {
        decision: "kept-separate",
      }),
    ).toEqual([]);
  });
});
