import type { ExistingBooking } from "./account";

export interface SelectedSeatSlot {
  seatId: string;
  seatCode: string;
  seatName: string;
  startTime: string;
  durationMinutes: number;
}

export interface PlannedBooking {
  id: string;
  seatId: string;
  seatCode: string;
  seatName: string;
  startTime: string;
  durationMinutes: number;
}

export type BookingProgressStatus =
  | "pending"
  | "booking"
  | "booked"
  | "failed";

export interface BookingProgress {
  booking: PlannedBooking;
  status: BookingProgressStatus;
  message?: string;
}

export type CancellationProgressStatus =
  | "pending"
  | "cancelling"
  | "cancelled"
  | "failed"
  | "uncertain";

export interface CancellationProgress {
  booking: ExistingBooking;
  status: CancellationProgressStatus;
  message?: string;
}
