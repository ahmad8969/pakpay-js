import type { PakPayResult } from "../types/result.js";
import { fail } from "../types/result.js";
import { PakPayValidationError } from "../errors/index.js";
import { addMinutes, formatTxnDateTime } from "./datetime.js";
import { DEFAULT_EXPIRY_MINUTES } from "./constants.js";

export function paymentTimestamps(expiryMinutes = DEFAULT_EXPIRY_MINUTES) {
  const now = new Date();
  return {
    now,
    txnDateTime: formatTxnDateTime(now),
    expiryDateTime: formatTxnDateTime(addMinutes(now, expiryMinutes)),
  };
}

export function catchAdapterError<T>(
  err: unknown,
  fallback: string,
): PakPayResult<T> {
  if (err instanceof PakPayValidationError) {
    return fail(err.message, err.code);
  }
  return fail(err instanceof Error ? err.message : fallback, "VALIDATION_ERROR");
}
