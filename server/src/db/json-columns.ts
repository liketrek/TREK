import type { JsonColumn } from '../utils/json-column';

import { z } from 'zod';

/**
 * The JSON-in-TEXT columns the services decode, one declaration each: the shape
 * the column holds and what a reader gets when a row is empty or broken. Read
 * them with `decodeJson`/`decodeJsonResult` and write server-built values with
 * `encodeJson` (`utils/json-column.ts`), never with a bare `JSON.parse` at the
 * call site.
 *
 * These are storage shapes, not API contracts: `reservations.metadata` goes out
 * as the stored string, and the scope lists are plain string arrays whose
 * values the OAuth layer checks against its own scope table.
 */

/** The free-form booking details (times, carrier, legs, the mirrored price). Old rows can hold a JSON string of the JSON. */
export const RESERVATION_METADATA: JsonColumn<Record<string, unknown>> = {
  column: 'reservations.metadata',
  schema: z.record(z.string(), z.unknown()),
  fallback: () => ({}),
  unwrapDoubleEncoded: true,
};

const stringList = z.array(z.string());

/** The scopes an OAuth token was issued with. A broken row grants nothing. */
export const OAUTH_TOKEN_SCOPES: JsonColumn<string[]> = {
  column: 'oauth_tokens.scopes',
  schema: stringList,
  fallback: () => [],
};

/** The scopes an OAuth client may ask for. A broken row allows nothing. */
export const OAUTH_CLIENT_ALLOWED_SCOPES: JsonColumn<string[]> = {
  column: 'oauth_clients.allowed_scopes',
  schema: stringList,
  fallback: () => [],
};

/** The redirect URIs an OAuth client registered. A broken row matches none. */
export const OAUTH_CLIENT_REDIRECT_URIS: JsonColumn<string[]> = {
  column: 'oauth_clients.redirect_uris',
  schema: stringList,
  fallback: () => [],
};

/** The scopes a user consented to for a client. A broken row counts as consent to nothing, so the user is asked again. */
export const OAUTH_CONSENT_SCOPES: JsonColumn<string[]> = {
  column: 'oauth_consents.scopes',
  schema: stringList,
  fallback: () => [],
};

/** A limited API token's scopes; the reader keeps the strings it knows. */
export const MCP_TOKEN_API_SCOPES: JsonColumn<unknown[]> = {
  column: 'mcp_tokens.api_scopes',
  schema: z.array(z.unknown()),
  fallback: () => [],
};

/** The hashed MFA backup codes; the reader keeps the strings. A broken row holds no codes. */
export const USER_MFA_BACKUP_CODES: JsonColumn<unknown[]> = {
  column: 'users.mfa_backup_codes',
  schema: z.array(z.unknown()),
  fallback: () => [],
};

/** A journey entry's tags. */
export const JOURNEY_ENTRY_TAGS: JsonColumn<string[]> = {
  column: 'journey_entries.tags',
  schema: z.array(z.string()),
  fallback: () => [],
};

/**
 * A journey entry's pros and cons (`{ pros, cons }`). Checked as an object
 * only: the lists inside go out as they were stored.
 */
export const JOURNEY_ENTRY_PROS_CONS: JsonColumn<Record<string, unknown> | null> = {
  column: 'journey_entries.pros_cons',
  schema: z.record(z.string(), z.unknown()).nullable(),
  fallback: () => null,
};

/** A poll's options: plain labels, or `{ label }` objects from older rows. Checked as a list only. */
export const COLLAB_POLL_OPTIONS: JsonColumn<unknown[]> = {
  column: 'collab_polls.options',
  schema: z.array(z.unknown()),
  fallback: () => [],
};
