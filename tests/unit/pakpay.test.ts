import { describe, expect, it } from "vitest";
import { PakPay } from "../../src/pakpay.js";
import { PakPayConfigError } from "../../src/errors/index.js";
import { jazzCashHostedCheckoutHash } from "../../src/utils/crypto.js";

const config = {
  provider: "jazzcash" as const,
  merchantId: "MC00000",
  password: "test-password",
  integritySalt: "test-integrity-salt-0000",
  sandbox: true,
};

describe("PakPay", () => {
  it("throws on invalid config", () => {
    expect(
      () =>
        new PakPay({
          provider: "jazzcash",
          merchantId: "",
          password: "x",
          integritySalt: "y",
        }),
    ).toThrow(PakPayConfigError);
  });

  it("createPayment returns redirect form", () => {
    const payment = new PakPay(config);
    const result = payment.createPayment({
      amount: 1000,
      orderId: "ORDER-123",
      returnUrl: "https://example.com/success",
      customerName: "Ahmad",
      customerEmail: "ahmad@gmail.com",
      customerPhone: "03001234567",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.redirectUrl).toContain("sandbox.jazzcash.com.pk");
    expect(result.data.method).toBe("POST");
    expect(result.data.formFields.pp_SecureHash).toHaveLength(64);
    expect(result.data.formFields.pp_Amount).toBe("100000");
    expect(result.data.formFields.pp_MerchantID).toBe("MC00000");
    expect(result.data.txnDateTime).toMatch(/^\d{14}$/);
    expect(result.data.txnDateTime).toBe(result.data.formFields.pp_TxnDateTime);
    expect(result.data.provider).toBe("jazzcash");
  });

  it("verifyPayment rejects tampered hash", () => {
    const payment = new PakPay(config);
    const created = payment.createPayment({
      amount: 500,
      orderId: "ORD-1",
      returnUrl: "https://example.com/cb",
    });
    if (!created.success) throw new Error("setup failed");

    const bad = payment.verifyPayment({
      ...created.data.formFields,
      pp_SecureHash: "deadbeef".repeat(8),
      pp_ResponseCode: "000",
    });
    expect(bad.success).toBe(false);
    if (bad.success) return;
    expect(bad.code).toBe("INVALID_SIGNATURE");
  });

  it("verifyPayment accepts valid callback", () => {
    const payment = new PakPay(config);
    const created = payment.createPayment({
      amount: 500,
      orderId: "ORD-2",
      returnUrl: "https://example.com/cb",
    });
    if (!created.success) throw new Error("setup failed");

    const callbackBody: Record<string, string> = {
      ...created.data.formFields,
      pp_ResponseCode: "000",
      pp_ResponseMessage: "Success",
    };
    delete callbackBody.pp_SecureHash;
    callbackBody.pp_SecureHash = jazzCashHostedCheckoutHash(
      callbackBody,
      config.integritySalt,
    );

    const verified = payment.verifyPayment(callbackBody);
    expect(verified.success).toBe(true);
    if (!verified.success) return;
    expect(verified.data.verified).toBe(true);
    expect(verified.data.paid).toBe(true);
  });
});
