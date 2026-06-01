# Easypaisa setup

1. Register at [Easypaisa Online Payment Gateway](https://easypaisa.com.pk/online-payment-gateway/).
2. Receive **Store ID** and **Hash Key** from your merchant representative (PDF guide).
3. Register **postBackURL** / return URL with Easypaisa.
4. Use `sandbox: true` (`easypaystg.easypaisa.com.pk`) until UAT is complete.

## Config

```javascript
new PakPay({
  provider: "easypaisa",
  storeId: "...",
  hashKey: "...",
  sandbox: true,
  username: "...", // REST inquiry only
  password: "...",
});
```

## Common errors

| Issue | Fix |
|-------|-----|
| Hash error `-27` | Verify field order matches your merchant PDF version |
| Invalid Store | Wrong `storeId` or sandbox vs production URL mix-up |
| `getStatus` fails | Add `username` and `password` from merchant portal |
