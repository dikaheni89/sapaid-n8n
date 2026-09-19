"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_WEBHOOK_SECRET_LENGTH = exports.MIN_WEBHOOK_SECRET_LENGTH = void 0;
exports.webhookSecretProblem = webhookSecretProblem;
/**
 * Bounds sapaid places on a webhook signing secret. The floor exists because a
 * short key is brute-forcible from one observed signature; the ceiling is the
 * column width. Enforced on rotation too, so an update cannot slip outside the
 * range set at creation.
 */
exports.MIN_WEBHOOK_SECRET_LENGTH = 16;
exports.MAX_WEBHOOK_SECRET_LENGTH = 255;
/**
 * The reason the server would refuse this secret, or null when it would accept
 * it. Empty means "no signing", which is allowed.
 */
function webhookSecretProblem(secret) {
    if (!secret) {
        return null;
    }
    if (secret.length < exports.MIN_WEBHOOK_SECRET_LENGTH) {
        return `Webhook secret must be at least ${exports.MIN_WEBHOOK_SECRET_LENGTH} characters`;
    }
    if (secret.length > exports.MAX_WEBHOOK_SECRET_LENGTH) {
        return `Webhook secret cannot exceed ${exports.MAX_WEBHOOK_SECRET_LENGTH} characters`;
    }
    return null;
}
