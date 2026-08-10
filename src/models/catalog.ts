export interface Seat {
  id: string;
  code: string;
  name: string;
  disabled: boolean;
  availableSlots: SeatAvailabilitySlot[];
}

export interface SeatAvailabilitySlot {
  time: string;
  isAvailable: boolean;
}

export interface Area {
  id: string;
  branchId: string;
  branchCode?: string;
  branchName: string;
  facilityId?: string;
  facilityCode?: string;
  name: string;
  floor?: string;
  openingTime?: string;
  closingTime?: string;
  intervalMinutes: number;
  minBookingMinutes: number;
  maxBookingMinutes: number;
  areaMapUrls: string[];
  seats: Seat[];
}

export interface Branch {
  id: string;
  code?: string;
  name: string;
  areas: Area[];
}

export interface Catalog {
  branches: Branch[];
  bookingRules: BookingRules;
  holidays: HolidayClosure[];
}

export interface HolidayClosure {
  name: string;
  startDate: string;
  endDate: string;
  excludedBranches: string[];
}

export interface BookingRules {
  advanceBookingDays: number;
  bookingReleaseTime?: string;
  privilegeUserBookingReleaseTime?: string;
  allowAdvanceBooking: boolean;
}

export interface FavouriteSeat {
  branchId: string;
  areaId: string;
  seatId: string;
  seatCode: string;
  seatName: string;
}
