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
