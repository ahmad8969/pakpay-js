import { describe, expect, it } from "vitest";
import {
  easypaisaHostedHash,
  easypaisaHostedHashAmpersand,
} from "../../../src/providers/easypaisa/hash.js";

describe("easypaisaHostedHash", () => {
  const fields = {
    storeId: "12345",
    amount: "1000.00",
    postBackURL: "https://example.com/callback",
    orderRefNum: "ORDER-1",
    expiryDate: "20260601180000",
  };

  it("produces stable hex hash", () => {
    const a = easypaisaHostedHash(fields, "test-hash-key");
    const b = easypaisaHostedHash(fields, "test-hash-key");
    expect(a).toBe(b);
    expect(a.length).toBeGreaterThan(32);
  });

  it("differs from ampersand variant", () => {
    const concat = easypaisaHostedHash(fields, "key");
    const amp = easypaisaHostedHashAmpersand(fields, "key");
    expect(concat).not.toBe(amp);
  });
});
