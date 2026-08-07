const LEGACY_STORAGE_KEY = "lastSeatSelection";
const STORAGE_KEY_PREFIX = "lastSeatSelectionByAccount";

function storageKey(userId: string) {
  return `${STORAGE_KEY_PREFIX}:${encodeURIComponent(userId)}`;
}

export interface LastSeatSelection {
  branchId: string;
  areaId: string;
}

function isLastSeatSelection(value: unknown): value is LastSeatSelection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.branchId === "string" &&
    typeof record.areaId === "string"
  );
}

export async function loadLastSeatSelection(userId: string) {
  const signedOutProfile = userId === SIGNED_OUT_PROFILE_ID;
  const accountKey = storageKey(userId);
  const result = await chrome.storage.local.get([
    accountKey,
    LEGACY_STORAGE_KEY,
  ]);
  const stored = result[accountKey];

  if (isLastSeatSelection(stored)) {
    return stored;
  }

  const legacy = result[LEGACY_STORAGE_KEY];
  if (isLastSeatSelection(legacy)) {
    if (signedOutProfile) {
      return legacy;
    }

    await chrome.storage.local.set({ [accountKey]: legacy });
    await chrome.storage.local.remove(LEGACY_STORAGE_KEY);
    return legacy;
  }

  return undefined;
}

export async function saveLastSeatSelection(
  userId: string,
  selection: LastSeatSelection,
) {
  await chrome.storage.local.set({
    [userId === SIGNED_OUT_PROFILE_ID
      ? LEGACY_STORAGE_KEY
      : storageKey(userId)]: selection,
  });
}
import { SIGNED_OUT_PROFILE_ID } from "./accountProfiles";
