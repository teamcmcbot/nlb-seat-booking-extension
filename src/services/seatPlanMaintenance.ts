import type { Catalog } from "../models/catalog";
import type { AvailabilityQuery } from "../api/availability";
import {
  extractAreaMapUrls,
  extractAvailableSeatIdentities,
} from "./availability";
import {
  getBookableDateRange,
  getTimelineSlots,
} from "./bookingRules";

export interface SeatPlanExportMetadata {
  extensionVersion: string;
  mode: "catalog" | "targeted-discovery";
}

export function sanitizedSeatPlanCatalog(
  catalog: Catalog,
  capturedAt = new Date().toISOString(),
  discoveredMaps: Readonly<Record<string, readonly string[]>> = {},
  discoveredSeatCodes: Readonly<
    Record<string, Readonly<Record<string, string>>>
  > = {},
  mapDiscovery?: SeatPlanMapDiscoveryReport,
  exportMetadata?: SeatPlanExportMetadata,
) {
  return {
    schemaVersion: 1,
    capturedAt,
    exportMetadata,
    mapDiscovery,
    branches: catalog.branches.map((branch) => ({
      id: branch.id,
      code: branch.code,
      name: branch.name,
      areas: branch.areas.map((area) => ({
        id: area.id,
        branchId: area.branchId,
        branchCode: area.branchCode,
        branchName: area.branchName,
        name: area.name,
        floor: area.floor,
        areaMapUrls: [
          ...new Set([
            ...area.areaMapUrls,
            ...(discoveredMaps[`${area.branchId}:${area.id}`] ?? []),
          ]),
        ],
        seats: area.seats.map((seat) => ({
          id: seat.id,
          code:
            seat.code ||
            discoveredSeatCodes[`${area.branchId}:${area.id}`]?.[
              seat.id.trim().toLowerCase()
            ] ||
            discoveredSeatCodes[`${area.branchId}:${area.id}`]?.[
              seat.name.trim().toLowerCase()
            ] ||
            "",
          name: seat.name,
          disabled: seat.disabled,
        })),
      })),
    })),
  };
}

export interface SeatPlanMapDiscoveryReport {
  requested: true;
  scope: "branch";
  branchId: string;
  requestCount: number;
  attempted: number;
  succeeded: number;
  failed: Array<{ branchId: string; areaId: string; message: string }>;
}

interface SeatPlanMapDiscovery {
  maps: Record<string, string[]>;
  seatCodes: Record<string, Record<string, string>>;
  report: SeatPlanMapDiscoveryReport;
}

type SearchArea = (
  query: AvailabilityQuery,
  signal: AbortSignal,
) => Promise<unknown>;

function localDateValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mostWidelyApplicableSlot(
  slotsByArea: ReadonlyArray<ReturnType<typeof getTimelineSlots>>,
  preference: "earliest" | "latest",
) {
  const counts = new Map<
    string,
    { count: number; slot: ReturnType<typeof getTimelineSlots>[number] }
  >();
  for (const slots of slotsByArea) {
    for (const slot of slots) {
      const current = counts.get(slot.startTime);
      counts.set(slot.startTime, {
        count: (current?.count ?? 0) + 1,
        slot,
      });
    }
  }
  return [...counts.values()]
    .sort((left, right) => {
      const coverage = right.count - left.count;
      if (coverage !== 0) {
        return coverage;
      }
      return preference === "earliest"
        ? left.slot.startTime.localeCompare(right.slot.startTime)
        : right.slot.startTime.localeCompare(left.slot.startTime);
    })
    .at(0)?.slot;
}

function branchDiscoveryProbeSlots(
  branch: Catalog["branches"][number],
  catalog: Catalog,
  now: Date,
) {
  const today = localDateValue(now);
  const futureSlots = branch.areas.map((area) => {
    const range = getBookableDateRange(
      area,
      catalog.bookingRules,
      now,
      catalog.holidays,
    );
    const date = range.selectableDates.find((candidate) => candidate > today);
    return date ? getTimelineSlots(area, date, now) : [];
  });
  const currentSlots = branch.areas.map((area) => {
    const range = getBookableDateRange(
      area,
      catalog.bookingRules,
      now,
      catalog.holidays,
    );
    return range.selectableDates.includes(today)
      ? getTimelineSlots(area, today, now)
      : [];
  });
  const futureSlot = mostWidelyApplicableSlot(futureSlots, "earliest");
  const currentDaySlot = mostWidelyApplicableSlot(currentSlots, "latest");

  const slots = [futureSlot, currentDaySlot].filter(
    (slot): slot is NonNullable<typeof slot> => slot !== undefined,
  );
  return slots.filter(
    (slot, index) =>
      slots.findIndex(
        (candidate) => candidate.startTime === slot.startTime,
      ) === index,
  );
}

export async function discoverBranchSeatPlanMetadata(
  catalog: Catalog,
  branchId: string,
  searchArea: SearchArea,
  now = new Date(),
  signal = new AbortController().signal,
): Promise<SeatPlanMapDiscovery> {
  const maps: Record<string, string[]> = {};
  const seatCodes: Record<string, Record<string, string>> = {};
  const branch = catalog.branches.find(
    (candidate) => candidate.id === branchId,
  );
  if (!branch) {
    throw new Error(
      `Branch ${branchId} is not present in the refreshed catalog.`,
    );
  }
  const report: SeatPlanMapDiscoveryReport = {
    requested: true,
    scope: "branch",
    branchId,
    requestCount: 0,
    attempted: branch.areas.length,
    succeeded: 0,
    failed: [],
  };
  const slots = branchDiscoveryProbeSlots(branch, catalog, now);
  const errors: string[] = [];
  let successfulResponse = false;

  for (const slot of slots) {
    if (signal.aborted) {
      throw new DOMException("Seat-plan discovery was canceled.", "AbortError");
    }
    try {
      report.requestCount += 1;
      const payload = await searchArea(
        {
          branchId,
          startTime: slot.startTime,
          durationMinutes: slot.minutes,
        },
        signal,
      );
      successfulResponse = true;
      for (const area of branch.areas) {
        const key = `${area.branchId}:${area.id}`;
        const discoveredMaps = extractAreaMapUrls(payload, area.id);
        if (discoveredMaps.length > 0) {
          maps[key] = [...new Set([...(maps[key] ?? []), ...discoveredMaps])];
        }
        const codes = seatCodes[key] ?? {};
        for (const seat of extractAvailableSeatIdentities(payload, area.id)) {
          if (seat.id) {
            codes[seatIdentityKey(seat.id)] = seat.code;
          }
          if (seat.name) {
            codes[seatIdentityKey(seat.name)] = seat.code;
          }
        }
        if (Object.keys(codes).length > 0) {
          seatCodes[key] = codes;
        }
      }
      if (
        branch.areas.every(
          (area) => maps[`${area.branchId}:${area.id}`]?.length,
        )
      ) {
        break;
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }
      errors.push(error instanceof Error ? error.message : "Discovery failed.");
    }
  }

  for (const area of branch.areas) {
    const key = `${area.branchId}:${area.id}`;
    if (maps[key]?.length) {
      report.succeeded += 1;
    } else {
      report.failed.push({
        branchId: area.branchId,
        areaId: area.id,
        message:
          slots.length === 0
            ? "No selectable branch probe interval was available."
            : [
                ...errors,
                successfulResponse
                  ? "No exact-area areaMapUrls were returned by the branch probe."
                  : undefined,
              ]
                .filter((message): message is string => Boolean(message))
                .join("; ") || "Discovery failed.",
      });
    }
  }

  return { maps, seatCodes, report };
}

function seatIdentityKey(value: string) {
  return value.trim().toLowerCase();
}
