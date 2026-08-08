/**
 * API-docs kill switch (#1412). Deliberately NOT in src/config.ts: tests mock
 * that module with partial exports, and reading the env at call time keeps the
 * flag testable per-request (same pattern as plugins/kill-switch.ts).
 *
 * Off by default — the generated spec enumerates every route including the
 * admin surface, so exposing it is an explicit self-hoster decision.
 */
import { readEnv } from '../../app-config';

export function apiDocsEnabled(): boolean {
  return readEnv().http.apiDocsEnabled;
}
