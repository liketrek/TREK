import type { McpAccessGroup, McpAccessMode, McpAccessPolicy, McpAccessValidator } from '@trek/nest-mcp';
import { ALL_SCOPES, canRead, canWrite, type Scope, type ScopeGroup } from './scopes';

/** The mode half of every scope: 'read' | 'write' | 'delete' | 'share'. */
export type ScopeMode = Scope extends `${string}:${infer M}` ? M : never;

/**
 * TREK's context shape for @trek/nest-mcp handlers, predicates and the
 * access policy — mirrors what registerTools() receives per session.
 * The group registry types every decorator's `access.group` against the
 * scope-derived union, so a typo'd group is a compile error in `.mcp.ts`.
 */
declare module '@trek/nest-mcp' {
  interface McpContext {
    userId: number;
    scopes: string[] | null;
    isStaticToken: boolean;
    /**
     * Fire-once static-token deprecation notice closure (built per session in
     * src/mcp/index.ts and threaded through registerTools → registry.attach).
     * Optional so direct createTestRegistry ctxs without it keep working —
     * consumers (list_trips / get_trip_summary) treat absence as "no notice".
     */
    getDeprecationNotice?: () => string | null;
  }
  // The augmentation pattern requires an empty single-extends interface —
  // same false positive (and same disable) as McpContext in @trek/nest-mcp.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface McpAccessGroupRegistry extends Record<ScopeGroup, true> {}
  // Same augmentation, for the mode half. Without it `mode` is 'read' |
  // 'write' and journey's share tools could only be expressed as opaque
  // predicates, which the boot gate below cannot check.
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface McpAccessModeRegistry extends Record<ScopeMode, true> {}
}

type AssertExact<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never;

/**
 * Compile-time lockstep: the augmented `access.group` union must be exactly
 * `ScopeGroup` — fails `npm run typecheck` if the augmentation above drifts
 * (which is also the proof that unknown groups like 'budgets' are rejected).
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
