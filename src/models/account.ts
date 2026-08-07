export interface BookingQuota {
  name: string;
  code: string;
  quotaInMinutes: number;
  remainingQuotaInMinutes: number;
}

export interface AdvancedBookingQuota {
  bookingDate: string;
  quotas: BookingQuota[];
}

export interface CancellationReason {
  code: string;
  name: string;
  description: string;
  order: number;
}

export interface ExistingBooking {
  bookingId?: string | number;
  branchId: string;
  facilityId?: string;
  floor?: string;
  seat: string;
  area: string;
  startTime: string;
  endTime: string;
  lastAction: string;
  canCancelStatus: boolean;
  active: boolean;
}

export interface AccountSession {
  userId: string;
  dailyQuotas: BookingQuota[];
  advancedQuotas: AdvancedBookingQuota[];
  bookings: ExistingBooking[];
  cancellationReasons: CancellationReason[];
}
