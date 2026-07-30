import type { ExistingBooking } from "../models/account";
import type { Area, Seat } from "../models/catalog";
import type { HourSlot } from "./availability";

function normalized(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
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
