import { beforeEach, describe, expect, it, vi } from "vitest";
import { bookSeat } from "./booking";

const booking = {
  id: "booking-1",
  seatId: "10",
  seatName: "HD10",
  seatCode: "LKCRL7TO9.7.HotDeskZone.10",
  startTime: "2026-08-23T17:00:00",
  durationMinutes: 60,
};

function response(
  body: unknown,
  options: { ok: boolean; status: number; statusText: string },
) {
  return {
    ...options,
    text: vi.fn(async () => JSON.stringify(body)),
    json: vi.fn(async () => body),
  } as unknown as Response;
}

describe("bookSeat", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows validation messages returned in a problem-details errors object", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        response(
          {
            type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
            title: "One or more validation errors occurred.",
            status: 400,
            errors: {
              "": [
                "This area is restricted to library patrons aged 21 and above.",
              ],
            },
          },
          { ok: false, status: 400, statusText: "Bad Request" },
        ),
      ),
    );

    await expect(bookSeat({ areaId: "94", booking })).rejects.toThrow(
      "This area is restricted to library patrons aged 21 and above.",
    );
  });

  it("falls back to the HTTP status when the error body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 409,
        statusText: "Conflict",
        text: vi.fn(async () => "not-json"),
      })),
    );

    await expect(bookSeat({ areaId: "94", booking })).rejects.toThrow(
      "Booking returned 409 Conflict",
    );
  });
});
