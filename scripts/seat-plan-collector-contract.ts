import { extractCatalog } from "../src/services/catalog";
import { sanitizedSeatPlanCatalog, discoverBranchSeatPlanMetadata } from "../src/services/seatPlanMaintenance";

export { sanitizedSeatPlanCatalog, discoverBranchSeatPlanMetadata };

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function identity(value: unknown) {
  return (typeof value === "string" && value.trim().length > 0) ||
    (typeof value === "number" && Number.isSafeInteger(value) && value > 0);
}
function entities(value: unknown, label: string, allowEmpty = false): Record<string, unknown>[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`Anonymous catalog has missing or empty ${label}.`);
  }
  const ids = new Set<string>();
  for (const item of value) {
    if (!record(item) || !identity(item.id) || typeof item.name !== "string" || !item.name.trim()) {
      throw new Error(`Anonymous catalog has malformed ${label} identity.`);
    }
    const id = String(item.id);
    if (ids.has(id)) throw new Error(`Anonymous catalog has duplicate ${label} identities.`);
    ids.add(id);
  }
  return value as Record<string, unknown>[];
}

// Stricter than the interactive parser: never silently drop malformed records
// and turn a partial response into apparent catalog removals.
export function anonymousCatalog(payload: unknown) {
  if (!record(payload) || payload.accountInfo !== null) {
    throw new Error("Collector requires an explicitly anonymous accountInfo: null response.");
  }
  const settings = payload.settings;
  const menus = record(settings) ? settings.menus : undefined;
  const branches = entities(record(menus) ? menus.branchMenus : undefined, "branches");
  let areaCount = 0;
  let seatCount = 0;
  let menuAreaCount = 0;
  const seatBranchIds = new Set<string>();
  const emptyBranchIds: string[] = [];
  const excludedFacilityAreas: string[] = [];
  for (const branch of branches) {
    const areas = entities(branch.areas, "areas", true);
    if (areas.length === 0) emptyBranchIds.push(String(branch.id));
    menuAreaCount += areas.length;
    for (const area of areas) {
      // Match the existing extension's explicit meeting-room exclusion.
      if (String(area.facilityId) === "2") {
        excludedFacilityAreas.push(`${branch.id}:${area.id}`);
        continue;
      }
      seatBranchIds.add(String(branch.id));
      areaCount += 1;
      const seats = entities(area.seats, "seats");
      seatCount += seats.length;
      const names = new Set<string>();
      for (const seat of seats) {
        const name = String(seat.name).trim().toUpperCase();
        if (names.has(name)) throw new Error("Anonymous catalog has duplicate seat names.");
        names.add(name);
      }
    }
  }
  // Only the known catalog/settings envelope enters the reusable parser.
  const catalog = extractCatalog({ settings, accountInfo: null });
  const counts = catalogCounts(catalog);
  if (counts.branches !== seatBranchIds.size || counts.areas !== areaCount || counts.seats !== seatCount) {
    throw new Error("Catalog normalization lost records; collection is incomplete.");
  }
  if (counts.areas === 0 || counts.seats === 0) throw new Error("Anonymous catalog has no seat areas.");
  return { ...catalog, collectionScope: { menuBranches: branches.length,
    menuAreas: menuAreaCount, emptyBranchIds, excludedFacilityAreas, seatCatalog: counts } };
}

export function catalogCounts(catalog: ReturnType<typeof extractCatalog>) {
  const areas = catalog.branches.flatMap((branch) => branch.areas);
  return { branches: catalog.branches.length, areas: areas.length,
    seats: areas.reduce((sum, area) => sum + area.seats.length, 0) };
}
