/**
 * The webhook events sapaid dispatches, as n8n `multiOptions` entries.
 *
 * Single source of truth for the Trigger node's `events` parameter and the action
 * node's Webhook Create/Update `events` parameters, so the lists cannot drift.
 * Mirrors `docs/API-CONTRACT.md` § Webhook events. Ordered alphabetically by value.
 */
import type { INodeProperties } from 'n8n-workflow';
export declare const WEBHOOK_EVENT_OPTIONS: INodeProperties['options'];
/** The event values only, for tests and validation. */
export declare const WEBHOOK_EVENT_VALUES: string[];
