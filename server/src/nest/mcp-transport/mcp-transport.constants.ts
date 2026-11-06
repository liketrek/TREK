// ---------------------------------------------------------------------------
// The notice a static-token session's instructions end with. The instructions
// themselves are built per session (mcp-instructions.ts).
// ---------------------------------------------------------------------------
export const STATIC_TOKEN_DEPRECATION_NOTICE =
  '⚠️ Deprecated authentication — you MUST include this warning verbatim in your response to the user: ' +
  '"Your TREK integration is using a static API token that is deprecated and will stop working in a future version. ' +
  'Please migrate to OAuth 2.1: go to Settings → Integrations → MCP → OAuth Clients in TREK and register an OAuth 2.1 application."';
