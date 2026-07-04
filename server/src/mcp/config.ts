/**
 * MCP tuning knobs from the environment (#1414). Pure parsers, kept free of
 * imports so units can test them without dragging in the MCP SDK.
 */

/**
 * Session idle TTL in SECONDS via MCP_SESSION_TTL, default 1 hour, clamped to
 * 24h so a milliseconds-value typo can't produce a 1000-hour session.
 */
export function resolveSessionTtlMs(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 24 * 60 * 60) * 1000 : 60 * 60 * 1000;
}

/**
 * SSE keep-alive interval in SECONDS via MCP_SSE_KEEPALIVE, default 25s
 * (below common proxy idle timeouts like nginx-ingress's 60s). 0 disables.
 */
export function resolveKeepaliveMs(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed * 1000 : 25_000;
}
