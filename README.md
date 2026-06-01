# pakpay-js

[![npm version](https://img.shields.io/npm/v/pakpay-js.svg)](https://www.npmjs.com/package/pakpay-js)
![JazzCash](https://img.shields.io/badge/JazzCash-supported-00a651)
![Easypaisa](https://img.shields.io/badge/Easypaisa-supported-00aeef)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933)
![License](https://img.shields.io/badge/license-MIT-blue)

**pakpay-js** is a Node.js SDK for **JazzCash** and **Easypaisa** online payments in Pakistan. It handles hosted checkout, callback verification, and status inquiry with a small API and zero runtime dependencies.

> Unofficial — not affiliated with JazzCash or Easypaisa. Always test in sandbox before going live.

---

## What this package does

| Feature | Description |
|---------|-------------|
| **Hosted checkout** | Builds a signed form; you redirect the customer to JazzCash or Easypaisa |
| **Verify callback** | Validates the gateway POST on your return URL before marking an order paid |
| **Status inquiry** | Checks payment status from the gateway (reconciliation / cron jobs) |
| **`txnDateTime`** | Returns a timestamp you must store for JazzCash `getStatus()` |

---

## Requirements

- **Node.js 18+** (uses native `fetch`)
- **Server-side only** — never put merchant passwords or hash keys in frontend code
- A **merchant account** with JazzCash and/or Easypaisa

---

## Installation

```bash
npm install pakpay-js
```

**Optional** — Express middleware wrapper:

```bash
npm install pakpay-js express
# or: npm install pakpay-js @pakpay-js/express express
```

---

## Quick usage (3 steps)

### Step 1 — Create the client

**JazzCash:**

```javascript
import { PakPay } from "pakpay-js";

const payment = new PakPay({
  provider: "jazzcash",
  merchantId: process.env.JAZZCASH_MERCHANT_ID,
  password: process.env.JAZZCASH_PASSWORD,
  integritySalt: process.env.JAZZCASH_INTEGRITY_SALT,
  sandbox: true, // false in production
});
```

**Easypaisa:**

```javascript
const payment = new PakPay({
  provider: "easypaisa",
  storeId: process.env.EASYPAISA_STORE_ID,
  hashKey: process.env.EASYPAISA_HASH_KEY,
  sandbox: true,
  username: process.env.EASYPAISA_USERNAME, // required for getStatus()
  password: process.env.EASYPAISA_PASSWORD,
});
```

### Step 2 — Start a payment

```javascript
import { renderPaymentForm } from "pakpay-js";

const session = payment.createPayment({
  amount: 1000,        // PKR
  orderId: "ORDER-123",
  returnUrl: "https://yoursite.com/payments/callback",
  customerEmail: "user@example.com",
  customerPhone: "03001234567",
});

if (!session.success) {
  throw new Error(session.error);
}

// Save in your database (required for JazzCash getStatus)
await saveOrder({
  orderId: session.data.orderId,
  txnDateTime: session.data.txnDateTime,
  status: "pending",
});

// Redirect customer to the gateway
res.send(renderPaymentForm(session.data.redirectUrl, session.data.formFields));
```

### Step 3 — Handle the callback

```javascript
import express from "express";
import { createCallbackHandler } from "pakpay-js";

app.post(
  "/payments/callback",
  express.urlencoded({ extended: false }),
  createCallbackHandler(payment, {
    onPaid: async (data) => {
      // Signature is valid AND payment succeeded
      await markOrderPaid(data.orderId, data.amount);
    },
    onFailed: async (data) => {
      await markOrderFailed(data.orderId);
    },
  }),
);
```

**Optional — reconcile stuck orders:**

```javascript
const status = await payment.getStatus({
  orderId: "ORDER-123",
  transactionDate: savedTxnDateTime, // from session.data.txnDateTime
});

if (status.success && status.data.status === "paid") {
  await markOrderPaid("ORDER-123");
}
```

---

## API summary

| Method | Type | Purpose |
|--------|------|---------|
| `createPayment(input)` | Sync | Build signed checkout form |
| `verifyPayment(body)` | Sync | Verify gateway callback |
| `getStatus(input)` | Async | Query payment status |
| `createCallbackHandler(payment, options)` | — | Express-style callback middleware |
| `renderPaymentForm(url, fields)` | — | Auto-submit HTML redirect page |

**Response format:**

```ts
{ success: true, data: { ... } }
{ success: false, error: "message", code?: "INVALID_SIGNATURE" }
```

---

## Environment variables

Copy `.env.example` to `.env`:

```env
JAZZCASH_MERCHANT_ID=
JAZZCASH_PASSWORD=
JAZZCASH_INTEGRITY_SALT=

EASYPAISA_STORE_ID=
EASYPAISA_HASH_KEY=
EASYPAISA_USERNAME=
EASYPAISA_PASSWORD=
```

---

## Sandbox testing

```bash
cp .env.example .env
# fill credentials, then:
npm run test:e2e
```

Full walkthrough: [docs/SANDBOX-E2E.md](./docs/SANDBOX-E2E.md)

---

## Documentation

| Document | Contents |
|----------|----------|
| [API Reference](./docs/API-REFERENCE.md) | Types and parameters |
| [Behaviour & flows](./docs/BEHAVIOUR.md) | How hashing and callbacks work |
| [JazzCash setup](./docs/jazzcash-setup.md) | Sandbox credentials |
| [Easypaisa setup](./docs/easypaisa-setup.md) | Sandbox credentials |
| [Publish to npm](./docs/PUBLISH-NPM.md) | Release guide |
| [Market readiness](./docs/MARKET-READINESS.md) | Pre-publish checklist |

---

## Example app

```bash
cd examples/express-callback
npm install
node server.mjs
```

---

## Roadmap

- v2 — PayFast, Safepay  
- v3 — Refunds, webhooks, subscriptions  

---

## License

[MIT](./LICENSE)
