import {
  CORE_CLIENT_SCOPES,
  OPT_IN_ONLY_SCOPES,
  READONLY_CLIENT_SCOPES,
  ALL_SCOPES as SCOPE_CATALOGUE,
  scopeGroup,
} from '@trek/shared';

/**
 * The scope list the consent screen and the client presets draw, derived from
 * the catalogue in @trek/shared (`shared/src/oauth/scopes.ts`) that the server
 * checks tokens against, so neither side keeps a copy of the other. The words
 * are the `oauth.scope.<scope>.label` / `.description` and
 * `oauth.scope.group.<group>` keys in the locales.
 */
export interface ScopeInfo {
  label: string;
  description: string;
  group: string;
}

export interface ScopeKeys {
  labelKey: string;
  descriptionKey: string;
  groupKey: string;
}

/** The i18n keys of one scope and its group; every scope in the catalogue has all three in every locale. */
const scopeLabelKey = (scope: string) => `oauth.scope.${scope}.label`;
const scopeDescriptionKey = (scope: string) => `oauth.scope.${scope}.description`;
const scopeGroupKey = (group: string) => `oauth.scope.group.${group}`;

export const SCOPE_GROUPS: Record<string, ScopeKeys> = Object.fromEntries(
  SCOPE_CATALOGUE.map((scope) => [
    scope,
    {
      labelKey: scopeLabelKey(scope),
      descriptionKey: scopeDescriptionKey(scope),
      groupKey: scopeGroupKey(scopeGroup(scope)),
    },
  ])
);

export const ALL_SCOPES: string[] = [...SCOPE_CATALOGUE];

/** Scopes a client preset must never tick for you (plugins:use runs third-party code). */
export const PRESET_OPT_IN_ONLY: ReadonlySet<string> = new Set(OPT_IN_ONLY_SCOPES);

/**
 * What the client presets tick: the core set. Tours, road trip, the journey
 * and its Studio, collections, atlas, vacay and collab stay visible in the
 * same picker, one tick away.
 */
export const PRESET_SCOPES_DEFAULT: string[] = [...CORE_CLIENT_SCOPES];

/** The read-only preset (VS Code). Kept beside the default so the pair stays visible. */
export const PRESET_SCOPES_READONLY: string[] = [...READONLY_CLIENT_SCOPES];

export const SCOPE_GROUP_NAMES = [...new Set(Object.values(SCOPE_GROUPS).map((s) => s.groupKey))];

export function getScopesByGroup(t: (key: string) => string): Record<string, Array<{ scope: string } & ScopeInfo>> {
  const groups: Record<string, Array<{ scope: string } & ScopeInfo>> = {};
  for (const [scope, keys] of Object.entries(SCOPE_GROUPS)) {
    const group = t(keys.groupKey);
    if (!groups[group]) groups[group] = [];
    groups[group].push({ scope, label: t(keys.labelKey), description: t(keys.descriptionKey), group });
  }
  return groups;
}
