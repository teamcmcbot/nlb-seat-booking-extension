import { afterEach, describe, expect, it, vi } from "vitest";
import { searchAvailableAreas } from "./availability";

describe("SearchAvailableAreas request", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("omits AreaId for maintenance branch discovery", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ found: false, areas: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", globalThis);

    await searchAvailableAreas({
      branchId: "10",
      startTime: "2026-08-15T10:00",
      durationMinutes: 60,
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("BranchId=10");
    expect(url).not.toContain("AreaId=");
  });

  it("retains exact AreaId for normal availability checks", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ found: false, areas: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("window", globalThis);

    await searchAvailableAreas({
      branchId: "10",
      areaId: "29",
      startTime: "2026-08-15T10:00",
      durationMinutes: 60,
    });

    expect(String(fetchMock.mock.calls[0][0])).toContain("AreaId=29");
  });
});
