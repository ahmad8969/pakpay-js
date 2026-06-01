export interface CreatePaymentInput {
  amount: number;
  orderId: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl: string;
  description?: string;
  expiryMinutes?: number;
}

export interface CreatePaymentData {
  orderId: string;
  transactionRef: string;
  /** Gateway transaction datetime — store in DB for `getStatus()` (JazzCash: pp_TxnDateTime) */
  txnDateTime: string;
  redirectUrl: string;
  method: "POST";
  formFields: Record<string, string>;
  provider: "jazzcash" | "easypaisa";
}

export interface VerifyPaymentData {
  verified: boolean;
  paid: boolean;
  orderId: string;
  transactionRef: string;
  amount: number;
  gatewayCode: string;
  gatewayMessage: string;
  provider: "jazzcash" | "easypaisa";
  raw: Record<string, string>;
}

export interface GetStatusInput {
  orderId: string;
  transactionRef?: string;
  /** JazzCash: yyyyMMddHHmmss from `createPayment().txnDateTime` */
  transactionDate?: string;
}

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "expired"
  | "unknown";

export interface PaymentStatusData {
  orderId: string;
  status: PaymentStatus;
  amount?: number;
  transactionRef?: string;
  gatewayCode?: string;
  gatewayMessage?: string;
  provider: "jazzcash" | "easypaisa";
  raw?: Record<string, unknown>;
}
