import { afterEach, describe, expect, it, vi } from "vitest";
import storageFixtures from "../../docs/examples/chrome-storage-profiles.sanitized.json";
import {
  profileUserId,
  SIGNED_OUT_PROFILE_ID,
} from "./accountProfiles";
import {
  copyGuestFavouritesToProfile,
  loadFavouriteSeats,
  saveFavouriteSeats,
} from "./favourites";
import {
  loadLastSeatSelection,
  saveLastSeatSelection,
} from "./preferences";
import {
  accountFavouritesKey,
  accountGuestDecisionKey,
  accountSelectionKey,
  clearAccountProfileData,
  clearAllProfileData,
  clearGuestProfileData,
  CURRENT_STORAGE_SCHEMA_VERSION,
  deriveOpaqueProfileId,
  GUEST_FAVOURITES_KEY,
  GUEST_SELECTION_KEY,
  isOpaqueProfileId,
  LAST_ACTIVE_PROFILE_KEY,
  loadGuestCopyDecision,
  PROFILE_ORDER_KEY,
  PROFILE_SECRET_KEY,
  profileDisplayLabel,
  readProfileStorageInventory,
  saveGuestCopyDecision,
  STORAGE_SCHEMA_VERSION_KEY,
} from "./profileStorage";

type StorageRecord = Record<string, unknown>;

function installChromeStorage(
  initial: StorageRecord = {},
  options: { failSetCalls?: number[] } = {},
) {
  const values: StorageRecord = structuredClone(initial);
  let setCall = 0;
  const local = {
    get: vi.fn(async (keys: string | string[] | null) => {
      if (keys === null) {
        return structuredClone(values);
      }

      const requestedKeys = Array.isArray(keys) ? keys : [keys];
      return Object.fromEntries(
        requestedKeys
          .filter((key) => Object.hasOwn(values, key))
          .map((key) => [key, structuredClone(values[key])]),
      );
    }),
    set: vi.fn(async (items: StorageRecord) => {
      setCall += 1;
      if (options.failSetCalls?.includes(setCall)) {
        throw new Error("simulated storage write failure");
      }
      Object.assign(values, structuredClone(items));
    }),
    remove: vi.fn(async (keys: string | string[]) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        delete values[key];
      }
    }),
  };

  vi.stubGlobal("chrome", { storage: { local } });
  return { local, values };
}

function expectNoRawUserId(values: StorageRecord, ...rawUserIds: string[]) {
  const serialized = JSON.stringify(values);
  rawUserIds.forEach((rawUserId) => {
    expect(serialized).not.toContain(rawUserId);
    expect(serialized).not.toContain(encodeURIComponent(rawUserId));
  });
}

describe("opaque account profiles", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("initializes schema 1 and keeps signed-out data in permanent Guest keys", async () => {
    const { values } = installChromeStorage();

    expect(await profileUserId()).toBe(SIGNED_OUT_PROFILE_ID);
    await saveFavouriteSeats(
      SIGNED_OUT_PROFILE_ID,
      storageFixtures.freshSignedOut.favouriteSeats,
    );
    await saveLastSeatSelection(
      SIGNED_OUT_PROFILE_ID,
      storageFixtures.freshSignedOut.lastSeatSelection,
    );

    expect(values[STORAGE_SCHEMA_VERSION_KEY]).toBe(
      CURRENT_STORAGE_SCHEMA_VERSION,
    );
    expect(values[PROFILE_SECRET_KEY]).toEqual(expect.any(String));
    expect(values[PROFILE_ORDER_KEY]).toEqual([]);
    expect(values[GUEST_FAVOURITES_KEY]).toEqual(
      storageFixtures.freshSignedOut.favouriteSeats,
    );
    expect(values[GUEST_SELECTION_KEY]).toEqual(
      storageFixtures.freshSignedOut.lastSeatSelection,
    );
    expect(values).not.toHaveProperty("favouriteSeats");
    expect(values).not.toHaveProperty("lastSeatSelection");
  });

  it("migrates legacy Guest data without silently moving it into an account", async () => {
    const { values } = installChromeStorage(storageFixtures.freshSignedOut);
    const rawUserId = "sanitized-user-1";

    const profileId = await profileUserId(rawUserId);

    expect(isOpaqueProfileId(profileId)).toBe(true);
    expect(await loadFavouriteSeats(profileId)).toEqual([]);
    expect(await loadFavouriteSeats(SIGNED_OUT_PROFILE_ID)).toEqual(
      storageFixtures.freshSignedOut.favouriteSeats,
    );
    expect(await loadLastSeatSelection(SIGNED_OUT_PROFILE_ID)).toEqual(
      storageFixtures.freshSignedOut.lastSeatSelection,
    );
    expect(values).not.toHaveProperty("favouriteSeats");
    expect(values).not.toHaveProperty("lastSeatSelection");
    expectNoRawUserId(values, rawUserId);
  });

  it("copies rather than moves Guest favourites after an explicit decision", async () => {
    installChromeStorage(storageFixtures.freshSignedOut);
    const profileId = await profileUserId("sanitized-user-1");

    const copied = await copyGuestFavouritesToProfile(profileId);
    await saveGuestCopyDecision(profileId, "copied");

    expect(copied).toEqual(storageFixtures.freshSignedOut.favouriteSeats);
    expect(await loadFavouriteSeats(profileId)).toEqual(copied);
    expect(await loadFavouriteSeats(SIGNED_OUT_PROFILE_ID)).toEqual(copied);
    expect(await loadGuestCopyDecision(profileId)).toBe("copied");
  });

  it("migrates one legacy account and removes every raw-ID key", async () => {
    const rawUserId = "sanitized-user-1";
    const { values } = installChromeStorage(storageFixtures.oneAccount);

    const profileId = await profileUserId(rawUserId);

    expect(await loadFavouriteSeats(profileId)).toEqual(
      storageFixtures.oneAccount[
        "favouriteSeatsByAccount:sanitized-user-1"
      ],
    );
    expect(await loadLastSeatSelection(profileId)).toEqual(
      storageFixtures.oneAccount[
        "lastSeatSelectionByAccount:sanitized-user-1"
      ],
    );
    expect(values[LAST_ACTIVE_PROFILE_KEY]).toBe(profileId);
    expect(values[PROFILE_ORDER_KEY]).toEqual([profileId]);
    expectNoRawUserId(values, rawUserId);
  });

  it("migrates multiple accounts and uses Guest whenever signed out", async () => {
    const rawUser1 = "sanitized-user-1";
    const rawUser2 = "sanitized-user-2";
    installChromeStorage(storageFixtures.multipleAccounts);

    expect(await profileUserId()).toBe(SIGNED_OUT_PROFILE_ID);
    const inventory = await readProfileStorageInventory();
    expect(inventory.accounts).toHaveLength(2);
    expect(inventory.accounts.map(({ label }) => label)).toEqual([
      "Profile 1",
      "Profile 2",
    ]);
    expect(inventory.accounts.filter(({ isLastActive }) => isLastActive)).toHaveLength(1);

    const profile1 = await profileUserId(rawUser1);
    const profile2 = await profileUserId(rawUser2);
    expect(profile1).not.toBe(profile2);
    expect(await profileDisplayLabel(profile1)).toBe("Profile 1");
    expect(await profileDisplayLabel(profile2)).toBe("Profile 2");
    expect(await loadFavouriteSeats(profile1)).toEqual(
      storageFixtures.multipleAccounts[
        "favouriteSeatsByAccount:sanitized-user-1"
      ],
    );
    expect(await loadFavouriteSeats(profile2)).toEqual(
      storageFixtures.multipleAccounts[
        "favouriteSeatsByAccount:sanitized-user-2"
      ],
    );
    expect(await profileUserId()).toBe(SIGNED_OUT_PROFILE_ID);
  });

  it("keeps three observed accounts and Guest isolated", async () => {
    installChromeStorage();
    const rawUserIds = ["user-1", "user-2", "user-3"];
    const profileIds: string[] = [];

    for (const [index, rawUserId] of rawUserIds.entries()) {
      const profileId = await profileUserId(rawUserId);
      profileIds.push(profileId);
      await saveFavouriteSeats(profileId, [
        {
          branchId: `${index}`,
          areaId: `${index}`,
          seatId: `${index}`,
          seatCode: `${index}`,
          seatName: `S${index}`,
        },
      ]);
    }
    await saveFavouriteSeats(
      SIGNED_OUT_PROFILE_ID,
      storageFixtures.freshSignedOut.favouriteSeats,
    );

    for (const [index, profileId] of profileIds.entries()) {
      expect(await loadFavouriteSeats(profileId)).toMatchObject([
        { seatId: `${index}` },
      ]);
    }
    expect(await loadFavouriteSeats(SIGNED_OUT_PROFILE_ID)).toEqual(
      storageFixtures.freshSignedOut.favouriteSeats,
    );
  });

  it("resumes a partially migrated schema using the existing secret", async () => {
    const secret = "A".repeat(43);
    const rawUserId = "sanitized-user-1";
    const profileId = await deriveOpaqueProfileId(rawUserId, secret);
    const existingFavourite = {
      branchId: "30",
      areaId: "40",
      seatId: "seat-existing",
      seatCode: "EXISTING",
      seatName: "Existing",
    };
    const { values } = installChromeStorage({
      ...storageFixtures.oneAccount,
      [PROFILE_SECRET_KEY]: secret,
      [PROFILE_ORDER_KEY]: [profileId],
      [accountFavouritesKey(profileId)]: [existingFavourite],
    });

    expect(await profileUserId(rawUserId)).toBe(profileId);
    expect(await loadFavouriteSeats(profileId)).toEqual([
      existingFavourite,
      ...storageFixtures.oneAccount[
        "favouriteSeatsByAccount:sanitized-user-1"
      ],
    ]);
    expect(values[STORAGE_SCHEMA_VERSION_KEY]).toBe(1);
    expectNoRawUserId(values, rawUserId);
  });

  it("does not delete legacy source data when migration writing fails", async () => {
    const rawUserId = "sanitized-user-1";
    const { values } = installChromeStorage(storageFixtures.oneAccount, {
      failSetCalls: [2],
    });

    await expect(profileUserId(rawUserId)).rejects.toThrow(
      "simulated storage write failure",
    );

    expect(values).toHaveProperty(
      "favouriteSeatsByAccount:sanitized-user-1",
    );
    expect(values).toHaveProperty(
      "lastSeatSelectionByAccount:sanitized-user-1",
    );
    expect(values).not.toHaveProperty(STORAGE_SCHEMA_VERSION_KEY);

    const profileId = await profileUserId(rawUserId);
    expect(isOpaqueProfileId(profileId)).toBe(true);
    expectNoRawUserId(values, rawUserId);
  });

  it("ignores malformed legacy values rather than upgrading them", async () => {
    const { values } = installChromeStorage({
      ...storageFixtures.malformedValues,
      "favouriteSeatsByAccount:%E0%A4%A": "invalid",
    });

    expect(await profileUserId()).toBe(SIGNED_OUT_PROFILE_ID);
    expect(await loadFavouriteSeats(SIGNED_OUT_PROFILE_ID)).toEqual([]);
    expect(await loadLastSeatSelection(SIGNED_OUT_PROFILE_ID)).toBeUndefined();
    expect(values[PROFILE_ORDER_KEY]).toEqual([]);
    expect(Object.keys(values).some((key) => key.includes("%E0%A4%A"))).toBe(
      false,
    );
  });
});

describe("schema-1 inventory and deletion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("inventories opaque profiles without modifying a current schema", async () => {
    const { local, values } = installChromeStorage();
    const profile1 = await profileUserId("user-1");
    const profile2 = await profileUserId("user-2");
    await saveFavouriteSeats(
      profile1,
      storageFixtures.freshSignedOut.favouriteSeats,
    );
    await saveLastSeatSelection(
      profile2,
      storageFixtures.freshSignedOut.lastSeatSelection,
    );
    const before = structuredClone(values);
    local.set.mockClear();
    local.remove.mockClear();

    const inventory = await readProfileStorageInventory();

    expect(inventory.schemaVersion).toBe(1);
    expect(inventory.accounts).toEqual([
      {
        profileId: profile1,
        label: "Profile 1",
        kind: "account",
        favouriteCount: 1,
        hasLastSelection: false,
        isLastActive: false,
      },
      {
        profileId: profile2,
        label: "Profile 2",
        kind: "account",
        favouriteCount: 0,
        hasLastSelection: true,
        isLastActive: true,
      },
    ]);
    expect(values).toEqual(before);
    expect(local.set).not.toHaveBeenCalled();
    expect(local.remove).not.toHaveBeenCalled();
  });

  it("clears only Guest data", async () => {
    const { values } = installChromeStorage(storageFixtures.freshSignedOut);
    const profileId = await profileUserId("user-1");
    await saveFavouriteSeats(
      profileId,
      storageFixtures.freshSignedOut.favouriteSeats,
    );

    await clearGuestProfileData();

    expect(values).not.toHaveProperty(GUEST_FAVOURITES_KEY);
    expect(values).not.toHaveProperty(GUEST_SELECTION_KEY);
    expect(values).toHaveProperty(accountFavouritesKey(profileId));
  });

  it("clears one profile without affecting Guest or another profile", async () => {
    const { values } = installChromeStorage(storageFixtures.freshSignedOut);
    const profile1 = await profileUserId("user-1");
    const profile2 = await profileUserId("user-2");
    await saveFavouriteSeats(profile1, storageFixtures.freshSignedOut.favouriteSeats);
    await saveFavouriteSeats(profile2, storageFixtures.freshSignedOut.favouriteSeats);
    await saveGuestCopyDecision(profile1, "kept-separate");

    await clearAccountProfileData(profile1);

    expect(values).not.toHaveProperty(accountFavouritesKey(profile1));
    expect(values).not.toHaveProperty(accountSelectionKey(profile1));
    expect(values).not.toHaveProperty(accountGuestDecisionKey(profile1));
    expect(values).toHaveProperty(accountFavouritesKey(profile2));
    expect(values).toHaveProperty(GUEST_FAVOURITES_KEY);
    expect(values[PROFILE_ORDER_KEY]).toEqual([profile2]);
  });

  it("clears all known data while preserving unrelated storage", async () => {
    const { values } = installChromeStorage({
      ...storageFixtures.multipleAccounts,
      unrelatedExtensionKey: "preserve me",
    });
    await profileUserId();

    await clearAllProfileData();

    expect(values).toEqual({ unrelatedExtensionKey: "preserve me" });
  });
});
