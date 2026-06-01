import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * JazzCash HMAC-SHA256 (Payment Portal Integration Guide v4.2, section 14.2).
 * pp_* fields sorted alphabetically; salt prepended with & separators.
 */
export function jazzCashSecureHash(
  fields: Record<string, string>,
  integritySalt: string,
): string {
  const keys = Object.keys(fields)
    .filter((k) => k.startsWith("pp_") && k !== "pp_SecureHash")
    .filter((k) => fields[k] !== "" && fields[k] !== undefined)
    .sort();

  const values = keys.map((k) => fields[k]!);
  const message =
    values.length > 0
      ? `${integritySalt}&${values.join("&")}`
      : integritySalt;

  return createHmac("sha256", Buffer.from(integritySalt, "utf-8"))
    .update(Buffer.from(message, "utf-8"))
    .digest("hex")
    .toUpperCase();
}

/** Fixed field order used by hosted checkout (widely deployed merchant integrations). */
export const JAZZCASH_PAY_HASH_FIELDS = [
  "pp_Amount",
  "pp_BankID",
  "pp_BillReference",
  "pp_Description",
  "pp_Language",
  "pp_MerchantID",
  "pp_Password",
  "pp_ProductID",
  "pp_ReturnURL",
  "pp_TxnCurrency",
  "pp_TxnDateTime",
  "pp_TxnExpiryDateTime",
  "pp_TxnRefNo",
  "pp_TxnType",
  "pp_Version",
  "ppmpf_1",
  "ppmpf_2",
  "ppmpf_3",
  "ppmpf_4",
  "ppmpf_5",
] as const;

export function jazzCashHostedCheckoutHash(
  fields: Record<string, string>,
  integritySalt: string,
): string {
  let message = integritySalt;
  for (const key of JAZZCASH_PAY_HASH_FIELDS) {
    const value = fields[key];
    if (value) {
      message += `&${value}`;
    }
  }
  return createHmac("sha256", Buffer.from(integritySalt, "utf-8"))
    .update(Buffer.from(message, "utf-8"))
    .digest("hex")
    .toUpperCase();
}

export function verifySecureHash(
  fields: Record<string, string>,
  integritySalt: string,
  receivedHash: string,
): boolean {
  if (!receivedHash) return false;

  const expectedHosted = jazzCashHostedCheckoutHash(fields, integritySalt);
  const expectedAlphabetical = jazzCashSecureHash(fields, integritySalt);

  const normalized = receivedHash.toUpperCase();
  return (
    safeCompareHex(normalized, expectedHosted) ||
    safeCompareHex(normalized, expectedAlphabetical)
  );
}

/** JazzCash payment inquiry API hash (fixed field order). */
export function jazzCashInquiryHash(
  fields: { pp_MerchantID: string; pp_Password: string; pp_TxnRefNo: string },
  integritySalt: string,
): string {
  const message = `${integritySalt}&${fields.pp_MerchantID}&${fields.pp_Password}&${fields.pp_TxnRefNo}`;
  return createHmac("sha256", Buffer.from(integritySalt, "utf-8"))
    .update(Buffer.from(message, "utf-8"))
    .digest("hex")
    .toUpperCase();
}

function safeCompareHex(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "hex");
    const bufB = Buffer.from(b, "hex");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return a === b;
  }
}
