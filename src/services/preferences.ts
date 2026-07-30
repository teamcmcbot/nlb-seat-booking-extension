const STORAGE_KEY = "lastSeatSelection";

export interface LastSeatSelection {
  branchId: string;
  areaId: string;
}

function isLastSeatSelection(value: unknown): value is LastSeatSelection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  return (
    typeof record.branchId === "string" &&
    typeof record.areaId === "string"
  );
}

export async function loadLastSeatSelection() {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];
  return isLastSeatSelection(stored) ? stored : undefined;
}

export async function saveLastSeatSelection(
  selection: LastSeatSelection,
) {
  await chrome.storage.local.set({ [STORAGE_KEY]: selection });
}
