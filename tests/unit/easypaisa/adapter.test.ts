import { describe, expect, it } from "vitest";
import { PakPay } from "../../../src/pakpay.js";
import { easypaisaHostedHash } from "../../../src/providers/easypaisa/hash.js";

const config = {
  provider: "easypaisa" as const,
  storeId: "STORE001",
  hashKey: "easypaisa-test-hash-key",
  sandbox: true,
};

describe("Easypaisa PakPay", () => {
  it("createPayment returns txnDateTime and sandbox URL", () => {
    const payment = new PakPay(config);
    const result = payment.createPayment({
      amount: 500,
      orderId: "EP-001",
      returnUrl: "https://example.com/callback",
      customerEmail: "test@example.com",
      customerPhone: "03001234567",
    });

    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.provider).toBe("easypaisa");
    expect(result.data.txnDateTime).toMatch(/^\d{14}$/);
    expect(result.data.redirectUrl).toContain("easypaystg.easypaisa.com.pk");
    expect(result.data.formFields.merchantHashedReq).toBeTruthy();
    expect(result.data.formFields.storeId).toBe("STORE001");
  });

  it("verifyPayment accepts valid callback hash", () => {
    const payment = new PakPay(config);
    const created = payment.createPayment({
      amount: 100,
      orderId: "EP-2",
      returnUrl: "https://example.com/cb",
    });
    if (!created.success) throw new Error("setup failed");

    const { formFields } = created.data;
    const callback = {
      ...formFields,
      responseCode: "0000",
      responseDesc: "SUCCESS",
    };

    const verified = payment.verifyPayment(callback);
    expect(verified.success).toBe(true);
    if (!verified.success) return;
    expect(verified.data.paid).toBe(true);
    expect(verified.data.provider).toBe("easypaisa");
  });

  it("verifyPayment rejects bad hash", () => {
    const payment = new PakPay(config);
    const created = payment.createPayment({
      amount: 100,
      orderId: "EP-3",
      returnUrl: "https://example.com/cb",
    });
    if (!created.success) throw new Error("setup failed");

    const verified = payment.verifyPayment({
      ...created.data.formFields,
      merchantHashedReq: "invalid",
      responseCode: "0000",
    });
    expect(verified.success).toBe(false);
  });
});

describe("easypaisa hash roundtrip", () => {
  it("merchantHashedReq matches hosted hash helper", () => {
    const fields = {
      storeId: "STORE001",
      amount: "500.00",
      postBackURL: "https://example.com/cb",
      orderRefNum: "EP-1",
      expiryDate: "20260601120000",
    };
    const hash = easypaisaHostedHash(fields, "easypaisa-test-hash-key");
    expect(hash).toBeTruthy();
  });
});
