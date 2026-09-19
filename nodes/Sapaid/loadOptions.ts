import type { IDataObject, ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';

/**
 * Dropdown loaders for the ID fields that have a listing route behind them.
 *
 * Every field these back stays a plain string value, so a workflow that supplies
 * an ID from an expression keeps working: the dropdown is a convenience, never
 * the only way in. Exactly one page is fetched; beyond it the field takes an
 * expression.
 */
const PAGE_SIZE = 200;

interface ListEntry {
  id?: string;
  name?: string;
  phone?: string;
  email?: string;
  status?: string;
  [key: string]: unknown;
}

/** Every sapaid list route answers `{ data: [...], next_cursor }`. */
function extractList(response: unknown): ListEntry[] {
  if (Array.isArray(response)) {
    return response as ListEntry[];
  }
  if (response && typeof response === 'object') {
    const data = (response as { data?: unknown }).data;
    if (Array.isArray(data)) {
      return data as ListEntry[];
    }
  }
  return [];
}

export async function fetchList(
  ctx: ILoadOptionsFunctions,
  endpoint: string,
  qs?: IDataObject,
): Promise<ListEntry[]> {
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

function toOptions(
  entries: ListEntry[],
  label: (entry: ListEntry) => string,
): INodePropertyOptions[] {
  return entries
    .filter((entry) => entry.id !== undefined && entry.id !== null)
    .map((entry) => ({ name: label(entry), value: String(entry.id) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getNumbers(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const entries = await fetchList(this, '/v1/numbers');
  return toOptions(entries, (n) => {
    const phone = n.phone ? `+${n.phone}` : String(n.id);
    const name = n.name ? `${n.name} (${phone})` : phone;
    return n.status && n.status !== 'connected' ? `${name} — ${n.status}` : name;
  });
}

export async function getTemplates(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const entries = await fetchList(this, '/v1/templates');
  return toOptions(entries, (t) => t.name ?? String(t.id));
}

export async function getLabels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const entries = await fetchList(this, '/v1/labels');
  return toOptions(entries, (l) => l.name ?? String(l.id));
}

export async function getAgents(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const entries = await fetchList(this, '/v1/agents');
  return toOptions(entries, (a) =>
    a.name ? `${a.name}${a.email ? ` (${a.email})` : ''}` : String(a.id),
  );
}
