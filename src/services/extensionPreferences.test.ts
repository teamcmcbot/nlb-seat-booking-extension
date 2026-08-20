import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_BOOKING_MODE_KEY,
  loadDefaultBookingMode,
  saveDefaultBookingMode,
} from "./extensionPreferences";

function installStorage(initial: Record<string, unknown> = {}) {
  const values = { ...initial };
  const local = {
    get: vi.fn(async (key: string) =>
      Object.hasOwn(values, key) ? { [key]: values[key] } : {},
    ),
    set: vi.fn(async (items: Record<string, unknown>) => {
      Object.assign(values, items);
    }),
  };
  vi.stubGlobal("chrome", { storage: { local } });
  return { local, values };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("default booking mode", () => {
  it("combines adjacent hours when no preference is stored", async () => {
    installStorage();
    await expect(loadDefaultBookingMode()).resolves.toBe("combine");
  });

  it("fails safely to combine for an invalid stored value", async () => {
    installStorage({ [DEFAULT_BOOKING_MODE_KEY]: "unexpected" });
    await expect(loadDefaultBookingMode()).resolves.toBe("combine");
  });

  it("persists and loads the separate-hours preference", async () => {
    const { values } = installStorage();
    await saveDefaultBookingMode("separate");
    expect(values[DEFAULT_BOOKING_MODE_KEY]).toBe("separate");
    await expect(loadDefaultBookingMode()).resolves.toBe("separate");
  });
});
