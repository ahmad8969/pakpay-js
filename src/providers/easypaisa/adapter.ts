import type { EasypaisaConfig } from "../../types/config.js";
import type {
  CreatePaymentInput,
  CreatePaymentData,
  GetStatusInput,
  PaymentStatusData,
  VerifyPaymentData,
} from "../../types/payment.js";
import type { PakPayResult } from "../../types/result.js";
import { ok, fail } from "../../types/result.js";
import { paymentTimestamps, catchAdapterError } from "../../utils/adapter-helpers.js";
import { DEFAULT_TIMEOUT_MS } from "../../utils/constants.js";
import { postJson } from "../../utils/http.js";
import { normalizePayload } from "../../utils/payload.js";
import { sanitizeOrderId, validateCreatePayment } from "../../utils/validate.js";
import { getEasypaisaBaseUrl, EASYPAISA_PATHS } from "./endpoints.js";
import {
  easypaisaHostedHash,
  verifyEasypaisaHash,
  type EasypaisaHostedHashFields,
} from "./hash.js";
import { isEasypaisaPaid, mapEasypaisaResponseCode } from "./map-status.js";

interface InquireResponse {
  responseCode?: string;
  responseDesc?: string;
  transactionStatus?: string;
  transactionAmount?: string;
  orderId?: string;
}

export class EasypaisaAdapter {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(private readonly config: EasypaisaConfig) {
    this.baseUrl = getEasypaisaBaseUrl(config.sandbox ?? false);
    this.timeout = config.timeout ?? DEFAULT_TIMEOUT_MS;
  }

  createPayment(input: CreatePaymentInput): PakPayResult<CreatePaymentData> {
    try {
      validateCreatePayment(input);
      const orderId = sanitizeOrderId(input.orderId);
      const { txnDateTime, expiryDateTime } = paymentTimestamps(
        input.expiryMinutes,
      );
      const amount = input.amount.toFixed(2);

      const hashFields: EasypaisaHostedHashFields = {
        storeId: this.config.storeId,
        amount,
        postBackURL: input.returnUrl,
        orderRefNum: orderId,
        expiryDate: expiryDateTime,
      };

      return ok({
        orderId,
        transactionRef: orderId,
        txnDateTime,
        redirectUrl: this.baseUrl + EASYPAISA_PATHS.hostedCheckout,
        method: "POST",
        formFields: {
          storeId: this.config.storeId,
          amount,
          postBackURL: input.returnUrl,
          orderRefNum: orderId,
          expiryDate: expiryDateTime,
          autoRedirect: "1",
          paymentMethod: "",
          emailAddr: input.customerEmail ?? "",
          mobileNum: input.customerPhone ?? "",
          merchantHashedReq: easypaisaHostedHash(
            hashFields,
            this.config.hashKey,
          ),
        },
        provider: "easypaisa",
      });
    } catch (err) {
      return catchAdapterError(err, "Failed to create payment");
    }
  }

  verifyPayment(
    payload: Record<string, string | undefined>,
  ): PakPayResult<VerifyPaymentData> {
    const raw = normalizePayload(payload);
    const hashFields: EasypaisaHostedHashFields = {
      storeId: raw.storeId ?? this.config.storeId,
      amount: raw.amount ?? raw.transactionAmount ?? "0",
      postBackURL: raw.postBackURL ?? raw.postbackurl ?? "",
      orderRefNum: raw.orderRefNum ?? raw.orderId ?? "",
      expiryDate: raw.expiryDate ?? "",
    };

    const receivedHash =
      raw.merchantHashedReq ?? raw.secureHash ?? raw.encryptedHashRequest ?? "";

    if (!receivedHash) {
      return fail("Missing payment signature in callback", "INVALID_SIGNATURE");
    }
    if (!verifyEasypaisaHash(hashFields, this.config.hashKey, receivedHash)) {
      return fail("Invalid payment signature", "INVALID_SIGNATURE");
    }

    const gatewayCode =
      raw.responseCode ?? raw.ResponseCode ?? raw.status ?? "";
    const orderId = raw.orderRefNum ?? raw.orderId ?? "";

    return ok({
      verified: true,
      paid: isEasypaisaPaid(gatewayCode),
      orderId,
      transactionRef: orderId,
      amount: parseFloat(raw.amount ?? raw.transactionAmount ?? "0") || 0,
      gatewayCode,
      gatewayMessage: (
        raw.responseDesc ??
        raw.ResponseMessage ??
        raw.description ??
        ""
      ).trim(),
      provider: "easypaisa",
      raw,
    });
  }

  async getStatus(
    input: GetStatusInput,
  ): Promise<PakPayResult<PaymentStatusData>> {
    if (!this.config.username?.trim() || !this.config.password?.trim()) {
      return fail(
        "Easypaisa getStatus requires username and password (REST inquiry API)",
        "VALIDATION_ERROR",
      );
    }

    try {
      const orderRef = input.transactionRef ?? input.orderId;
      const auth = Buffer.from(
        `${this.config.username}:${this.config.password}`,
      ).toString("base64");

      const response = await postJson<InquireResponse>(
        this.baseUrl + EASYPAISA_PATHS.inquireStatus,
        { storeId: this.config.storeId, orderId: orderRef },
        {
          timeout: this.timeout,
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        },
      );

      const gatewayCode = String(
        response.responseCode ?? response.transactionStatus ?? "",
      );

      return ok({
        orderId: input.orderId,
        status: mapEasypaisaResponseCode(gatewayCode),
        amount: response.transactionAmount
          ? parseFloat(String(response.transactionAmount))
          : undefined,
        transactionRef: String(response.orderId ?? orderRef),
        gatewayCode,
        gatewayMessage: String(response.responseDesc ?? ""),
        provider: "easypaisa",
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
