const LAST_ACTIVE_USER_KEY = "lastActiveNlbUserId";
export const SIGNED_OUT_PROFILE_ID = "__signed_out__";

export async function profileUserId(activeUserId?: string) {
  const stored = await chrome.storage.local.get(LAST_ACTIVE_USER_KEY);
  const lastActiveUserId = stored[LAST_ACTIVE_USER_KEY];

  if (activeUserId) {
    if (lastActiveUserId !== activeUserId) {
      await chrome.storage.local.set({
        [LAST_ACTIVE_USER_KEY]: activeUserId,
      });
    }

    return activeUserId;
  }

  return typeof lastActiveUserId === "string" && lastActiveUserId
    ? lastActiveUserId
    : SIGNED_OUT_PROFILE_ID;
}
