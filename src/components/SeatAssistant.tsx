import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { bookSeat } from "../api/booking";
import { cancelBooking } from "../api/cancellation";
import {
  searchAvailableAreas,
  type AvailabilityQuery,
} from "../api/availability";
import { NlbApiError } from "../api/account";
import type { AccountSession, ExistingBooking } from "../models/account";
import type {
  BookingProgress,
  CancellationProgress,
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
  getBookableDateRange,
  getBookableSlots,
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
  bookingFavouriteCandidates,
  existingBookingKey,
  findBookingForSeatSlot,
  findConflictingBooking,
  isBookingCancelable,
} from "../services/bookingConflicts";
import { buildBookingPlan } from "../services/bookingPlanner";
import {
  loadLastSeatSelection,
  saveLastSeatSelection,
} from "../services/preferences";

interface SeatAssistantProps {
  catalog: Catalog;
  profileUserId: string;
  session?: AccountSession;
  onAccountRefresh: () => Promise<{
    session?: AccountSession;
    catalog?: Catalog;
  }>;
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

function todayValue() {
  return localDateValue(new Date());
}

function isToday(date: string, now: Date) {
  return date === localDateValue(now);
}

function referenceTime(value: string) {
  return (
    value.match(/(?:T|\s)?(\d{1,2}:\d{2})/)?.[1] ?? value.slice(0, 5)
  );
}

function referenceAvailability(
  area: Area | undefined,
  seats: Seat[],
  slots: HourSlot[],
  date: string,
  now: Date,
) {
  if (!area || !isToday(date, now)) {
    return undefined;
  }

  const availability: SeatAvailability = {};
  let knownSlots = 0;

  for (const seat of seats) {
    const slotsByTime = new Map(
      seat.availableSlots.map((slot) => [referenceTime(slot.time), slot]),
    );

    for (const slot of slots) {
      const referenceSlot = slotsByTime.get(referenceTime(slot.label));
      if (!referenceSlot) {
        continue;
      }

      availability[seat.id] = {
        ...availability[seat.id],
        [slot.key]: !seat.disabled && referenceSlot.isAvailable,
      };
      knownSlots += 1;
    }
  }

  return knownSlots > 0 ? availability : undefined;
}

function catalogArea(
  catalog: Catalog | undefined,
  branchId: string,
  areaId: string,
) {
  return catalog?.branches
    .find((branch) => branch.id === branchId)
    ?.areas.find((area) => area.id === areaId);
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

async function searchWithTransientRetry(
  query: AvailabilityQuery,
  signal: AbortSignal,
) {
  try {
    return await searchAvailableAreas(query, signal);
  } catch (error) {
    const isTransient =
      error instanceof NlbApiError &&
      (error.status === 429 ||
        (error.status !== undefined && error.status >= 500));

    if (!isTransient || signal.aborted) {
      throw error;
    }

    await retryDelay(signal);
    return searchAvailableAreas(query, signal);
  }
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

function joinSeatNames(names: string[]) {
  if (names.length <= 1) {
    return names[0] ?? "";
  }

  return `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
}

function sequenceHint(
  names: string[],
  parsed: { stem: string; value: number }[],
  formatValue: (stem: string, value: number) => string,
) {
  const stem = parsed[0]?.stem;

  if (
    stem === undefined ||
    parsed.some((item) => item.stem !== stem) ||
    parsed.some(
      (item, index) =>
        index > 0 && item.value <= parsed[index - 1].value,
    )
  ) {
    return undefined;
  }

  const first = parsed[0].value;
  const last = parsed.at(-1)?.value ?? first;

  if (first === last) {
    return `Type a seat number (${names[0]}).`;
  }

  const existing = new Set(parsed.map((item) => item.value));
  const missing: string[] = [];

  for (let value = first; value <= last; value += 1) {
    if (!existing.has(value)) {
      missing.push(formatValue(stem, value));
    }
  }

  const range = `${names[0]} to ${names.at(-1)}`;

  if (missing.length === 0) {
    return `Type a seat number (${range}).`;
  }

  if (missing.length <= 3) {
    return `Type a seat number (${range}, excluding ${joinSeatNames(
      missing,
    )}).`;
  }

  return undefined;
}

function seatSearchHint(seats: Seat[]) {
  const names = seats.map((seat) => seat.name.trim()).filter(Boolean);

  if (names.length === 0) {
    return "No seats are configured for this area.";
  }

  const numeric = names.map((name) => {
    const match = name.match(/^(.*?)(\d+)$/);
    return match
      ? { stem: match[1], value: Number(match[2]) }
      : undefined;
  });

  if (numeric.every((item) => item !== undefined)) {
    const hint = sequenceHint(
      names,
      numeric as { stem: string; value: number }[],
      (stem, value) => `${stem}${value}`,
    );

    if (hint) {
      return hint;
    }
  }

  const lettered = names.map((name) => {
    const match = name.match(/^(.*?\d+)([A-Za-z])$/);
    return match
      ? {
          stem: match[1],
          value: match[2].toUpperCase().charCodeAt(0),
        }
      : undefined;
  });

  if (lettered.every((item) => item !== undefined)) {
    const hint = sequenceHint(
      names,
      lettered as { stem: string; value: number }[],
      (stem, value) => `${stem}${String.fromCharCode(value)}`,
    );

    if (hint) {
      return hint;
    }
  }

  return `Type a seat number to search ${names.length} seats.`;
}

function formatSelectedDate(date: string) {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

function selectedDateLabel(date: string, now: Date) {
  if (date === localDateValue(now)) {
    return "Today";
  }

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return date === localDateValue(tomorrow) ? "Tomorrow" : "Selected date";
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

function existingBookingPeriod(booking: ExistingBooking) {
  const start = new Date(booking.startTime);
  const end = new Date(booking.endTime);
  const date = `${String(start.getDate()).padStart(2, "0")}/${String(
    start.getMonth() + 1,
  ).padStart(2, "0")}/${start.getFullYear()}`;
  const label = (value: Date) =>
    timeLabel(
      `${String(value.getHours()).padStart(2, "0")}:${String(
        value.getMinutes(),
      ).padStart(2, "0")}`,
    );

  return `${date}, ${label(start)}–${label(end)}`;
}

function bookingDurationMinutes(booking: ExistingBooking) {
  return Math.max(
    0,
    Math.round(
      (new Date(booking.endTime).getTime() -
        new Date(booking.startTime).getTime()) /
        60_000,
    ),
  );
}

export function SeatAssistant({
  catalog,
  profileUserId,
  session,
  onAccountRefresh,
}: SeatAssistantProps) {
  const [branchId, setBranchId] = useState("");
  const [areaId, setAreaId] = useState("");
  const [date, setDate] = useState(todayValue);
  const [favourites, setFavourites] = useState<FavouriteSeat[]>([]);
  const [storageReady, setStorageReady] = useState(false);
  const [managing, setManaging] = useState(false);
  const [seatSearch, setSeatSearch] = useState("");
  const [now, setNow] = useState(() => new Date());
  const [mapExpanded, setMapExpanded] = useState(false);
  const [loadingMapKey, setLoadingMapKey] = useState("");
  const [discoveredMaps, setDiscoveredMaps] = useState<
    Record<string, string[]>
  >({});
  const [discoveredSeatCodes, setDiscoveredSeatCodes] = useState<
    Record<string, Record<string, string>>
  >({});
  const [selectedCellKeys, setSelectedCellKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedCancellationKeys, setSelectedCancellationKeys] = useState<
    Set<string>
  >(() => new Set());
  const [selectionMessage, setSelectionMessage] = useState("");
  const [automaticFavouriteMessage, setAutomaticFavouriteMessage] =
    useState("");
  const [bookSeparately, setBookSeparately] = useState(true);
  const [reviewingBooking, setReviewingBooking] = useState(false);
  const [reviewingCancellation, setReviewingCancellation] = useState(false);
  const [cancellationReasonCode, setCancellationReasonCode] = useState("");
  const [bookingRunning, setBookingRunning] = useState(false);
  const [cancellationRunning, setCancellationRunning] = useState(false);
  const [bookingProgress, setBookingProgress] = useState<
    BookingProgress[]
  >([]);
  const [cancellationProgress, setCancellationProgress] = useState<
    CancellationProgress[]
  >([]);
  const [scan, setScan] = useState<ScanState>({
    status: "idle",
    availability: {},
  });
  const scanController = useRef<AbortController>();
  const mapRequests = useRef(new Set<string>());

  useEffect(() => {
    if (!reviewingBooking && !reviewingCancellation) {
      return undefined;
    }

    const closeReviewOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setReviewingBooking(false);
        setReviewingCancellation(false);
      }
    };

    document.addEventListener("keydown", closeReviewOnEscape);
    return () => document.removeEventListener("keydown", closeReviewOnEscape);
  }, [reviewingBooking, reviewingCancellation]);

  useEffect(() => {
    const allBookingsSucceeded =
      bookingProgress.length > 0 &&
      bookingProgress.every((item) => item.status === "booked");

    if (bookingRunning || !allBookingsSucceeded) {
      return undefined;
    }

    const dismissTimer = window.setTimeout(
      () => setBookingProgress([]),
      12_000,
    );

    return () => window.clearTimeout(dismissTimer);
  }, [bookingProgress, bookingRunning]);

  useEffect(() => {
    const allCancellationsSucceeded =
      cancellationProgress.length > 0 &&
      cancellationProgress.every((item) => item.status === "cancelled");

    if (cancellationRunning || !allCancellationsSucceeded) {
      return undefined;
    }

    const dismissTimer = window.setTimeout(
      () => setCancellationProgress([]),
      12_000,
    );

    return () => window.clearTimeout(dismissTimer);
  }, [cancellationProgress, cancellationRunning]);

  const branch = useMemo(
    () => catalog.branches.find((item) => item.id === branchId),
    [branchId, catalog.branches],
  );
  const area = useMemo(
    () => branch?.areas.find((item) => item.id === areaId),
    [areaId, branch],
  );
  const seatHint = useMemo(
    () => seatSearchHint(area?.seats ?? []),
    [area],
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
  const bookingFavouriteState = useMemo(
    () => bookingFavouriteCandidates(catalog, session?.bookings, now),
    [catalog, now, session?.bookings],
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
  const referenceMatrix = useMemo(
    () => referenceAvailability(area, favouriteSeats, slots, date, now),
    [area, date, favouriteSeats, slots],
  );
  const referenceMatrixKey = JSON.stringify(referenceMatrix ?? null);
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
  const selectedCancellationBookings = useMemo(
    () =>
      session?.bookings.filter((booking) =>
        selectedCancellationKeys.has(existingBookingKey(booking)),
      ) ?? [],
    [selectedCancellationKeys, session?.bookings],
  );
  const selectedMinutes = selectedSeatSlots.reduce(
    (total, slot) => total + slot.durationMinutes,
    0,
  );
  const selectedCancellationMinutes = selectedCancellationBookings.reduce(
    (total, booking) => total + bookingDurationMinutes(booking),
    0,
  );
  const cancellationMode = selectedCancellationBookings.length > 0;
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
  const orderedFavouriteSeats = useMemo(() => {
    const useAvailabilityPriority =
      scan.status === "complete" || scan.status === "error";

    return favouriteSeats
      .map((seat, index) => {
        const seatAvailability = scan.availability[seat.id] ?? {};
        const booked = Boolean(
          area &&
            slots.some((slot) => {
              const booking = findBookingForSeatSlot(
                session?.bookings,
                slot,
                area,
                seat,
              );
              return Boolean(booking);
            }),
        );
        const available =
          useAvailabilityPriority &&
          Object.values(seatAvailability).some(Boolean);
        const rank = booked ? 0 : available ? 1 : 2;

        return { seat, index, rank };
      })
      .sort((left, right) => left.rank - right.rank || left.index - right.index)
      .map(({ seat }) => seat);
  }, [
    area,
    favouriteSeats,
    scan.availability,
    scan.status,
    session?.bookings,
    slots,
  ]);
  const scanContextKey = [
    session?.userId ?? profileUserId,
    area?.branchId,
    area?.id,
    date,
    favouriteSeats.map((seat) => seat.id).join(","),
    slots.map((slot) => slot.key).join(","),
    referenceMatrixKey,
  ].join("|");

  useEffect(() => {
    Promise.all([
      loadFavouriteSeats(profileUserId),
      loadLastSeatSelection(profileUserId),
    ])
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
    if (!storageReady || !session) {
      return;
    }

    const existing = new Set(favourites.map(favouriteIdentity));
    const additions = bookingFavouriteState.favourites.filter(
      (favourite) => !existing.has(favouriteIdentity(favourite)),
    );
    if (additions.length === 0) {
      return;
    }

    const next = [...favourites, ...additions];
    setFavourites(next);
    setAutomaticFavouriteMessage(
      `${additions.length} booked seat${
        additions.length === 1 ? " was" : "s were"
      } added to this account's favourites.`,
    );
    void saveFavouriteSeats(profileUserId, next);
  }, [
    bookingFavouriteState.favourites,
    favourites,
    profileUserId,
    session,
    storageReady,
  ]);

  useEffect(() => {
    const reasons = session?.cancellationReasons ?? [];
    if (
      cancellationReasonCode &&
      reasons.some((reason) => reason.code === cancellationReasonCode)
    ) {
      return;
    }

    setCancellationReasonCode(
      reasons.find((reason) => reason.code === "ChangeOfPlan")?.code ??
        reasons[0]?.code ??
        "",
    );
  }, [cancellationReasonCode, session?.cancellationReasons]);

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
    const probeSlot = slots[0];
    if (!area || !storageReady || areaMapImage || !probeSlot) {
      return undefined;
    }

    const mapKey = `${area.branchId}:${area.id}`;
    if (mapRequests.current.has(mapKey)) {
      return undefined;
    }

    mapRequests.current.add(mapKey);
    setLoadingMapKey(mapKey);
    const controller = new AbortController();

    void searchWithTransientRetry(
      {
        branchId: area.branchId,
        areaId: area.id,
        startTime: probeSlot.startTime,
        durationMinutes: probeSlot.minutes,
      },
      controller.signal,
    )
      .then((payload) => {
        const maps = extractAreaMapUrls(payload, area.id);
        if (maps.length === 0) {
          return;
        }

        setDiscoveredMaps((current) => ({
          ...current,
          [mapKey]: [...new Set([...(current[mapKey] ?? []), ...maps])],
        }));
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          mapRequests.current.delete(mapKey);
        }
      })
      .finally(() => {
        setLoadingMapKey((current) => (current === mapKey ? "" : current));
      });

    return () => {
      controller.abort();
      mapRequests.current.delete(mapKey);
    };
  }, [
    area?.branchId,
    area?.id,
    areaMapImage,
    slots[0]?.startTime,
    slots[0]?.minutes,
    storageReady,
  ]);

  useEffect(() => {
    scanController.current?.abort();
    setScan(
      referenceMatrix
        ? { status: "complete", availability: referenceMatrix }
        : { status: "idle", availability: {} },
    );
    setSelectedCellKeys(new Set());
    setSelectedCancellationKeys(new Set());
    setSelectionMessage("");
    setReviewingBooking(false);
    setReviewingCancellation(false);

    return () => scanController.current?.abort();
  }, [scanContextKey]);

  async function checkAvailability(
    refreshedAccount?: {
      session?: AccountSession;
      catalog?: Catalog;
    },
    options: { preserveCancellationSelection?: boolean } = {},
  ) {
    if (
      !area ||
      !date ||
      !storageReady ||
      favouriteSeats.length === 0 ||
      slots.length === 0
    ) {
      return;
    }

    if (isToday(date, now)) {
      scanController.current?.abort();
      const controller = new AbortController();
      scanController.current = controller;
      setScan({
        status: "scanning",
        availability: referenceMatrix ?? scan.availability,
        completed: 0,
        total: 1,
      });

      try {
        const refreshed = refreshedAccount ?? (await onAccountRefresh());
        if (controller.signal.aborted) {
          return;
        }

        const refreshedArea = catalogArea(
          refreshed.catalog,
          area.branchId,
          area.id,
        );
        const refreshedFavouriteSeats = favouriteSeats
          .map((seat) =>
            refreshedArea?.seats.find((candidate) => candidate.id === seat.id),
          )
          .filter((seat): seat is Seat => Boolean(seat));
        const refreshedMatrix = referenceAvailability(
          refreshedArea,
          refreshedFavouriteSeats,
          slots,
          date,
          now,
        );

        if (!refreshedMatrix) {
          throw new NlbApiError(
            "NLB did not return current seat availability.",
          );
        }

        const unavailableSelections = selectedSeatSlots.filter(
          (selected) => {
            const seatAvailability = refreshedMatrix[selected.seatId];
            return !seatAvailability?.[selected.startTime];
          },
        );

        if (unavailableSelections.length > 0) {
          const unavailableKeys = new Set(
            unavailableSelections.map((selected) =>
              selectionKey(selected.seatId, selected.startTime),
            ),
          );
          setSelectedCellKeys(
            (current) =>
              new Set(
                [...current].filter((key) => !unavailableKeys.has(key)),
              ),
          );
          setSelectionMessage(
            "One or more selected hours are no longer available and were removed.",
          );
        } else {
          setSelectionMessage("");
        }

        setScan({ status: "complete", availability: refreshedMatrix });
      } catch (error) {
        if (!controller.signal.aborted) {
          setScan({
            status: "error",
            availability: referenceMatrix ?? scan.availability,
            message:
              error instanceof Error
                ? error.message
                : "Current availability could not be refreshed.",
          });
        }
      }

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
    if (!options.preserveCancellationSelection) {
      setSelectedCancellationKeys(new Set());
    }
    setSelectionMessage("");
    setReviewingBooking(false);
    setReviewingCancellation(false);
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
      const payload = await searchWithTransientRetry(
        query,
        controller.signal,
      );

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
    if (selectedCancellationKeys.size > 0) {
      setSelectionMessage(
        "Clear the selected purple booking before selecting available hours.",
      );
      return;
    }

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
    setSelectionMessage("");
  }

  function toggleCancellationBooking(booking: ExistingBooking) {
    if (selectedCellKeys.size > 0) {
      setSelectionMessage(
        "Clear the selected green hours before selecting a booking to cancel.",
      );
      return;
    }

    if (!isBookingCancelable(booking, now)) {
      setSelectionMessage(
        `${existingBookingLabel(booking)} can no longer be cancelled.`,
      );
      return;
    }

    const key = existingBookingKey(booking);
    setSelectedCancellationKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
    setSelectionMessage("");
  }

  function markBookingUnavailable(booking: PlannedBooking) {
    const bookingStart = new Date(booking.startTime).getTime();
    const bookingEnd = bookingStart + booking.durationMinutes * 60_000;
    const affectedSlots = slots.filter((slot) => {
      const slotStart = new Date(slot.startTime).getTime();
      return slotStart >= bookingStart && slotStart < bookingEnd;
    });

    setScan((current) => {
      const availability = { ...current.availability };
      const seatAvailability = { ...availability[booking.seatId] };
      affectedSlots.forEach((slot) => {
        seatAvailability[slot.key] = false;
      });
      availability[booking.seatId] = seatAvailability;

      return current.status === "scanning"
        ? { ...current, availability }
        : { status: "complete", availability };
    });
    setSelectedCellKeys((current) => {
      const next = new Set(current);
      affectedSlots.forEach((slot) => {
        next.delete(selectionKey(booking.seatId, slot.key));
      });
      return next;
    });
  }

  async function refreshAfterMutation() {
    const refreshed = await onAccountRefresh();
    await checkAvailability(refreshed);
    return refreshed;
  }

  async function runBookings() {
    if (
      !area ||
      !session ||
      bookingPlan.length === 0 ||
      bookingRunning
    ) {
      return;
    }

    let refreshedCatalog: Catalog | undefined;
    try {
      const refreshed = await onAccountRefresh();
      if (refreshed.session?.userId !== session.userId) {
        setReviewingBooking(false);
        setSelectionMessage(
          "The signed-in NLB account changed. Review the booking again under the active account.",
        );
        return;
      }
      refreshedCatalog = refreshed.catalog;
    } catch {
      setReviewingBooking(false);
      setSelectionMessage(
        "The active NLB account could not be verified. Refresh the account and try again.",
      );
      return;
    }

    if (isToday(date, now)) {
      const refreshedArea = catalogArea(
        refreshedCatalog,
        area.branchId,
        area.id,
      );
      const refreshedSeats = favouriteSeats
        .map((seat) =>
          refreshedArea?.seats.find((candidate) => candidate.id === seat.id),
        )
        .filter((seat): seat is Seat => Boolean(seat));
      const refreshedMatrix = referenceAvailability(
        refreshedArea,
        refreshedSeats,
        slots,
        date,
        now,
      );

      if (!refreshedMatrix) {
        setReviewingBooking(false);
        setSelectionMessage(
          "NLB did not return current reference availability. Refresh and try again.",
        );
        return;
      }

      const unavailableBooking = bookingPlan.find((booking) => {
        const bookingStart = new Date(booking.startTime).getTime();
        const bookingEnd =
          bookingStart + booking.durationMinutes * 60_000;
        return slots.some((slot) => {
          const slotStart = new Date(slot.startTime).getTime();
          return (
            slotStart >= bookingStart &&
            slotStart < bookingEnd &&
            refreshedMatrix[booking.seatId]?.[slot.key] !== true
          );
        });
      });

      if (unavailableBooking) {
        markBookingUnavailable(unavailableBooking);
        setReviewingBooking(false);
        setSelectionMessage(
          `${unavailableBooking.seatName} is no longer available for the selected time. The selection was removed.`,
        );
        return;
      }
    }

    const controller = new AbortController();
    setBookingRunning(true);
    setReviewingBooking(false);
    setSelectionMessage("Verifying the selected seats with NLB…");
    const validatedPlan: PlannedBooking[] = [];

    try {
      for (const booking of bookingPlan) {
        const payload = await searchWithTransientRetry(
          {
            branchId: area.branchId,
            areaId: area.id,
            startTime: booking.startTime,
            durationMinutes: booking.durationMinutes,
          },
          controller.signal,
        );
        const maps = extractAreaMapUrls(payload, area.id);
        if (maps.length > 0) {
          const mapKey = `${area.branchId}:${area.id}`;
          setDiscoveredMaps((current) => ({
            ...current,
            [mapKey]: [
              ...new Set([...(current[mapKey] ?? []), ...maps]),
            ],
          }));
        }

        const availableSeat = extractAvailableSeatIdentities(payload).find(
          (candidate) =>
            candidate.id === booking.seatId ||
            candidate.name?.toLowerCase() ===
              booking.seatName.toLowerCase() ||
            (booking.seatCode && candidate.code === booking.seatCode),
        );

        if (!availableSeat) {
          markBookingUnavailable(booking);
          setBookingRunning(false);
          setSelectionMessage(
            `${booking.seatName} is no longer available for ${bookingPeriod(
              booking,
            )}. The selection was removed.`,
          );
          return;
        }

        validatedPlan.push({ ...booking, seatCode: availableSeat.code });
      }
    } catch (error) {
      setBookingRunning(false);
      setSelectionMessage(
        error instanceof Error
          ? `The selected seats could not be verified: ${error.message}`
          : "The selected seats could not be verified. Try again.",
      );
      return;
    }

    const areaKey = `${area.branchId}:${area.id}`;
    setDiscoveredSeatCodes((current) => {
      const codes = { ...(current[areaKey] ?? {}) };
      validatedPlan.forEach((booking) => {
        codes[seatIdentityKey(booking.seatId)] = booking.seatCode;
        codes[seatIdentityKey(booking.seatName)] = booking.seatCode;
      });
      return { ...current, [areaKey]: codes };
    });
    setSelectionMessage("");
    setBookingProgress(
      validatedPlan.map((booking) => ({
        booking,
        status: "pending",
      })),
    );

    let successfulBookings = 0;
    for (const booking of validatedPlan) {
      setBookingProgress((current) =>
        current.map((item) =>
          item.booking.id === booking.id
            ? { ...item, status: "booking" }
            : item,
        ),
      );

      try {
        await bookSeat({ areaId: area.id, booking }, controller.signal);
        successfulBookings += 1;
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

    try {
      await refreshAfterMutation();
    } catch {
      setSelectionMessage(
        successfulBookings > 0
          ? "Bookings finished, but account and availability could not be refreshed."
          : "Booking attempts finished, but account data could not be refreshed.",
      );
    }
  }

  async function runCancellations() {
    if (
      !session ||
      selectedCancellationBookings.length === 0 ||
      !cancellationReasonCode ||
      cancellationRunning
    ) {
      return;
    }

    setCancellationRunning(true);
    setReviewingCancellation(false);
    setSelectionMessage("Verifying the selected bookings with NLB…");

    let refreshedBeforeCancellation: Awaited<
      ReturnType<typeof onAccountRefresh>
    >;
    try {
      refreshedBeforeCancellation = await onAccountRefresh();
    } catch {
      setCancellationRunning(false);
      setSelectionMessage(
        "The active NLB account could not be verified. Refresh and try again.",
      );
      return;
    }

    if (refreshedBeforeCancellation.session?.userId !== session.userId) {
      setCancellationRunning(false);
      setSelectedCancellationKeys(new Set());
      setSelectionMessage(
        "The signed-in NLB account changed. Review cancellations under the active account.",
      );
      return;
    }

    const refreshedBookings = new Map(
      refreshedBeforeCancellation.session.bookings.map((booking) => [
        existingBookingKey(booking),
        booking,
      ]),
    );
    const verifiedBookings = [...selectedCancellationKeys]
      .map((key) => refreshedBookings.get(key))
      .filter(
        (booking): booking is ExistingBooking =>
          Boolean(booking && isBookingCancelable(booking, new Date())),
      );

    if (verifiedBookings.length === 0) {
      setCancellationRunning(false);
      setSelectedCancellationKeys(new Set());
      setSelectionMessage(
        "The selected bookings are no longer eligible for cancellation.",
      );
      return;
    }

    if (verifiedBookings.length < selectedCancellationKeys.size) {
      const verifiedKeys = new Set(
        verifiedBookings.map(existingBookingKey),
      );
      setSelectedCancellationKeys((current) =>
        new Set([...current].filter((key) => verifiedKeys.has(key))),
      );
      setSelectionMessage(
        "One or more bookings changed and were removed from the cancellation request.",
      );
    } else {
      setSelectionMessage("");
    }

    const controller = new AbortController();
    const resolvedKeys = new Set<string>();
    setCancellationProgress(
      verifiedBookings.map((booking) => ({
        booking,
        status: "pending",
      })),
    );

    for (const booking of verifiedBookings) {
      const key = existingBookingKey(booking);
      if (!isBookingCancelable(booking, new Date())) {
        setCancellationProgress((current) =>
          current.map((item) =>
            existingBookingKey(item.booking) === key
              ? {
                  ...item,
                  status: "failed",
                  message: `${booking.seat}: the booking has started and can no longer be cancelled.`,
                }
              : item,
          ),
        );
        continue;
      }

      setCancellationProgress((current) =>
        current.map((item) =>
          existingBookingKey(item.booking) === key
            ? { ...item, status: "cancelling" }
            : item,
        ),
      );

      try {
        await cancelBooking(
          { booking, reasonCode: cancellationReasonCode },
          controller.signal,
        );
        setCancellationProgress((current) =>
          current.map((item) =>
            existingBookingKey(item.booking) === key
              ? {
                  ...item,
                  status: "cancelled",
                  message: `${booking.seat}: cancellation accepted by NLB.`,
                }
              : item,
          ),
        );
      } catch (error) {
        setCancellationProgress((current) =>
          current.map((item) =>
            existingBookingKey(item.booking) === key
              ? {
                  ...item,
                  status: "failed",
                  message:
                    error instanceof Error
                      ? error.message
                      : "Cancellation failed.",
                }
              : item,
          ),
        );
      }
    }

    try {
      const refreshedAfterCancellation = await onAccountRefresh();
      if (refreshedAfterCancellation.session?.userId !== session.userId) {
        throw new NlbApiError(
          "The signed-in NLB account changed before cancellation could be verified.",
        );
      }

      const remainingBookings = new Map(
        refreshedAfterCancellation.session.bookings.map((booking) => [
          existingBookingKey(booking),
          booking,
        ]),
      );
      verifiedBookings.forEach((booking) => {
        const key = existingBookingKey(booking);
        if (!remainingBookings.get(key)?.active) {
          resolvedKeys.add(key);
        }
      });
      setCancellationProgress((current) =>
        current.map((item) => {
          const key = existingBookingKey(item.booking);
          const remaining = remainingBookings.get(key);
          if (!remaining?.active && item.status === "failed") {
            return {
              ...item,
              status: "cancelled",
              message: `${item.booking.seat}: the refreshed account confirms cancellation.`,
            };
          }

          if (item.status === "cancelled" && remaining?.active) {
            return {
              ...item,
              status: "uncertain",
              message: `${item.booking.seat}: NLB accepted the request, but the booking still appears active. Refresh before trying again.`,
            };
          }

          return item;
        }),
      );

      await checkAvailability(refreshedAfterCancellation, {
        preserveCancellationSelection: true,
      });
    } catch (error) {
      setCancellationProgress((current) =>
        current.map((item) =>
          item.status === "cancelled"
            ? {
                ...item,
                status: "uncertain",
                message: `${item.booking.seat}: cancellation was accepted, but the account could not be reconciled. Refresh before trying again.`,
              }
            : item,
        ),
      );
      setSelectionMessage(
        error instanceof Error
          ? error.message
          : "Cancellation finished, but account data could not be refreshed.",
      );
    } finally {
      setCancellationRunning(false);
      setSelectedCancellationKeys((current) => {
        const next = new Set(current);
        resolvedKeys.forEach((key) => next.delete(key));
        return next;
      });
    }
  }

  async function toggleFavourite(seat: Seat) {
    if (!area) {
      return;
    }

    const favourite = seatToFavourite(area, seat);
    const identity = favouriteIdentity(favourite);
    const alreadyFavourite = favourites.some(
      (item) => favouriteIdentity(item) === identity,
    );
    const requiredByActiveBooking = bookingFavouriteState.favourites.some(
      (item) => favouriteIdentity(item) === identity,
    );

    if (alreadyFavourite && requiredByActiveBooking) {
      setAutomaticFavouriteMessage(
        `${seat.name} is kept in favourites while it has an active booking.`,
      );
      return;
    }

    const next = alreadyFavourite
      ? favourites.filter((item) => favouriteIdentity(item) !== identity)
      : [...favourites, favourite];

    setFavourites(next);
    await saveFavouriteSeats(profileUserId, next);
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
              void saveLastSeatSelection(profileUserId, {
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
              void saveLastSeatSelection(profileUserId, {
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
            <span>
              {selectedDateLabel(date, now)} · {formatSelectedDate(date)}
            </span>
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

          {automaticFavouriteMessage && (
            <p className="nlb-seat-helper__notice">
              {automaticFavouriteMessage}
            </p>
          )}

          {bookingFavouriteState.unmatched > 0 && (
            <p className="nlb-seat-helper__notice nlb-seat-helper__notice--error">
              {bookingFavouriteState.unmatched} active booked seat
              {bookingFavouriteState.unmatched === 1 ? " could" : "s could"}
              {" "}not be matched to the current NLB catalog.
            </p>
          )}

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
                {loadingMapKey === `${area.branchId}:${area.id}`
                  ? "Loading seat plan…"
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
              <strong>
                Favourite seats{" "}
                <span className="nlb-seat-helper__section-date">
                  ({formatSelectedDate(date)})
                </span>
              </strong>
              <span>
                {areaFavourites.length} of {area.seats.length} selected
              </span>
            </div>
            <div className="nlb-seat-helper__section-actions">
              <button
                type="button"
                className="nlb-seat-helper__text-button"
                onClick={() => setManaging((current) => !current)}
              >
                {managing ? "Done" : "Manage"}
              </button>
              {!managing && areaFavourites.length > 0 && (
                <button
                  type="button"
                  className="nlb-seat-helper__refresh"
                  onClick={() => void checkAvailability()}
                  disabled={
                    scan.status === "scanning" || slots.length === 0
                  }
                >
                  {scan.status === "scanning"
                    ? "Checking…"
                    : scan.status === "idle"
                      ? "Check"
                      : "Refresh"}
                </button>
              )}
            </div>
          </div>

          {managing ? (
            <div className="nlb-seat-helper__seat-manager">
              <input
                type="search"
                placeholder={`Search seat number, e.g. ${
                  area.seats[0]?.name ?? "S1"
                }`}
                value={seatSearch}
                onChange={(event) => setSeatSearch(event.target.value)}
                autoFocus
              />
              {!seatSearch.trim() && <p>{seatHint}</p>}
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
                    {orderedFavouriteSeats.map((seat) => {
                      const seatAvailability =
                        scan.availability[seat.id] ?? {};
                      const knownSlots = slots.filter(
                        (slot) => seatAvailability[slot.key] !== undefined,
                      );
                      const availableForSeat = slots.filter(
                        (slot) => seatAvailability[slot.key],
                      ).length;
                      const selectedForSeat = slots.filter((slot) =>
                        selectedCellKeys.has(
                          selectionKey(seat.id, slot.key),
                        ),
                      ).length;
                      const selectedCancellationForSeat = area
                        ? slots.filter((slot) => {
                            const booking = findBookingForSeatSlot(
                              session?.bookings,
                              slot,
                              area,
                              seat,
                            );
                            return Boolean(
                              booking &&
                                selectedCancellationKeys.has(
                                  existingBookingKey(booking),
                                ),
                            );
                          }).length
                        : 0;
                      const bookedForSeat = area
                        ? slots.filter((slot) => {
                            const booking = findBookingForSeatSlot(
                              session?.bookings,
                              slot,
                              area,
                              seat,
                            );
                            return Boolean(booking);
                          }).length
                        : 0;

                      return (
                        <article key={seat.id}>
                          <div className="nlb-seat-helper__seat-title">
                            <strong>★ {seat.name}</strong>
                            <span
                              className={
                                availableForSeat > 0 ? "is-available" : ""
                              }
                            >
                              {selectedForSeat > 0
                                ? `${formatQuotaMinutes(
                                    selectedForSeat *
                                      area.intervalMinutes,
                                  )} selected`
                                : selectedCancellationForSeat > 0
                                  ? `${formatQuotaMinutes(
                                      selectedCancellationForSeat *
                                        area.intervalMinutes,
                                    )} selected to cancel`
                                : bookedForSeat > 0
                                  ? `${formatQuotaMinutes(
                                      bookedForSeat *
                                        area.intervalMinutes,
                                    )} booked by you`
                                : scan.status === "idle"
                                ? "Not checked"
                                : scan.status === "scanning" &&
                                    knownSlots.length < slots.length
                                  ? "Checking…"
                                  : scan.status === "error" &&
                                      knownSlots.length < slots.length
                                    ? "Incomplete"
                                    : availableForSeat > 0
                                      ? `${formatQuotaMinutes(
                                          availableForSeat *
                                            area.intervalMinutes,
                                        )} available`
                                      : "Unavailable"}
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
                              const bookedBooking = area
                                ? findBookingForSeatSlot(
                                    session?.bookings,
                                    slot,
                                    area,
                                    seat,
                                  )
                                : undefined;
                              const conflictingBooking =
                                bookedBooking ??
                                findConflictingBooking(
                                  session?.bookings,
                                  slot,
                                );
                              const bookedByYou = Boolean(bookedBooking);
                              const cancellationEligible = Boolean(
                                bookedBooking &&
                                  isBookingCancelable(bookedBooking, now),
                              );
                              const cancellationSelected = Boolean(
                                bookedBooking &&
                                  selectedCancellationKeys.has(
                                    existingBookingKey(bookedBooking),
                                  ),
                              );
                              const blockedByBooking = Boolean(
                                available &&
                                  conflictingBooking &&
                                  !bookedByYou,
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
                                selected ? "is-selected" : "",
                                cancellationSelected
                                  ? "is-cancel-selected"
                                  : "",
                              ]
                                .filter(Boolean)
                                .join(" ");
                              const title = `${timeLabel(slot.label)}: ${
                                bookedByYou
                                  ? cancellationSelected
                                    ? "booked by you — selected for cancellation"
                                    : cancellationEligible && bookedBooking
                                      ? `booked by you — click to select the complete ${existingBookingPeriod(
                                          bookedBooking,
                                        )} booking for cancellation`
                                      : "booked by you — this booking cannot be cancelled"
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

                              return bookedBooking && cancellationEligible ? (
                                <button
                                  type="button"
                                  key={slot.key}
                                  className={className}
                                  title={title}
                                  aria-label={`${seat.name}, ${timeLabel(
                                    slot.label,
                                  )}, booked by you, ${
                                    cancellationSelected
                                      ? "selected for cancellation"
                                      : "select complete booking for cancellation"
                                  }`}
                                  aria-pressed={cancellationSelected}
                                  onClick={() =>
                                    toggleCancellationBooking(bookedBooking)
                                  }
                                />
                              ) : available && !conflictingBooking ? (
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
                  <details
                    className="nlb-seat-helper__timeline-legend"
                    aria-label="Timeline color legend"
                  >
                    <summary>Colors</summary>
                    <div>
                      <span><i className="is-free" />Available</span>
                      <span><i className="is-mine" />Booked by you</span>
                      <span><i className="is-cancel-selected" />Selected to cancel</span>
                      <span><i className="is-conflict" />Blocked by your booking</span>
                      <span><i className="is-busy" />Unavailable</span>
                    </div>
                  </details>

                  <section className="nlb-seat-helper__booking-selection">
                    <div className="nlb-seat-helper__booking-selection-header">
                      <div>
                        <strong>
                          {cancellationMode
                            ? `${selectedCancellationBookings.length} booking${
                                selectedCancellationBookings.length === 1
                                  ? ""
                                  : "s"
                              } selected`
                            : selectedMinutes > 0
                            ? `${formatQuotaMinutes(
                                selectedMinutes,
                              )} selected`
                            : "Select available hours or a booking"}
                        </strong>
                        <span>
                          {cancellationMode
                            ? cancellationReasonCode
                              ? `${formatQuotaMinutes(
                                  selectedCancellationMinutes,
                                )} of booked time will be cancelled.`
                              : "Cancellation reasons are unavailable. Refresh the account before continuing."
                            : "Click green boxes to book or cancelable purple boxes to cancel."}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={
                          cancellationMode ? "is-cancel-action" : ""
                        }
                        disabled={
                          cancellationMode
                            ? selectedCancellationBookings.length === 0 ||
                              !cancellationReasonCode ||
                              cancellationRunning ||
                              bookingRunning
                            : selectedSeatSlots.length === 0 ||
                              !selectedDateQuota ||
                              bookingRunning ||
                              cancellationRunning
                        }
                        onClick={() =>
                          cancellationMode
                            ? setReviewingCancellation(true)
                            : setReviewingBooking(true)
                        }
                      >
                        {cancellationMode ? "Cancel" : "Book"}
                      </button>
                    </div>

                    {selectionMessage && (
                      <p className="nlb-seat-helper__selection-warning">
                        {selectionMessage}
                      </p>
                    )}

                    {!cancellationMode && selectedSeatSlots.length > 0 && (
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

                  </section>

                  {bookingProgress.length > 0 && (
                    <section
                      className="nlb-seat-helper__booking-progress"
                      aria-live="polite"
                    >
                      <div className="nlb-seat-helper__booking-progress-header">
                        <strong>Booking status</strong>
                        {!bookingRunning && (
                          <button
                            type="button"
                            onClick={() => setBookingProgress([])}
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                      {bookingProgress.map((item) => (
                        <div
                          key={item.booking.id}
                          className={`nlb-seat-helper__booking-progress-item is-${item.status}`}
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

                  {cancellationProgress.length > 0 && (
                    <section
                      className="nlb-seat-helper__booking-progress nlb-seat-helper__cancellation-progress"
                      aria-live="polite"
                    >
                      <div className="nlb-seat-helper__booking-progress-header">
                        <strong>Cancellation status</strong>
                        {!cancellationRunning && (
                          <button
                            type="button"
                            onClick={() => setCancellationProgress([])}
                          >
                            Dismiss
                          </button>
                        )}
                      </div>
                      {cancellationProgress.map((item) => (
                        <div
                          key={existingBookingKey(item.booking)}
                          className={`nlb-seat-helper__booking-progress-item is-${item.status}`}
                        >
                          <span aria-hidden="true">
                            {item.status === "pending" && "○"}
                            {item.status === "cancelling" && "…"}
                            {item.status === "cancelled" && "✓"}
                            {item.status === "failed" && "!"}
                            {item.status === "uncertain" && "?"}
                          </span>
                          <p>
                            {item.message ??
                              `${item.booking.seat}: ${existingBookingPeriod(
                                item.booking,
                              )}`}
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

      {reviewingBooking &&
        bookingPlan.length > 0 &&
        createPortal(
          <div
            className="nlb-seat-helper__booking-review-overlay"
            onClick={() => setReviewingBooking(false)}
          >
            <div
              className="nlb-seat-helper__booking-review"
              role="alertdialog"
              aria-modal="true"
              aria-label="Confirm NLB bookings"
              onClick={(event) => event.stopPropagation()}
            >
              <strong>
                Confirm {bookingPlan.length} booking request
                {bookingPlan.length === 1 ? "" : "s"}?
              </strong>
              <p>
                Check the seat and time below. These requests will be submitted
                sequentially and successful bookings consume your displayed
                quota.
              </p>
              <div className="nlb-seat-helper__booking-review-plan">
                {bookingPlan.map((booking) => (
                  <div key={booking.id}>
                    <strong>{booking.seatName}</strong>
                    <span>{bookingPeriod(booking)}</span>
                  </div>
                ))}
              </div>
              <div className="nlb-seat-helper__booking-review-actions">
                <button
                  type="button"
                  onClick={() => setReviewingBooking(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="is-confirm"
                  autoFocus
                  onClick={() => void runBookings()}
                >
                  Confirm and book
                </button>
              </div>
            </div>
          </div>,
          document.getElementById("nlb-seat-helper-root")!,
        )}

      {reviewingCancellation &&
        selectedCancellationBookings.length > 0 &&
        createPortal(
          <div
            className="nlb-seat-helper__booking-review-overlay"
            onClick={() => setReviewingCancellation(false)}
          >
            <div
              className="nlb-seat-helper__booking-review nlb-seat-helper__cancellation-review"
              role="alertdialog"
              aria-modal="true"
              aria-label="Confirm NLB booking cancellations"
              onClick={(event) => event.stopPropagation()}
            >
              <strong>
                Cancel {selectedCancellationBookings.length} booking
                {selectedCancellationBookings.length === 1 ? "" : "s"}?
              </strong>
              <p>
                Each booking below will be cancelled in full. This cannot be
                undone from the extension.
              </p>
              <label className="nlb-seat-helper__cancellation-reason">
                <span>Reason</span>
                <select
                  value={cancellationReasonCode}
                  onChange={(event) =>
                    setCancellationReasonCode(event.target.value)
                  }
                >
                  {(session?.cancellationReasons ?? []).map((reason) => (
                    <option key={reason.code} value={reason.code}>
                      {reason.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="nlb-seat-helper__booking-review-plan">
                {selectedCancellationBookings.map((booking) => (
                  <div key={existingBookingKey(booking)}>
                    <strong>{booking.seat}</strong>
                    <span>
                      <small>
                        {area?.branchName ?? "Selected library"} ·{
                          " "
                        }
                        {booking.area || area?.name || "Selected area"}
                      </small>
                      {existingBookingPeriod(booking)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="nlb-seat-helper__booking-review-actions">
                <button
                  type="button"
                  onClick={() => setReviewingCancellation(false)}
                >
                  Go back
                </button>
                <button
                  type="button"
                  className="is-confirm is-cancel-confirm"
                  disabled={!cancellationReasonCode}
                  autoFocus
                  onClick={() => void runCancellations()}
                >
                  Confirm cancellation
                </button>
              </div>
            </div>
          </div>,
          document.getElementById("nlb-seat-helper-root")!,
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
