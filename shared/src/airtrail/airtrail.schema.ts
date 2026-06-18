import { z } from 'zod';

/**
 * AirTrail integration contracts (#214).
 *
 * AirTrail is a self-hosted flight tracker (github.com/johanohly/AirTrail).
 * The connection is per-user (Settings → Integrations); the global on/off is the
 * `airtrail` addon. Each user stores their instance URL + a personal Bearer API
 * key, which only ever exposes that user's own flights.
 */

// ── Per-user connection ──────────────────────────────────────────────────────

/** Placeholder the server returns instead of the real key once one is stored. */
export const AIRTRAIL_KEY_MASK = '••••••••';

export const airtrailSettingsSchema = z.object({
  /** Instance origin, e.g. https://flights.example.com — TREK appends /api itself. */
  url: z.string().trim().max(2048),
  /** Bearer API key. Omitted / blank / the mask keeps the stored key unchanged. */
  apiKey: z.string().max(512).optional(),
  /** Allow self-signed TLS certs (common on LAN instances). */
  allowInsecureTls: z.boolean().optional().default(false),
  /**
   * Opt in to writing TREK edits back to AirTrail (#1240). Off by default:
   * AirTrail is the source of truth and TREK only reads from it.
   */
  writeEnabled: z.boolean().optional().default(false),
});
export type AirtrailSettings = z.infer<typeof airtrailSettingsSchema>;

export const airtrailConnectionSchema = z.object({
  url: z.string(),
  apiKeyMasked: z.string(),
  allowInsecureTls: z.boolean(),
  writeEnabled: z.boolean(),
  connected: z.boolean(),
});
export type AirtrailConnection = z.infer<typeof airtrailConnectionSchema>;

export const airtrailStatusSchema = z.object({
  connected: z.boolean(),
  flightCount: z.number().optional(),
  error: z.string().optional(),
});
export type AirtrailStatus = z.infer<typeof airtrailStatusSchema>;

// ── Flight list (picker) ─────────────────────────────────────────────────────

/** A normalized AirTrail flight as surfaced to the import picker. */
export const airtrailFlightSchema = z.object({
  id: z.string(),
  fromCode: z.string().nullable(),
  fromName: z.string().nullable(),
  toCode: z.string().nullable(),
  toName: z.string().nullable(),
  date: z.string().nullable(),
  departure: z.string().nullable(),
  arrival: z.string().nullable(),
  airline: z.string().nullable(),
  flightNumber: z.string().nullable(),
  aircraft: z.string().nullable(),
  seatClass: z.string().nullable(),
});
export type AirtrailFlight = z.infer<typeof airtrailFlightSchema>;

// ── Import ───────────────────────────────────────────────────────────────────

export const airtrailImportSchema = z.object({
  flightIds: z.array(z.string()).min(1, 'Select at least one flight'),
});
export type AirtrailImport = z.infer<typeof airtrailImportSchema>;

/** Per-flight outcome of an import (so the picker can show what was skipped). */
export const airtrailImportResultSchema = z.object({
  imported: z.array(z.string()),
  skipped: z.array(
    z.object({
      flightId: z.string(),
      reason: z.enum(['already-imported', 'already-in-trip', 'invalid']),
      detail: z.string().optional(),
    }),
  ),
});
export type AirtrailImportResult = z.infer<typeof airtrailImportResultSchema>;
