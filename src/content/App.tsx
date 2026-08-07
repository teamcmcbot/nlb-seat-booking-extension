import { useCallback, useEffect, useRef, useState } from "react";
import { getAccountInfo, NlbApiError } from "../api/account";
import { SeatAssistant } from "../components/SeatAssistant";
import type { AccountSession } from "../models/account";
import type { Catalog } from "../models/catalog";
import { extractAccountSession } from "../services/accountSession";
import { profileUserId } from "../services/accountProfiles";
import {
  beginSignIn,
  beginSignOut,
  clearAuthenticationPending,
  isAuthenticationPending,
} from "../services/authentication";
import { extractCatalog } from "../services/catalog";

type AccountState =
  | { status: "loading" }
  | {
      status: "signedOut";
      catalog?: Catalog;
      profileUserId: string;
    }
  | {
      status: "signedIn";
      session: AccountSession;
      catalog: Catalog;
      profileUserId: string;
    }
  | { status: "error"; message: string };

interface RefreshedAccount {
  session?: AccountSession;
  catalog?: Catalog;
}

const AUTH_RETRY_DELAYS = [0, 250, 500, 1_000, 2_000, 3_000];
const RELOAD_PATHS = new Set([
  "/seatbooking",
  "/seatbooking/account",
  "/seatbooking/new/bookingdetails",
  "/seatbooking/mybookings",
]);

function requestsExtensionReload(url: string) {
  const parsedUrl = new URL(url);
  const pathname =
    parsedUrl.pathname.endsWith("/") && parsedUrl.pathname !== "/"
      ? parsedUrl.pathname.slice(0, -1)
      : parsedUrl.pathname;

  return (
    parsedUrl.origin === "https://www.nlb.gov.sg" &&
    parsedUrl.searchParams.get("reload") === "true" &&
    RELOAD_PATHS.has(pathname)
  );
}

async function accountStateFrom(accountInfo: unknown): Promise<AccountState> {
  const session = extractAccountSession(accountInfo);
  const activeProfileUserId = await profileUserId(session?.userId);
  return session
    ? {
        status: "signedIn",
        session,
        catalog: extractCatalog(accountInfo),
        profileUserId: activeProfileUserId,
      }
    : {
        status: "signedOut",
        catalog: extractCatalog(accountInfo),
        profileUserId: activeProfileUserId,
      };
}

function isMissingSessionError(error: unknown) {
  return (
    error instanceof NlbApiError &&
    (error.status === 401 || error.status === 403)
  );
}

function getErrorMessage(error: unknown) {
  if (error instanceof NlbApiError) {
    return error.message;
  }

  return "Could not connect to NLB. Please refresh or try again.";
}

function wait(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    if (milliseconds === 0 || signal.aborted) {
      resolve();
      return;
    }

    const timeout = window.setTimeout(resolve, milliseconds);
    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timeout);
        resolve();
      },
      { once: true },
    );
  });
}

async function loadAccountState(
  signal: AbortSignal,
  waitForAuthentication = false,
) {
  const delays = waitForAuthentication ? AUTH_RETRY_DELAYS : [0];
  let lastState: AccountState = {
    status: "signedOut",
    profileUserId: await profileUserId(),
  };

  for (const delay of delays) {
    await wait(delay, signal);
    if (signal.aborted) {
      return lastState;
    }

    try {
      const accountInfo = await getAccountInfo(signal);
      lastState = await accountStateFrom(accountInfo);
      if (lastState.status === "signedIn" || !waitForAuthentication) {
        return lastState;
      }
    } catch (error) {
      if (isMissingSessionError(error)) {
        lastState = {
          status: "signedOut",
          profileUserId: await profileUserId(),
        };
        if (!waitForAuthentication) {
          return lastState;
        }
        continue;
      }

      throw error;
    }
  }

  return lastState;
}

export function App() {
  const [accountState, setAccountState] = useState<AccountState>({
    status: "loading",
  });
  const [requestId, setRequestId] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [finishingAuthentication, setFinishingAuthentication] = useState(
    isAuthenticationPending,
  );
  const [refreshingAccount, setRefreshingAccount] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [accountActionError, setAccountActionError] = useState("");
  const refreshInFlight = useRef<Promise<RefreshedAccount> | null>(null);

  const retry = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);
  const refreshAccountSilently = useCallback(() => {
    if (refreshInFlight.current) {
      return refreshInFlight.current;
    }

    const controller = new AbortController();
    const refresh = loadAccountState(controller.signal)
      .then((nextState) => {
        setAccountState(nextState);
        setAccountActionError("");
        return nextState.status === "signedIn"
          ? { session: nextState.session, catalog: nextState.catalog }
          : nextState.status === "signedOut"
            ? { catalog: nextState.catalog }
            : {};
      })
      .finally(() => {
        refreshInFlight.current = null;
      });

    refreshInFlight.current = refresh;
    return refresh;
  }, []);
  const refreshAccountFromHeader = useCallback(async () => {
    setRefreshingAccount(true);

    try {
      await refreshAccountSilently();
    } catch (error) {
      setAccountState({
        status: "error",
        message: getErrorMessage(error),
      });
    } finally {
      setRefreshingAccount(false);
    }
  }, [refreshAccountSilently]);

  useEffect(() => {
    const controller = new AbortController();
    const authenticationPending = isAuthenticationPending();
    setFinishingAuthentication(authenticationPending);
    setAccountState({ status: "loading" });

    loadAccountState(controller.signal, authenticationPending)
      .then((nextState) => {
        if (controller.signal.aborted) {
          return;
        }

        setAccountState(nextState);
        setFinishingAuthentication(false);
        clearAuthenticationPending();
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setAccountState({
            status: "error",
            message: getErrorMessage(error),
          });
          setFinishingAuthentication(false);
        }
      });

    return () => controller.abort();
  }, [requestId]);

  useEffect(() => {
    const refreshVisibleAccount = () => {
      if (
        document.visibilityState === "visible" &&
        !isAuthenticationPending()
      ) {
        void refreshAccountSilently().catch(() => undefined);
      }
    };

    window.addEventListener("focus", refreshVisibleAccount);
    document.addEventListener("visibilitychange", refreshVisibleAccount);
    window.addEventListener("pageshow", refreshVisibleAccount);

    return () => {
      window.removeEventListener("focus", refreshVisibleAccount);
      document.removeEventListener("visibilitychange", refreshVisibleAccount);
      window.removeEventListener("pageshow", refreshVisibleAccount);
    };
  }, [refreshAccountSilently]);

  useEffect(() => {
    let previousUrl = window.location.href;

    const refreshForUrlChange = () => {
      const currentUrl = window.location.href;
      if (currentUrl === previousUrl) {
        return;
      }

      previousUrl = currentUrl;
      if (requestsExtensionReload(currentUrl)) {
        retry();
      }
    };
    const urlCheckInterval = window.setInterval(refreshForUrlChange, 250);

    window.addEventListener("popstate", refreshForUrlChange);
    window.addEventListener("hashchange", refreshForUrlChange);

    return () => {
      window.clearInterval(urlCheckInterval);
      window.removeEventListener("popstate", refreshForUrlChange);
      window.removeEventListener("hashchange", refreshForUrlChange);
    };
  }, [retry]);

  function signIn() {
    setAccountActionError("");
    setExpanded(false);
    window.requestAnimationFrame(() => {
      try {
        beginSignIn();
      } catch (error) {
        setExpanded(true);
        setAccountActionError(getErrorMessage(error));
      }
    });
  }

  async function signOut() {
    setSigningOut(true);
    setAccountActionError("");

    try {
      await beginSignOut();
    } catch (error) {
      setSigningOut(false);
      setAccountActionError(getErrorMessage(error));
    }
  }

  const statusTone =
    accountState.status === "signedIn"
      ? "connected"
      : accountState.status === "signedOut"
        ? "signed-out"
        : accountState.status;
  const assistant =
    accountState.status === "signedIn"
      ? {
          catalog: accountState.catalog,
          profileUserId: accountState.profileUserId,
          session: accountState.session,
        }
      : accountState.status === "signedOut" && accountState.catalog
        ? {
            catalog: accountState.catalog,
            profileUserId: accountState.profileUserId,
            session: undefined,
          }
        : undefined;
  const workspaceOpen = expanded && Boolean(assistant);

  return (
    <aside
      className={`nlb-seat-helper__panel${workspaceOpen ? " is-workspace" : ""}`}
      aria-label="NLB Seat Helper status"
      aria-live="polite"
    >
      <header className="nlb-seat-helper__header">
        <div
          className={`nlb-seat-helper__status nlb-seat-helper__status--${statusTone}`}
          aria-hidden="true"
        />
        <div className="nlb-seat-helper__title">
          <strong>NLB Seat Helper</strong>
          {accountState.status === "signedIn" && (
            <span
              className="nlb-seat-helper__account-name"
              title={accountState.session.userId}
              aria-label={`Signed in as ${accountState.session.userId}`}
            >
              <span
                className="nlb-seat-helper__account-parenthesis"
                aria-hidden="true"
              >
                (
              </span>
              <span
                className="nlb-seat-helper__account-name-value"
                aria-hidden="true"
              >
                {accountState.session.userId}
              </span>
              <span
                className="nlb-seat-helper__account-parenthesis"
                aria-hidden="true"
              >
                )
              </span>
            </span>
          )}
          {accountState.status === "signedOut" && (
            <span className="nlb-seat-helper__title-status">
              (Not signed in)
            </span>
          )}
          {accountState.status === "loading" && (
            <span className="nlb-seat-helper__title-status">
              {finishingAuthentication
                ? "(Finishing sign in…)"
                : "(Connecting…)"}
            </span>
          )}
          {accountState.status === "error" && (
            <span className="nlb-seat-helper__title-status">
              (Connection failed)
            </span>
          )}
        </div>
        {accountState.status === "signedOut" && (
          <button
            type="button"
            className="nlb-seat-helper__account-action"
            onClick={signIn}
          >
            Sign in
          </button>
        )}
        {accountState.status === "signedIn" && (
          <button
            type="button"
            className="nlb-seat-helper__account-action nlb-seat-helper__account-action--secondary"
            onClick={() => void signOut()}
            disabled={signingOut}
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        )}
        {(accountState.status === "signedIn" ||
          accountState.status === "signedOut") && (
          <button
            type="button"
            className={`nlb-seat-helper__account-refresh${
              refreshingAccount ? " is-refreshing" : ""
            }`}
            onClick={() => void refreshAccountFromHeader()}
            disabled={refreshingAccount || signingOut}
            aria-label="Refresh NLB account session"
            title="Refresh NLB account"
          >
            ↻
          </button>
        )}
        <button
          type="button"
          className="nlb-seat-helper__collapse"
          onClick={() => setExpanded((current) => !current)}
          aria-label={expanded ? "Collapse NLB Seat Helper" : "Expand NLB Seat Helper"}
        >
          {expanded ? "−" : "+"}
        </button>
      </header>

      {expanded && accountState.status === "loading" && (
        <div className="nlb-seat-helper__loading" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      )}

      {accountActionError && expanded && (
        <div className="nlb-seat-helper__error">
          <p>{accountActionError}</p>
        </div>
      )}

      {expanded && assistant && (
        <SeatAssistant
          key={`${assistant.profileUserId}:${
            assistant.session?.userId ?? "signed-out"
          }`}
          catalog={assistant.catalog}
          profileUserId={assistant.profileUserId}
          session={assistant.session}
          onAccountRefresh={refreshAccountSilently}
        />
      )}

      {expanded && accountState.status === "error" && (
        <div className="nlb-seat-helper__error">
          <p>{accountState.message}</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}
    </aside>
  );
}
