const ORIGIN = "https://www.nlb.gov.sg";
const ACCOUNT = "/seatbooking/api/accounts/GetAccountInfo";
const SEARCH = "/seatbooking/api/areas/SearchAvailableAreas";

export function collectorRequestPolicy() {
  let accounts = 0;
  let searches = 0;
  let permittedSearch;
  return {
    counts: () => ({ accounts, searches }),
    permitSearch(url) { permittedSearch = url; },
    allow(urlString, method, resourceType) {
      const url = new URL(urlString);
      // Let the site's own AWS WAF JavaScript initialize a normal anonymous
      // browser session. This is not an NLB account/booking API permission.
      if (url.protocol === "https:" && url.hostname.endsWith(".token.awswaf.com") &&
          ["script", "xhr", "fetch", "other"].includes(resourceType) &&
          ["GET", "POST"].includes(method)) return true;
      if (url.origin !== ORIGIN || method !== "GET") return false;
      if (url.pathname.startsWith("/seatbooking/api/")) {
        if (url.pathname === ACCOUNT && accounts === 0) { accounts += 1; return true; }
        if (url.pathname === SEARCH && urlString === permittedSearch && searches < 2) {
          permittedSearch = undefined;
          searches += 1;
          return true;
        }
        return false;
      }
      return url.pathname.startsWith("/seatbooking/");
    },
  };
}
