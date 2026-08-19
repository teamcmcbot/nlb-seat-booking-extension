import { useRef, useState } from "react";
import { searchAvailableAreas } from "../api/availability";
import type { AccountSession } from "../models/account";
import type { Catalog } from "../models/catalog";
import {
  discoverBranchSeatPlanMetadata,
  sanitizedSeatPlanCatalog,
  type SeatPlanExportMetadata,
} from "../services/seatPlanMaintenance";

interface SeatPlanMaintenancePanelProps {
  branchId: string;
  catalog: Catalog;
  session?: AccountSession;
  onAccountRefresh: () => Promise<{
    session?: AccountSession;
    catalog?: Catalog;
  }>;
}

type ExportState =
  | { status: "idle" }
  | { status: "running"; message: string }
  | { status: "complete"; message: string }
  | { status: "error"; message: string };

export function SeatPlanMaintenancePanel({
  branchId,
  catalog,
  session,
  onAccountRefresh,
}: SeatPlanMaintenancePanelProps) {
  const running = useRef(false);
  const [exportState, setExportState] = useState<ExportState>({ status: "idle" });
  const selectedBranch = catalog.branches.find((branch) => branch.id === branchId);

  async function runExport(mode: "catalog" | "targeted-discovery") {
    if (running.current) {
      return;
    }
    running.current = true;
    try {
      const description =
        mode === "catalog"
          ? "Refresh the current account catalog and export sanitized branch, area, map, and seat identity fields?\n\nThis makes one GetAccountInfo request and no SearchAvailableAreas requests."
          : `Refresh the catalog and discover map metadata for ${selectedBranch?.name ?? "the selected branch"}?\n\nThis makes one GetAccountInfo request, followed by at most two sequential branch-level SearchAvailableAreas requests. Results are availability-sensitive and incomplete areas will be reported.`;
      if (!window.confirm(description)) {
        return;
      }

      setExportState({
        status: "running",
        message:
          mode === "catalog"
            ? "Refreshing and preparing the sanitized catalog…"
            : "Refreshing and probing the selected branch…",
      });
      const refreshed = await onAccountRefresh();
      if (!refreshed.session || !refreshed.catalog) {
        throw new Error("The NLB session is not signed in after refresh.");
      }

      let discoveredMaps: Record<string, string[]> = {};
      let discoveredSeatCodes: Record<string, Record<string, string>> = {};
      let mapDiscovery;
      if (mode === "targeted-discovery") {
        if (!branchId) {
          throw new Error("Select a library before targeted discovery.");
        }
        const discovery = await discoverBranchSeatPlanMetadata(
          refreshed.catalog,
          branchId,
          searchAvailableAreas,
          new Date(),
        );
        discoveredMaps = discovery.maps;
        discoveredSeatCodes = discovery.seatCodes;
        mapDiscovery = discovery.report;
      }

      const exportMetadata: SeatPlanExportMetadata = {
        extensionVersion: chrome.runtime.getManifest().version,
        mode,
      };
      const snapshot = sanitizedSeatPlanCatalog(
        refreshed.catalog,
        new Date().toISOString(),
        discoveredMaps,
        discoveredSeatCodes,
        mapDiscovery,
        exportMetadata,
      );
      const branchSuffix =
        mode === "targeted-discovery" ? `-branch-${branchId}` : "";
      const filename = `nlb-seat-plan-catalog-${new Date()
        .toISOString()
        .slice(0, 10)}${branchSuffix}.json`;
      downloadJson(snapshot, filename);
      setExportState({
        status: "complete",
        message: `${filename} downloaded. Continue with the local full-audit command.`,
      });
    } catch (error) {
      console.error("Seat-plan maintenance export failed.", error);
      const message =
        error instanceof Error
          ? `Seat-plan maintenance export failed: ${error.message}`
          : "Seat-plan maintenance export failed.";
      setExportState({ status: "error", message });
    } finally {
      running.current = false;
    }
  }

  return (
    <details className="nlb-seat-helper__maintenance">
      <summary>Seat-plan maintenance</summary>
      <p>
        Routine audit export refreshes the catalog without availability probes.
        Branch discovery is optional and availability-sensitive.
      </p>
      <button
        type="button"
        onClick={() => void runExport("catalog")}
        disabled={!session || exportState.status === "running"}
      >
        {exportState.status === "running"
          ? "Export running…"
          : "Export audit catalog"}
      </button>
      <button
        type="button"
        onClick={() => void runExport("targeted-discovery")}
        disabled={!session || !branchId || exportState.status === "running"}
      >
        Discover selected library maps
      </button>
      {!session && <small>Sign in to NLB before exporting.</small>}
      {session && !branchId && (
        <small>Select a library to enable targeted discovery.</small>
      )}
      {exportState.status !== "idle" && (
        <small
          role="status"
          className={exportState.status === "error" ? "is-error" : undefined}
        >
          {exportState.message}
        </small>
      )}
    </details>
  );
}

function downloadJson(value: unknown, filename: string) {
  const blob = new Blob([`${JSON.stringify(value, null, 2)}\n`], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
