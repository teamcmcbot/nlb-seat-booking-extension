import type { FavouriteSeat } from "../models/catalog";
import { SIGNED_OUT_PROFILE_ID } from "./accountProfiles";

const LEGACY_STORAGE_KEY = "favouriteSeats";
const STORAGE_KEY_PREFIX = "favouriteSeatsByAccount";

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${encodeURIComponent(userId)}`;
}

function isFavouriteSeat(value: unknown): value is FavouriteSeat {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return ["branchId", "areaId", "seatId", "seatCode", "seatName"].every(
    (key) => typeof record[key] === "string",
  );
}

export async function loadFavouriteSeats(
  userId: string,
): Promise<FavouriteSeat[]> {
  const signedOutProfile = userId === SIGNED_OUT_PROFILE_ID;
  const accountKey = storageKey(userId);
  const result = await chrome.storage.local.get([
    accountKey,
    LEGACY_STORAGE_KEY,
  ]);
  const stored = result[accountKey];

  if (Array.isArray(stored)) {
    return stored.filter(isFavouriteSeat);
  }

  const legacy = result[LEGACY_STORAGE_KEY];
  if (Array.isArray(legacy)) {
    const migrated = legacy.filter(isFavouriteSeat);
    if (signedOutProfile) {
      return migrated;
    }

    await chrome.storage.local.set({ [accountKey]: migrated });
    await chrome.storage.local.remove(LEGACY_STORAGE_KEY);
    return migrated;
  }

  return [];
}

export async function saveFavouriteSeats(
  userId: string,
  favourites: FavouriteSeat[],
) {
  await chrome.storage.local.set({
    [userId === SIGNED_OUT_PROFILE_ID
      ? LEGACY_STORAGE_KEY
      : storageKey(userId)]: favourites,
  });
}

export function favouriteIdentity(favourite: FavouriteSeat) {
  return `${favourite.branchId}:${favourite.areaId}:${favourite.seatId}`;
}
