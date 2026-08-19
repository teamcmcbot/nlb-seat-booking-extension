import type { FavouriteSeat } from "../models/catalog";
import type { GuestCopyState } from "./profileStorage";
import {
  accountFavouritesKey,
  GUEST_FAVOURITES_KEY,
  isFavouriteSeat,
  SIGNED_OUT_PROFILE_ID,
} from "./profileStorage";

export async function loadFavouriteSeats(
  profileId: string,
): Promise<FavouriteSeat[]> {
  const storageKey =
    profileId === SIGNED_OUT_PROFILE_ID
      ? GUEST_FAVOURITES_KEY
      : accountFavouritesKey(profileId);
  const result = await chrome.storage.local.get(storageKey);
  const stored = result[storageKey];
  return Array.isArray(stored) ? stored.filter(isFavouriteSeat) : [];
}

export async function saveFavouriteSeats(
  profileId: string,
  favourites: FavouriteSeat[],
) {
  await chrome.storage.local.set({
    [profileId === SIGNED_OUT_PROFILE_ID
      ? GUEST_FAVOURITES_KEY
      : accountFavouritesKey(profileId)]: favourites,
  });
}

export async function copyGuestFavouritesToProfile(profileId: string) {
  if (profileId === SIGNED_OUT_PROFILE_ID) {
    return loadFavouriteSeats(profileId);
  }

  const [guestFavourites, profileFavourites] = await Promise.all([
    loadFavouriteSeats(SIGNED_OUT_PROFILE_ID),
    loadFavouriteSeats(profileId),
  ]);
  const merged = new Map<string, FavouriteSeat>();
  [...profileFavourites, ...guestFavourites].forEach((favourite) => {
    merged.set(favouriteIdentity(favourite), favourite);
  });
  const favourites = [...merged.values()];
  await saveFavouriteSeats(profileId, favourites);
  return favourites;
}

export function favouriteIdentity(favourite: FavouriteSeat) {
  return `${favourite.branchId}:${favourite.areaId}:${favourite.seatId}`;
}

export function guestFavouritesNeedingCopy(
  guestFavourites: FavouriteSeat[],
  profileFavourites: FavouriteSeat[],
  copyState?: GuestCopyState,
) {
  if (copyState?.decision === "kept-separate") {
    return [];
  }
  if (!copyState) {
    return guestFavourites;
  }

  const profileKeys = new Set(profileFavourites.map(favouriteIdentity));
  const acknowledgedKeys = new Set(
    copyState.acknowledgedFavouriteKeys ?? profileKeys,
  );
  return guestFavourites.filter((favourite) => {
    const key = favouriteIdentity(favourite);
    return !acknowledgedKeys.has(key) && !profileKeys.has(key);
  });
}

export function firstAreaWithFavouriteSeat(
  branch:
    | {
        id: string;
        areas: Array<{ id: string; seats: Array<{ id: string }> }>;
      }
    | undefined,
  favourites: FavouriteSeat[],
) {
  if (!branch) {
    return "";
  }

  const favouriteSeatKeys = new Set(
    favourites
      .filter((favourite) => favourite.branchId === branch.id)
      .map((favourite) => `${favourite.areaId}:${favourite.seatId}`),
  );

  return (
    branch.areas.find((area) =>
      area.seats.some((seat) =>
        favouriteSeatKeys.has(`${area.id}:${seat.id}`),
      ),
    )?.id ?? ""
  );
}
