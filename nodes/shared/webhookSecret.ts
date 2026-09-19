/**
 * Bounds sapaid places on a webhook signing secret. The floor exists because a
 * short key is brute-forcible from one observed signature; the ceiling is the
 * column width. Enforced on rotation too, so an update cannot slip outside the
 * range set at creation.
 */
export const MIN_WEBHOOK_SECRET_LENGTH = 16;
export const MAX_WEBHOOK_SECRET_LENGTH = 255;

/**
 * The reason the server would refuse this secret, or null when it would accept
 * it. Empty means "no signing", which is allowed.
 */
export function webhookSecretProblem(secret: string): string | null {
  if (!secret) {
    return null;
  }
  if (secret.length < MIN_WEBHOOK_SECRET_LENGTH) {
    return `Webhook secret must be at least ${MIN_WEBHOOK_SECRET_LENGTH} characters`;
  }
  if (secret.length > MAX_WEBHOOK_SECRET_LENGTH) {
    return `Webhook secret cannot exceed ${MAX_WEBHOOK_SECRET_LENGTH} characters`;
  }
  return null;
}
