/**
 * Bounds sapaid places on a webhook signing secret. The floor exists because a
 * short key is brute-forcible from one observed signature; the ceiling is the
 * column width. Enforced on rotation too, so an update cannot slip outside the
 * range set at creation.
 */
export declare const MIN_WEBHOOK_SECRET_LENGTH = 16;
export declare const MAX_WEBHOOK_SECRET_LENGTH = 255;
/**
 * The reason the server would refuse this secret, or null when it would accept
 * it. Empty means "no signing", which is allowed.
 */
export declare function webhookSecretProblem(secret: string): string | null;
