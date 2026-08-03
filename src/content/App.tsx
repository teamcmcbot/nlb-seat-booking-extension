import { useCallback, useEffect, useState } from "react";
import { getAccountInfo, NlbApiError } from "../api/account";
import { SeatAssistant } from "../components/SeatAssistant";
import type { AccountSession } from "../models/account";
import type { Catalog } from "../models/catalog";
import { extractAccountSession } from "../services/accountSession";
import { extractCatalog } from "../services/catalog";

type AccountState =
  | { status: "loading" }
  | {
      status: "connected";
      session?: AccountSession;
      catalog: Catalog;
    }
  | { status: "error"; message: string };

function connectedAccountState(accountInfo: unknown): AccountState {
  return {
    status: "connected",
    session: extractAccountSession(accountInfo),
    catalog: extractCatalog(accountInfo),
  };
}

function getErrorMessage(error: unknown) {
  if (error instanceof NlbApiError) {
    if (error.status === 401 || error.status === 403) {
      return "Your NLB session is not available. Sign in and try again.";
    }

    return error.message;
  }

  return "Could not connect to NLB. Please refresh or try again.";
}

export function App() {
  const [accountState, setAccountState] = useState<AccountState>({
    status: "loading",
  });
  const [requestId, setRequestId] = useState(0);
  const [expanded, setExpanded] = useState(true);
  const [refreshingAccount, setRefreshingAccount] = useState(false);

  const retry = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);
  const refreshAccountSilently = useCallback(async () => {
    const accountInfo = await getAccountInfo();
    setAccountState(connectedAccountState(accountInfo));
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
    setAccountState({ status: "loading" });

    getAccountInfo(controller.signal)
      .then((accountInfo) => {
        setAccountState(connectedAccountState(accountInfo));
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setAccountState({
            status: "error",
            message: getErrorMessage(error),
          });
        }
      });

    return () => controller.abort();
  }, [requestId]);

  return (
    <aside
      className={`nlb-seat-helper__panel${
        expanded && accountState.status === "connected" ? " is-workspace" : ""
      }`}
      aria-label="NLB Seat Helper status"
      aria-live="polite"
    >
      <header className="nlb-seat-helper__header">
        <div
          className={`nlb-seat-helper__status nlb-seat-helper__status--${accountState.status}`}
          aria-hidden="true"
        />
        <strong className="nlb-seat-helper__title">
          NLB Seat Helper
          {accountState.status === "connected" && (
            <span> ({accountState.session?.userId ?? "Not signed in"})</span>
          )}
          {accountState.status === "loading" && <span> (Connecting…)</span>}
          {accountState.status === "error" && <span> (Connection failed)</span>}
        </strong>
        <button
          type="button"
          className={`nlb-seat-helper__account-refresh${
            refreshingAccount ? " is-refreshing" : ""
          }`}
          onClick={() => void refreshAccountFromHeader()}
          disabled={refreshingAccount || accountState.status === "loading"}
          aria-label="Refresh NLB account session"
          title="Refresh account after signing in"
        >
          ↻
        </button>
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

      {expanded && accountState.status === "connected" && (
        <SeatAssistant
          catalog={accountState.catalog}
          session={accountState.session}
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
