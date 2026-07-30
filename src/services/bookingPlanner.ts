import type {
  PlannedBooking,
  SelectedSeatSlot,
} from "../models/booking";

function startTimestamp(value: string) {
  return new Date(value).getTime();
}

function bookingId(slot: SelectedSeatSlot, index: number) {
  return `${slot.seatId}:${slot.startTime}:${index}`;
}

export function buildBookingPlan(
  selectedSlots: SelectedSeatSlot[],
  bookSeparately: boolean,
  maxBookingMinutes: number,
): PlannedBooking[] {
  const sorted = [...selectedSlots].sort((left, right) => {
    const seatComparison = left.seatId.localeCompare(right.seatId);
    return seatComparison || left.startTime.localeCompare(right.startTime);
  });

  if (bookSeparately) {
    return sorted.map((slot, index) => ({
      id: bookingId(slot, index),
      seatId: slot.seatId,
      seatCode: slot.seatCode,
      seatName: slot.seatName,
      startTime: slot.startTime,
      durationMinutes: slot.durationMinutes,
    }));
  }

  const plan: PlannedBooking[] = [];

  for (const slot of sorted) {
    const previous = plan[plan.length - 1];
    const previousEnd = previous
      ? startTimestamp(previous.startTime) +
        previous.durationMinutes * 60_000
      : undefined;
    const canMerge =
      previous &&
      previous.seatId === slot.seatId &&
      previousEnd === startTimestamp(slot.startTime) &&
      previous.durationMinutes + slot.durationMinutes <= maxBookingMinutes;

    if (canMerge) {
      previous.durationMinutes += slot.durationMinutes;
    } else {
      plan.push({
        id: bookingId(slot, plan.length),
        seatId: slot.seatId,
        seatCode: slot.seatCode,
        seatName: slot.seatName,
        startTime: slot.startTime,
        durationMinutes: slot.durationMinutes,
      });
    }
  }

  return plan;
}
