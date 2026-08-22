import { McpController, Prompt, type McpContext } from '../../nest-mcp';

/**
 * Auth-related MCP surface. One prompt today, moved 1:1 from the legacy
 * registrar src/mcp/tools/prompts.ts.
 *
 * It lives in the auth domain rather than a domain of its own because it is a
 * statement about how the session authenticated, not about any trip data — and
 * it injects nothing, since the message is static.
 *
 * The registrar gated it with an `if (isStaticToken)` around the registration
 * call. `when` receives the session context, so that becomes a declarative gate
 * with the same effect: OAuth 2.1 sessions never see the prompt listed at all.
 */
@McpController()
export class AuthMcp {
  @Prompt({
    name: 'token_auth_notice',
    title: 'Static Token Auth Notice',
    description: 'Notification that this session uses a static API token which will be deprecated',
    argsSchema: {},
    when: (ctx: McpContext) => ctx.isStaticToken,
  })
  async tokenAuthNotice() {
    return {
      description: 'Static token deprecation notice',
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: '⚠️ This MCP connection is authenticated with a static API token (trek_…). Static token authentication will be deprecated in a future version of TREK. Please inform the user that they should migrate to OAuth 2.1 by going to Settings → Integrations → MCP → OAuth Clients in TREK and registering an OAuth 2.1 application for their MCP client.',
        },
      }],
    };
  }
}
