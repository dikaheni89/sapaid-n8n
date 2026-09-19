/**
 * Verifies a sapaid webhook delivery signature.
 *
 * sapaid signs the raw request body with HMAC-SHA256 and sends it as
 * `X-Sapaid-Signature: sha256=<hex>`. The signed bytes are exactly what is
 * transmitted, so the receiver must hash the raw bytes it received: re-serialising
 * a parsed body can reorder keys or change whitespace and reject a valid delivery.
 *
 * Returns false when no secret or no signature is supplied; the caller decides
 * how to treat an unsigned request.
 */
export declare function verifySapaidSignature(rawBody: Buffer | string, secret: string, signatureHeader: string | undefined): boolean;
