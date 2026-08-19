import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  acknowledgePrivacyDisclosure,
  clearAccountProfileData,
  clearAllProfileData,
  clearCurrentProfileData,
  clearGuestProfileData,
  loadGuestCopyDecision,
  readProfileStorageInventory,
  resetGuestCopyDecision,
  saveGuestCopyDecision,
  type ProfileStorageInventory,
  type StoredProfileSummary,
} from "../services/profileStorage";
import { clearAuthenticationPending } from "../services/authentication";

const SOURCE_URL =
  "https://github.com/teamcmcbot/nlb-seat-booking-extension";
const PRIVACY_URL = `${SOURCE_URL}/blob/main/PRIVACY.md`;
const TERMS_URL = `${SOURCE_URL}/blob/main/TERMS.md`;
const LICENSE_URL = `${SOURCE_URL}/blob/main/LICENSE`;
const SUPPORT_URL = `${SOURCE_URL}/issues`;
const SECURITY_URL = `${SOURCE_URL}/security/advisories/new`;

export type LocalDataChange =
  | "guest"
  | "current-profile"
  | "inactive-profile"
  | "all"
  | "preference"
  | "refresh";

interface SettingsDialogProps {
  currentProfileId?: string;
  maskedAccountId?: string;
  disclosureRequired: boolean;
  onClose: () => void;
  onDisclosureAcknowledged: () => void;
  onLocalDataChanged: (change: LocalDataChange) => void | Promise<void>;
}

interface Confirmation {
  kind: "guest" | "current-profile" | "inactive-profile" | "all";
  title: string;
  description: string;
  confirmLabel: string;
  profile?: StoredProfileSummary;
}

function profileDetails(profile: StoredProfileSummary) {
  return `${profile.favouriteCount} favourite seat${
    profile.favouriteCount === 1 ? "" : "s"
  } · ${profile.hasLastSelection ? "saved area" : "no saved area"}`;
}

function focusableElements(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )].filter((element) => element.getClientRects().length > 0);
}

export function SettingsDialog({
  currentProfileId,
  maskedAccountId,
  disclosureRequired,
  onClose,
  onDisclosureAcknowledged,
  onLocalDataChanged,
}: SettingsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);
  const confirmationCancelRef = useRef<HTMLButtonElement>(null);
  const acknowledgementRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [inventory, setInventory] = useState<ProfileStorageInventory>();
  const [guestDecision, setGuestDecision] = useState<
    "copied" | "kept-separate" | undefined
  >();
  const [confirmation, setConfirmation] = useState<Confirmation>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const version = chrome.runtime.getManifest().version;

  async function refreshInventory() {
    const nextInventory = await readProfileStorageInventory();
    setInventory(nextInventory);
    setGuestDecision(
      currentProfileId
        ? await loadGuestCopyDecision(currentProfileId)
        : undefined,
    );
  }

  useEffect(() => {
    const extensionRoot = document.getElementById("nlb-seat-helper-root");
    const previousAriaHidden = extensionRoot?.getAttribute("aria-hidden");
    if (extensionRoot) {
      extensionRoot.inert = true;
      extensionRoot.setAttribute("aria-hidden", "true");
    }
    return () => {
      if (!extensionRoot) {
        return;
      }
      extensionRoot.inert = false;
      if (previousAriaHidden == null) {
        extensionRoot.removeAttribute("aria-hidden");
      } else {
        extensionRoot.setAttribute("aria-hidden", previousAriaHidden);
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      readProfileStorageInventory(),
      currentProfileId
        ? loadGuestCopyDecision(currentProfileId)
        : Promise.resolve(undefined),
    ])
      .then(([nextInventory, decision]) => {
        if (active) {
          setInventory(nextInventory);
          setGuestDecision(decision);
        }
      })
      .catch(() => {
        if (active) {
          setError("Local profile information could not be loaded.");
        }
      });
    return () => {
      active = false;
    };
  }, [currentProfileId]);

  useEffect(() => {
    const target = confirmation
      ? confirmationCancelRef.current
      : disclosureRequired
        ? acknowledgementRef.current
        : closeRef.current;
    target?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (confirmation) {
          setConfirmation(undefined);
        } else {
          onClose();
        }
        return;
      }
      const focusContainer = confirmation
        ? confirmationRef.current
        : dialogRef.current;
      if (event.key !== "Tab" || !focusContainer) {
        return;
      }

      const focusable = focusableElements(focusContainer);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [confirmation, disclosureRequired, onClose]);

  async function acknowledgeDisclosure() {
    setBusy(true);
    setError("");
    try {
      await acknowledgePrivacyDisclosure();
      onDisclosureAcknowledged();
    } catch {
      setError("The acknowledgement could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function setCopyPreference(
    preference: "prompt" | "kept-separate",
  ) {
    if (!currentProfileId) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (preference === "prompt") {
        await resetGuestCopyDecision(currentProfileId);
        setGuestDecision(undefined);
      } else {
        await saveGuestCopyDecision(currentProfileId, "kept-separate");
        setGuestDecision("kept-separate");
      }
      await onLocalDataChanged("preference");
    } catch {
      setError("The Guest-favourites preference could not be changed.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDestructiveAction() {
    if (!confirmation) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (confirmation.kind === "guest") {
        await clearGuestProfileData();
        await refreshInventory();
        await onLocalDataChanged("guest");
      } else if (
        confirmation.kind === "current-profile" &&
        currentProfileId
      ) {
        await clearCurrentProfileData(currentProfileId);
        await refreshInventory();
        await onLocalDataChanged("current-profile");
      } else if (
        confirmation.kind === "inactive-profile" &&
        confirmation.profile
      ) {
        await clearAccountProfileData(confirmation.profile.profileId);
        await refreshInventory();
        await onLocalDataChanged("inactive-profile");
      } else if (confirmation.kind === "all") {
        await clearAllProfileData();
        clearAuthenticationPending();
        await onLocalDataChanged("all");
        onClose();
      }
      setConfirmation(undefined);
    } catch {
      setError("The selected local data could not be removed.");
    } finally {
      setBusy(false);
    }
  }

  const settings = (
    <div className="nlb-seat-helper__settings-backdrop">
      <div
        ref={dialogRef}
        className="nlb-seat-helper__settings-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="nlb-seat-helper-settings-title"
      >
        <header
          className="nlb-seat-helper__settings-header"
          aria-hidden={confirmation ? "true" : undefined}
        >
          <div>
            <strong id="nlb-seat-helper-settings-title">Settings</strong>
            <span>StudySeat SG - for NLB v{version}</span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close Settings"
          >
            ×
          </button>
        </header>

        <div
          className="nlb-seat-helper__settings-content"
          aria-hidden={confirmation ? "true" : undefined}
        >
          {disclosureRequired && (
            <section className="nlb-seat-helper__settings-disclosure">
              <h2>Before you continue</h2>
              <p>
                This independent extension uses the NLB session already signed
                in within this tab. It can read account, quota, booking, seat,
                and availability information and sends booking or cancellation
                requests only after you confirm them.
              </p>
              <p>
                It does not collect credentials, directly read cookies, or
                send your local profile data to the extension developer.
              </p>
              <button
                ref={acknowledgementRef}
                type="button"
                onClick={() => void acknowledgeDisclosure()}
                disabled={busy}
              >
                I understand
              </button>
            </section>
          )}

          {error && (
            <p className="nlb-seat-helper__settings-error" role="alert">
              {error}
            </p>
          )}

          <section>
            <h2>About</h2>
            <p>
              A free, independent interface for finding and booking seats on
              NLB’s Seat Booking service. It is not affiliated with, endorsed
              by, sponsored by, or supported by the National Library Board.
              NLB remains the final authority for availability, bookings, and
              cancellations.
            </p>
            <nav className="nlb-seat-helper__settings-links" aria-label="Project links">
              <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
                Privacy
              </a>
              <a href={TERMS_URL} target="_blank" rel="noreferrer">
                Terms
              </a>
              <a href={LICENSE_URL} target="_blank" rel="noreferrer">
                License
              </a>
              <a href={SOURCE_URL} target="_blank" rel="noreferrer">
                Source
              </a>
              <a href={SUPPORT_URL} target="_blank" rel="noreferrer">
                Support
              </a>
              <a href={SECURITY_URL} target="_blank" rel="noreferrer">
                Security
              </a>
            </nav>
          </section>

          <section>
            <h2>Local data</h2>
            <p>
              Stored locally: favourite seats, last selected areas, opaque
              Profile N identifiers, Guest-copy choices, and this disclosure
              acknowledgement. Credentials, cookies, bookings, quotas, and
              availability results are not stored by the extension.
            </p>

            {!inventory ? (
              <p>Loading saved profiles…</p>
            ) : (
              <div className="nlb-seat-helper__settings-profiles">
                <article>
                  <div>
                    <strong>Guest</strong>
                    <span>{profileDetails(inventory.guest)}</span>
                  </div>
                  <button
                    type="button"
                    disabled={
                      busy ||
                      (inventory.guest.favouriteCount === 0 &&
                        !inventory.guest.hasLastSelection)
                    }
                    onClick={() =>
                      setConfirmation({
                        kind: "guest",
                        title: "Clear Guest data?",
                        description: `This removes ${profileDetails(
                          inventory.guest,
                        )}. Signed-in profiles are not changed.`,
                        confirmLabel: "Clear Guest data",
                      })
                    }
                  >
                    Clear Guest
                  </button>
                </article>

                {inventory.accounts.map((profile) => {
                  const current = profile.profileId === currentProfileId;
                  return (
                    <article
                      key={profile.profileId}
                      className={current ? "is-current" : undefined}
                    >
                      <div>
                        <strong>
                          {profile.label}
                          {current ? " · Current account" : ""}
                        </strong>
                        <span>{profileDetails(profile)}</span>
                        {current && maskedAccountId && (
                          <span>Signed in as {maskedAccountId}</span>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={
                          busy ||
                          (current &&
                            profile.favouriteCount === 0 &&
                            !profile.hasLastSelection)
                        }
                        onClick={() =>
                          setConfirmation(
                            current
                              ? {
                                  kind: "current-profile",
                                  title: `Clear ${profile.label}?`,
                                  description: `This removes ${profileDetails(
                                    profile,
                                  )}. It does not sign out, cancel bookings, or delete the stable profile label. Seats required by active bookings may be added again after refresh.`,
                                  confirmLabel: "Clear current profile",
                                }
                              : {
                                  kind: "inactive-profile",
                                  title: `Delete ${profile.label}?`,
                                  description: `This removes ${profileDetails(
                                    profile,
                                  )}, its Guest-copy choice, and its saved profile entry. Other profiles are not changed.`,
                                  confirmLabel: `Delete ${profile.label}`,
                                  profile,
                                },
                          )
                        }
                      >
                        {current ? "Clear profile" : "Delete profile"}
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </section>

          {currentProfileId && (
            <section>
              <h2>Guest favourites for this account</h2>
              <p>
                Choose whether this account should offer newly added Guest
                favourites. Copying is always additive and never deletes Guest
                data or account favourites.
              </p>
              <div className="nlb-seat-helper__settings-choice">
                <button
                  type="button"
                  className={guestDecision !== "kept-separate" ? "is-selected" : ""}
                  disabled={busy || guestDecision !== "kept-separate"}
                  onClick={() => void setCopyPreference("prompt")}
                >
                  Offer new Guest favourites
                </button>
                <button
                  type="button"
                  className={guestDecision === "kept-separate" ? "is-selected" : ""}
                  disabled={busy || guestDecision === "kept-separate"}
                  onClick={() => void setCopyPreference("kept-separate")}
                >
                  Always keep separate
                </button>
              </div>
            </section>
          )}

          <section>
            <h2>Recovery and deletion</h2>
            <div className="nlb-seat-helper__settings-actions">
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  onClose();
                  void onLocalDataChanged("refresh");
                }}
              >
                Reset current view and refresh from NLB
              </button>
              <button
                type="button"
                className="is-danger"
                disabled={busy}
                onClick={() =>
                  setConfirmation({
                    kind: "all",
                    title: "Clear all StudySeat SG data?",
                    description:
                      "This removes Guest data, every saved profile, favourite seats, saved areas, profile metadata, Guest-copy choices, the privacy acknowledgement, and the pending sign-in marker. It does not sign out of NLB or cancel bookings. If currently signed in, a fresh profile will be created for that session and seats required by active bookings may be added again.",
                    confirmLabel: "Clear all local data",
                  })
                }
              >
                Clear all local data
              </button>
            </div>
          </section>
        </div>

        {confirmation && (
          <div className="nlb-seat-helper__settings-confirmation-backdrop">
            <div
              ref={confirmationRef}
              className="nlb-seat-helper__settings-confirmation"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="nlb-seat-helper-settings-confirmation-title"
            >
              <strong id="nlb-seat-helper-settings-confirmation-title">
                {confirmation.title}
              </strong>
              <p>{confirmation.description}</p>
              <div>
                <button
                  ref={confirmationCancelRef}
                  type="button"
                  onClick={() => setConfirmation(undefined)}
                  disabled={busy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="is-danger"
                  onClick={() => void confirmDestructiveAction()}
                  disabled={busy}
                >
                  {busy ? "Working…" : confirmation.confirmLabel}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(settings, document.body);
}
