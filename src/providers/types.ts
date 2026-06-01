import type {
  CreatePaymentInput,
  CreatePaymentData,
  GetStatusInput,
  PaymentStatusData,
  VerifyPaymentData,
} from "../types/payment.js";
import type { PakPayResult } from "../types/result.js";

export interface ProviderAdapter {
  createPayment(input: CreatePaymentInput): PakPayResult<CreatePaymentData>;
  verifyPayment(
    payload: Record<string, string | undefined>,
  ): PakPayResult<VerifyPaymentData>;
  getStatus(input: GetStatusInput): Promise<PakPayResult<PaymentStatusData>>;
}
