# Sandbox E2E — recorded flow

This documents a **real sandbox test** you can run locally. Automated tests skip unless env vars are set.

## Prerequisites

1. JazzCash sandbox merchant account  
2. Copy `.env.example` → `.env` and fill credentials  
3. `returnUrl` must be reachable by JazzCash (use [ngrok](https://ngrok.com/) for localhost)

## Automated E2E

```bash
# PowerShell
$env:JAZZCASH_SANDBOX="1"
$env:JAZZCASH_MERCHANT_ID="your-id"
$env:JAZZCASH_PASSWORD="your-password"
$env:JAZZCASH_INTEGRITY_SALT="your-salt"
$env:JAZZCASH_RETURN_URL="https://your-ngrok.app/payments/callback"

npm test -- tests/e2e/sandbox.e2e.test.ts
```

**Expected console output (createPayment):**

```
[E2E JazzCash] POST https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/
[E2E JazzCash] orderId: E2E-1717248000123
[E2E JazzCash] txnDateTime: 20260601143000
```

Easypaisa (optional):

```bash
$env:EASYPAISA_SANDBOX="1"
$env:EASYPAISA_STORE_ID="..."
$env:EASYPAISA_HASH_KEY="..."
npm test -- tests/e2e/sandbox.e2e.test.ts
```

---

## Manual recorded flow (JazzCash)

### Step 1 — Create payment (your server)

```javascript
const session = payment.createPayment({
  amount: 100,
  orderId: `ORD-${Date.now()}`,
  returnUrl: "https://YOUR-NGROK/payments/callback",
});
```

**Record in database:**

| Column | Value |
|--------|--------|
| `order_id` | `session.data.orderId` |
| `txn_date_time` | `session.data.txnDateTime` |
| `status` | `pending` |

### Step 2 — Redirect customer

Serve `renderPaymentForm(session.data.redirectUrl, session.data.formFields)`.

Customer completes payment on JazzCash sandbox UI.

### Step 3 — Callback hits your server

JazzCash `POST`s to `returnUrl`. Handler:

```javascript
createCallbackHandler(payment, {
  onPaid: async (data) => {
    console.log("PAID", data.orderId, data.amount);
    await db.markPaid(data.orderId);
  },
});
```

**Expected:** `data.paid === true`, `data.gatewayCode === "000"` (sandbox success amount per JazzCash appendix).

### Step 4 — Reconciliation (optional)

```javascript
const status = await payment.getStatus({
  orderId: storedOrderId,
  transactionDate: storedTxnDateTime,
});
```

**Expected:** `status.data.status === "paid"`

---

## Manual recorded flow (Easypaisa)

Same steps; use `provider: "easypaisa"` and Easypaisa env vars. Success callback code is typically **`0000`**.

---

## Troubleshooting

| Symptom | Action |
|---------|--------|
| `115` Invalid hash | Re-check integrity salt; confirm sandbox credentials |
| Callback never arrives | Use public HTTPS URL; check firewall |
| `getStatus` wrong | Pass exact `txnDateTime` from step 1 |
| E2E tests skipped | Set `JAZZCASH_SANDBOX=1` and all three credentials |
