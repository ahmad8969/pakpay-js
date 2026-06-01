import type { JazzCashConfig } from "../../types/config.js";
import type {
  CreatePaymentInput,
  CreatePaymentData,
  GetStatusInput,
  PaymentStatusData,
  VerifyPaymentData,
} from "../../types/payment.js";
import type { PakPayResult } from "../../types/result.js";
import { ok, fail } from "../../types/result.js";
import { jazzCashAmountToPkr, pkrToJazzCashAmount } from "../../utils/amount.js";
import {
  jazzCashHostedCheckoutHash,
  jazzCashInquiryHash,
  verifySecureHash,
} from "../../utils/crypto.js";
import { paymentTimestamps, catchAdapterError } from "../../utils/adapter-helpers.js";
import { DEFAULT_TIMEOUT_MS } from "../../utils/constants.js";
import { postJson } from "../../utils/http.js";
import { normalizePayload } from "../../utils/payload.js";
import { sanitizeOrderId, validateCreatePayment } from "../../utils/validate.js";
import { getJazzCashBaseUrl, JAZZCASH_PATHS } from "./endpoints.js";
import { isJazzCashPaid, mapJazzCashResponseCode } from "./map-status.js";

interface InquiryResponse {
  pp_ResponseCode?: string;
  pp_ResponseMessage?: string;
  pp_PaymentResponseCode?: string;
  pp_PaymentResponseMessage?: string;
  pp_Amount?: string;
  pp_TxnRefNo?: string;
  pp_BillReference?: string;
}

export class JazzCashAdapter {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(private readonly config: JazzCashConfig) {
    this.baseUrl = getJazzCashBaseUrl(config.sandbox ?? false);
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  createPayment(input: CreatePaymentInput): PakPayResult<CreatePaymentData> {
    try {
      validateCreatePayment(input);
      const orderId = sanitizeOrderId(input.orderId);
      const { txnDateTime, expiryDateTime } = paymentTimestamps(
        input.expiryMinutes,
      );

      const formFields: Record<string, string> = {
        pp_Version: "1.1",
        pp_TxnType: "MWALLET",
        pp_Language: "EN",
        pp_MerchantID: this.config.merchantId,
        pp_SubMerchantID: "",
        pp_Password: this.config.password,
        pp_BankID: "",
        pp_ProductID: "",
        pp_TxnRefNo: orderId,
        pp_Amount: pkrToJazzCashAmount(input.amount),
        pp_TxnCurrency: "PKR",
        pp_TxnDateTime: txnDateTime,
        pp_BillReference: orderId,
        pp_Description: (input.description ?? `Payment for ${orderId}`).slice(
          0,
          200,
        ),
        pp_TxnExpiryDateTime: expiryDateTime,
        pp_ReturnURL: input.returnUrl,
        ppmpf_1: input.customerName ?? "",
        ppmpf_2: input.customerEmail ?? "",
        ppmpf_3: input.customerPhone ?? "",
        ppmpf_4: "",
        ppmpf_5: "",
      };

      formFields.pp_SecureHash = jazzCashHostedCheckoutHash(
        formFields,
        this.config.integritySalt,
      );

      return ok({
        orderId,
        transactionRef: orderId,
        txnDateTime,
        redirectUrl: this.baseUrl + JAZZCASH_PATHS.hostedCheckout,
        method: "POST",
        formFields,
        provider: "jazzcash",
      });
    } catch (err) {
      return catchAdapterError(err, "Failed to create payment");
    }
  }

  verifyPayment(
    payload: Record<string, string | undefined>,
  ): PakPayResult<VerifyPaymentData> {
    const raw = normalizePayload(payload);
    const receivedHash = raw.pp_SecureHash ?? "";

    if (
      !receivedHash ||
      !verifySecureHash(raw, this.config.integritySalt, receivedHash)
    ) {
      return fail("Invalid payment signature", "INVALID_SIGNATURE");
    }

    const gatewayCode =
      raw.pp_ResponseCode ?? raw.pp_PaymentResponseCode ?? "";
    const orderId = raw.pp_BillReference ?? raw.pp_TxnRefNo ?? "";

    return ok({
      verified: true,
      paid: isJazzCashPaid(gatewayCode),
      orderId,
      transactionRef: raw.pp_TxnRefNo ?? orderId,
      amount: jazzCashAmountToPkr(raw.pp_Amount ?? "0"),
      gatewayCode,
      gatewayMessage: (
        raw.pp_ResponseMessage ??
        raw.pp_PaymentResponseMessage ??
        ""
      ).trim(),
      provider: "jazzcash",
      raw,
    });
  }

  async getStatus(
    input: GetStatusInput,
  ): Promise<PakPayResult<PaymentStatusData>> {
    try {
      const transactionRef = input.transactionRef ?? input.orderId;
      const txnDateTime =
        input.transactionDate ?? paymentTimestamps().txnDateTime;

      const inquiryFields: Record<string, string> = {
        pp_Version: "1.1",
        pp_TxnType: "MWALLET",
        pp_MerchantID: this.config.merchantId,
        pp_Password: this.config.password,
        pp_TxnRefNo: transactionRef,
        pp_TxnDateTime: txnDateTime,
        pp_SecureHash: jazzCashInquiryHash(
          {
            pp_MerchantID: this.config.merchantId,
            pp_Password: this.config.password,
            pp_TxnRefNo: transactionRef,
          },
          this.config.integritySalt,
        ),
      };

      const response = await postJson<InquiryResponse>(
        this.baseUrl + JAZZCASH_PATHS.paymentInquiry,
        inquiryFields,
        { timeout: this.timeout },
      );

      const gatewayCode =
        response.pp_PaymentResponseCode ?? response.pp_ResponseCode ?? "";

      return ok({
        orderId: input.orderId,
        status: mapJazzCashResponseCode(gatewayCode),
        amount: response.pp_Amount
          ? jazzCashAmountToPkr(response.pp_Amount)
          : undefined,
        transactionRef: response.pp_TxnRefNo ?? transactionRef,
        gatewayCode,
        gatewayMessage:
          response.pp_PaymentResponseMessage ??
          response.pp_ResponseMessage ??
          "",
        provider: "jazzcash",
        raw: response as Record<string, unknown>,
      });
    } catch (err) {
      return fail(
        err instanceof Error ? err.message : "Status inquiry failed",
        "GATEWAY_ERROR",
      );
    }
  }
}
