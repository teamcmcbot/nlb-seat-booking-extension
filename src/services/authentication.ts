import { NlbApiError } from "../api/account";

const SEAT_BOOKING_LOGOUT_URL =
  "https://www.nlb.gov.sg/seatbooking/api/logout";
const NLB_LOGOUT_URL =
  "https://signin.nlb.gov.sg/authenticate/oidc/logout";
const SEAT_BOOKING_URL = "https://www.nlb.gov.sg/seatbooking/";
const SEAT_BOOKING_MODE = "OffsiteMode";
const AUTH_PENDING_KEY = "nlbSeatHelper.authPending";
const AUTH_PENDING_MAX_AGE_MS = 5 * 60_000;

interface PendingAuthentication {
  startedAt: number;
}

function pendingAuthentication(): PendingAuthentication | undefined {
  const stored = window.sessionStorage.getItem(AUTH_PENDING_KEY);
  if (!stored) {
    return undefined;
  }

  try {
    const pending = JSON.parse(stored) as Partial<PendingAuthentication>;
    if (
      typeof pending.startedAt !== "number" ||
      Date.now() - pending.startedAt > AUTH_PENDING_MAX_AGE_MS
    ) {
      clearAuthenticationPending();
      return undefined;
    }

    return pending as PendingAuthentication;
  } catch {
    clearAuthenticationPending();
    return undefined;
  }
}

export function isAuthenticationPending() {
  return Boolean(pendingAuthentication());
}

export function clearAuthenticationPending() {
  window.sessionStorage.removeItem(AUTH_PENDING_KEY);
}

export function beginSignIn() {
  const loginControl = document.querySelector<HTMLButtonElement>(
    'button[aria-label="Log in"].mdi-login-variant',
  );

  if (!loginControl) {
    throw new NlbApiError(
      "NLB's sign-in control is not available. Refresh the account and try again.",
    );
  }

  window.sessionStorage.setItem(
    AUTH_PENDING_KEY,
    JSON.stringify({ startedAt: Date.now() }),
  );
  loginControl.click();
}

export async function beginSignOut() {
  const response = await fetch(SEAT_BOOKING_LOGOUT_URL, {
    method: "POST",
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ Mode: SEAT_BOOKING_MODE }),
  });

  if (!response.ok) {
    throw new NlbApiError(
      `NLB logout returned ${response.status} ${response.statusText}`.trim(),
      response.status,
    );
  }

  clearAuthenticationPending();
  const logoutUrl = new URL(NLB_LOGOUT_URL);
  logoutUrl.searchParams.set("service", SEAT_BOOKING_URL);
  window.location.assign(logoutUrl.href);
}
