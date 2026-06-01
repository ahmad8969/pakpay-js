import type { Request, Response, RequestHandler } from "express";
import type { PakPay } from "pakpay-js";
import {
  createCallbackHandler,
  type CallbackHandlerOptions,
} from "pakpay-js";

export type { CallbackHandlerOptions };

/**
 * Express middleware for JazzCash / Easypaisa payment callbacks.
 *
 * Use with `express.urlencoded({ extended: false })` on the route.
 */
export function pakpayCallbackMiddleware(
  payment: PakPay,
  options?: CallbackHandlerOptions,
): RequestHandler {
  const handler = createCallbackHandler(payment, options);
  return (req, res, next) => {
    handler(req as Request, res as Response).catch(next);
  };
}

export { createCallbackHandler, renderPaymentForm } from "pakpay-js";
