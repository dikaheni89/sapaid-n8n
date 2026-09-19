"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchList = fetchList;
exports.getNumbers = getNumbers;
exports.getTemplates = getTemplates;
exports.getLabels = getLabels;
exports.getAgents = getAgents;
/**
 * Dropdown loaders for the ID fields that have a listing route behind them.
 *
 * Every field these back stays a plain string value, so a workflow that supplies
 * an ID from an expression keeps working: the dropdown is a convenience, never
 * the only way in. Exactly one page is fetched; beyond it the field takes an
 * expression.
 */
const PAGE_SIZE = 200;
/** Every sapaid list route answers `{ data: [...], next_cursor }`. */
function extractList(response) {
    if (Array.isArray(response)) {
        return response;
    }
    if (response && typeof response === 'object') {
        const data = response.data;
        if (Array.isArray(data)) {
            return data;
        }
    }
    return [];
}
async function fetchList(ctx, endpoint, qs) {
    const credentials = await ctx.getCredentials('sapaidApi');
    const baseUrl = String(credentials.baseUrl ?? '').replace(/\/+$/, '');
    const response = await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'sapaidApi', {
        method: 'GET',
        url: `${baseUrl}${endpoint}`,
        qs: { limit: PAGE_SIZE, ...(qs ?? {}) },
        json: true,
    });
    return extractList(response);
}
function toOptions(entries, label) {
    return entries
        .filter((entry) => entry.id !== undefined && entry.id !== null)
        .map((entry) => ({ name: label(entry), value: String(entry.id) }))
        .sort((a, b) => a.name.localeCompare(b.name));
}
async function getNumbers() {
    const entries = await fetchList(this, '/v1/numbers');
    return toOptions(entries, (n) => {
        const phone = n.phone ? `+${n.phone}` : String(n.id);
        const name = n.name ? `${n.name} (${phone})` : phone;
        return n.status && n.status !== 'connected' ? `${name} — ${n.status}` : name;
    });
}
async function getTemplates() {
    const entries = await fetchList(this, '/v1/templates');
    return toOptions(entries, (t) => t.name ?? String(t.id));
}
async function getLabels() {
    const entries = await fetchList(this, '/v1/labels');
    return toOptions(entries, (l) => l.name ?? String(l.id));
}
async function getAgents() {
    const entries = await fetchList(this, '/v1/agents');
    return toOptions(entries, (a) => a.name ? `${a.name}${a.email ? ` (${a.email})` : ''}` : String(a.id));
}
