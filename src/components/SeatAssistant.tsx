import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { bookSeat } from "../api/booking";
import { searchAvailableAreas } from "../api/availability";
import { NlbApiError } from "../api/account";
import type { AccountSession } from "../models/account";
import type {
  BookingProgress,
  PlannedBooking,
  SelectedSeatSlot,
} from "../models/booking";
import type {
  Area,
  Catalog,
  FavouriteSeat,
  Seat,
} from "../models/catalog";
import {
  extractAreaMapUrls,
  extractAvailableSeatIdentities,
  extractAvailableSeatKeys,
  seatMatchKeys,
  type HourSlot,
} from "../services/availability";
import {
  durationOptions,
  formatDuration,
  getBookableDateRange,
  getBookableSlots,
  preferredDuration,
} from "../services/bookingRules";
import {
  favouriteIdentity,
  loadFavouriteSeats,
  saveFavouriteSeats,
} from "../services/favourites";
import {
  formatQuotaMinutes,
  quotaForDate,
} from "../services/accountSession";
import {
  bookingMatchesSeat,
  findConflictingBooking,
} from "../services/bookingConflicts";
import { buildBookingPlan } from "../services/bookingPlanner";
import {
  loadLastSeatSelection,
  saveLastSeatSelection,
} from "../services/preferences";

interface SeatAssistantProps {
  catalog: Catalog;
  session?: AccountSession;
  onAccountRefresh: () => Promise<void>;
}

type SeatAvailability = Record<string, Record<string, boolean>>;

type ScanState =
  | { status: "idle"; availability: SeatAvailability }
  | {
      status: "scanning";
      availability: SeatAvailability;
      completed: number;
      total: number;
    }
  | { status: "complete"; availability: SeatAvailability }
  | { status: "error"; availability: SeatAvailability; message: string };

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function tomorrowValue() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return localDateValue(tomorrow);
}

function mapImageUrl(path?: string) {
  if (!path || path.includes("..") || /^[a-z]+:/i.test(path)) {
    return undefined;
  }

  const relativePath = path.replace(/^\/+/, "");
  return new URL(
    `/seatbooking/img/areas/${relativePath}`,
    window.location.origin,
  ).href;
}

function seatToFavourite(area: Area, seat: Seat): FavouriteSeat {
  return {
    branchId: area.branchId,
    areaId: area.id,
    seatId: seat.id,
    seatCode: seat.code,
    seatName: seat.name,
  };
}

function seatMatchesKeys(seat: Seat, availableKeys: Set<string>) {
  return seatMatchKeys(seat).some((key) => availableKeys.has(key));
}

function retryDelay(signal: AbortSignal) {
  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(resolve, 600);
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

function timeLabel(value: string) {
  const [hoursText, minutes] = value.split(":");
  const hours = Number(hoursText);
  const suffix = hours >= 12 ? "pm" : "am";
  const displayHours = hours % 12 || 12;
  return minutes === "00"
    ? `${displayHours}${suffix}`
    : `${displayHours}:${minutes}${suffix}`;
}

function selectionKey(seatId: string, slotKey: string) {
  return `${seatId}|${slotKey}`;
}

function seatIdentityKey(value: string) {
  return value.trim().toLowerCase();
}

function formatSelectedDate(date: string) {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

function bookingPeriod(booking: PlannedBooking) {
  const start = new Date(booking.startTime);
  const end = new Date(
    start.getTime() + booking.durationMinutes * 60_000,
  );
  const date = `${String(start.getDate()).padStart(2, "0")}/${String(
    start.getMonth() + 1,
  ).padStart(2, "0")}`;
  const time = (value: Date) =>
    timeLabel(
      `${String(value.getHours()).padStart(2, "0")}:${String(
        value.getMinutes(),
      ).padStart(2, "0")}`,
    );

  return `${date}, ${time(start)}–${time(end)}`;
}

function existingBookingLabel(
  booking: NonNullable<AccountSession["bookings"][number]>,
) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const label = (value: Date) =>
    timeLabel(
      `${String(value.getHours()).padStart(2, "0")}:${String(
        value.getMinutes(),
      ).padStart(2, "0")}`,
    );

  return `${booking.seat || "an existing seat"} ${label(start)}–${label(
    end,
  )}`;
}

export function SeatAssistant({
  catalog,
  session,
  onAccountRefresh,
}: SeatAssistantProps) {
  const [branchId, setBranchId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [date, setDate] = useState(tomorrowValue);
  const [favourites, setFavourites] = useState<FavouriteSeat[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [managing, setManaging] = useState(false);
  const [seatSearch, setSeatSearch] = useState("");
  const [selectedStart, setSelectedStart] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(240);
  const [now, setNow] = useState(() => new Date());
  const [mapExpanded, setMapExpanded] = useState(false);
  const [discoveredMaps, setDiscoveredMaps] = useState<
    Record<string, string[]>
  >({});
  const [discoveredSeatCodes, setDiscoveredSeatCodes] = useState<
    Record<string, Record<string, string>>
  >({});
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectionMessage, setSelectionMessage] = useState("");
  const [bookSeparately, setBookSeparately] = useState(true);
  const [reviewingBooking, setReviewingBooking] = useState(false);
  const [bookingRunning, setBookingRunning] = useState(false);
  const [bookingProgress, setBookingProgress] = useState<
    BookingProgress[]
  >([]);
  const [scan, setScan] = useState<ScanState>({
    status: "idle",
    availability: {},
  });
  const scanController = useRef<AbortController>();

  const branch = useMemo(
    () => catalog.branches.find((item) => item.id === branchId),
    [branchId, catalog.branches],
  );
  const area = useMemo(
    () => branch?.areas.find((item) => item.id === areaId),
    [areaId, branch],
  );
  const areaFavourites = useMemo(
    () =>
      favourites.filter(
        (item) => item.branchId === branchId && item.areaId === areaId,
      ),
    [areaId, branchId, favourites],
  );
  const favouriteIds = useMemo(
    () => new Set(areaFavourites.map((item) => item.seatId)),
    [areaFavourites],
  );
  const favouriteSeats = useMemo(
    () =>
      area?.seats.filter((seat) => favouriteIds.has(seat.id)) ?? [],
    [area, favouriteIds],
  );
  const dateRange = useMemo(
    () =>
      area
        ? getBookableDateRange(area, catalog.bookingRules, now)
        : undefined,
    [area, catalog.bookingRules, now],
  );
  const slots = useMemo(
    () => (area && date ? getBookableSlots(area, date, now) : []),
    [area, date, now],
  );
  const selectedStartIndex = slots.findIndex(
    (slot) => slot.key === selectedStart,
  );
  const availableDurations = useMemo(
    () =>
      area
        ? durationOptions(area, slots, selectedStartIndex)
        : [],
    [area, selectedStartIndex, slots],
  );
  const selectedSlots =
    selectedStartIndex >= 0 && area
      ? slots.slice(
          selectedStartIndex,
          selectedStartIndex +
            Math.ceil(durationMinutes / area.intervalMinutes),
        )
      : [];
  const areaMapPaths = area
    ? [
        ...new Set([
          ...area.areaMapUrls,
          ...(discoveredMaps[`${area.branchId}:${area.id}`] ?? []),
        ]),
      ]
    : [];
  const seatPlanPath =
    areaMapPaths.find((path) => path.toLowerCase().includes("-sp")) ??
    areaMapPaths[1] ??
    areaMapPaths[0];
  const areaMapImage = mapImageUrl(seatPlanPath);
  const selectedDateQuota = quotaForDate(
    session,
    date,
    area?.facilityCode ?? "StudyArea",
  );
  const areaSeatCodes = area
    ? discoveredSeatCodes[`${area.branchId}:${area.id}`] ?? {}
    : {};
  const bookingCodeForSeat = (seat: Seat) =>
    seat.code ||
    areaSeatCodes[seatIdentityKey(seat.id)] ||
    areaSeatCodes[seatIdentityKey(seat.name)] ||
    "";
  const selectedSeatSlots = useMemo(
    () =>
      favouriteSeats.flatMap((seat): SelectedSeatSlot[] =>
        slots
          .filter((slot) =>
            selectedCellKeys.has(selectionKey(seat.id, slot.key)),
          )
          .map((slot) => ({
            seatId: seat.id,
            seatCode: bookingCodeForSeat(seat),
            seatName: seat.name,
            startTime: slot.startTime,
            durationMinutes: slot.minutes,
          })),
      ),
    [areaSeatCodes, favouriteSeats, selectedCellKeys, slots],
  );
  const selectedMinutes = selectedSeatSlots.reduce(
    (total, slot) => total + slot.durationMinutes,
    0,
  );
  const bookingIdentifiersReady = selectedSeatSlots.every(
    (slot) => Boolean(slot.seatCode),
  );
  const bookingPlan = useMemo(
    () =>
      buildBookingPlan(
        selectedSeatSlots,
        bookSeparately,
        area?.maxBookingMinutes ?? 240,
      ),
    [
      area?.maxBookingMinutes,
      bookSeparately,
      selectedSeatSlots,
    ],
  );
  const selectedQuotaTone = !selectedDateQuota
    ? "unknown"
    : selectedDateQuota.remainingQuotaInMinutes === 0
      ? "empty"
      : selectedDateQuota.remainingQuotaInMinutes <=
          selectedDateQuota.quotaInMinutes / 2
        ? "low"
        : "available";
  const scanContextKey = [
    area?.branchId,
    area?.id,
    date,
    favouriteSeats.map((seat) => seat.id).join(","),
    slots.map((slot) => slot.key).join(","),
    session?.bookings
      .filter((booking) => booking.active)
      .map(
        (booking) =>
          `${booking.bookingId}:${booking.startTime}:${booking.endTime}`,
      )
      .join(","),
  ].join("|");

  useEffect(() => {
    Promise.all([loadFavouriteSeats(), loadLastSeatSelection()])
      .then(([storedFavourites, lastSelection]) => {
        setFavourites(storedFavourites);

        if (!lastSelection) {
          return;
        }

        const storedBranch = catalog.branches.find(
          (item) => item.id === lastSelection.branchId,
        );
        const storedArea = storedBranch?.areas.find(
          (item) => item.id === lastSelection.areaId,
        );

        if (storedBranch) {
          setBranchId(storedBranch.id);
          setAreaId(storedArea?.id ?? "");
        }
      })
      .finally(() => setStorageReady(true));
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!mapExpanded) {
      return;
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMapExpanded(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mapExpanded]);

  useEffect(() => {
    if (!dateRange) {
      return;
    }

    if (!dateRange.hasDates) {
      if (date) {
        setDate("");
      }
      return;
    }

    if (!date || date < dateRange.min || date > dateRange.max) {
      setDate(dateRange.min);
    }
  }, [date, dateRange]);

  useEffect(() => {
    if (slots.length === 0) {
      setSelectedStart("");
      return;
    }

    if (!slots.some((slot) => slot.key === selectedStart)) {
      setSelectedStart(slots[0].key);
    }
  }, [selectedStart, slots]);

  useEffect(() => {
    if (availableDurations.length === 0) {
      return;
    }

    const duration = preferredDuration(
      availableDurations,
      selectedDateQuota?.remainingQuotaInMinutes,
    );
    if (duration !== undefined) {
      setDurationMinutes(duration);
    }
  }, [availableDurations, selectedDateQuota]);

  useEffect(() => {
    scanController.current?.abort();
    setScan({ status: "idle", availability: {} });
    setSelectedCellKeys(new Set());
    setSelectionMessage("");
    setReviewingBooking(false);

    return () => scanController.current?.abort();
  }, [scanContextKey]);

  async function checkAvailability() {
    if (
      !area ||
      !date ||
      !storageReady ||
      favouriteSeats.length === 0 ||
      slots.length === 0
    ) {
      return;
    }

    scanController.current?.abort();
    const controller = new AbortController();
    scanController.current = controller;
    const selectedArea = area;
    const seats = favouriteSeats;
    const scanSlots = slots;
    let nextIndex = 0;
    let completed = 0;
    let failed = 0;
    let firstError: unknown;

    setSelectedCellKeys(new Set());
    setSelectionMessage("");
    setReviewingBooking(false);
    setScan({
      status: "scanning",
      availability: {},
      completed: 0,
      total: scanSlots.length,
    });

    async function scanSlot(slot: HourSlot) {
      const query = {
        branchId: selectedArea.branchId,
        areaId: selectedArea.id,
        startTime: slot.startTime,
        durationMinutes: slot.minutes,
      };
      let payload: unknown;

      try {
        payload = await searchAvailableAreas(query, controller.signal);
      } catch (error) {
        const isTransient =
          error instanceof NlbApiError &&
          (error.status === 429 ||
            (error.status !== undefined && error.status >= 500));

        if (!isTransient || controller.signal.aborted) {
          throw error;
        }

        await retryDelay(controller.signal);
        payload = await searchAvailableAreas(query, controller.signal);
      }

      const maps = extractAreaMapUrls(payload, selectedArea.id);
      if (maps.length > 0) {
        const mapKey = `${selectedArea.branchId}:${selectedArea.id}`;
        setDiscoveredMaps((current) => ({
          ...current,
          [mapKey]: [
            ...new Set([...(current[mapKey] ?? []), ...maps]),
          ],
        }));
      }

      const availableSeats = extractAvailableSeatIdentities(payload);
      if (availableSeats.length > 0) {
        const areaKey = `${selectedArea.branchId}:${selectedArea.id}`;
        setDiscoveredSeatCodes((current) => {
          const codes = { ...(current[areaKey] ?? {}) };

          for (const availableSeat of availableSeats) {
            if (availableSeat.id) {
              codes[seatIdentityKey(availableSeat.id)] =
                availableSeat.code;
            }
            if (availableSeat.name) {
              codes[seatIdentityKey(availableSeat.name)] =
                availableSeat.code;
            }
          }

          return {
            ...current,
            [areaKey]: codes,
          };
        });
      }

      const availableKeys = extractAvailableSeatKeys(payload);
      completed += 1;

      setScan((current) => {
        const availability = { ...current.availability };

        for (const seat of seats) {
          availability[seat.id] = {
            ...availability[seat.id],
            [slot.key]: seatMatchesKeys(seat, availableKeys),
          };
        }

        return {
          status: "scanning",
          availability,
          completed,
          total: scanSlots.length,
        };
      });
    }

    function recordFailure(error: unknown) {
      failed += 1;
      completed += 1;
      firstError ??= error;

      setScan((current) => ({
        status: "scanning",
        availability: current.availability,
        completed,
        total: scanSlots.length,
      }));
    }

    async function worker() {
      while (!controller.signal.aborted) {
        const slotIndex = nextIndex;
        nextIndex += 1;

        if (slotIndex >= scanSlots.length) {
          return;
        }

        try {
          await scanSlot(scanSlots[slotIndex]);
        } catch (error) {
          if (!controller.signal.aborted) {
            recordFailure(error);
          }
        }
      }
    }

    await worker();

    if (!controller.signal.aborted) {
      setScan((current) =>
        failed > 0
          ? {
              status: "error",
              availability: current.availability,
              message: `${failed} of ${scanSlots.length} time slots could not be checked${
                firstError instanceof Error
                  ? `: ${firstError.message}`
                  : "."
              }`,
            }
          : {
              status: "complete",
              availability: current.availability,
            },
      );
    }
  }

  function toggleSelectedSlot(seat: Seat, slot: HourSlot) {
    const key = selectionKey(seat.id, slot.key);
    const alreadySelected = selectedCellKeys.has(key);

    if (alreadySelected) {
      setSelectedCellKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      setSelectionMessage("");
      return;
    }

    const conflictingBooking = findConflictingBooking(
      session?.bookings,
      slot,
    );
    if (conflictingBooking) {
      setSelectionMessage(
        `This time is blocked by your ${existingBookingLabel(
          conflictingBooking,
        )} booking.`,
      );
      return;
    }

    const slotStart = new Date(slot.startTime).getTime();
    const slotEnd = slotStart + slot.minutes * 60_000;
    const overlappingSelection = selectedSeatSlots.find((selected) => {
      const selectedStartTime = new Date(selected.startTime).getTime();
      const selectedEnd =
        selectedStartTime + selected.durationMinutes * 60_000;
      return selectedStartTime < slotEnd && selectedEnd > slotStart;
    });
    if (overlappingSelection) {
      setSelectionMessage(
        `${timeLabel(slot.label)} is already selected for ${
          overlappingSelection.seatName
        }. Only one seat can be booked at a time.`,
      );
      return;
    }

    if (!selectedDateQuota) {
      setSelectionMessage(
        "Quota information is unavailable for the selected date.",
      );
      return;
    }

    if (
      selectedMinutes + slot.minutes >
      selectedDateQuota.remainingQuotaInMinutes
    ) {
      setSelectionMessage(
        `Only ${formatQuotaMinutes(
          selectedDateQuota.remainingQuotaInMinutes,
        )} of quota remains for ${formatSelectedDate(date)}.`,
      );
      return;
    }

    setSelectedCellKeys((current) => new Set(current).add(key));
    setSelectionMessage(
      bookingCodeForSeat(seat)
        ? ""
        : `${seat.name} was selected, but its booking identifier is unavailable.`,
    );
  }

  async function runBookings() {
    if (
      !area ||
      bookingPlan.length === 0 ||
      !bookingIdentifiersReady ||
      bookingRunning
    ) {
      return;
    }

    const controller = new AbortController();
    setBookingRunning(true);
    setReviewingBooking(false);
    setBookingProgress(
      bookingPlan.map((booking) => ({
        booking,
        status: "pending",
      })),
    );

    for (const booking of bookingPlan) {
      setBookingProgress((current) =>
        current.map((item) =>
          item.booking.id === booking.id
            ? { ...item, status: "booking" }
            : item,
        ),
      );

      try {
        await bookSeat({ areaId: area.id, booking }, controller.signal);
        setBookingProgress((current) =>
          current.map((item) =>
            item.booking.id === booking.id
              ? {
                  ...item,
                  status: "booked",
                  message: `${booking.seatName}: ${bookingPeriod(
                    booking,
                  )} booked!`,
                }
              : item,
          ),
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Booking failed.";
        setBookingProgress((current) =>
          current.map((item) =>
            item.booking.id === booking.id
              ? { ...item, status: "failed", message }
              : item,
          ),
        );
      }
    }

    setBookingRunning(false);
    setSelectedCellKeys(new Set());
    setScan({ status: "idle", availability: {} });

    try {
      await onAccountRefresh();
    } catch {
      setSelectionMessage(
        "Bookings finished, but the quota could not be refreshed.",
      );
    }
  }

  async function toggleFavourite(seat: Seat) {
    if (!area) {
      return;
    }

    const favourite = seatToFavourite(area, seat);
    const identity = favouriteIdentity(favourite);
    const next = favourites.some(
      (item) => favouriteIdentity(item) === identity,
    )
      ? favourites.filter((item) => favouriteIdentity(item) !== identity)
      : [...favourites, favourite];

    setFavourites(next);
    await saveFavouriteSeats(next);
  }

  const searchedSeats = useMemo(() => {
    if (!area) {
      return [];
    }

    const query = seatSearch.trim().toLowerCase();

    if (!query) {
      return area.seats.filter((seat) => favouriteIds.has(seat.id));
    }

    return area.seats
      .filter(
        (seat) =>
          seat.name.toLowerCase().includes(query) ||
          seat.code.toLowerCase().includes(query),
      )
      .slice(0, 50);
  }, [area, favouriteIds, seatSearch]);

  return (
    <section className="nlb-seat-helper__assistant">
      <div className="nlb-seat-helper__fields">
        <label>
          <span>Library</span>
          <select
            value={branchId}
            onChange={(event) => {
              const nextBranchId = event.target.value;
              setBranchId(nextBranchId);
              setAreaId("");
              setManaging(false);
              void saveLastSeatSelection({
                branchId: nextBranchId,
                areaId: "",
              });
            }}
          >
            <option value="">Choose a library</option>
            {catalog.branches.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Area</span>
          <select
            value={areaId}
            disabled={!branch}
            onChange={(event) => {
              const nextAreaId = event.target.value;
              setAreaId(nextAreaId);
              setManaging(false);
              void saveLastSeatSelection({
                branchId,
                areaId: nextAreaId,
              });
            }}
          >
            <option value="">Choose a specific area</option>
            {branch?.areas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
                {item.floor ? ` — ${item.floor}` : ""}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Date</span>
          <input
            type="date"
            min={dateRange?.min}
            max={dateRange?.max}
            value={date}
            disabled={!dateRange?.hasDates}
            onChange={(event) => setDate(event.target.value)}
          />
        </label>
      </div>

      {!area && (
        <p className="nlb-seat-helper__empty">
          Choose a library and a specific area to manage favourite seats.
        </p>
      )}

      {area && (
        <>
          <div
            className={`nlb-seat-helper__date-quota is-${selectedQuotaTone}`}
          >
            <span>Quota for {formatSelectedDate(date)}</span>
            {selectedDateQuota ? (
              <strong>
                {formatQuotaMinutes(
                  selectedDateQuota.remainingQuotaInMinutes,
                )}{" "}
                remaining
                <small>
                  {" "}
                  of {formatQuotaMinutes(
                    selectedDateQuota.quotaInMinutes,
                  )}
                </small>
              </strong>
            ) : (
              <strong>Unavailable</strong>
            )}
          </div>

          <section className="nlb-seat-helper__map-section">
            <strong>Seat plan</strong>
            {areaMapImage ? (
              <figure className="nlb-seat-helper__area-map">
                <button
                  type="button"
                  onClick={() => setMapExpanded(true)}
                  aria-label={`Open full seat plan for ${area.name}`}
                >
                  <img
                    src={areaMapImage}
                    alt={`${area.name} seat plan`}
                    loading="lazy"
                  />
                  <span>Click to enlarge</span>
                </button>
              </figure>
            ) : (
              <p>
                {scan.status === "idle"
                  ? "The seat plan will load when availability is checked."
                  : "NLB did not provide a seat plan for this area."}
              </p>
            )}
          </section>

          {dateRange && !dateRange.hasDates && (
            <p className="nlb-seat-helper__notice">
              No booking dates are currently open. The next date will appear
              after NLB’s booking release time.
            </p>
          )}

          <div className="nlb-seat-helper__section-heading">
            <div>
              <strong>Favourite seats</strong>
              <span>
                {areaFavourites.length} of {area.seats.length} selected
              </span>
            </div>
            <button
              type="button"
              className="nlb-seat-helper__text-button"
              onClick={() => setManaging((current) => !current)}
            >
              {managing ? "Done" : "Manage"}
            </button>
          </div>

          {managing ? (
            <div className="nlb-seat-helper__seat-manager">
              <input
                type="search"
                placeholder="Search seat number, e.g. S383"
                value={seatSearch}
                onChange={(event) => setSeatSearch(event.target.value)}
                autoFocus
              />
              {!seatSearch.trim() && searchedSeats.length === 0 && (
                <p>Type a seat number to search {area.seats.length} seats.</p>
              )}
              <div className="nlb-seat-helper__seat-results">
                {searchedSeats.map((seat) => {
                  const selected = favouriteIds.has(seat.id);
                  return (
                    <button
                      type="button"
                      key={seat.id}
                      className={selected ? "is-favourite" : ""}
                      onClick={() => void toggleFavourite(seat)}
                    >
                      <span aria-hidden="true">{selected ? "★" : "☆"}</span>
                      <strong>{seat.name}</strong>
                      {seat.disabled && <small>Unavailable</small>}
                    </button>
                  );
                })}
              </div>
              {seatSearch.trim() && searchedSeats.length === 0 && (
                <p>No matching seats found.</p>
              )}
            </div>
          ) : areaFavourites.length === 0 ? (
            <div className="nlb-seat-helper__empty nlb-seat-helper__empty--card">
              <p>No favourites configured for this area.</p>
              <button type="button" onClick={() => setManaging(true)}>
                Choose favourite seats
              </button>
            </div>
          ) : (
            <>
              <div className="nlb-seat-helper__request-fields">
                <label>
                  <span>Start</span>
                  <select
                    value={selectedStart}
                    onChange={(event) => setSelectedStart(event.target.value)}
                  >
                    {slots.map((slot) => (
                      <option key={slot.key} value={slot.key}>
                        {timeLabel(slot.label)}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Duration</span>
                  <select
                    value={durationMinutes}
                    onChange={(event) =>
                      setDurationMinutes(Number(event.target.value))
                    }
                    disabled={availableDurations.length === 0}
                  >
                    {availableDurations.map((minutes) => (
                      <option key={minutes} value={minutes}>
                        {formatDuration(minutes)}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="nlb-seat-helper__refresh"
                  onClick={() => void checkAvailability()}
                  disabled={
                    scan.status === "scanning" || slots.length === 0
                  }
                >
                  {scan.status === "idle"
                    ? "Check availability"
                    : "Refresh"}
                </button>
              </div>
              <p className="nlb-seat-helper__request-hint">
                Start and duration highlight your preferred window. The hourly
                scan is reused when these values change.
              </p>

              {slots.length === 0 ? (
                <p className="nlb-seat-helper__notice">
                  Opening hours were not available for this area.
                </p>
              ) : (
                <>
                  {scan.status === "scanning" && (
                    <div className="nlb-seat-helper__progress">
                      <span
                        style={{
                          width: `${(scan.completed / scan.total) * 100}%`,
                        }}
                      />
                    </div>
                  )}
                  {scan.status === "error" && (
                    <p className="nlb-seat-helper__notice nlb-seat-helper__notice--error">
                      {scan.message}
                    </p>
                  )}
                  <div className="nlb-seat-helper__favourite-list">
                    {favouriteSeats.map((seat) => {
                      const seatAvailability =
                        scan.availability[seat.id] ?? {};
                      const knownSelectedSlots = selectedSlots.filter(
                        (slot) => seatAvailability[slot.key] !== undefined,
                      );
                      const selectedAvailable =
                        selectedSlots.length > 0 &&
                        knownSelectedSlots.length === selectedSlots.length &&
                        selectedSlots.every(
                          (slot) => seatAvailability[slot.key],
                        );
                      const selectedForSeat = slots.filter((slot) =>
                        selectedCellKeys.has(
                          selectionKey(seat.id, slot.key),
                        ),
                      ).length;
                      const bookedForSeat = area
                        ? slots.filter((slot) => {
                            const booking = findConflictingBooking(
                              session?.bookings,
                              slot,
                            );
                            return (
                              booking &&
                              bookingMatchesSeat(booking, area, seat)
                            );
                          }).length
                        : 0;

                      return (
                        <article key={seat.id}>
                          <div className="nlb-seat-helper__seat-title">
                            <strong>★ {seat.name}</strong>
                            <span
                              className={
                                selectedAvailable ? "is-available" : ""
                              }
                            >
                              {selectedForSeat > 0
                                ? `${formatQuotaMinutes(
                                    selectedForSeat *
                                      area.intervalMinutes,
                                  )} selected`
                                : bookedForSeat > 0
                                  ? `${formatQuotaMinutes(
                                      bookedForSeat *
                                        area.intervalMinutes,
                                    )} booked by you`
                                : scan.status === "idle"
                                ? "Not checked"
                                : scan.status === "scanning" &&
                                    knownSelectedSlots.length <
                                      selectedSlots.length
                                  ? "Checking…"
                                  : scan.status === "error" &&
                                      knownSelectedSlots.length <
                                        selectedSlots.length
                                    ? "Incomplete"
                                    : selectedAvailable
                                      ? "Available"
                                      : "Not fully available"}
                            </span>
                          </div>
                          <div
                            className="nlb-seat-helper__timeline"
                            style={{
                              gridTemplateColumns: `repeat(${slots.length}, 1fr)`,
                            }}
                          >
                            {slots.map((slot) => {
                              const available = seatAvailability[slot.key];
                              const conflictingBooking =
                                findConflictingBooking(
                                  session?.bookings,
                                  slot,
                                );
                              const bookedByYou = Boolean(
                                conflictingBooking &&
                                  area &&
                                  bookingMatchesSeat(
                                    conflictingBooking,
                                    area,
                                    seat,
                                  ),
                              );
                              const blockedByBooking = Boolean(
                                available &&
                                  conflictingBooking &&
                                  !bookedByYou,
                              );
                              const requested = selectedSlots.some(
                                (selected) => selected.key === slot.key,
                              );
                              const selected = selectedCellKeys.has(
                                selectionKey(seat.id, slot.key),
                              );
                              const className = [
                                bookedByYou
                                  ? "is-mine"
                                  : blockedByBooking
                                    ? "is-conflict"
                                    : available === undefined
                                      ? "is-pending"
                                      : available
                                        ? "is-free"
                                        : "is-busy",
                                requested ? "is-requested" : "",
                                selected ? "is-selected" : "",
                              ]
                                .filter(Boolean)
                                .join(" ");
                              const title = `${timeLabel(slot.label)}: ${
                                bookedByYou
                                  ? "booked by you"
                                  : blockedByBooking &&
                                      conflictingBooking
                                    ? `available, but blocked by your ${existingBookingLabel(
                                        conflictingBooking,
                                      )} booking`
                                : available === undefined
                                  ? "checking"
                                  : available
                                    ? selected
                                      ? "selected"
                                      : "available — click to select"
                                    : "unavailable"
                              }`;

                              return available && !conflictingBooking ? (
                                <button
                                  type="button"
                                  key={slot.key}
                                  className={className}
                                  title={title}
                                  aria-label={`${seat.name}, ${timeLabel(
                                    slot.label,
                                  )}, ${selected ? "selected" : "available"}`}
                                  aria-pressed={selected}
                                  onClick={() =>
                                    toggleSelectedSlot(seat, slot)
                                  }
                                />
                              ) : (
                                <span
                                  key={slot.key}
                                  className={className}
                                  title={title}
                                />
                              );
                            })}
                          </div>
                          <div
                            className="nlb-seat-helper__timeline-labels"
                            style={{
                              gridTemplateColumns: `repeat(${slots.length}, 1fr)`,
                            }}
                          >
                            {slots.map((slot) => (
                              <small key={slot.key}>
                                {timeLabel(slot.label).replace(
                                  /:00|am|pm/g,
                                  "",
                                )}
                              </small>
                            ))}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                  <div
                    className="nlb-seat-helper__timeline-legend"
                    aria-label="Timeline color legend"
                  >
                    <span><i className="is-free" />Available</span>
                    <span><i className="is-mine" />Booked by you</span>
                    <span><i className="is-conflict" />Blocked by your booking</span>
                    <span><i className="is-busy" />Unavailable</span>
                  </div>

                  <section className="nlb-seat-helper__booking-selection">
                    <div className="nlb-seat-helper__booking-selection-header">
                      <div>
                        <strong>
                          {selectedMinutes > 0
                            ? `${formatQuotaMinutes(
                                selectedMinutes,
                              )} selected`
                            : "Select available hours"}
                        </strong>
                        <span>
                          Click green timeline boxes. Selection cannot exceed
                          the quota for this date.
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={
                          selectedSeatSlots.length === 0 ||
                          !selectedDateQuota ||
                          !bookingIdentifiersReady ||
                          bookingRunning
                        }
                        onClick={() => setReviewingBooking(true)}
                      >
                        Book
                      </button>
                    </div>

                    {selectionMessage && (
                      <p className="nlb-seat-helper__selection-warning">
                        {selectionMessage}
                      </p>
                    )}

                    {selectedSeatSlots.length > 0 && (
                      <>
                        <fieldset className="nlb-seat-helper__booking-mode">
                          <legend>How should adjacent hours be booked?</legend>
                          <label>
                            <input
                              type="radio"
                              name="nlb-booking-mode"
                              checked={!bookSeparately}
                              onChange={() => setBookSeparately(false)}
                            />
                            <span>
                              <strong>Combine adjacent hours</strong>
                              <small>Fewer booking requests</small>
                            </span>
                          </label>
                          <label>
                            <input
                              type="radio"
                              name="nlb-booking-mode"
                              checked={bookSeparately}
                              onChange={() => setBookSeparately(true)}
                            />
                            <span>
                              <strong>Book each hour separately</strong>
                              <small>Independent hourly reservations</small>
                            </span>
                          </label>
                        </fieldset>

                        <div className="nlb-seat-helper__booking-plan">
                          {bookingPlan.map((booking) => (
                            <div key={booking.id}>
                              <strong>{booking.seatName}</strong>
                              <span>{bookingPeriod(booking)}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {reviewingBooking && bookingPlan.length > 0 && (
                      <div
                        className="nlb-seat-helper__booking-review"
                        role="alertdialog"
                        aria-label="Confirm NLB bookings"
                      >
                        <strong>
                          Confirm {bookingPlan.length} booking request
                          {bookingPlan.length === 1 ? "" : "s"}?
                        </strong>
                        <p>
                          These requests will be submitted sequentially to
                          NLB. Successful bookings consume your displayed
                          quota.
                        </p>
                        <div>
                          <button
                            type="button"
                            onClick={() => setReviewingBooking(false)}
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            className="is-confirm"
                            onClick={() => void runBookings()}
                          >
                            Confirm and book
                          </button>
                        </div>
                      </div>
                    )}
                  </section>

                  {bookingProgress.length > 0 && (
                    <section
                      className="nlb-seat-helper__booking-progress"
                      aria-live="polite"
                    >
                      <strong>Booking status</strong>
                      {bookingProgress.map((item) => (
                        <div
                          key={item.booking.id}
                          className={`is-${item.status}`}
                        >
                          <span aria-hidden="true">
                            {item.status === "pending" && "○"}
                            {item.status === "booking" && "…"}
                            {item.status === "booked" && "✓"}
                            {item.status === "failed" && "!"}
                          </span>
                          <p>
                            {item.message ??
                              `${item.booking.seatName}: ${bookingPeriod(
                                item.booking,
                              )} ${
                                item.status === "booking"
                                  ? "booking…"
                                  : "waiting"
                              }`}
                          </p>
                        </div>
                      ))}
                    </section>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {mapExpanded &&
        areaMapImage &&
        createPortal(
          <div
            className="nlb-seat-helper__map-dialog"
            role="dialog"
            aria-modal="true"
            aria-label={`${area?.name ?? "Area"} seat plan`}
            onClick={() => setMapExpanded(false)}
          >
            <button
              type="button"
              className="nlb-seat-helper__map-dialog-close"
              onClick={() => setMapExpanded(false)}
              aria-label="Close full seat plan"
            >
              ×
            </button>
            <img
              src={areaMapImage}
              alt={`${area?.name ?? "Area"} full seat plan`}
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.getElementById("nlb-seat-helper-root")!,
        )}
    </section>
  );
}
