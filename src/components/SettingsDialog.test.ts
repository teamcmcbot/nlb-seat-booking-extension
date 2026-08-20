import { describe, expect, it } from "vitest";
import type {
  ProfileStorageInventory,
  StoredProfileSummary,
} from "../services/profileStorage";
import { visibleAccountProfiles } from "./SettingsDialog";

function account(profileId: string, label: string): StoredProfileSummary {
  return {
    profileId,
    label,
    kind: "account",
    favouriteCount: 1,
    hasLastSelection: true,
    isLastActive: false,
  };
}

const inventory: ProfileStorageInventory = {
  schemaVersion: 1,
  guest: {
    profileId: "guest",
    label: "Guest",
    kind: "guest",
    favouriteCount: 2,
    hasLastSelection: true,
    isLastActive: false,
  },
  accounts: [account("profile-one", "Profile 1"), account("profile-two", "Profile 2")],
  knownKeys: [],
  malformedKeys: [],
};

describe("visibleAccountProfiles", () => {
  it("hides every account profile while signed out", () => {
    expect(visibleAccountProfiles(inventory)).toEqual([]);
  });

  it("shows only the currently signed-in account", () => {
    expect(visibleAccountProfiles(inventory, "profile-two")).toEqual([
      inventory.accounts[1],
    ]);
  });

  it("does not fall back to another saved profile", () => {
    expect(visibleAccountProfiles(inventory, "profile-missing")).toEqual([]);
  });
});
