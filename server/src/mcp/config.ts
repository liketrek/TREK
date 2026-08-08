/**
 * MCP tuning knobs from the environment (#1414). The parsers moved into the
 * app-config layer (src/app-config/parsers.ts) — this module re-exports them
 * so existing import paths keep working. mcp/index.ts consumes the derived
 * values via readEnv().mcp.
 */
export { resolveSessionTtlMs, resolveKeepaliveMs } from '../app-config/parsers';
