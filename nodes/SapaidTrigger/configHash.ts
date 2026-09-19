import { createHash } from 'node:crypto';

/**
 * Stable fingerprint of the trigger configuration the server-side registration
 * depends on: the delivery URL n8n advertises, the events, the signing secret and
 * the number filter. When any of these changes the stored registration is stale;
 * checkExists compares this hash and re-registers on a mismatch.
 *
 * Only the hash is ever kept in workflow static data; the secret is never stored.
 */
export function webhookConfigHash(config: {
  url: string;
  events: string[];
  secret: string;
  numberId: string;
}): string {
  const canonical = JSON.stringify({
    url: config.url,
    events: [...config.events].sort(),
    secret: config.secret,
    numberId: config.numberId,
  });
  return createHash('sha256').update(canonical).digest('hex');
}
