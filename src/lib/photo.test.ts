import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { sniffImage } from "./photo";

describe("sniffImage", () => {
  it("recognises jpeg, png, and webp", () => {
    assert.equal(sniffImage(Buffer.from([0xff, 0xd8, 0xff, 0x00]))?.ext, "jpg");
    assert.equal(
      sniffImage(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.ext,
      "png",
    );
    const webp = Buffer.alloc(12);
    webp.write("RIFF", 0);
    webp.write("WEBP", 8);
    assert.equal(sniffImage(webp)?.contentType, "image/webp");
  });

  it("rejects other files", () => {
    assert.equal(sniffImage(Buffer.from("GIF89a")), null);
    assert.equal(sniffImage(Buffer.from([0xff, 0xd8])), null);
  });
});
