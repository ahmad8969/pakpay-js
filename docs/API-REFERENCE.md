# API Reference — pakpay-js v1.0

## Installation

```bash
npm install pakpay-js
```

```ts
import { PakPay } from "pakpay-js";
import type {
  PakPayConfig,
  PakPayResult,
  CreatePaymentInput,
  CreatePaymentData,
  VerifyPaymentData,
  GetStatusInput,
  PaymentStatusData,
} from "pakpay-js";
```

---

## Class `PakPay`

### `constructor(config: PakPayConfig)`

```ts
const payment = new PakPay({
  provider: "jazzcash",
  merchantId: "MC00000",
  password: "your-password",
  integritySalt: "your-integrity-salt",
  sandbox: true,       // optional, default false
  timeout: 30000,      // optional, ms for getStatus only
});
```

---

### `createPayment(input: CreatePaymentInput): PakPayResult<CreatePaymentData>`

**Sync.** Builds signed hosted-checkout fields.

#### `CreatePaymentInput`

```ts
interface CreatePaymentInput {
  amount: number;           // PKR
  orderId: string;        // max 20 chars (after sanitization)
  returnUrl: string;      // http(s) callback URL
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  expiryMinutes?: number;   // default 1440
}
```

#### `CreatePaymentData`

```ts
interface CreatePaymentData {
  orderId: string;
  transactionRef: string;
  redirectUrl: string;
  method: "POST";
  formFields: Record<string, string>;
}
```

#### Example

```ts
const result = payment.createPayment({
  amount: 1000,
  orderId: "ORDER-123",
  customerName: "Ahmad",
  customerEmail: "ahmad@gmail.com",
  customerPhone: "03001234567",
  returnUrl: "https://example.com/payments/callback",
});

if (!result.success) {
  console.error(result.code, result.error);
  return;
}

// Persist for later inquiry:
const { formFields } = result.data;
await db.orders.update({
  id: "ORDER-123",
  txnDateTime: formFields.pp_TxnDateTime,
  txnRef: formFields.pp_TxnRefNo,
});

// Redirect customer (Express)
const inputs = Object.entries(result.data.formFields)
  .map(([k, v]) => `<input type="hidden" name="${k}" value="${escape(v)}" />`)
  .join("");

res.send(`<form method="POST" action="${result.data.redirectUrl}">${inputs}</form>
  <script>document.forms[0].submit()</script>`);
```

---

### `verifyPayment(payload): PakPayResult<VerifyPaymentData>`

**Sync.** Validates JazzCash callback POST body.

#### Parameter

```ts
payload: Record<string, string | undefined>
// Typically req.body after express.urlencoded()
```

#### `VerifyPaymentData`

```ts
interface VerifyPaymentData {
  verified: boolean;      // true when success
  paid: boolean;
  orderId: string;
  transactionRef: string;
  amount: number;         // PKR
  gatewayCode: string;
  gatewayMessage: string;
  provider: "jazzcash";
  raw: Record<string, string>;
}
```

#### Example

```ts
app.post(
  "/payments/callback",
  express.urlencoded({ extended: false }),
  async (req, res) => {
    const result = payment.verifyPayment(req.body);

    if (!result.success) {
      return res.status(400).json({ error: result.error, code: result.code });
    }

    if (result.data.paid) {
      await markOrderPaid(result.data.orderId, result.data.transactionRef);
    }

    res.send("OK");
  },
);
```

---

### `getStatus(input: GetStatusInput): Promise<PakPayResult<PaymentStatusData>>`

**Async.** Calls JazzCash Payment Inquiry API.

#### `GetStatusInput`

```ts
interface GetStatusInput {
  orderId: string;
  transactionRef?: string;    // default: orderId
  transactionDate?: string;   // yyyyMMddHHmmss — use stored pp_TxnDateTime
}
```

#### `PaymentStatusData`

```ts
type PaymentStatus = "pending" | "paid" | "failed" | "expired" | "unknown";

interface PaymentStatusData {
  orderId: string;
  status: PaymentStatus;
  amount?: number;
  transactionRef?: string;
  gatewayCode?: string;
  gatewayMessage?: string;
  raw?: Record<string, unknown>;
}
```

#### Example

```ts
const status = await payment.getStatus({
  orderId: "ORDER-123",
  transactionRef: "ORDER-123",
  transactionDate: "20260601143000", // from DB
});

if (status.success && status.data.status === "paid") {
  await markOrderPaid("ORDER-123");
}
```

---

## Result type

```ts
type PakPayResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

Always check `result.success` before reading `result.data`.

---

## Errors (thrown)

| Class | When |
|-------|------|
| `PakPayConfigError` | Invalid/missing constructor config |
| `PakPayValidationError` | Rare: thrown from amount utils if called incorrectly |

Gateway failures in `createPayment` / `verifyPayment` return `{ success: false }` instead of throwing.

---

## `formFields` keys (createPayment)

| Key | Description |
|-----|-------------|
| `pp_Version` | `1.1` |
| `pp_TxnType` | `MWALLET` |
| `pp_Language` | `EN` |
| `pp_MerchantID` | Your merchant ID |
| `pp_Password` | Your password |
| `pp_TxnRefNo` | Transaction reference |
| `pp_Amount` | Amount in **paisa** (string) |
| `pp_TxnCurrency` | `PKR` |
| `pp_TxnDateTime` | `yyyyMMddHHmmss` |
| `pp_TxnExpiryDateTime` | Expiry datetime |
| `pp_BillReference` | Order / bill reference |
| `pp_Description` | Payment description |
| `pp_ReturnURL` | Your callback URL |
| `pp_SecureHash` | HMAC signature |
| `ppmpf_1` … `ppmpf_3` | Optional customer metadata |

---

## Amount conversion

| Direction | Rule |
|-----------|------|
| Input `amount: 1000` | `pp_Amount = "100000"` (1000 × 100 paisa) |
| Callback `pp_Amount: "100000"` | `data.amount = 1000` PKR |

---

## JazzCash response codes (common)

| Code | `paid` / `status` |
|------|-------------------|
| `000` | paid |
| `112` | failed (cancelled by user) |
| `115` | failed (invalid hash) |
| `116` | expired |
| `124` | pending (OTC) |
| `101` | failed (invalid credentials) |

Full list: JazzCash Merchant Integration Guide Appendix I.

---

See [BEHAVIOUR.md](./BEHAVIOUR.md) for flows, hash algorithms, and edge cases.
