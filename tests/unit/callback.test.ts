import { describe, expect, it, vi } from "vitest";
import { PakPay, createCallbackHandler } from "../../src/index.js";
import { jazzCashHostedCheckoutHash } from "../../src/utils/crypto.js";

const payment = new PakPay({
  provider: "jazzcash",
  merchantId: "MC1",
  password: "pw",
  integritySalt: "salt1234567890ab",
  sandbox: true,
});

function mockRes() {
  const res = {
    statusCode: 200,
    body: "",
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    send(b: string) {
      this.body = b;
    },
  };
  return res;
}

describe("createCallbackHandler", () => {
  function paidCallbackBody(formFields: Record<string, string>) {
    const body = { ...formFields, pp_ResponseCode: "000" };
    delete body.pp_SecureHash;
    body.pp_SecureHash = jazzCashHostedCheckoutHash(body, "salt1234567890ab");
    return body;
  }

  it("returns OK on paid verified callback", async () => {
    const created = payment.createPayment({
      amount: 10,
      orderId: "CB1",
      returnUrl: "https://example.com/cb",
    });
    if (!created.success) throw new Error("setup");

    const handler = createCallbackHandler(payment);
    const req = { body: paidCallbackBody(created.data.formFields) };
    const res = mockRes();
    await handler(req, res);
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("OK");
  });

  it("calls onPaid hook", async () => {
    const created = payment.createPayment({
      amount: 10,
      orderId: "CB2",
      returnUrl: "https://example.com/cb",
    });
    if (!created.success) throw new Error("setup");

    const onPaid = vi.fn();
    const handler = createCallbackHandler(payment, { onPaid });
    await handler(
      { body: paidCallbackBody(created.data.formFields) },
      mockRes(),
    );
    expect(onPaid).toHaveBeenCalledOnce();
  });
});
