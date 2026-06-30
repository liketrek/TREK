/**
 * Optimistic-concurrency result shared by the entity update services (#1135).
 *
 * When a client replays an offline edit it may send `X-Base-Updated-At` — the
 * `updated_at` the edit was based on. If the row has moved on since, the update
 * service returns this sentinel instead of overwriting, and the controller turns
 * it into a 409 carrying the server's current version so the client can let the
 * user resolve the conflict. Absent token => unconditional update (back-compat).
 */
export interface UpdateConflict {
  conflict: true;
  server: unknown;
}

export function isUpdateConflict(result: unknown): result is UpdateConflict {
  return !!result && typeof result === 'object' && (result as { conflict?: unknown }).conflict === true;
}
