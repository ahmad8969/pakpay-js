import type { PakPay } from "./pakpay.js";
import type { VerifyPaymentData } from "./types/payment.js";
import type { PakPayResult } from "./types/result.js";

export interface CallbackHandlerOptions {
  /** Called when signature is valid and payment succeeded */
  onPaid?: (
    data: VerifyPaymentData,
    req: CallbackRequest,
    res: CallbackResponse,
  ) => void | Promise<void>;
  /** Called when signature is valid but payment did not succeed */
  onFailed?: (
    data: VerifyPaymentData,
    req: CallbackRequest,
    res: CallbackResponse,
  ) => void | Promise<void>;
  /** Called when signature verification fails (HTTP 400 by default) */
  onInvalid?: (
    error: string,
    req: CallbackRequest,
    res: CallbackResponse,
  ) => void | Promise<void>;
  /** HTTP status when signature is invalid (default 400) */
  invalidStatus?: number;
  /** Response body when paid (default "OK") */
  paidBody?: string;
  /** Response body when failed but verified (default "FAILED") */
  failedBody?: string;
}

/** Minimal request shape (Express, Fastify, etc.) */
export interface CallbackRequest {
  body: Record<string, string | undefined>;
  method?: string;
}

export interface CallbackResponse {
  status(code: number): CallbackResponse;
  send(body?: string): void;
  json?(data: unknown): void;
}

/**
 * Express-style middleware factory for payment gateway callbacks.
 *
 * @example
 * ```ts
 * import express from "express";
 * import { PakPay, createCallbackHandler } from "pakpay-js";
 *
 * app.post(
 *   "/payments/callback",
 *   express.urlencoded({ extended: false }),
 *   createCallbackHandler(payment, {
 *     onPaid: async (data) => { await markPaid(data.orderId); },
 *   }),
 * );
 * ```
 */
export function createCallbackHandler(
  payment: PakPay,
  options: CallbackHandlerOptions = {},
) {
  const invalidStatus = options.invalidStatus ?? 400;

  return async function pakpayCallbackMiddleware(
    req: CallbackRequest,
    res: CallbackResponse,
  ): Promise<void> {
    const result: PakPayResult<VerifyPaymentData> = payment.verifyPayment(
      req.body ?? {},
    );

    if (!result.success) {
      if (options.onInvalid) {
        await options.onInvalid(result.error, req, res);
        return;
      }
      res.status(invalidStatus).send(result.error);
      return;
    }

    if (result.data.paid) {
      if (options.onPaid) {
        await options.onPaid(result.data, req, res);
        return;
      }
      res.status(200).send(options.paidBody ?? "OK");
      return;
    }

    if (options.onFailed) {
      await options.onFailed(result.data, req, res);
      return;
    }

    res.status(200).send(options.failedBody ?? "FAILED");
  };
}

/**
 * Build auto-submit HTML to redirect the customer to the gateway.
 */
export function renderPaymentForm(
  redirectUrl: string,
  formFields: Record<string, string>,
): string {
  const inputs = Object.entries(formFields)
    .map(
      ([name, value]) =>
        `<input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`,
    )
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /><title>Redirecting…</title></head>
<body onload="document.forms[0].submit()">
  <p>Redirecting to payment gateway…</p>
  <form method="POST" action="${escapeHtml(redirectUrl)}">
${inputs}
  </form>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
