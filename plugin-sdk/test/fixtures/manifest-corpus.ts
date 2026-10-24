/**
 * One corpus of manifests, judged by both validators: the SDK's `validateManifest`
 * (what `trek-plugin validate` says) and the host's `parseManifest` with
 * `requireTrek` (what an install says). `test/manifest-corpus.test.ts` runs the SDK
 * over it here; `server/tests/unit/plugins/manifest-parity.test.ts` runs both and
 * fails on any case where they disagree with the verdicts below.
 *
 * The verdict that must never happen is the SDK accepting what the host refuses: a
 * false green lets an author cut a release the registry then rejects. The SDK may be
 * stricter than the host on purpose (a declaration the host installs but never
 * uses); each such case carries `sdk` and the reason in `why`.
 *
 * Plain data, no imports: the server test reaches this file by a relative path.
 */

export type Verdict = 'accept' | 'reject';

export interface ManifestCase {
  name: string;
  manifest: Record<string, unknown>;
  /** What an install answers. */
  host: Verdict;
  /** What `validate` answers, when it differs from the host (only ever stricter). */
  sdk?: Verdict;
  /** Why the SDK is stricter here. Required with `sdk`. */
  why?: string;
}

const base = {
  id: 'demo-plugin',
  name: 'Demo',
  version: '1.0.0',
  type: 'integration',
  trek: '>=4.0.0 <5.0.0',
};

const tool = (name: string) => ({ name, description: 'Looks something up.' });
const poi = { id: 'trails', label: 'Trails', icon: 'Footprints', color: '#22aa66' };

export const MANIFEST_CORPUS: ManifestCase[] = [
  { name: 'the minimal manifest', manifest: { ...base }, host: 'accept' },
  { name: 'not an object', manifest: null as unknown as Record<string, unknown>, host: 'reject' },

  // apiVersion: a positive integer no newer than the host's plugin API
  { name: 'apiVersion 1', manifest: { ...base, apiVersion: 1 }, host: 'accept' },
  { name: 'apiVersion 0', manifest: { ...base, apiVersion: 0 }, host: 'reject' },
  { name: 'apiVersion -1', manifest: { ...base, apiVersion: -1 }, host: 'reject' },
  { name: 'apiVersion 1.5', manifest: { ...base, apiVersion: 1.5 }, host: 'reject' },
  { name: 'apiVersion as a string', manifest: { ...base, apiVersion: '1' }, host: 'reject' },
  { name: 'apiVersion null', manifest: { ...base, apiVersion: null }, host: 'reject' },
  { name: 'apiVersion newer than the host', manifest: { ...base, apiVersion: 2 }, host: 'reject' },

  // id, version, type, trek
  { name: 'id too short', manifest: { ...base, id: 'ab' }, host: 'reject' },
  { name: 'id with capitals', manifest: { ...base, id: 'Demo-plugin' }, host: 'reject' },
  { name: 'reserved id', manifest: { ...base, id: 'registry' }, host: 'reject' },
  { name: 'missing name', manifest: { ...base, name: '' }, host: 'reject' },
  { name: 'version without patch', manifest: { ...base, version: '1.0' }, host: 'reject' },
  { name: 'prerelease version', manifest: { ...base, version: '1.0.0-beta.1' }, host: 'accept' },
  { name: 'version with build metadata', manifest: { ...base, version: '1.0.0+build' }, host: 'reject' },
  { name: 'unknown type', manifest: { ...base, type: 'theme' }, host: 'reject' },
  { name: 'trip-page type', manifest: { ...base, type: 'trip-page' }, host: 'accept' },
  { name: 'missing trek range', manifest: { ...base, trek: undefined }, host: 'reject' },
  { name: 'unsatisfiable trek range', manifest: { ...base, trek: '>=5.0.0 <4.0.0' }, host: 'reject' },
  { name: 'trek range that is not semver', manifest: { ...base, trek: 'latest' }, host: 'reject' },
  { name: 'native modules', manifest: { ...base, nativeModules: true }, host: 'reject' },

  // permissions and egress
  { name: 'a known permission', manifest: { ...base, permissions: ['db:read:trips'] }, host: 'accept' },
  { name: 'an unknown permission', manifest: { ...base, permissions: ['db:read:everything'] }, host: 'reject' },
  {
    name: 'outbound host with its egress',
    manifest: { ...base, permissions: ['http:outbound:api.example.com'], egress: ['api.example.com'] },
    host: 'accept',
  },
  {
    name: 'outbound to a whole TLD',
    manifest: { ...base, permissions: ['http:outbound:*.com'], egress: ['*.com'] },
    host: 'reject',
  },
  { name: 'outbound without egress', manifest: { ...base, permissions: ['http:outbound'] }, host: 'reject' },
  {
    name: 'operator egress without hosts',
    manifest: { ...base, permissions: ['http:outbound'], operatorEgress: true },
    host: 'accept',
  },
  { name: 'operator egress not a boolean', manifest: { ...base, operatorEgress: 'yes' }, host: 'reject' },
  { name: 'operator egress without outbound', manifest: { ...base, operatorEgress: true }, host: 'reject' },
  {
    name: 'bare wildcard egress',
    manifest: { ...base, permissions: ['http:outbound'], egress: ['*'] },
    host: 'reject',
  },
  {
    name: 'egress host with a scheme',
    manifest: { ...base, permissions: ['http:outbound'], egress: ['https://api.example.com'] },
    host: 'reject',
  },

  // capabilities
  { name: 'hero widget', manifest: { ...base, type: 'widget', capabilities: { widget: { slot: 'hero' } } }, host: 'accept' },
  { name: 'unknown widget slot', manifest: { ...base, capabilities: { widget: { slot: 'footer' } } }, host: 'reject' },
  { name: 'trip page replacing collab', manifest: { ...base, capabilities: { tripPage: { replaces: ['collab'] } } }, host: 'accept' },
  { name: 'trip page replacing the plan', manifest: { ...base, capabilities: { tripPage: { replaces: ['plan'] } } }, host: 'reject' },
  { name: 'trip page at position 50', manifest: { ...base, capabilities: { tripPage: { position: 50 } } }, host: 'accept' },
  { name: 'trip page at position 51', manifest: { ...base, capabilities: { tripPage: { position: 51 } } }, host: 'reject' },
  { name: 'settingsUi not a boolean', manifest: { ...base, capabilities: { settingsUi: 'yes' } }, host: 'reject' },
  {
    name: 'route profiles with their grant',
    manifest: { ...base, permissions: ['hook:route-provider'], capabilities: { routeProfiles: [{ id: 'bike', label: 'Bike' }] } },
    host: 'accept',
  },
  {
    name: 'four route profiles',
    manifest: {
      ...base,
      permissions: ['hook:route-provider'],
      capabilities: { routeProfiles: ['a', 'b', 'c', 'd'].map((id) => ({ id, label: id })) },
    },
    host: 'reject',
  },
  {
    name: 'route profile id with capitals',
    manifest: { ...base, permissions: ['hook:route-provider'], capabilities: { routeProfiles: [{ id: 'Bike', label: 'Bike' }] } },
    host: 'reject',
  },
  {
    name: 'route profiles without their grant',
    manifest: { ...base, capabilities: { routeProfiles: [{ id: 'bike', label: 'Bike' }] } },
    host: 'accept',
    sdk: 'reject',
    why: 'the host installs the declaration but never offers the profiles without hook:route-provider',
  },
  {
    name: 'notification channel with its grant',
    manifest: {
      ...base,
      permissions: ['hook:notification-channel'],
      capabilities: { notificationChannel: { events: ['trip_invite'] } },
    },
    host: 'accept',
  },
  {
    name: 'notification channel for an admin-only event',
    manifest: {
      ...base,
      permissions: ['hook:notification-channel'],
      capabilities: { notificationChannel: { events: ['version_available'] } },
    },
    host: 'reject',
  },
  {
    name: 'notification channel without its grant',
    manifest: { ...base, capabilities: { notificationChannel: { events: ['trip_invite'] } } },
    host: 'accept',
    sdk: 'reject',
    why: 'the host installs the declaration but never delivers to it without hook:notification-channel',
  },
  {
    name: 'MCP tools with their grant',
    manifest: { ...base, permissions: ['mcp:tools'], capabilities: { mcpTools: [tool('lookup')] } },
    host: 'accept',
  },
  {
    name: 'MCP tools without their grant',
    manifest: { ...base, capabilities: { mcpTools: [tool('lookup')] } },
    host: 'reject',
  },
  {
    name: 'MCP tool name with a dash',
    manifest: { ...base, permissions: ['mcp:tools'], capabilities: { mcpTools: [tool('look-up')] } },
    host: 'reject',
  },
  {
    name: 'nine MCP tools',
    manifest: {
      ...base,
      permissions: ['mcp:tools'],
      capabilities: { mcpTools: Array.from({ length: 9 }, (_, i) => tool(`tool_${i}`)) },
    },
    host: 'reject',
  },
  {
    name: 'MCP tool without a description',
    manifest: { ...base, permissions: ['mcp:tools'], capabilities: { mcpTools: [{ name: 'lookup' }] } },
    host: 'reject',
  },
  {
    name: 'POI categories with their grant',
    manifest: { ...base, permissions: ['hook:poi-category-provider'], capabilities: { poiCategories: [poi] } },
    host: 'accept',
  },
  {
    name: 'POI category with an unknown icon',
    manifest: {
      ...base,
      permissions: ['hook:poi-category-provider'],
      capabilities: { poiCategories: [{ ...poi, icon: 'NotAnIcon' }] },
    },
    host: 'reject',
  },
  {
    name: 'POI categories without their grant',
    manifest: { ...base, capabilities: { poiCategories: [poi] } },
    host: 'accept',
    sdk: 'reject',
    why: 'the host installs the declaration but never shows the chips without hook:poi-category-provider',
  },
  { name: 'provided names', manifest: { ...base, capabilities: { provides: ['rate.updated'] } }, host: 'accept' },
  { name: 'provided name starting with a digit', manifest: { ...base, capabilities: { provides: ['1rate'] } }, host: 'reject' },

  // settings and actions
  { name: 'a dotted settings key', manifest: { ...base, settings: [{ key: 'api.key' }] }, host: 'accept' },
  { name: 'a prototype settings key', manifest: { ...base, settings: [{ key: '__proto__' }] }, host: 'reject' },
  { name: 'settings options not a list', manifest: { ...base, settings: [{ key: 'mode', options: 'a,b' }] }, host: 'reject' },
  { name: 'settings option without a value', manifest: { ...base, settings: [{ key: 'mode', options: [{ value: '' }] }] }, host: 'reject' },
  { name: 'string settings options', manifest: { ...base, settings: [{ key: 'mode', options: ['a', 'b'] }] }, host: 'accept' },
  { name: 'an action', manifest: { ...base, actions: [{ key: 'test', label: 'Test' }] }, host: 'accept' },
  {
    name: 'nine actions',
    manifest: { ...base, actions: Array.from({ length: 9 }, (_, i) => ({ key: `a${i}` })) },
    host: 'reject',
  },
  { name: 'duplicate actions', manifest: { ...base, actions: [{ key: 'test' }, { key: 'test' }] }, host: 'reject' },
  { name: 'action with an unknown scope', manifest: { ...base, actions: [{ key: 'test', scope: 'admin' }] }, host: 'reject' },

  // dependencies
  { name: 'a required addon', manifest: { ...base, requiredAddons: ['llm_parsing'] }, host: 'accept' },
  { name: 'a malformed addon id', manifest: { ...base, requiredAddons: ['LLM'] }, host: 'reject' },
  {
    name: 'a plugin dependency',
    manifest: { ...base, pluginDependencies: [{ id: 'other-plugin', version: '^1.0.0' }] },
    host: 'accept',
  },
  {
    name: 'a dependency on itself',
    manifest: { ...base, pluginDependencies: [{ id: 'demo-plugin', version: '^1.0.0' }] },
    host: 'reject',
  },
  {
    name: 'a dependency with a junk range',
    manifest: { ...base, pluginDependencies: [{ id: 'other-plugin', version: 'whenever' }] },
    host: 'reject',
  },
];
