"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildMessageRequest = buildMessageRequest;
const n8n_workflow_1 = require("n8n-workflow");
const jsonParam_1 = require("../../shared/jsonParam");
const phone_1 = require("../../shared/phone");
const media_1 = require("../media");
const params_1 = require("./params");
// The API refuses a longer text; failing here names the field.
const MAX_TEXT_LENGTH = 4096;
const MAX_CAPTION_LENGTH = 1024;
/** Default MIME per media kind, for binary input that carries none. */
const MEDIA_KIND = {
    sendAudio: { type: 'audio', mime: 'audio/ogg' },
    sendDocument: { type: 'document', mime: 'application/octet-stream' },
    sendImage: { type: 'image', mime: 'image/jpeg' },
    sendSticker: { type: 'sticker', mime: 'image/webp' },
    sendVideo: { type: 'video', mime: 'video/mp4' },
};
/** Reads the option collection every send shares into body fields. */
function applySendOptions(ctx, body, itemIndex) {
    const options = ctx.getNodeParameter('sendOptions', itemIndex, {});
    const replyTo = (0, params_1.asText)(options.replyTo, 'Reply To Message ID');
    if (replyTo) {
        body.reply_to = replyTo;
    }
    const idempotencyKey = (0, params_1.asText)(options.idempotencyKey, 'Idempotency Key');
    if (idempotencyKey) {
        body.idempotency_key = idempotencyKey;
    }
    const typing = Number(options.typingSeconds);
    if (Number.isFinite(typing) && typing > 0) {
        body.typing_seconds = typing;
    }
}
/** The fields every send starts from. */
function sendBase(ctx, itemIndex) {
    const body = {
        to: (0, params_1.requireRecipient)(ctx, 'to', 'To', itemIndex),
    };
    const numberId = (0, params_1.optionalText)(ctx, 'numberId', 'Number ID', itemIndex);
    if (numberId) {
        body.number_id = numberId;
    }
    return body;
}
function readVariables(ctx, itemIndex) {
    let parsed;
    try {
        parsed = (0, jsonParam_1.parseJsonParam)(ctx.getNodeParameter('variables', itemIndex, ''));
    }
    catch {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'Variables must be valid JSON', { itemIndex });
    }
    if (parsed === undefined) {
        return {};
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        throw new n8n_workflow_1.NodeOperationError(ctx.getNode(), 'Variables must be a JSON object', { itemIndex });
    }
    return parsed;
}
async function buildMessageRequest(operation, itemIndex) {
    const send = (body) => {
        applySendOptions(this, body, itemIndex);
        return { method: 'POST', endpoint: '/v1/messages', body };
    };
    switch (operation) {
        case 'sendText': {
            const body = sendBase(this, itemIndex);
            body.type = 'text';
            body.text = (0, params_1.requireText)(this, 'text', 'Text', itemIndex, MAX_TEXT_LENGTH);
            return send(body);
        }
        case 'sendImage':
        case 'sendVideo':
        case 'sendAudio':
        case 'sendDocument':
        case 'sendSticker': {
            const kind = MEDIA_KIND[operation];
            const body = sendBase(this, itemIndex);
            body.type = kind.type;
            body.media = await media_1.resolveMedia.call(this, itemIndex, kind.mime);
            if (operation === 'sendImage' || operation === 'sendVideo' || operation === 'sendDocument') {
                const caption = (0, params_1.asText)(this.getNodeParameter('caption', itemIndex, ''), 'Caption');
                if (caption.length > MAX_CAPTION_LENGTH) {
                    throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Caption cannot exceed ${MAX_CAPTION_LENGTH} characters`, { itemIndex });
                }
                if (caption) {
                    body.caption = caption;
                }
            }
            if (operation === 'sendAudio' &&
                this.getNodeParameter('voiceNote', itemIndex, false)) {
                body.voice_note = true;
            }
            return send(body);
        }
        case 'sendLocation': {
            const body = sendBase(this, itemIndex);
            const latitude = Number(this.getNodeParameter('latitude', itemIndex));
            const longitude = Number(this.getNodeParameter('longitude', itemIndex));
            if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Latitude must be between -90 and 90', {
                    itemIndex,
                });
            }
            if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Longitude must be between -180 and 180', {
                    itemIndex,
                });
            }
            const location = { latitude, longitude };
            const name = (0, params_1.optionalText)(this, 'locationName', 'Location Name', itemIndex);
            const address = (0, params_1.optionalText)(this, 'locationAddress', 'Address', itemIndex);
            if (name)
                location.name = name;
            if (address)
                location.address = address;
            body.type = 'location';
            body.location = location;
            return send(body);
        }
        case 'sendContact': {
            const body = sendBase(this, itemIndex);
            const phoneRaw = (0, params_1.requireText)(this, 'contactPhone', 'Contact Phone', itemIndex);
            const phone = (0, phone_1.normalizeRecipient)(phoneRaw);
            if (!phone || phone.includes('@')) {
                throw new n8n_workflow_1.NodeOperationError(this.getNode(), 'Contact Phone is not a valid phone number. Use the international form, e.g. 628123456789.', { itemIndex });
            }
            body.type = 'contact';
            body.contact = {
                name: (0, params_1.requireText)(this, 'contactName', 'Contact Name', itemIndex),
                phone,
            };
            return send(body);
        }
        case 'sendTemplate': {
            const body = sendBase(this, itemIndex);
            body.type = 'template';
            body.template = {
                id: (0, params_1.requireText)(this, 'templateId', 'Template ID', itemIndex),
                variables: readVariables(this, itemIndex),
            };
            return send(body);
        }
        case 'get': {
            const id = (0, params_1.requirePathId)(this, 'messageId', 'Message ID', itemIndex);
            return { method: 'GET', endpoint: `/v1/messages/${id}`, body: {} };
        }
        case 'downloadMedia': {
            const id = (0, params_1.requirePathId)(this, 'messageId', 'Message ID', itemIndex);
            return {
                method: 'GET',
                endpoint: `/v1/messages/${id}/media`,
                body: {},
                responseFormat: 'binary',
            };
        }
        case 'list': {
            const { qs, returnAll } = (0, params_1.readListOptions)(this, itemIndex);
            for (const key of ['since', 'until']) {
                if (qs[key] !== undefined) {
                    const ms = Date.parse(String(qs[key]));
                    if (!Number.isFinite(ms)) {
                        throw new n8n_workflow_1.NodeOperationError(this.getNode(), `${key} is not a valid date`, {
                            itemIndex,
                        });
                    }
                    qs[key] = new Date(ms).toISOString();
                }
            }
            return { method: 'GET', endpoint: '/v1/messages', body: {}, qs, returnAll };
        }
        default:
            return null;
    }
}
