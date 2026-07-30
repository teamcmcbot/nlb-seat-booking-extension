import type { FavouriteSeat } from "../models/catalog";

const STORAGE_KEY = "favouriteSeats";

function isFavouriteSeat(value: unknown): value is FavouriteSeat {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return ["branchId", "areaId", "seatId", "seatCode", "seatName"].every(
    (key) => typeof record[key] === "string",
  );
}

export async function loadFavouriteSeats(): Promise<FavouriteSeat[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];

  return Array.isArray(stored) ? stored.filter(isFavouriteSeat) : [];
}

export async function saveFavouriteSeats(favourites: FavouriteSeat[]) {
  await chrome.storage.local.set({ [STORAGE_KEY]: favourites });
}

export function favouriteIdentity(favourite: FavouriteSeat) {
  return `${favourite.branchId}:${favourite.areaId}:${favourite.seatId}`;
}
