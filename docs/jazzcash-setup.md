# JazzCash setup

1. Register at [JazzCash Online Payment Gateway](https://www.jazzcash.com.pk/corporate/online-payment-gateway/).
2. Request **sandbox** credentials: Merchant ID, Password, Integrity Salt.
3. Register your **return URL** prefix with JazzCash (must match `pp_ReturnURL`).
4. Use `sandbox: true` until UAT is complete.
5. Switch to production credentials and `sandbox: false` for live traffic.

Sandbox portal: [https://sandbox.jazzcash.com.pk/SandboxDocumentation/](https://sandbox.jazzcash.com.pk/SandboxDocumentation/)

## Test amounts (sandbox)

Sandbox may return different response codes based on amount — see JazzCash Appendix II in the merchant PDF.

## Common errors

| Code | Meaning |
|------|---------|
| `115` | Invalid hash — check integrity salt and field values |
| `101` | Invalid merchant credentials |
| `109` | Transaction not found (inquiry) |
