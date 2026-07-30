import type {
  AccountSession,
  AdvancedBookingQuota,
  BookingQuota,
  ExistingBooking,
} from "../models/account";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function quotaFrom(value: unknown): BookingQuota | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const name = value.name;
  const code = value.code;
  const quotaInMinutes = Number(value.quotaInMinutes);
  const remainingQuotaInMinutes = Number(value.remainingQuotaInMinutes);

  if (
    typeof name !== "string" ||
    typeof code !== "string" ||
    !Number.isFinite(quotaInMinutes) ||
    !Number.isFinite(remainingQuotaInMinutes)
  ) {
    return undefined;
  }

  return {
    name,
    code,
    quotaInMinutes,
    remainingQuotaInMinutes,
  };
}

function quotaList(value: unknown) {
  return Array.isArray(value)
    ? value.map(quotaFrom).filter((quota): quota is BookingQuota => Boolean(quota))
    : [];
}

function advancedQuotaFrom(
  value: unknown,
): AdvancedBookingQuota | undefined {
  if (!isRecord(value) || typeof value.bookingDateTime !== "string") {
    return undefined;
  }

  return {
    bookingDate: value.bookingDateTime.slice(0, 10),
    quotas: quotaList(value.advancedDailyBookingQuotas),
  };
}

function identifier(value: unknown) {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function existingBookingFrom(
  value: unknown,
): ExistingBooking | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const startTime =
    typeof value.startTime === "string" ? value.startTime : "";
  const endTime =
    typeof value.endTime === "string" ? value.endTime : "";

  if (
    !startTime ||
    !endTime ||
    !Number.isFinite(new Date(startTime).getTime()) ||
    !Number.isFinite(new Date(endTime).getTime())
  ) {
    return undefined;
  }

  const lastAction =
    typeof value.lastAction === "string" ? value.lastAction : "";

  return {
    bookingId: identifier(value.bookingId),
    branchId: identifier(value.branchId),
    facilityId: identifier(value.facilityId) || undefined,
    floor: identifier(value.floor) || undefined,
    seat: typeof value.seat === "string" ? value.seat : "",
    area: typeof value.area === "string" ? value.area : "",
    startTime,
    endTime,
    active: !/cancel/i.test(lastAction),
  };
}

export function extractAccountSession(
  payload: unknown,
): AccountSession | undefined {
  if (!isRecord(payload) || !isRecord(payload.accountInfo)) {
    return undefined;
  }

  const accountInfo = payload.accountInfo;
  if (typeof accountInfo.userId !== "string" || !accountInfo.userId) {
    return undefined;
  }

  return {
    userId: accountInfo.userId,
    dailyQuotas: quotaList(accountInfo.dailyBookingQuotas),
    advancedQuotas: Array.isArray(accountInfo.advancedBookingQuotas)
      ? accountInfo.advancedBookingQuotas
          .map(advancedQuotaFrom)
          .filter(
            (quota): quota is AdvancedBookingQuota => Boolean(quota),
          )
          .sort((left, right) =>
            left.bookingDate.localeCompare(right.bookingDate),
          )
      : [],
    bookings: Array.isArray(accountInfo.bookings)
      ? accountInfo.bookings
          .map(existingBookingFrom)
          .filter(
            (booking): booking is ExistingBooking => Boolean(booking),
          )
          .sort((left, right) =>
            left.startTime.localeCompare(right.startTime),
          )
      : [],
  };
}

export function quotaByCode(
  quotas: BookingQuota[],
  preferredCode = "StudyArea",
) {
  return (
    quotas.find(
      (quota) =>
        quota.code.toLowerCase() === preferredCode.toLowerCase(),
    ) ?? quotas[0]
  );
}

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function quotaForDate(
  session: AccountSession | undefined,
  date: string,
  preferredCode = "StudyArea",
) {
  if (!session || !date) {
    return undefined;
  }

  const quotas =
    date === localDateValue(new Date())
      ? session.dailyQuotas
      : session.advancedQuotas.find(
          (advanced) => advanced.bookingDate === date,
        )?.quotas ?? [];

  return quotaByCode(quotas, preferredCode);
}

export function formatQuotaMinutes(minutes: number) {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;

  if (safeMinutes === 0) {
    return "0h";
  }

  if (hours === 0) {
    return `${remainder}m`;
  }

  return remainder === 0 ? `${hours}h` : `${hours}h ${remainder}m`;
}
