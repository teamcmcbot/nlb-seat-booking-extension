import type { ExistingBooking } from "../models/account";
import type { Area, Catalog, FavouriteSeat, Seat } from "../models/catalog";
import type { HourSlot } from "./availability";

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

export function existingBookingKey(booking: ExistingBooking) {
  return booking.bookingId === undefined
    ? `${booking.branchId}:${booking.area}:${booking.seat}:${booking.startTime}:${booking.endTime}`
    : String(booking.bookingId);
}

export function isBookingCancelable(
  booking: ExistingBooking,
  now = new Date(),
) {
  return (
    booking.bookingId !== undefined &&
    booking.lastAction === "Book" &&
    booking.canCancelStatus &&
    now.getTime() < new Date(booking.startTime).getTime()
  );
}

export function bookingOverlapsSlot(
  booking: ExistingBooking,
  slot: HourSlot,
) {
  if (!booking.active) {
    return false;
  }

  const bookingStart = new Date(booking.startTime).getTime();
  const bookingEnd = new Date(booking.endTime).getTime();
  const slotStart = new Date(slot.startTime).getTime();
  const slotEnd = slotStart + slot.minutes * 60_000;

  return bookingStart < slotEnd && bookingEnd > slotStart;
}

export function findConflictingBooking(
  bookings: ExistingBooking[] | undefined,
  slot: HourSlot,
) {
  return bookings?.find((booking) => bookingOverlapsSlot(booking, slot));
}

export function bookingMatchesSeat(
  booking: ExistingBooking,
  area: Area,
  seat: Seat,
) {
  const bookingArea = normalized(booking.area);
  const catalogArea = normalized(area.name);
  const areaNamesMatch =
    Boolean(bookingArea && catalogArea) &&
    (bookingArea === catalogArea ||
      bookingArea.includes(catalogArea) ||
      catalogArea.includes(bookingArea));
  const facilityMatches =
    !booking.facilityId ||
    !area.facilityId ||
    booking.facilityId === area.facilityId;
  const floorMatches =
    !booking.floor || !area.floor || normalized(booking.floor) === normalized(area.floor);
  const strongLocationMatch =
    Boolean(
      booking.facilityId &&
        area.facilityId &&
        booking.floor &&
        area.floor,
    ) &&
    facilityMatches &&
    floorMatches;

  return (
    booking.branchId === area.branchId &&
    normalized(booking.seat) === normalized(seat.name) &&
    facilityMatches &&
    floorMatches &&
    (areaNamesMatch || strongLocationMatch)
  );
}

export function findBookingForSeatSlot(
  bookings: ExistingBooking[] | undefined,
  slot: HourSlot,
  area: Area,
  seat: Seat,
) {
  return bookings?.find(
    (booking) =>
      bookingOverlapsSlot(booking, slot) &&
      bookingMatchesSeat(booking, area, seat),
  );
}

export function resolveBookingSeat(
  catalog: Catalog,
  booking: ExistingBooking,
) {
  const matches = catalog.branches.flatMap((branch) =>
    branch.areas.flatMap((area) =>
      area.seats
        .filter((seat) => bookingMatchesSeat(booking, area, seat))
        .map((seat) => ({ area, seat })),
    ),
  );

  return matches.length === 1 ? matches[0] : undefined;
}

export function bookingFavouriteCandidates(
  catalog: Catalog,
  bookings: ExistingBooking[] | undefined,
  now = new Date(),
): { favourites: FavouriteSeat[]; unmatched: number } {
  const favourites = new Map<string, FavouriteSeat>();
  let unmatched = 0;

  for (const booking of bookings ?? []) {
    if (
      !booking.active ||
      new Date(booking.endTime).getTime() <= now.getTime()
    ) {
      continue;
    }

    const resolved = resolveBookingSeat(catalog, booking);
    if (!resolved) {
      unmatched += 1;
      continue;
    }

    const favourite = {
      branchId: resolved.area.branchId,
      areaId: resolved.area.id,
      seatId: resolved.seat.id,
      seatCode: resolved.seat.code,
      seatName: resolved.seat.name,
    };
    favourites.set(
      `${favourite.branchId}:${favourite.areaId}:${favourite.seatId}`,
      favourite,
    );
  }

  return { favourites: [...favourites.values()], unmatched };
}
