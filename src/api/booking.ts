import type { PlannedBooking } from "../models/booking";
import { NlbApiError } from "./account";

const BOOKING_URL =
  "https://www.nlb.gov.sg/seatbooking/api/bookings/Book";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function bookingErrorMessage(payload: unknown) {
  if (!isRecord(payload)) {
    return undefined;
  }

  const directMessage = stringValue(payload.message);
  if (directMessage) {
    return directMessage;
  }

  if (isRecord(payload.errors)) {
    const messages = Object.values(payload.errors).flatMap((value) =>
      Array.isArray(value)
        ? value.map(stringValue).filter((message): message is string => Boolean(message))
        : [stringValue(value)].filter((message): message is string => Boolean(message)),
    );
    const uniqueMessages = [...new Set(messages)];
    if (uniqueMessages.length > 0) {
      return uniqueMessages.join(" ");
    }
  }

  return stringValue(payload.detail);
}

async function responseJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text.trim()) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

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
    const payload = await responseJson(response);
    const message = bookingErrorMessage(payload);
    throw new NlbApiError(
      message ?? `Booking returned ${response.status} ${response.statusText}`.trim(),
      response.status,
    );
  }

  const payload = (await response.json()) as Record<string, unknown> | null;

  if (!payload) {
    throw new NlbApiError("NLB returned an empty booking response.");
  }

  if (payload.isPreferredSeat === false || payload.success === false) {
    const message =
      bookingErrorMessage(payload) ?? "The selected seat is no longer available.";
    throw new NlbApiError(message);
  }
}
