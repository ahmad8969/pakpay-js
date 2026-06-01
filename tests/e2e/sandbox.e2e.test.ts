/**
 * Live sandbox E2E — runs only when credentials are set in the environment.
 * See docs/SANDBOX-E2E.md
 */
import { describe, expect, it } from "vitest";
import { PakPay } from "../../src/pakpay.js";

const jazzcashEnabled = Boolean(
  process.env.JAZZCASH_SANDBOX === "1" &&
    process.env.JAZZCASH_MERCHANT_ID?.trim() &&
    process.env.JAZZCASH_PASSWORD?.trim() &&
    process.env.JAZZCASH_INTEGRITY_SALT?.trim(),
);

const easypaisaEnabled = Boolean(
  process.env.EASYPAISA_SANDBOX === "1" &&
    process.env.EASYPAISA_STORE_ID?.trim() &&
    process.env.EASYPAISA_HASH_KEY?.trim(),
);

describe.skipIf(!jazzcashEnabled)("E2E JazzCash sandbox", () => {
  const payment = new PakPay({
    provider: "jazzcash",
    merchantId: process.env.JAZZCASH_MERCHANT_ID!,
    password: process.env.JAZZCASH_PASSWORD!,
    integritySalt: process.env.JAZZCASH_INTEGRITY_SALT!,
    sandbox: true,
  });

  it("createPayment returns valid redirect payload", () => {
    const orderId = `E2E-${Date.now()}`.slice(0, 20);
    const result = payment.createPayment({
      amount: 100,
      orderId,
      returnUrl:
        process.env.JAZZCASH_RETURN_URL ?? "https://example.com/callback",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.txnDateTime).toMatch(/^\d{14}$/);
    expect(result.data.formFields.pp_SecureHash).toHaveLength(64);
    expect(result.data.redirectUrl).toContain("sandbox.jazzcash.com.pk");

    console.log("[E2E JazzCash] POST", result.data.redirectUrl);
    console.log("[E2E JazzCash] orderId:", result.data.orderId);
    console.log("[E2E JazzCash] txnDateTime:", result.data.txnDateTime);
  });

  it.skipIf(!process.env.JAZZCASH_E2E_INQUIRE)(
    "getStatus inquires a completed order",
    async () => {
      const orderId = process.env.JAZZCASH_E2E_ORDER_ID!;
      const txnDateTime = process.env.JAZZCASH_E2E_TXN_DATETIME!;
      const status = await payment.getStatus({
        orderId,
        transactionDate: txnDateTime,
      });
      expect(status.success).toBe(true);
      if (status.success) {
        console.log(
          "[E2E JazzCash] status:",
          status.data.status,
          status.data.gatewayCode,
        );
      }
    },
  );
});

describe.skipIf(!easypaisaEnabled)("E2E Easypaisa sandbox", () => {
  const payment = new PakPay({
    provider: "easypaisa",
    storeId: process.env.EASYPAISA_STORE_ID!,
    hashKey: process.env.EASYPAISA_HASH_KEY!,
    username: process.env.EASYPAISA_USERNAME,
    password: process.env.EASYPAISA_PASSWORD,
    sandbox: true,
  });

  it("createPayment returns valid redirect payload", () => {
    const orderId = `EP-${Date.now()}`.slice(0, 18);
    const result = payment.createPayment({
      amount: 50,
      orderId,
      returnUrl:
        process.env.EASYPAISA_RETURN_URL ?? "https://example.com/callback",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.txnDateTime).toMatch(/^\d{14}$/);
    expect(result.data.formFields.merchantHashedReq).toBeTruthy();
    expect(result.data.redirectUrl).toContain("easypaystg.easypaisa.com.pk");

    console.log("[E2E Easypaisa] POST", result.data.redirectUrl);
    console.log("[E2E Easypaisa] orderId:", result.data.orderId);
    console.log("[E2E Easypaisa] txnDateTime:", result.data.txnDateTime);
  });
});

describe("E2E placeholder", () => {
  it.skipIf(jazzcashEnabled || easypaisaEnabled)(
    "skipped — set JAZZCASH_SANDBOX=1 or EASYPAISA_SANDBOX=1 with credentials (see .env.example)",
    () => {},
  );
});
