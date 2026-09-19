"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeRecipient = normalizeRecipient;
/**
 * Normalises a recipient the way the sapaid panel does: digits only, international
 * form, a leading `0` read as an Indonesian number (`0812…` → `62812…`). Anything
 * else is taken as already carrying its country code.
 *
 * A value containing `@` is a chat or group ID rather than a phone number and is
 * passed through untouched, so a workflow can address a group the same way the
 * API does.
 *
 * Returns null when the digits do not form a plausible phone number, so the caller
 * can name the field instead of forwarding a value the server will refuse.
 */
const PHONE_MIN = 8;
const PHONE_MAX = 15;
function normalizeRecipient(input) {
    const trimmed = input.trim();
    if (!trimmed) {
        return null;
    }
    if (trimmed.includes('@')) {
        return trimmed;
    }
    const digits = trimmed.replace(/\D/g, '');
    const intl = digits.startsWith('0') ? `62${digits.slice(1)}` : digits;
    if (intl.length < PHONE_MIN || intl.length > PHONE_MAX) {
        return null;
    }
    return intl;
}
