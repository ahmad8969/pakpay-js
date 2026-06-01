import { PakPayValidationError } from "../errors/index.js";

/** Convert PKR (e.g. 1000) to JazzCash minor units (paisa, no decimal point). */
export function pkrToJazzCashAmount(pkr: number): string {
  if (!Number.isFinite(pkr) || pkr <= 0) {
    throw new PakPayValidationError("amount must be a positive number (PKR)");
  }
  const rounded = Math.round(pkr * 100);
  if (rounded > 999_999_999_999) {
    throw new PakPayValidationError("amount exceeds JazzCash maximum");
  }
  return String(rounded);
}

/** Convert JazzCash paisa string back to PKR. */
export function jazzCashAmountToPkr(paisa: string): number {
  const n = parseInt(paisa, 10);
  if (Number.isNaN(n)) return 0;
  return n / 100;
}
