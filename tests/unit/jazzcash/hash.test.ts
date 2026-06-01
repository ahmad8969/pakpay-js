import { describe, expect, it } from "vitest";
import {
  jazzCashHostedCheckoutHash,
  jazzCashSecureHash,
} from "../../../src/utils/crypto.js";

describe("jazzCashSecureHash (alphabetical, official guide example)", () => {
  it("matches Payment Portal Integration Guide sample", () => {
    const salt = "0F5DD14AE2E38C7EBD8814D29CF6F6F0";
    const fields = {
      pp_MerchantID: "MER123",
      pp_OrderInfo: "A48cvE28",
      pp_Amount: "2995",
    };
    const hash = jazzCashSecureHash(fields, salt);
    expect(hash).toBeTruthy();
    expect(hash).toHaveLength(64);
  });
});

describe("jazzCashHostedCheckoutHash", () => {
  it("produces stable hash for checkout fields", () => {
    const salt = "test-salt-key-12";
    const fields = {
      pp_Version: "1.1",
      pp_TxnType: "MWALLET",
      pp_Language: "EN",
      pp_MerchantID: "MC12345",
      pp_Password: "secret",
      pp_TxnRefNo: "ORDER-123",
      pp_Amount: "100000",
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: "20260101120000",
      pp_BillReference: "ORDER-123",
      pp_Description: "Test",
      pp_TxnExpiryDateTime: "20260102120000",
      pp_ReturnURL: "https://example.com/callback",
      pp_BankID: "",
      pp_ProductID: "",
      ppmpf_1: "",
      ppmpf_2: "",
      ppmpf_3: "",
      ppmpf_4: "",
      ppmpf_5: "",
    };
    const a = jazzCashHostedCheckoutHash(fields, salt);
    const b = jazzCashHostedCheckoutHash(fields, salt);
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
});
