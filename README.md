# n8n-nodes-sapaid

n8n community nodes for [sapaid](https://sapaid.id): send WhatsApp messages, run
broadcasts, manage the team inbox, and start workflows from incoming messages.

Two nodes ship in this package:

- **sapaid** (action): messages, chats, contacts, numbers, templates, broadcasts, labels, webhooks.
- **sapaid Trigger**: starts a workflow when a message arrives, a chat changes hands, a number
  disconnects, a broadcast finishes, and so on. Registers the webhook for you and verifies each
  delivery's signature.

## Installation

### Community nodes (recommended)

In n8n go to **Settings → Community Nodes → Install**, enter `n8n-nodes-sapaid`, and confirm.
Requires n8n ≥ 1.0 with community nodes enabled.

### Manual

```bash
cd ~/.n8n/nodes   # or your N8N_CUSTOM_EXTENSIONS directory
npm install n8n-nodes-sapaid
```

Restart n8n afterwards.

## Credentials

Create a **sapaid API** credential:

| Field | Value |
|---|---|
| API Key | From the Developer page of your sapaid panel |
| API Base URL | `https://api.sapaid.id` unless support gave you another address |

The credential test calls `GET /v1/me`, so a wrong key fails right there.

## sapaid (action node)

Every operation runs once per input item. Phone numbers are normalised before
sending: `0812-3456-789`, `+62 812…` and `628123456789` all become `628123456789`.
A value containing `@` is treated as a chat/group ID and passed through.

| Resource | Operations |
|---|---|
| **Message** | Send Text, Send Image, Send Video, Send Audio (voice note option), Send Document, Send Sticker, Send Location, Send Contact, Send Template, Get, List, Download Media |
| **Chat** | List, Get, List Messages, Mark as Read, Close, Reopen, Assign, Set Labels |
| **Contact** | List, Get, Create, Update, Delete, Check Number |
| **Number** | List, Get, Get Status |
| **Template** | List, Get, Create, Update, Delete, Render |
| **Broadcast** | List, Get, Create, Cancel |
| **Label** | List, Get, Create, Update, Delete |
| **Webhook** | List, Get, Create, Update, Delete, Test |

Notes worth knowing:

- **Media** comes from a binary field of the previous node, a public URL, or base64. Binary
  input keeps the MIME type and file name n8n already knows.
- **Send options** on every send: *Reply To Message ID*, *Idempotency Key* (a retried
  workflow does not send twice), *Typing Delay*.
- **List operations** emit one item per row. With *Return All* the node follows the
  cursor until the server runs out; otherwise *Limit* caps the page.
- **Download Media** puts the file on a binary field (default `data`), ready for a
  Write File, S3 or Drive node.
- **Continue On Fail** keeps a failed item in the output as `{ error, description }`
  where `description` is the server's own sentence.
- The node is marked `usableAsTool`, so an AI Agent can call it.

## sapaid Trigger

Pick the events, optionally a single number, and activate the workflow. The
node registers a webhook on your account, keeps it in sync (a changed event
list, secret or URL re-registers on the next activation; a registration edited
or disabled in the panel is rebuilt), and removes it when the workflow is
deactivated.

Events: `message.received`, `message.sent`, `message.delivered`, `message.read`,
`message.failed`, `chat.opened`, `chat.closed`, `chat.assigned`,
`contact.created`, `number.connected`, `number.disconnected`, `number.qr`,
`broadcast.completed`.

### Output

Each delivery is one item shaped like

```json
{
  "id": "evt_01J…",
  "event": "message.received",
  "timestamp": "2026-09-20T10:00:00+07:00",
  "number_id": "num_01J…",
  "data": {
    "id": "msg_01J…",
    "chat_id": "cht_01J…",
    "from": "628123456789",
    "from_name": "Budi",
    "type": "text",
    "text": "Halo, mau tanya stok"
  }
}
```

Read message fields from `data`: `{{ $json.data.text }}`, `{{ $json.data.from }}`.

### Signature verification

Set a **Webhook Secret** (16–255 characters). The node registers it with sapaid,
and every delivery must then carry a valid `X-Sapaid-Signature: sha256=<hex>`
header (HMAC-SHA256 over the raw body). Anything that fails verification is
answered `401` and never starts an execution. The secret is only ever stored in
the node parameters; workflow static data holds a hash of the configuration,
not the secret itself.

### Duplicate deliveries

sapaid delivers at least once and retries a failed POST under the same envelope
`id`. Turn on **Deduplicate Deliveries** to drop a replay (the last 500 IDs are
remembered per node). A *Webhook › Test* delivery is never de-duplicated.

## Example: auto-reply with a template

1. **sapaid Trigger** — events: `message.received`.
2. **IF** — `{{ $json.data.text.toLowerCase().includes("harga") }}`.
3. **sapaid** — Message › Send Template, To `{{ $json.data.from }}`, Template *Daftar harga*,
   Options › Reply To Message ID `{{ $json.data.id }}`.

## Example: broadcast from a Google Sheet

1. **Google Sheets** — read rows with a `phone` column.
2. **Aggregate** — all `phone` values into one list.
3. **sapaid** — Broadcast › Create, Recipients `{{ $json.phone }}`, Content *Template*,
   Options › Schedule At tomorrow 09:00.

## API contract

The routes and payloads these nodes call are written down in
[`docs/API-CONTRACT.md`](docs/API-CONTRACT.md). If you are integrating with the
API directly, that file is the reference.

## Development

```bash
npm install
npm run build        # tsc + icon copy into dist/
npm test             # build, then node --test against dist/
npm run lint
npm run format
```

CI runs one further gate on top: the n8n Creator Portal scanner (see
`scripts/n8n-scan.mjs`), pinned to the portal's own rule version.

### Commits and releases

`dist/` is committed so `npm i github:sapaid/n8n-nodes-sapaid` works without a
build step. The pre-commit hook (husky) rebuilds and stages it; CI fails if the
committed `dist/` drifts from the source.

Commit subjects follow [Conventional Commits](https://www.conventionalcommits.org/)
(`feat:`, `fix:`, `docs:`, …) and are checked by commitlint. release-please reads
them on `main` to open a release PR with the version bump and changelog; merging
that PR publishes to npm with a provenance attestation.

To try the nodes in a local n8n:

```bash
npm run build
npm link
cd ~/.n8n/nodes && npm link n8n-nodes-sapaid
n8n start
```

## License

MIT
