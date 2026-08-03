const GET_ACCOUNT_INFO_URL =
  "https://www.nlb.gov.sg/seatbooking/api/accounts/GetAccountInfo";

export class NlbApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "NlbApiError";
  }
}

export async function getAccountInfo(signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(GET_ACCOUNT_INFO_URL, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    headers: {
      Accept: "application/json, text/plain, */*",
    },
    signal,
  });

  if (!response.ok) {
    throw new NlbApiError(
      `NLB returned ${response.status} ${response.statusText}`.trim(),
      response.status,
    );
  }

  const contentType = response.headers.get("content-type");

  if (!contentType?.toLowerCase().includes("application/json")) {
    throw new NlbApiError(
      "NLB returned an unexpected response. Your session may have expired.",
    );
  }

  return response.json() as Promise<unknown>;
}
