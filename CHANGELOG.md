# Changelog

## 0.1.0

First release.

- **sapaid** action node: Message (send text/image/video/audio/document/sticker/location/contact/template, get, list, download media), Chat, Contact, Number, Template, Broadcast, Label, Webhook.
- **sapaid Trigger**: registers a webhook per workflow, verifies `X-Sapaid-Signature`, re-registers on configuration drift, optional de-duplication.
- Indonesian phone normalisation (`0812…` → `62812…`) on every recipient field.
- Cursor pagination with *Return All*.
