/**
 * Example: Express + pakpay-js (JazzCash or Easypaisa)
 *
 *   cp ../../.env.example .env   # fill credentials
 *   npm install
 *   node server.mjs
 */
import express from "express";
import { PakPay, createCallbackHandler, renderPaymentForm } from "pakpay-js";

const PORT = process.env.PORT ?? 3000;
const PROVIDER = process.env.PAY_PROVIDER ?? "jazzcash";

const app = express();

const payment =
  PROVIDER === "easypaisa"
    ? new PakPay({
        provider: "easypaisa",
        storeId: process.env.EASYPAISA_STORE_ID ?? "",
        hashKey: process.env.EASYPAISA_HASH_KEY ?? "",
        sandbox: true,
      })
    : new PakPay({
        provider: "jazzcash",
        merchantId: process.env.JAZZCASH_MERCHANT_ID ?? "",
        password: process.env.JAZZCASH_PASSWORD ?? "",
        integritySalt: process.env.JAZZCASH_INTEGRITY_SALT ?? "",
        sandbox: true,
      });

app.get("/", (_req, res) => {
  res.send(
    `<h1>pakpay-js demo (${PROVIDER})</h1><a href="/pay">Pay test amount</a>`,
  );
});

app.get("/pay", (_req, res) => {
  const session = payment.createPayment({
    amount: 10,
    orderId: `${PROVIDER}-${Date.now()}`.slice(0, 20),
    returnUrl: `http://localhost:${PORT}/callback`,
    description: "pakpay-js example",
  });

  if (!session.success) {
    return res.status(400).send(session.error);
  }

  console.log("txnDateTime (save to DB):", session.data.txnDateTime);
  res.send(renderPaymentForm(session.data.redirectUrl, session.data.formFields));
});

app.post(
  "/callback",
  express.urlencoded({ extended: false }),
  createCallbackHandler(payment, {
    onPaid: (data) => {
      console.log("Payment success:", data);
    },
    onFailed: (data) => {
      console.log("Payment failed:", data.gatewayCode, data.gatewayMessage);
    },
  }),
);

app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}  provider=${PROVIDER}`);
});
