import { NlbApiError } from "./account";

const SEARCH_AVAILABLE_AREAS_URL =
  "https://www.nlb.gov.sg/seatbooking/api/areas/SearchAvailableAreas";

export interface AvailabilityQuery {
  branchId: string;
  areaId?: string;
  startTime: string;
  durationMinutes: number;
}

export async function searchAvailableAreas(
  query: AvailabilityQuery,
  signal?: AbortSignal,
): Promise<unknown> {
  const requestController = new AbortController();
  let timedOut = false;
  const timeout = window.setTimeout(() => {
    timedOut = true;
    requestController.abort();
  }, 6_000);
  const abortRequest = () => requestController.abort();
  signal?.addEventListener("abort", abortRequest, { once: true });
  const parameters = new URLSearchParams({
    Mode: "OffsiteMode",
    BranchId: query.branchId,
    StartTime: query.startTime,
    DurationInMinutes: String(query.durationMinutes),
  });
  if (query.areaId) {
    parameters.set("AreaId", query.areaId);
  }
  try {
    const response = await fetch(
      `${SEARCH_AVAILABLE_AREAS_URL}?${parameters.toString()}`,
      {
        cache: "no-store",
        credentials: "include",
        headers: {
          Accept: "application/json, text/plain, */*",
        },
        signal: requestController.signal,
      },
    );

    if (!response.ok) {
      throw new NlbApiError(
        `Availability request for ${query.startTime.slice(11)} returned ${response.status}`,
        response.status,
      );
    }

    return response.json() as Promise<unknown>;
  } catch (error) {
    if (timedOut) {
      throw new NlbApiError(
        `The ${query.startTime.slice(11)} availability check timed out`,
      );
    }

    throw error;
  } finally {
    window.clearTimeout(timeout);
    signal?.removeEventListener("abort", abortRequest);
  }
}
