# sapaid Public API v1 — contract used by `n8n-nodes-sapaid`

This is the HTTP surface the n8n nodes are written against. The sapaid backend
must implement it as written here; if a route or field changes, change it here
first and bump the node in the same PR.

Base URL: `https://api.sapaid.id` (configurable per credential). Every route below
is under `/v1`. All request and response bodies are JSON, UTF-8. Field names are
`snake_case`. Timestamps are ISO-8601 with offset. IDs are opaque strings.

## Authentication

```
Authorization: Bearer <api_key>
```

API keys are issued per account on the Developer page. `GET /v1/me` is the
credential test: it must be authenticated, side-effect free, and answer 401 to a
bad key.

## Errors

```json
{ "error": { "code": "quota_exceeded", "message": "Kuota pesan bulan ini habis." } }
```

`message` is what the node shows the user, so it should be a sentence a
non-developer can act on. Status codes: 400 validation, 401 bad key, 403 plan
does not allow it, 404 not found, 409 conflict (duplicate idempotency key with
a different body), 422 the number cannot do that right now (disconnected), 429
rate limit (with `Retry-After`), 5xx server.

## Pagination

Every list route answers

```json
{ "data": [ ... ], "next_cursor": "opaque-or-null" }
```

and takes `?limit=` (1–200, default 50) and `?cursor=`. The node unwraps `data`
into one n8n item per row and, with *Return All*, follows `next_cursor` until it
is `null`.

## Phone numbers

Digits only, international form, no `+`: `628123456789`. The node already
normalises `0812…` to `62812…` and strips punctuation before sending, but the
server should accept the same rule so raw API users get identical behaviour. A
value containing `@` is a chat/group ID and is used as-is.

## Routes

### Account

| Method | Path | Notes |
|---|---|---|
| GET | `/v1/me` | `{ id, name, plan, numbers_count }` — credential test |
| GET | `/v1/agents` | Team members: `{ data: [{ id, name, email }] }` — used by the Chat › Assign dropdown |

### Messages

`POST /v1/messages` — one message, any kind. Common fields:

| Field | Type | Notes |
|---|---|---|
| `to` | string | phone or chat ID, required |
| `type` | `text` \| `image` \| `video` \| `audio` \| `document` \| `sticker` \| `location` \| `contact` \| `template` | required |
| `number_id` | string | which linked number sends; account default when omitted |
| `reply_to` | string | message ID to quote |
| `idempotency_key` | string | same key within 24 h returns the first result (200, not a resend) |
| `typing_seconds` | number 0–30 | show typing before sending |

Per type:

- `text`: `text` (≤ 4096)
- `image` / `video` / `document`: `media`, optional `caption` (≤ 1024)
- `audio`: `media`, optional `voice_note: true` (PTT)
- `sticker`: `media` (WebP)
- `location`: `location: { latitude, longitude, name?, address? }`
- `contact`: `contact: { name, phone }`
- `template`: `template: { id, variables: { ... } }`

`media` is one of `{ url, filename? }` (server downloads it) or
`{ base64, mime_type, filename? }`.

Response `201`: the message object

```json
{
  "id": "msg_01J…",
  "chat_id": "cht_01J…",
  "number_id": "num_01J…",
  "direction": "outbound",
  "type": "text",
  "text": "Halo",
  "status": "pending",
  "to": "628123456789",
  "created_at": "2026-09-20T10:00:00+07:00"
}
```

| Method | Path | Notes |
|---|---|---|
| GET | `/v1/messages/{id}` | message object |
| GET | `/v1/messages/{id}/media` | raw bytes with the real `Content-Type`; 404 when no media |
| GET | `/v1/messages` | filters: `chat_id`, `number_id`, `direction`, `status`, `since`, `until` |

Inbound message object adds `from` (phone), `from_name` (push name), and for
media `media: { mime_type, filename, bytes, url }` where `url` is a short-lived
signed download link.

### Chats

| Method | Path | Body / query |
|---|---|---|
| GET | `/v1/chats` | `status` (`open`\|`closed`), `agent_id`, `label_id`, `number_id`, `unread` (bool), `q` |
| GET | `/v1/chats/{id}` | |
| GET | `/v1/chats/{id}/messages` | paginated, newest first |
| POST | `/v1/chats/{id}/read` | send read receipts |
| POST | `/v1/chats/{id}/close` | |
| POST | `/v1/chats/{id}/reopen` | |
| POST | `/v1/chats/{id}/assign` | `{ agent_id: string \| null }` — null unassigns |
| PUT | `/v1/chats/{id}/labels` | `{ label_ids: string[] }` — replaces |

Chat object: `{ id, number_id, contact: { id, name, phone }, status, agent_id, label_ids, unread_count, last_message: {...}, updated_at }`.

### Contacts

| Method | Path | Body / query |
|---|---|---|
| GET | `/v1/contacts` | `q`, `label_id` |
| POST | `/v1/contacts` | `{ phone, name, email?, notes?, label_ids?, metadata? }` |
| GET | `/v1/contacts/{id}` | |
| PATCH | `/v1/contacts/{id}` | any subset of the create fields; `null` clears `email`/`notes` |
| DELETE | `/v1/contacts/{id}` | 204 |
| POST | `/v1/contacts/check` | `{ phone }` → `{ phone, exists: bool, chat_id?: string }` |

### Numbers

| Method | Path | Notes |
|---|---|---|
| GET | `/v1/numbers` | `{ data: [{ id, phone, name, status }] }` |
| GET | `/v1/numbers/{id}` | |
| GET | `/v1/numbers/{id}/status` | `{ status, since, qr?: "data:image/png;base64,…" }` |

`status` is one of `connected`, `qr_ready`, `connecting`, `disconnected`, `action_required`.

### Templates

| Method | Path | Body |
|---|---|---|
| GET | `/v1/templates` | |
| POST | `/v1/templates` | `{ name, body }` — placeholders are `{{name}}` |
| GET | `/v1/templates/{id}` | |
| PATCH | `/v1/templates/{id}` | `{ name?, body? }` |
| DELETE | `/v1/templates/{id}` | 204 |
| POST | `/v1/templates/{id}/render` | `{ variables }` → `{ text, missing: string[] }` |

### Broadcasts

| Method | Path | Body |
|---|---|---|
| GET | `/v1/broadcasts` | `status` filter |
| POST | `/v1/broadcasts` | `{ name, recipients: string[], text? \| template?: { id, variables }, number_id?, schedule_at?, delay_seconds? }` |
| GET | `/v1/broadcasts/{id}` | `{ id, name, status, total, sent, delivered, failed, scheduled_at, started_at, finished_at }` |
| POST | `/v1/broadcasts/{id}/cancel` | |

`status`: `scheduled`, `running`, `completed`, `cancelled`. Recipients cap: 5000
per request. `delay_seconds` has a per-plan floor; below it the server clamps
and reports the value it used.

### Labels

| Method | Path | Body |
|---|---|---|
| GET | `/v1/labels` | |
| POST | `/v1/labels` | `{ name, color? }` — `#RRGGBB` |
| GET | `/v1/labels/{id}` | |
| PATCH | `/v1/labels/{id}` | `{ name?, color? }` |
| DELETE | `/v1/labels/{id}` | 204, detaches from every chat and contact |

### Webhooks

| Method | Path | Body |
|---|---|---|
| GET | `/v1/webhooks` | |
| POST | `/v1/webhooks` | `{ url, events: string[], secret?, number_id?, source? }` → `201 { id, url, events, number_id, active, created_at }` |
| GET | `/v1/webhooks/{id}` | same object; **`secret` is never returned** |
| PATCH | `/v1/webhooks/{id}` | `{ url?, events?, secret?, number_id?, active? }` — `secret: null` stops signing |
| DELETE | `/v1/webhooks/{id}` | 204; 404 when already gone |
| POST | `/v1/webhooks/{id}/test` | delivers `{ id, event: "test", timestamp, data: {} }` |

`secret` must be 16–255 characters (400 otherwise). `source: "n8n"` is a label the
panel can show ("registered by n8n"); it changes nothing else. Per-account cap on
registrations: 20.

## Webhook delivery

`POST <url>` with

```
Content-Type: application/json
X-Sapaid-Event: message.received
X-Sapaid-Delivery: dlv_01J…          (unique per attempt)
X-Sapaid-Signature: sha256=<hex>     (only when a secret is set)
```

The signature is `HMAC-SHA256(secret, raw_body_bytes)` over exactly the bytes
sent. Never re-serialise before signing.

Envelope:

```json
{
  "id": "evt_01J…",
  "event": "message.received",
  "timestamp": "2026-09-20T10:00:00+07:00",
  "number_id": "num_01J…",
  "data": { ...event payload... }
}
```

`id` identifies the **event** and is reused verbatim on every retry of the same
event, so receivers can de-duplicate on it. Delivery is at-least-once: retry on
any non-2xx or timeout (>10 s) with backoff 1 min, 5 min, 30 min, 2 h, 6 h, then
give up and mark the webhook `failing`. A receiver answering 401 counts as a
failure like any other.

### Events

| Event | `data` |
|---|---|
| `message.received` | inbound message object (`from`, `from_name`, `chat_id`, `type`, `text`, `media?`, `reply_to?`) |
| `message.sent` | outbound message object |
| `message.delivered` / `message.read` / `message.failed` | `{ message_id, chat_id, status, error? }` |
| `chat.opened` / `chat.closed` | chat object |
| `chat.assigned` | chat object with `agent_id` (null when unassigned) |
| `contact.created` | contact object with `source` (`manual` \| `api` \| `chat`) |
| `number.connected` / `number.disconnected` | `{ number_id, phone, status, reason? }` |
| `number.qr` | `{ number_id, qr: "data:image/png;base64,…" }` |
| `broadcast.completed` | broadcast object with final counters |

Adding an event: add it here, add it to `nodes/shared/webhookEvents.ts`, ship.
