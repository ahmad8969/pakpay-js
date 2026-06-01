export const EASYPAISA_URLS = {
  sandbox: "https://easypaystg.easypaisa.com.pk",
  production: "https://easypay.easypaisa.com.pk",
} as const;

export const EASYPAISA_PATHS = {
  hostedCheckout: "/easypay/Index.jsf",
  inquireStatus: "/easypay-service/rest/v4/inquire-transaction-status",
} as const;

export function getEasypaisaBaseUrl(sandbox: boolean): string {
  return sandbox ? EASYPAISA_URLS.sandbox : EASYPAISA_URLS.production;
}
