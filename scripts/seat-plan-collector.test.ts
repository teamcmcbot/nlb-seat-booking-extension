import { afterEach, describe, expect, it, vi } from "vitest";
import { anonymousCatalog, catalogCounts, sanitizedSeatPlanCatalog } from "./seat-plan-collector-contract";
import { browserJson } from "./seat-plan-browser-json.mjs";
import { collectorRequestPolicy } from "./seat-plan-collector-network.mjs";
import { validateExportProvenance } from "./seat-plan-export-provenance.mjs";

function payload() {
  return { accountInfo: null, settings: { menus: { branchMenus: [{
    id: 2, name: "Example Library", code: "EX", areas: [{
      id: 43, name: "Study Area", seats: [{ id: 723, name: "S1", hasAvailableSlots: [{time: "10:00", isAvail: true}] }],
    }],
  }] } } };
}

describe("anonymous catalog evidence", () => {
  it("keeps catalog identity but excludes account, availability and unrelated response fields", () => {
    const raw = { ...payload(), debug: { userId: "do-not-export", bookings: ["private"] } };
    const catalog = anonymousCatalog(raw);
    expect(catalogCounts(catalog)).toEqual({ branches: 1, areas: 1, seats: 1 });
    const snapshot = sanitizedSeatPlanCatalog(catalog);
    expect(snapshot.branches[0].areas[0].seats[0]).toMatchObject({ id: "723", name: "S1" });
    const serialized = JSON.stringify(snapshot);
    for (const field of ["userId", "bookings", "hasAvailableSlots", "availableSlots", "debug", "do-not-export"]) {
      expect(serialized).not.toContain(field);
    }
  });
  it.each([{}, { settings: {} }, { ...payload(), accountInfo: { userId: "private" } }])("rejects absent or authenticated account state", (raw) => {
    expect(() => anonymousCatalog(raw)).toThrow();
  });
  it("records empty branch menus and the extension's facility-2 exclusion without losing seat areas", () => {
    const raw = payload();
    raw.settings.menus.branchMenus.push({id: 6, name: "No seats", code: "NS", areas: []});
    raw.settings.menus.branchMenus[0].areas.push({id: 99, name: "Meeting room", seats: [], facilityId: 2} as never);
    const catalog = anonymousCatalog(raw);
    expect(catalogCounts(catalog)).toEqual({branches: 1, areas: 1, seats: 1});
    expect(catalog.collectionScope).toMatchObject({menuBranches: 2, menuAreas: 2, emptyBranchIds: ["6"], excludedFacilityAreas: ["2:99"]});
  });
  it("rejects empty and malformed collections before the tolerant normalizer can drop them", () => {
    const raw = payload();
    raw.settings.menus.branchMenus[0].areas[0].seats = [];
    expect(() => anonymousCatalog(raw)).toThrow(/empty seats/);
    const malformed = payload();
    malformed.settings.menus.branchMenus.push({ id: 3, name: "", code: "", areas: [] });
    expect(() => anonymousCatalog(malformed)).toThrow(/malformed branches/);
  });
  it("rejects duplicate area IDs and seat names", () => {
    const raw = payload();
    raw.settings.menus.branchMenus[0].areas.push(raw.settings.menus.branchMenus[0].areas[0]);
    expect(() => anonymousCatalog(raw)).toThrow(/duplicate areas/);
    const duplicate = payload();
    duplicate.settings.menus.branchMenus[0].areas[0].seats.push({id: 724, name: "s1", hasAvailableSlots: []});
    expect(() => anonymousCatalog(duplicate)).toThrow(/duplicate seat names/);
  });
});

describe("anonymous request budget", () => {
  const base = "https://www.nlb.gov.sg";
  const account = `${base}/seatbooking/api/accounts/GetAccountInfo`;
  const search = `${base}/seatbooking/api/areas/SearchAvailableAreas?Mode=OffsiteMode&BranchId=2`;
  it("allows one startup account request and no spontaneous searches", () => {
    const policy = collectorRequestPolicy();
    expect(policy.allow(account, "GET")).toBe(true);
    expect(policy.allow(account, "GET")).toBe(false);
    expect(policy.allow(search, "GET")).toBe(false);
    expect(policy.counts()).toEqual({ accounts: 1, searches: 0 });
  });
  it("permits only an armed exact search, at most twice", () => {
    const policy = collectorRequestPolicy();
    for (let i = 0; i < 3; i++) {
      policy.permitSearch(search);
      expect(policy.allow(`${search}&AreaId=43`, "GET")).toBe(false);
      expect(policy.allow(search, "GET")).toBe(i < 2);
      expect(policy.allow(search, "GET")).toBe(false);
    }
    expect(policy.counts().searches).toBe(2);
  });
  it("allows only resource requests for NLB's normal AWS WAF initialization", () => {
    const policy = collectorRequestPolicy();
    expect(policy.allow("https://example.region.token.awswaf.com/challenge.js", "GET", "script")).toBe(true);
    expect(policy.allow("https://example.region.token.awswaf.com/verify", "POST", "fetch")).toBe(true);
    expect(policy.allow("https://example.region.token.awswaf.com/login", "GET", "document")).toBe(false);
    expect(policy.allow("https://token.awswaf.com.evil.test/verify", "POST", "fetch")).toBe(false);
  });
  it("blocks mutations, other APIs, and authentication navigation", () => {
    const policy = collectorRequestPolicy();
    for (const method of ["POST", "PATCH", "DELETE"]) expect(policy.allow(account, method)).toBe(false);
    expect(policy.allow(`${base}/seatbooking/api/bookings/Book`, "GET")).toBe(false);
    expect(policy.allow("https://account.nlb.gov.sg/login", "GET")).toBe(false);
    expect(policy.allow(`${base}/seatbooking/main.js`, "GET")).toBe(true);
  });
});

describe("collector provenance", () => {
  const metadata = {source: "anonymous-browser", collectorVersion: 1, repositoryVersion: "1.4.1", sourceRevision: "a".repeat(40), sourceDirty: false, anonymous: true, mode: "catalog"};
  it("accepts both explicit anonymous and legacy extension exports", () => {
    expect(() => validateExportProvenance(metadata, "1.4.1")).not.toThrow();
    expect(() => validateExportProvenance({extensionVersion: "1.4.1", mode: "catalog"}, "1.4.1")).not.toThrow();
  });
  it("rejects incompatible or falsely authenticated provenance", () => {
    for (const update of [{collectorVersion: 2}, {anonymous: false}, {sourceRevision: ""}, {source: "unknown"}, {repositoryVersion: "0.0.0"}]) {
      expect(() => validateExportProvenance({...metadata, ...update}, "1.4.1")).toThrow();
    }
  });
});


describe("in-page Fetch response consumption", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("reads browser Response.status as a property and returns parsed evidence", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({found: true, areas: []}), {status: 200, headers: {"content-type": "application/json"}}));
    vi.stubGlobal("fetch", fetchMock);
    expect(await browserJson("https://www.nlb.gov.sg/seatbooking/api/areas/SearchAvailableAreas")).toEqual({status: 200, payload: {found: true, areas: []}});
    expect(fetchMock.mock.calls[0][1]).toMatchObject({credentials: "include", cache: "no-store"});
  });
  it("does not promote error pages, malformed JSON, or timeouts into evidence", async () => {
    vi.stubGlobal("fetch", vi.fn()
      .mockResolvedValueOnce(new Response("login page", {status: 200, headers: {"content-type": "text/html"}}))
      .mockResolvedValueOnce(new Response("", {status: 200, headers: {"content-type": "application/json"}}))
      .mockRejectedValueOnce(new DOMException("timed out", "TimeoutError")));
    expect(await browserJson("test")).toEqual({status: 200, failure: "http-or-content-type"});
    expect(await browserJson("test")).toEqual({status: 200, failure: "invalid-json"});
    expect(await browserJson("test")).toEqual({status: 0, failure: "timeout"});
  });
});
