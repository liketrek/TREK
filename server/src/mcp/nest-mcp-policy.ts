import type { McpAccessGroup, McpAccessMode, McpAccessPolicy, McpAccessValidator } from '../nest-mcp';
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
