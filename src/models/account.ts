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

export interface ExistingBooking {
  bookingId: string;
  branchId: string;
  facilityId?: string;
  floor?: string;
  seat: string;
  area: string;
  startTime: string;
  endTime: string;
  active: boolean;
}

export interface AccountSession {
  userId: string;
  dailyQuotas: BookingQuota[];
  advancedQuotas: AdvancedBookingQuota[];
  bookings: ExistingBooking[];
}
