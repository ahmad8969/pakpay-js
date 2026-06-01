import { createHmac, timingSafeEqual } from "node:crypto";

export interface EasypaisaHostedHashFields {
  storeId: string;
  amount: string;
  postBackURL: string;
  orderRefNum: string;
  expiryDate: string;
}

/**
 * Easypay hosted checkout (Index.jsf) — value concatenation then HMAC-SHA256 hex.
 * Also tries ampersand-separated values (some merchant PDF versions).
 */
export function easypaisaHostedHash(
  fields: EasypaisaHostedHashFields,
  hashKey: string,
): string {
  const concat = [
    fields.storeId,
    fields.amount,
    fields.postBackURL,
    fields.orderRefNum,
    fields.expiryDate,
  ].join("");

  return hmacHex(hashKey, concat);
}

export function easypaisaHostedHashAmpersand(
  fields: EasypaisaHostedHashFields,
  hashKey: string,
): string {
  const message = [
    fields.storeId,
    fields.amount,
    fields.postBackURL,
    fields.orderRefNum,
    fields.expiryDate,
  ].join("&");

  return hmacHex(hashKey, message);
}

/** REST MA style: amount=…&postBackURL=…&orderRefNum=…&storeId=…&transactionType=MA */
export function easypaisaRestHash(
  params: {
    amount: string;
    postBackURL: string;
    orderRefNum: string;
    storeId: string;
    transactionType: string;
  },
  hashKey: string,
): string {
  const message =
    `amount=${params.amount}` +
    `&postBackURL=${params.postBackURL}` +
    `&orderRefNum=${params.orderRefNum}` +
    `&storeId=${params.storeId}` +
    `&transactionType=${params.transactionType}`;

  return createHmac("sha256", hashKey)
    .update(message, "utf8")
    .digest("base64");
}

export function verifyEasypaisaHash(
  fields: EasypaisaHostedHashFields,
  hashKey: string,
  received: string,
): boolean {
  if (!received) return false;
  const normalized = received.trim();
  const candidates = [
    easypaisaHostedHash(fields, hashKey),
    easypaisaHostedHashAmpersand(fields, hashKey),
    easypaisaHostedHash(fields, hashKey).toLowerCase(),
  ];
  return candidates.some((expected) => safeEqual(normalized, expected));
}

function hmacHex(key: string, message: string): string {
  return createHmac("sha256", key).update(message, "utf8").digest("hex").toUpperCase();
}

function safeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  } catch {
    return a.toUpperCase() === b.toUpperCase();
  }
}
