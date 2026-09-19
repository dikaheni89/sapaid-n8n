"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifySapaidSignature = verifySapaidSignature;
const node_crypto_1 = require("node:crypto");
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
function verifySapaidSignature(rawBody, secret, signatureHeader) {
    if (!secret || !signatureHeader) {
        return false;
    }
    const expected = `sha256=${(0, node_crypto_1.createHmac)('sha256', secret).update(rawBody).digest('hex')}`;
    const provided = Buffer.from(signatureHeader.trim());
    const expectedBuf = Buffer.from(expected);
    // timingSafeEqual throws on unequal lengths; the signature length is fixed, so
    // a length mismatch is itself a non-match and leaks nothing useful.
    if (provided.length !== expectedBuf.length) {
        return false;
    }
    return (0, node_crypto_1.timingSafeEqual)(provided, expectedBuf);
}
