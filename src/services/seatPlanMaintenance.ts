import type { Catalog } from "../models/catalog";
import type { AvailabilityQuery } from "../api/availability";
import {
  extractAreaMapUrls,
  extractAvailableSeatIdentities,
} from "./availability";
import {
  getBookableDateRange,
  getTimelineSlots,
  holidayClosureForDate,
} from "./bookingRules";

export const SEAT_PLAN_CATALOG_EXPORT_EVENT =
  "nlb-seat-helper:export-seat-plan-catalog";

export function sanitizedSeatPlanCatalog(
  catalog: Catalog,
  capturedAt = new Date().toISOString(),
  discoveredMaps: Readonly<Record<string, readonly string[]>> = {},
  discoveredSeatCodes: Readonly<
    Record<string, Readonly<Record<string, string>>>
  > = {},
  mapDiscovery?: SeatPlanMapDiscoveryReport,
) {
  return {
    schemaVersion: 1,
    capturedAt,
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
  requested: boolean;
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

export async function discoverSeatPlanMetadata(
  catalog: Catalog,
  searchArea: SearchArea,
  now = new Date(),
  signal = new AbortController().signal,
): Promise<SeatPlanMapDiscovery> {
  const maps: Record<string, string[]> = {};
  const seatCodes: Record<string, Record<string, string>> = {};
  const report: SeatPlanMapDiscoveryReport = {
    requested: true,
    attempted: 0,
    succeeded: 0,
    failed: [],
  };

  for (const branch of catalog.branches) {
    for (const area of branch.areas) {
      if (signal.aborted) {
        throw new DOMException("Seat-plan discovery was canceled.", "AbortError");
      }
      const range = getBookableDateRange(
        area,
        catalog.bookingRules,
        now,
        catalog.holidays,
      );
      const slot = range.selectableDates
        .filter(
          (date) =>
            !holidayClosureForDate(area, date, catalog.holidays),
        )
        .flatMap((date) => getTimelineSlots(area, date, now))
        .at(0);
      const key = `${area.branchId}:${area.id}`;
      if (!slot) {
        report.failed.push({
          branchId: area.branchId,
          areaId: area.id,
          message: "No selectable probe interval was available.",
        });
        continue;
      }

      report.attempted += 1;
      try {
        const payload = await searchArea(
          {
            branchId: area.branchId,
            areaId: area.id,
            startTime: slot.startTime,
            durationMinutes: slot.minutes,
          },
          signal,
        );
        const discoveredMaps = extractAreaMapUrls(payload, area.id);
        if (discoveredMaps.length > 0) {
          maps[key] = [...new Set(discoveredMaps)];
        }
        const codes: Record<string, string> = {};
        for (const seat of extractAvailableSeatIdentities(payload)) {
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
        report.succeeded += 1;
      } catch (error) {
        report.failed.push({
          branchId: area.branchId,
          areaId: area.id,
          message: error instanceof Error ? error.message : "Discovery failed.",
        });
      }
    }
  }

  return { maps, seatCodes, report };
}

function seatIdentityKey(value: string) {
  return value.trim().toLowerCase();
}
