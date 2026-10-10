import {
  demoDenied,
  errorResult,
  type McpAccessGroup,
  type McpAccessMode,
  type McpAccessPolicy,
  type McpAccessValidator,
  type McpErrorMapper,
  type McpToolGate,
  type ToolOptions,
} from '../nest-mcp';
import { DomainError } from '../nest/common/domain-error';
import { ALL_SCOPES, canRead, canWrite, type Scope, type ScopeGroup } from './scopes';

/** The mode half of every scope: 'read' | 'write' | 'delete' | 'share'. */
export type ScopeMode = Scope extends `${string}:${infer M}` ? M : never;

type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

/**
 * Compile-time lockstep: `access.group` (from the registry interfaces in
 * src/nest-mcp/types.ts) must be exactly `ScopeGroup` — fails
 * `npm run typecheck` if the registries drift from scopes.ts.
 * Exported so the policy unit test has a runtime touchpoint.
 */
export const MCP_ACCESS_GROUPS_MATCH_SCOPE_GROUPS: AssertExact<McpAccessGroup, ScopeGroup> = true;

/** Same lockstep for the mode half. */
export const MCP_ACCESS_MODES_MATCH_SCOPE_MODES: AssertExact<McpAccessMode, ScopeMode> = true;

/**
 * Resolves declarative `access: { group, mode }` markers with the exact
 * scopes.ts semantics the legacy registrars used at registration time:
 * null scopes ⇒ full access; read ⇒ `group:read` OR `group:write`;
 * write ⇒ `group:write`. Any other mode (`share`, `delete`) is its own scope
 * and is not implied by `:write` — matching canShareJourneys, which the
 * journey registrar used for its three share-link tools. Single source for
 * production (AppModule) and the MCP test harness.
 */
export const trekMcpAccessPolicy: McpAccessPolicy = ({ group, mode }, ctx) => {
  if (mode === 'read') return canRead(ctx.scopes, group);
  if (mode === 'write') return canWrite(ctx.scopes, group);
  return ctx.scopes === null || ctx.scopes.includes(`${group}:${mode}`);
};

const VALID_GROUP_MODES: ReadonlySet<string> = new Set(ALL_SCOPES);

/**
 * Boot gate run by registry.validate(): a declarative marker must resolve to
 * a real scope — `{ group, mode }` requires `group:mode` ∈ ALL_SCOPES. Catches
 * what the group typing alone cannot: mode drift on read-only groups (`geo`
 * and `weather` have no `:write` scope, so `{ group: 'weather', mode:
 * 'write' }` type-checks but would silently deny scoped tokens while passing
 * `scopes: null` sessions). The offending entry is named by the registry's
 * aggregated error.
 */
export const trekMcpValidateAccess: McpAccessValidator = ({ group, mode }) =>
  VALID_GROUP_MODES.has(`${group}:${mode}`) ? null : `no '${group}:${mode}' scope in SCOPES`;

/**
 * True for a tool the demo gate holds back: every tool that does not declare
 * itself read-only. The annotation, not `access.mode`, is the signal, because
 * the share/content scopes cover reads too (get_share_link,
 * get_trip_calendar_feed, read_trip_file) and the predicate-gated tools carry
 * no mode at all. tests/unit/mcp/demo-tool-gate.test.ts holds the two in step:
 * every `mode: 'read'` tool is read-only and every `mode: 'write'` one is not.
 */
export function isDemoGatedTool(tool: ToolOptions): boolean {
  return tool.annotations?.readOnlyHint !== true;
}

/**
 * The demo-mode write block for every registered tool, in one place: a demo
 * account calling a tool that is not read-only gets the canned refusal, the
 * same result each tool used to return from its own first line. Given to
 * McpModule.forRoot as `toolGate` (AppModule) and to the MCP test registry.
 * Plugin tools are dynamic and keep their own gate in PluginMcpToolsService.
 */
export function trekDemoToolGate(isDemoUser: (userId: number) => Promise<boolean>): McpToolGate {
  return async (tool, ctx) => (isDemoGatedTool(tool) && (await isDemoUser(ctx.userId)) ? demoDenied() : undefined);
}

/**
 * A service refusal (`DomainError`) thrown out of a tool answers the call with
 * `errorResult(publicMessage)` (or the refusal's own `mcpMessage`): the same text REST sends as `{ error }`, and the
 * same result the tools built by hand from a `{ error, status }` return. Any
 * other error propagates as before. Given to McpModule.forRoot (AppModule) and
 * to the MCP test registry.
 */
export const trekMcpErrorMapper: McpErrorMapper = (err) =>
  err instanceof DomainError ? errorResult(err.mcpMessage ?? err.publicMessage) : undefined;
