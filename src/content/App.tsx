import { useCallback, useEffect, useState } from "react";
import { getAccountInfo, NlbApiError } from "../api/account";
import { SeatAssistant } from "../components/SeatAssistant";
import type { AccountSession, BookingQuota } from "../models/account";
import type { Catalog } from "../models/catalog";
import {
  extractAccountSession,
  formatQuotaMinutes,
  quotaByCode,
} from "../services/accountSession";
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

function QuotaValue({ quota }: { quota?: BookingQuota }) {
  if (!quota) {
    return <strong className="nlb-seat-helper__quota-unavailable">—</strong>;
  }

  return (
    <strong>
      {formatQuotaMinutes(quota.remainingQuotaInMinutes)}
      <span> / {formatQuotaMinutes(quota.quotaInMinutes)}</span>
    </strong>
  );
}

export function App() {
  const [accountState, setAccountState] = useState<AccountState>({
    status: "loading",
  });
  const [requestId, setRequestId] = useState(0);
  const [expanded, setExpanded] = useState(true);

  const retry = useCallback(() => {
    setRequestId((current) => current + 1);
  }, []);
  const refreshAccountSilently = useCallback(async () => {
    const accountInfo = await getAccountInfo();
    setAccountState(connectedAccountState(accountInfo));
  }, []);

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
      className="nlb-seat-helper__panel"
      aria-label="NLB Seat Helper status"
      aria-live="polite"
    >
      <header className="nlb-seat-helper__header">
        <div
          className={`nlb-seat-helper__status nlb-seat-helper__status--${accountState.status}`}
          aria-hidden="true"
        />
        <div>
          <strong className="nlb-seat-helper__title">NLB Seat Helper</strong>
          <span className="nlb-seat-helper__message">
            {accountState.status === "loading" && "Connecting to NLB…"}
            {accountState.status === "connected" &&
              (accountState.session
                ? `Connected to ${accountState.session.userId}`
                : "NLB sign-in not detected")}
            {accountState.status === "error" && "Connection failed"}
          </span>
        </div>
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
        <>
          <div className="nlb-seat-helper__quota-summary">
            <div>
              <span>Current day quota</span>
              <QuotaValue
                quota={quotaByCode(
                  accountState.session?.dailyQuotas ?? [],
                )}
              />
              <small>remaining / total</small>
            </div>
            <div>
              <span>Next day quota</span>
              <QuotaValue
                quota={quotaByCode(
                  accountState.session?.advancedQuotas[0]?.quotas ?? [],
                )}
              />
              <small>remaining / total</small>
            </div>
          </div>
          <SeatAssistant
            catalog={accountState.catalog}
            session={accountState.session}
            onAccountRefresh={refreshAccountSilently}
          />
        </>
      )}

      {expanded && accountState.status === "error" && (
        <div className="nlb-seat-helper__error">
          <p>{accountState.message}</p>
          <button type="button" onClick={retry}>
            Try again
          </button>
        </div>
      )}

      {expanded && (
        <div className="nlb-seat-helper__privacy">
          Uses this tab’s signed-in session. Favourites stay in Chrome.
        </div>
      )}
    </aside>
  );
}
