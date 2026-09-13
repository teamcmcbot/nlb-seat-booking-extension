// Serialized by Playwright into the fresh page. Keep this function standalone:
// browser Fetch Response fields differ from Playwright APIResponse methods.
export async function browserJson(requestUrl) {
  try {
    const response = await fetch(requestUrl, {
      credentials: "include", cache: "no-store",
      headers: { Accept: "application/json, text/plain, */*" },
      signal: AbortSignal.timeout(6_000),
    });
    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
      return { status: response.status, failure: "http-or-content-type" };
    }
    try { return { status: response.status, payload: await response.json() }; }
    catch { return { status: response.status, failure: "invalid-json" }; }
  } catch (error) {
    return { status: 0, failure: ["TimeoutError", "AbortError"].includes(error.name) ? "timeout" : "network" };
  }
}
