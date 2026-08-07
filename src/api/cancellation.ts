import type { ExistingBooking } from "../models/account";
import { NlbApiError } from "./account";

const CANCELLATION_URL =
  "https://www.nlb.gov.sg/seatbooking/api/bookings/Cancel";

export interface CancelBookingRequest {
  booking: ExistingBooking;
  reasonCode: string;
}

export async function cancelBooking(
  request: CancelBookingRequest,
  signal?: AbortSignal,
): Promise<unknown> {
  if (request.booking.bookingId === undefined) {
    throw new NlbApiError("The selected booking has no cancellation ID.");
  }

  const response = await fetch(CANCELLATION_URL, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      mode: "OffsiteMode",
      bookingId: request.booking.bookingId,
      CancelReason: request.reasonCode,
    }),
    signal,
  });

  if (!response.ok) {
    throw new NlbApiError(
      `Cancellation returned ${response.status} ${response.statusText}`.trim(),
      response.status,
    );
  }

  const contentType = response.headers.get("content-type");
  if (!contentType?.toLowerCase().includes("application/json")) {
    return undefined;
  }

  const payload = (await response.json()) as Record<string, unknown> | null;
  if (payload?.success === false) {
    throw new NlbApiError(
      typeof payload.message === "string"
        ? payload.message
        : "NLB did not cancel the selected booking.",
    );
  }

  return payload;
}
