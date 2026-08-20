import type { FavouriteSeat } from "../models/catalog";

export const CURRENT_STORAGE_SCHEMA_VERSION = 1;

// Stable legacy storage namespace retained across the public product rename.
// Do not rename these persisted values without a versioned, verified migration.
export const STORAGE_SCHEMA_VERSION_KEY = "studySeatStorageSchemaVersion";
export const PROFILE_SECRET_KEY = "studySeatProfileSecret";
export const PROFILE_ORDER_KEY = "studySeatProfileOrder";
export const LAST_ACTIVE_PROFILE_KEY = "studySeatLastActiveProfile";
export const PRIVACY_ACKNOWLEDGEMENT_KEY =
  "studySeatPrivacyDisclosureAcknowledged";
export const SIGNED_OUT_PROFILE_ID = "guest";
export const GUEST_FAVOURITES_KEY = "studySeatGuestFavourites";
export const GUEST_SELECTION_KEY = "studySeatGuestSelection";
export const ACCOUNT_PROFILE_PREFIX = "studySeatProfile";

const LEGACY_LAST_ACTIVE_USER_KEY = "lastActiveNlbUserId";
const LEGACY_GUEST_FAVOURITES_KEY = "favouriteSeats";
const LEGACY_ACCOUNT_FAVOURITES_PREFIX = "favouriteSeatsByAccount";
const LEGACY_GUEST_SELECTION_KEY = "lastSeatSelection";
const LEGACY_ACCOUNT_SELECTION_PREFIX = "lastSeatSelectionByAccount";
const OPAQUE_PROFILE_ID_PATTERN = /^profile_[A-Za-z0-9_-]{43}$/;

export type GuestCopyDecision = "copied" | "kept-separate";

export interface GuestCopyState {
  decision: GuestCopyDecision;
  acknowledgedFavouriteKeys?: string[];
}

export interface LastSeatSelection {
  branchId: string;
  areaId: string;
}

export interface StoredProfileSummary {
  profileId: string;
  label: string;
  kind: "guest" | "account";
  favouriteCount: number;
  hasLastSelection: boolean;
  isLastActive: boolean;
}

export interface ProfileStorageInventory {
  schemaVersion: number;
  guest: StoredProfileSummary;
  accounts: StoredProfileSummary[];
  knownKeys: string[];
  malformedKeys: string[];
}

function accountProfileKey(profileId: string, field: string) {
  return `${ACCOUNT_PROFILE_PREFIX}:${profileId}:${field}`;
}

export function accountFavouritesKey(profileId: string) {
  return accountProfileKey(profileId, "favourites");
}

export function accountSelectionKey(profileId: string) {
  return accountProfileKey(profileId, "selection");
}

export function accountGuestDecisionKey(profileId: string) {
  return accountProfileKey(profileId, "guestDecision");
}

export function isOpaqueProfileId(value: unknown): value is string {
  return typeof value === "string" && OPAQUE_PROFILE_ID_PATTERN.test(value);
}

export function isFavouriteSeat(value: unknown): value is FavouriteSeat {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return ["branchId", "areaId", "seatId", "seatCode", "seatName"].every(
    (key) => typeof record[key] === "string",
  );
}

export function isLastSeatSelection(
  value: unknown,
): value is LastSeatSelection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.branchId === "string" &&
    typeof record.areaId === "string"
  );
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((value) => {
    binary += String.fromCharCode(value);
  });
  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");
}

function base64UrlToBytes(value: string) {
  const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function validSecret(value: unknown) {
  if (typeof value !== "string") {
    return undefined;
  }

  try {
    return base64UrlToBytes(value).length === 32 ? value : undefined;
  } catch {
    return undefined;
  }
}

function newProfileSecret() {
  return bytesToBase64Url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function deriveOpaqueProfileId(
  rawUserId: string,
  secret: string,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    base64UrlToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(rawUserId),
  );
  return `profile_${bytesToBase64Url(new Uint8Array(signature))}`;
}

function legacyAccountKey(prefix: string, rawUserId: string) {
  return `${prefix}:${encodeURIComponent(rawUserId)}`;
}

function legacyAccountIdFromKey(key: string, prefix: string) {
  const keyPrefix = `${prefix}:`;
  if (!key.startsWith(keyPrefix)) {
    return undefined;
  }

  const encodedUserId = key.slice(keyPrefix.length);
  if (!encodedUserId) {
    return undefined;
  }

  try {
    const rawUserId = decodeURIComponent(encodedUserId);
    return rawUserId || undefined;
  } catch {
    return undefined;
  }
}

function profileIdFromKey(key: string) {
  const match = key.match(
    new RegExp(
      `^${ACCOUNT_PROFILE_PREFIX}:(profile_[A-Za-z0-9_-]{43}):(favourites|selection|guestDecision)$`,
    ),
  );
  return match?.[1];
}

function validProfileOrder(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.filter(isOpaqueProfileId))];
}

function validFavourites(value: unknown) {
  return Array.isArray(value) ? value.filter(isFavouriteSeat) : [];
}

function mergeFavourites(...lists: FavouriteSeat[][]) {
  const merged = new Map<string, FavouriteSeat>();
  lists.flat().forEach((favourite) => {
    merged.set(
      `${favourite.branchId}:${favourite.areaId}:${favourite.seatId}`,
      favourite,
    );
  });
  return [...merged.values()];
}

function isLegacyDynamicKey(key: string) {
  return (
    key.startsWith(`${LEGACY_ACCOUNT_FAVOURITES_PREFIX}:`) ||
    key.startsWith(`${LEGACY_ACCOUNT_SELECTION_PREFIX}:`)
  );
}

function isAccountProfileKey(key: string) {
  return key.startsWith(`${ACCOUNT_PROFILE_PREFIX}:`);
}

function legacyKeys(stored: Record<string, unknown>) {
  const exact = new Set([
    LEGACY_LAST_ACTIVE_USER_KEY,
    LEGACY_GUEST_FAVOURITES_KEY,
    LEGACY_GUEST_SELECTION_KEY,
  ]);
  return Object.keys(stored).filter(
    (key) => exact.has(key) || isLegacyDynamicKey(key),
  );
}

function valuesMatch(left: unknown, right: unknown) {
  return JSON.stringify(left) === JSON.stringify(right);
}

async function migrateToCurrentSchema() {
  const stored = (await chrome.storage.local.get(null)) as Record<
    string,
    unknown
  >;
  const storedVersion = stored[STORAGE_SCHEMA_VERSION_KEY];
  if (
    typeof storedVersion === "number" &&
    storedVersion > CURRENT_STORAGE_SCHEMA_VERSION
  ) {
    throw new Error("Unsupported Library Seats SG storage schema");
  }

  const sources = legacyKeys(stored);
  const existingSecret = validSecret(stored[PROFILE_SECRET_KEY]);
  if (
    storedVersion === CURRENT_STORAGE_SCHEMA_VERSION &&
    existingSecret &&
    sources.length === 0
  ) {
    return;
  }
  if (Object.hasOwn(stored, PROFILE_SECRET_KEY) && !existingSecret) {
    throw new Error("Library Seats SG profile secret is malformed");
  }

  const secret = existingSecret ?? newProfileSecret();
  if (!existingSecret) {
    await chrome.storage.local.set({ [PROFILE_SECRET_KEY]: secret });
  }

  const rawAccountIds = new Set<string>();
  for (const key of sources) {
    const prefix = key.startsWith(`${LEGACY_ACCOUNT_FAVOURITES_PREFIX}:`)
      ? LEGACY_ACCOUNT_FAVOURITES_PREFIX
      : key.startsWith(`${LEGACY_ACCOUNT_SELECTION_PREFIX}:`)
        ? LEGACY_ACCOUNT_SELECTION_PREFIX
        : undefined;
    if (!prefix) {
      continue;
    }

    const rawUserId = legacyAccountIdFromKey(key, prefix);
    if (rawUserId) {
      rawAccountIds.add(rawUserId);
    }
  }

  const legacyLastActive = stored[LEGACY_LAST_ACTIVE_USER_KEY];
  if (typeof legacyLastActive === "string" && legacyLastActive) {
    rawAccountIds.add(legacyLastActive);
  }

  const profileIdsByRawId = new Map<string, string>();
  for (const rawUserId of [...rawAccountIds].sort()) {
    profileIdsByRawId.set(
      rawUserId,
      await deriveOpaqueProfileId(rawUserId, secret),
    );
  }

  const profileOrder = validProfileOrder(stored[PROFILE_ORDER_KEY]);
  Object.keys(stored).forEach((key) => {
    const profileId = profileIdFromKey(key);
    if (profileId && !profileOrder.includes(profileId)) {
      profileOrder.push(profileId);
    }
  });
  profileIdsByRawId.forEach((profileId) => {
    if (!profileOrder.includes(profileId)) {
      profileOrder.push(profileId);
    }
  });

  const migrated: Record<string, unknown> = {
    [PROFILE_SECRET_KEY]: secret,
    [PROFILE_ORDER_KEY]: profileOrder,
  };

  if (
    Object.hasOwn(stored, LEGACY_GUEST_FAVOURITES_KEY) ||
    Object.hasOwn(stored, GUEST_FAVOURITES_KEY)
  ) {
    migrated[GUEST_FAVOURITES_KEY] = mergeFavourites(
      validFavourites(stored[GUEST_FAVOURITES_KEY]),
      validFavourites(stored[LEGACY_GUEST_FAVOURITES_KEY]),
    );
  }

  const currentGuestSelection = stored[GUEST_SELECTION_KEY];
  const legacyGuestSelection = stored[LEGACY_GUEST_SELECTION_KEY];
  if (isLastSeatSelection(currentGuestSelection)) {
    migrated[GUEST_SELECTION_KEY] = currentGuestSelection;
  } else if (isLastSeatSelection(legacyGuestSelection)) {
    migrated[GUEST_SELECTION_KEY] = legacyGuestSelection;
  }

  for (const [rawUserId, profileId] of profileIdsByRawId) {
    const currentFavouritesKey = accountFavouritesKey(profileId);
    const legacyFavouritesKey = legacyAccountKey(
      LEGACY_ACCOUNT_FAVOURITES_PREFIX,
      rawUserId,
    );
    if (
      Object.hasOwn(stored, currentFavouritesKey) ||
      Object.hasOwn(stored, legacyFavouritesKey)
    ) {
      migrated[currentFavouritesKey] = mergeFavourites(
        validFavourites(stored[currentFavouritesKey]),
        validFavourites(stored[legacyFavouritesKey]),
      );
    }

    const currentSelectionKey = accountSelectionKey(profileId);
    const legacySelectionKey = legacyAccountKey(
      LEGACY_ACCOUNT_SELECTION_PREFIX,
      rawUserId,
    );
    const currentSelection = stored[currentSelectionKey];
    const legacySelection = stored[legacySelectionKey];
    if (isLastSeatSelection(currentSelection)) {
      migrated[currentSelectionKey] = currentSelection;
    } else if (isLastSeatSelection(legacySelection)) {
      migrated[currentSelectionKey] = legacySelection;
    }
  }

  const currentLastActive = stored[LAST_ACTIVE_PROFILE_KEY];
  if (isOpaqueProfileId(currentLastActive)) {
    migrated[LAST_ACTIVE_PROFILE_KEY] = currentLastActive;
  } else if (typeof legacyLastActive === "string" && legacyLastActive) {
    migrated[LAST_ACTIVE_PROFILE_KEY] = profileIdsByRawId.get(legacyLastActive);
  }

  await chrome.storage.local.set(migrated);
  const written = await chrome.storage.local.get(Object.keys(migrated));
  if (
    Object.entries(migrated).some(
      ([key, value]) => !valuesMatch(written[key], value),
    )
  ) {
    throw new Error("Could not verify migrated Library Seats SG profile data");
  }

  if (sources.length > 0) {
    await chrome.storage.local.remove(sources);
    const remaining = await chrome.storage.local.get(sources);
    if (sources.some((key) => Object.hasOwn(remaining, key))) {
      throw new Error("Could not remove legacy Library Seats SG profile data");
    }
  }

  await chrome.storage.local.set({
    [STORAGE_SCHEMA_VERSION_KEY]: CURRENT_STORAGE_SCHEMA_VERSION,
  });
}

let migrationInFlight: Promise<void> | undefined;

export async function ensureProfileStorageSchema() {
  if (!migrationInFlight) {
    migrationInFlight = migrateToCurrentSchema().finally(() => {
      migrationInFlight = undefined;
    });
  }
  return migrationInFlight;
}

export async function opaqueProfileIdForUser(rawUserId: string) {
  await ensureProfileStorageSchema();
  const stored = await chrome.storage.local.get([
    PROFILE_SECRET_KEY,
    PROFILE_ORDER_KEY,
  ]);
  const secret = validSecret(stored[PROFILE_SECRET_KEY]);
  if (!secret) {
    throw new Error("Library Seats SG profile secret is unavailable");
  }

  const profileId = await deriveOpaqueProfileId(rawUserId, secret);
  const profileOrder = validProfileOrder(stored[PROFILE_ORDER_KEY]);
  if (!profileOrder.includes(profileId)) {
    profileOrder.push(profileId);
  }
  await chrome.storage.local.set({
    [PROFILE_ORDER_KEY]: profileOrder,
    [LAST_ACTIVE_PROFILE_KEY]: profileId,
  });
  return profileId;
}

export async function profileDisplayLabel(profileId: string) {
  await ensureProfileStorageSchema();
  const stored = await chrome.storage.local.get(PROFILE_ORDER_KEY);
  const index = validProfileOrder(stored[PROFILE_ORDER_KEY]).indexOf(profileId);
  return index >= 0 ? `Profile ${index + 1}` : "Signed-in profile";
}

function knownStorageKey(key: string) {
  return (
    [
      STORAGE_SCHEMA_VERSION_KEY,
      PROFILE_SECRET_KEY,
      PROFILE_ORDER_KEY,
      LAST_ACTIVE_PROFILE_KEY,
      PRIVACY_ACKNOWLEDGEMENT_KEY,
      GUEST_FAVOURITES_KEY,
      GUEST_SELECTION_KEY,
      LEGACY_LAST_ACTIVE_USER_KEY,
      LEGACY_GUEST_FAVOURITES_KEY,
      LEGACY_GUEST_SELECTION_KEY,
    ].includes(key) ||
    isAccountProfileKey(key) ||
    isLegacyDynamicKey(key)
  );
}

export async function readProfileStorageInventory(): Promise<ProfileStorageInventory> {
  await ensureProfileStorageSchema();
  const stored = (await chrome.storage.local.get(null)) as Record<
    string,
    unknown
  >;
  const malformedKeys = new Set<string>();
  const profileOrder = validProfileOrder(stored[PROFILE_ORDER_KEY]);
  if (
    !Array.isArray(stored[PROFILE_ORDER_KEY]) ||
    profileOrder.length !== stored[PROFILE_ORDER_KEY].length
  ) {
    malformedKeys.add(PROFILE_ORDER_KEY);
  }

  const discoveredProfileIds = new Set(profileOrder);
  Object.keys(stored).forEach((key) => {
    if (!isAccountProfileKey(key)) {
      return;
    }
    const profileId = profileIdFromKey(key);
    if (profileId) {
      discoveredProfileIds.add(profileId);
    } else {
      malformedKeys.add(key);
    }
  });

  const lastActiveProfile = stored[LAST_ACTIVE_PROFILE_KEY];
  if (
    Object.hasOwn(stored, LAST_ACTIVE_PROFILE_KEY) &&
    !isOpaqueProfileId(lastActiveProfile)
  ) {
    malformedKeys.add(LAST_ACTIVE_PROFILE_KEY);
  }

  const guestFavourites = stored[GUEST_FAVOURITES_KEY];
  const guestSelection = stored[GUEST_SELECTION_KEY];
  if (
    Object.hasOwn(stored, GUEST_FAVOURITES_KEY) &&
    (!Array.isArray(guestFavourites) ||
      guestFavourites.some((value) => !isFavouriteSeat(value)))
  ) {
    malformedKeys.add(GUEST_FAVOURITES_KEY);
  }
  if (
    Object.hasOwn(stored, GUEST_SELECTION_KEY) &&
    !isLastSeatSelection(guestSelection)
  ) {
    malformedKeys.add(GUEST_SELECTION_KEY);
  }

  const orderedProfileIds = [
    ...profileOrder,
    ...[...discoveredProfileIds].filter(
      (profileId) => !profileOrder.includes(profileId),
    ),
  ];
  const accounts = orderedProfileIds.map(
    (profileId, index): StoredProfileSummary => {
      const favouritesKey = accountFavouritesKey(profileId);
      const selectionKey = accountSelectionKey(profileId);
      const favourites = stored[favouritesKey];
      const selection = stored[selectionKey];
      if (
        Object.hasOwn(stored, favouritesKey) &&
        (!Array.isArray(favourites) ||
          favourites.some((value) => !isFavouriteSeat(value)))
      ) {
        malformedKeys.add(favouritesKey);
      }
      if (
        Object.hasOwn(stored, selectionKey) &&
        !isLastSeatSelection(selection)
      ) {
        malformedKeys.add(selectionKey);
      }

      return {
        profileId,
        label: `Profile ${index + 1}`,
        kind: "account",
        favouriteCount: validFavourites(favourites).length,
        hasLastSelection: isLastSeatSelection(selection),
        isLastActive: profileId === lastActiveProfile,
      };
    },
  );

  return {
    schemaVersion: CURRENT_STORAGE_SCHEMA_VERSION,
    guest: {
      profileId: SIGNED_OUT_PROFILE_ID,
      label: "Guest",
      kind: "guest",
      favouriteCount: validFavourites(guestFavourites).length,
      hasLastSelection: isLastSeatSelection(guestSelection),
      isLastActive: false,
    },
    accounts,
    knownKeys: Object.keys(stored).filter(knownStorageKey).sort(),
    malformedKeys: [...malformedKeys].sort(),
  };
}

export async function loadGuestCopyState(
  profileId: string,
): Promise<GuestCopyState | undefined> {
  const key = accountGuestDecisionKey(profileId);
  const stored = await chrome.storage.local.get(key);
  const value = stored[key];
  if (value === "copied" || value === "kept-separate") {
    return { decision: value };
  }
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as Record<string, unknown>;
  if (
    record.decision !== "copied" &&
    record.decision !== "kept-separate"
  ) {
    return undefined;
  }
  const acknowledgedFavouriteKeys = Array.isArray(
    record.acknowledgedFavouriteKeys,
  )
    ? [
        ...new Set(
          record.acknowledgedFavouriteKeys.filter(
            (item): item is string => typeof item === "string" && item !== "",
          ),
        ),
      ]
    : undefined;
  return {
    decision: record.decision,
    acknowledgedFavouriteKeys,
  };
}

export async function loadGuestCopyDecision(profileId: string) {
  return (await loadGuestCopyState(profileId))?.decision;
}

export async function saveGuestCopyDecision(
  profileId: string,
  decision: GuestCopyDecision,
  acknowledgedFavouriteKeys?: string[],
) {
  await chrome.storage.local.set({
    [accountGuestDecisionKey(profileId)]: {
      decision,
      ...(acknowledgedFavouriteKeys
        ? { acknowledgedFavouriteKeys: [...new Set(acknowledgedFavouriteKeys)] }
        : {}),
    },
  });
}

export async function resetGuestCopyDecision(profileId: string) {
  await chrome.storage.local.remove(accountGuestDecisionKey(profileId));
}

export async function privacyDisclosureAcknowledged() {
  const stored = await chrome.storage.local.get(PRIVACY_ACKNOWLEDGEMENT_KEY);
  return stored[PRIVACY_ACKNOWLEDGEMENT_KEY] === true;
}

export async function acknowledgePrivacyDisclosure() {
  await chrome.storage.local.set({
    [PRIVACY_ACKNOWLEDGEMENT_KEY]: true,
  });
}

export async function clearGuestProfileData() {
  await ensureProfileStorageSchema();
  await chrome.storage.local.remove([
    GUEST_FAVOURITES_KEY,
    GUEST_SELECTION_KEY,
  ]);
}

export async function clearAccountProfileData(profileId: string) {
  if (!isOpaqueProfileId(profileId)) {
    throw new Error("A valid account profile ID is required");
  }

  await ensureProfileStorageSchema();
  const stored = await chrome.storage.local.get([
    PROFILE_ORDER_KEY,
    LAST_ACTIVE_PROFILE_KEY,
  ]);
  const keys = [
    accountFavouritesKey(profileId),
    accountSelectionKey(profileId),
    accountGuestDecisionKey(profileId),
  ];
  if (stored[LAST_ACTIVE_PROFILE_KEY] === profileId) {
    keys.push(LAST_ACTIVE_PROFILE_KEY);
  }
  await chrome.storage.local.remove(keys);
  await chrome.storage.local.set({
    [PROFILE_ORDER_KEY]: validProfileOrder(stored[PROFILE_ORDER_KEY]).filter(
      (storedProfileId) => storedProfileId !== profileId,
    ),
  });
}

export async function clearCurrentProfileData(profileId: string) {
  if (!isOpaqueProfileId(profileId)) {
    throw new Error("A valid account profile ID is required");
  }

  await ensureProfileStorageSchema();
  await chrome.storage.local.remove([
    accountFavouritesKey(profileId),
    accountSelectionKey(profileId),
  ]);
}

export async function clearAllProfileData() {
  const stored = (await chrome.storage.local.get(null)) as Record<
    string,
    unknown
  >;
  const keys = Object.keys(stored).filter(knownStorageKey);
  if (keys.length > 0) {
    await chrome.storage.local.remove(keys);
  }
}
