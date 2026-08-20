export const DEFAULT_BOOKING_MODE_KEY = "librarySeatsDefaultBookingMode";

export type DefaultBookingMode = "combine" | "separate";

export const FALLBACK_DEFAULT_BOOKING_MODE: DefaultBookingMode = "combine";

export async function loadDefaultBookingMode(): Promise<DefaultBookingMode> {
  const stored = await chrome.storage.local.get(DEFAULT_BOOKING_MODE_KEY);
  return stored[DEFAULT_BOOKING_MODE_KEY] === "separate"
    ? "separate"
    : FALLBACK_DEFAULT_BOOKING_MODE;
}

export async function saveDefaultBookingMode(mode: DefaultBookingMode) {
  await chrome.storage.local.set({ [DEFAULT_BOOKING_MODE_KEY]: mode });
}
