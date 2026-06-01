import { PakPayValidationError } from "../errors/index.js";

export function validateCreatePayment(input: {
  amount: number;
  orderId: string;
  returnUrl: string;
}): void {
  if (!input.orderId?.trim()) {
    throw new PakPayValidationError("orderId is required");
  }
  if (input.orderId.length > 20) {
    throw new PakPayValidationError("orderId must be at most 20 characters");
  }
  if (!/^https?:\/\//i.test(input.returnUrl)) {
    throw new PakPayValidationError("returnUrl must start with http:// or https://");
  }
}

export function sanitizeOrderId(orderId: string): string {
  return orderId.replace(/[^a-zA-Z0-9._/-]/g, "").slice(0, 20);
}
