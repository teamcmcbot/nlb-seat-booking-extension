import {
  accountSelectionKey,
  GUEST_SELECTION_KEY,
  isLastSeatSelection,
  type LastSeatSelection,
  SIGNED_OUT_PROFILE_ID,
} from "./profileStorage";

export type { LastSeatSelection } from "./profileStorage";

export async function loadLastSeatSelection(userId: string) {
  const storageKey =
    userId === SIGNED_OUT_PROFILE_ID
      ? GUEST_SELECTION_KEY
      : accountSelectionKey(userId);
  const result = await chrome.storage.local.get(storageKey);
  const stored = result[storageKey];
  return isLastSeatSelection(stored) ? stored : undefined;
}

export async function saveLastSeatSelection(
  userId: string,
  selection: LastSeatSelection,
) {
  await chrome.storage.local.set({
    [userId === SIGNED_OUT_PROFILE_ID
      ? GUEST_SELECTION_KEY
      : accountSelectionKey(userId)]: selection,
  });
}
