import type { PaymentStatus } from "../../types/payment.js";

const PAID_CODES = new Set(["000", "121", "200", "T00"]);

const FAILED_CODES = new Set([
  "001",
  "002",
  "003",
  "004",
  "095",
  "101",
  "109",
  "112",
  "115",
  "122",
]);

const EXPIRED_CODES = new Set(["116", "117"]);

export function mapJazzCashResponseCode(code: string): PaymentStatus {
  const normalized = code.trim().toUpperCase();
  if (PAID_CODES.has(normalized) || normalized === "000") {
    return "paid";
  }
  if (EXPIRED_CODES.has(normalized)) {
    return "expired";
  }
  if (FAILED_CODES.has(normalized)) {
    return "failed";
  }
  if (normalized === "124") {
    return "pending";
  }
  return "unknown";
}

export function isJazzCashPaid(code: string): boolean {
  return mapJazzCashResponseCode(code) === "paid";
}
