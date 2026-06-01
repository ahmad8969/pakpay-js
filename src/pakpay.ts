import { createProviderAdapter } from "./providers/registry.js";
import type { PakPayConfig } from "./types/config.js";
import type {
  CreatePaymentInput,
  CreatePaymentData,
  GetStatusInput,
  PaymentStatusData,
  VerifyPaymentData,
} from "./types/payment.js";
import type { PakPayResult } from "./types/result.js";

/**
 * PakPay — simple JazzCash payment SDK for Node.js (Pakistan).
 *
 * @example
 * ```ts
 * import { PakPay } from "pakpay-js";
 *
 * const payment = new PakPay({
 *   provider: "jazzcash",
 *   merchantId: process.env.JAZZCASH_MERCHANT_ID!,
 *   password: process.env.JAZZCASH_PASSWORD!,
 *   integritySalt: process.env.JAZZCASH_INTEGRITY_SALT!,
 *   sandbox: true,
 * });
 *
 * const session = payment.createPayment({
 *   amount: 1000,
 *   orderId: "ORDER-123",
 *   returnUrl: "https://example.com/callback",
 * });
 *
 * // Save session.data.txnDateTime for getStatus()
 * ```
 */
export class PakPay {
  private readonly adapter;

  constructor(config: PakPayConfig) {
    this.adapter = createProviderAdapter(config);
  }

  createPayment(input: CreatePaymentInput): PakPayResult<CreatePaymentData> {
    return this.adapter.createPayment(input);
  }

  verifyPayment(
    payload: Record<string, string | undefined>,
  ): PakPayResult<VerifyPaymentData> {
    return this.adapter.verifyPayment(payload);
  }

  getStatus(input: GetStatusInput): Promise<PakPayResult<PaymentStatusData>> {
    return this.adapter.getStatus(input);
  }
}
