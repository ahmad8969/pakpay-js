export const JAZZCASH_URLS = {
  sandbox: "https://sandbox.jazzcash.com.pk",
  production: "https://payments.jazzcash.com.pk",
} as const;

export const JAZZCASH_PATHS = {
  hostedCheckout: "/CustomerPortal/transactionmanagement/merchantform/",
  paymentInquiry: "/ApplicationAPI/API/PaymentInquiry/Inquire",
} as const;

export function getJazzCashBaseUrl(sandbox: boolean): string {
  return sandbox ? JAZZCASH_URLS.sandbox : JAZZCASH_URLS.production;
}
