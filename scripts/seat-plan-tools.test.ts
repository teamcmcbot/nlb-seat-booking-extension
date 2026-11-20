import { describe, expect, it } from "vitest";

import { imageDimensions } from "./seat-plan-tools.mjs";

describe("seat-plan image dimensions", () => {
  it("reads PNG dimensions from the byte signature", () => {
    const png = Buffer.alloc(24);
    Buffer.from("89504e470d0a1a0a", "hex").copy(png);
    png.writeUInt32BE(1280, 16);
    png.writeUInt32BE(720, 20);

    expect(imageDimensions(png, "application/octet-stream")).toEqual({
      width: 1280,
      height: 720,
    });
  });

  it("reads JPEG dimensions when the server incorrectly labels it as PNG", () => {
    const jpeg = Buffer.from([
      0xff, 0xd8,
      0xff, 0xe0, 0x00, 0x04, 0x00, 0x00,
      0xff, 0xc2, 0x00, 0x08, 0x08, 0x02, 0x98, 0x04, 0xb0, 0x03,
      0xff, 0xd9,
    ]);

    expect(imageDimensions(jpeg, "image/png")).toEqual({
      width: 1200,
      height: 664,
    });
  });

  it("rejects malformed image bytes despite an image content type", () => {
    expect(imageDimensions(Buffer.from("not an image"), "image/png")).toBeUndefined();
  });
});
