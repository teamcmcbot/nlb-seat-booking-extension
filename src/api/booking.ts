import type { PlannedBooking } from "../models/booking";
import { NlbApiError } from "./account";

const BOOKING_URL =
  "https://www.nlb.gov.sg/seatbooking/api/bookings/Book";

export interface BookSeatRequest {
  areaId: string;
  booking: PlannedBooking;
}

export async function bookSeat(
  request: BookSeatRequest,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(BOOKING_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      areaId: request.areaId,
      seatCode: request.booking.seatCode,
      startTime: request.booking.startTime,
      durationInMinutes: request.booking.durationMinutes,
      mode: "OffsiteMode",
    }),
    signal,
  });

  if (!response.ok) {
    throw new NlbApiError(
      `Booking returned ${response.status} ${response.statusText}`.trim(),
      response.status,
    );
  }

  const payload = (await response.json()) as Record<string, unknown> | null;

  if (!payload) {
    throw new NlbApiError("NLB returned an empty booking response.");
  }

  if (
    payload.isPreferredSeat === false ||
    payload.success === false
  ) {
    const message =
      typeof payload.message === "string"
        ? payload.message
        : "The selected seat is no longer available.";
    throw new NlbApiError(message);
  }
}
