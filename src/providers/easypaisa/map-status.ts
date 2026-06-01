import type { PaymentStatus } from "../../types/payment.js";

/** Easypaisa success code on hosted / REST callbacks */
export const EASYPAISA_PAID_CODE = "0000";

export function mapEasypaisaResponseCode(code: string): PaymentStatus {
  const c = code.trim();
  if (c === EASYPAISA_PAID_CODE || c === "00") {
    return "paid";
  }
  if (c === "0001" || c === "0002") {
    return "pending";
  }
  if (c === "0003" || c === "0004") {
    return "failed";
  }
  if (c === "" || c === "-1") {
    return "unknown";
  }
  return "failed";
}

export function isEasypaisaPaid(code: string): boolean {
  return mapEasypaisaResponseCode(code) === "paid";
}
