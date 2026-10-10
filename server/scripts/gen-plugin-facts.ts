/**
 * Regenerates every derived copy of the plugin permission facts from the single source,
 * server/src/nest/plugins/protocol/envelope.ts, plus the output contract
 * (protocol/output-contract.ts) and the addon ids (src/addons.ts) the SDK publishes.
 *
 *   node --import tsx server/scripts/gen-plugin-facts.ts            # write
 *   node --import tsx server/scripts/gen-plugin-facts.ts --check    # exit 1 on drift
 *
 * It *imports* envelope.ts rather than scraping it. The guard it replaces
 * (plugin-sdk/test/permissions-parity.test.ts) pulled the block out with a regex, which
 * goes quietly null the moment someone reformats a closing brace — and that test only ran
 * from prepublishOnly, so the failure would have surfaced as a broken npm release.
 *
 * The generated files are CHECKED IN: publish-plugin-sdk runs inside a standalone
 * plugin-sdk/ checkout with no server present, so a build-time artefact would ship an SDK
 * with an empty permission list.
 */
// A relative import of the shared SOURCE, not @trek/shared: the plugin-facts CI job
// installs only the server, so shared's dist does not exist there. The file has no
// imports of its own for exactly this reason.
import {
  PLUGIN_POI_ICONS,
  PLUGIN_POI_LABEL_MAX,
  PLUGIN_POI_MAX_CATEGORIES,
} from '../../shared/src/plugins/plugin-poi-facts';
import { ADDON_IDS } from '../src/addons';
import {
  HOOK_PERMISSION,
  KNOWN_METHODS,
  KNOWN_PERMISSIONS,
  METHOD_PERMISSION,
  EVENTS_PERMISSION,
  JOBS_PERMISSION,
  USER_DATA_PERMISSION,
  HTTP_OUTBOUND_PREFIX,
  PLUGIN_API_VERSION,
} from '../src/nest/plugins/protocol/envelope';
import {
  ACTIONS_MAX,
  ADDON_ID_RE,
  CAPABILITY_NAME_RE,
  EGRESS_HOST_RE,
  MCP_TOOLS_MAX,
  PLUGIN_CHANNEL_EVENTS,
  PLUGIN_ID_RE,
  PLUGIN_SEMVER_RE,
  PLUGIN_TYPES,
  REPLACEABLE_TABS,
  RESERVED_PLUGIN_IDS,
  RESERVED_SETTING_KEYS,
  ROUTE_PROFILE_ID_RE,
  ROUTE_PROFILES_MAX,
  SETTING_FIELD_KEYS,
  SETTING_KEY_RE,
  TOOL_NAME_RE,
  TRIP_PAGE_POSITION_MAX,
  WIDGET_SLOTS,
} from '../src/nest/plugins/protocol/manifest-rules';
import {
  PLUGIN_ENTITY_CONTRACT,
  PLUGIN_ENTITY_NESTED,
  PLUGIN_METHOD_OUTPUT,
  pluginEntityFields,
  type PluginEntityName,
  type PluginMethodOutput,
} from '../src/nest/plugins/protocol/output-contract';
import { SNAPSHOT_GRANT, ENTITY_ID_KEYS } from '../src/plugin-event-sink';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const HEADER = [
  '// GENERATED — do not edit by hand.',
  '// Source: server/src/nest/plugins/protocol/envelope.ts + server/src/plugin-event-sink.ts',
  '//         + server/src/nest/plugins/protocol/manifest-rules.ts',
  '//         + server/src/nest/plugins/protocol/output-contract.ts + server/src/addons.ts',
  '//         + shared/src/plugins/plugin-poi-facts.ts',
  '// Regenerate: node --import tsx server/scripts/gen-plugin-facts.ts',
  '',
].join('\n');

const list = (xs: readonly string[]) => xs.map((x) => `  '${x}',`).join('\n');
const pairs = (o: Readonly<Record<string, string>>) =>
  Object.entries(o)
    .map(([k, v]) => `  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: '${v}',`)
    .join('\n');

/**
 * Types here are deliberately WIDE — Readonly<Record<string, string>> and string[] —
 * matching exactly what plugin-sdk published before this file existed. An `as const`
 * literal would be TS7053 under plugin-sdk/tsconfig.json's "strict": true, where
 * grantGaps indexes HOOK_PERMISSION[key] with a plain string, and it would be a
 * source-breaking type change for any plugin author doing a dynamic lookup. Strictness
 * belongs on the host side, where the data source lives.
 */
const EVENT_FAMILIES = [...new Set([...Object.keys(ENTITY_ID_KEYS), ...Object.keys(SNAPSHOT_GRANT)])].sort();

/** `'trip'`, `'trip[]'`, `'host'` or `'readModel'`: what a method's result is. */
const describeOutput = (output: PluginMethodOutput): string =>
  output.kind === 'entity' ? `${output.entity}${output.many ? '[]' : ''}` : output.kind;

const fieldList = (fields: readonly string[]) => fields.map((f) => `    '${f}',`).join('\n');
const ENTITY_FIELDS = (Object.keys(PLUGIN_ENTITY_CONTRACT) as PluginEntityName[])
  .map((entity) => `  ${entity}: [\n${fieldList(pluginEntityFields(entity))}\n  ],`)
  .join('\n');

const ENTITY_NESTED = (Object.keys(PLUGIN_ENTITY_NESTED) as PluginEntityName[])
  .map((entity) => {
    const children = Object.entries(PLUGIN_ENTITY_NESTED[entity] ?? {}).map(([key, child]) => `${key}: '${child}'`);
    return `  ${entity}: { ${children.join(', ')} },`;
  })
  .join('\n');

const METHOD_RESULT = Object.fromEntries(
  Object.entries(PLUGIN_METHOD_OUTPUT).map(([method, output]) => [method, describeOutput(output)]),
);

const SDK_FACTS = `${HEADER}
export const HOOK_PERMISSION: Readonly<Record<string, string>> = {
${pairs(HOOK_PERMISSION)}
};

export const KNOWN_PERMISSIONS: string[] = [
${list(KNOWN_PERMISSIONS)}
];

export const METHOD_PERMISSION: Readonly<Record<string, string>> = {
${pairs(METHOD_PERMISSION)}
};

export const KNOWN_METHODS: string[] = [
${list(KNOWN_METHODS)}
];

export const USER_DATA_PERMISSION = '${USER_DATA_PERMISSION}';
export const EVENTS_PERMISSION = '${EVENTS_PERMISSION}';
export const JOBS_PERMISSION = '${JOBS_PERMISSION}';
export const HTTP_OUTBOUND_PREFIX = '${HTTP_OUTBOUND_PREFIX}';

/**
 * Core-event catalog. Delivery names are the WebSocket broadcast names,
 * \`<family>:<verb>\` (e.g. \`place:created\`). A subscribed plugin receives
 * \`{event, tripId, entity?, entityId?, snapshot?}\`; \`snapshot\` is delivered only
 * when the plugin also holds EVENT_SNAPSHOT_GRANT[family]. Delete/reorder/bulk
 * events carry no snapshot.
 */
export const EVENT_FAMILIES: readonly string[] = [
${list(EVENT_FAMILIES)}
];

export const EVENT_SNAPSHOT_GRANT: Readonly<Record<string, string>> = {
${pairs(SNAPSHOT_GRANT)}
};

/**
 * \`capabilities.poiCategories\` (#1781): the lucide icons a category may use, how many
 * categories one plugin may declare, and the longest label.
 */
export const POI_CATEGORY_ICONS: string[] = [
${list(PLUGIN_POI_ICONS)}
];

export const POI_CATEGORY_MAX = ${PLUGIN_POI_MAX_CATEGORIES};
export const POI_CATEGORY_LABEL_MAX = ${PLUGIN_POI_LABEL_MAX};

/**
 * The addon ids a manifest's \`requiredAddons\` may name: TREK's ADDON_IDS.
 */
export const KNOWN_ADDONS: string[] = [
${list(Object.values(ADDON_IDS))}
];

/**
 * The fields each entity result carries, and nothing else: the row's published
 * columns, then the keys the host adds (joined names, counts, hydrated children).
 * A column TREK adds later is not delivered until it is listed here. A literal,
 * unlike the wide tables above, because it is new (nothing published depends on a
 * wider type) and the SDK's entity interfaces are type-checked against it.
 */
export const PLUGIN_ENTITY_FIELDS = {
${ENTITY_FIELDS}
} as const;

/**
 * The fields of an entity that hold rows of another entity (one row or a list),
 * and which one. Those rows carry that entity's PLUGIN_ENTITY_FIELDS and no others,
 * however deep they sit, so a column TREK adds to a child table is held back the
 * same way. A field not listed here holds a value TREK builds field by field.
 */
export const PLUGIN_ENTITY_NESTED: Readonly<Record<string, Readonly<Record<string, string>>>> = {
${ENTITY_NESTED}
};

/**
 * What each ctx method returns: an entity from PLUGIN_ENTITY_FIELDS (\`trip\`, or
 * \`trip[]\` for a list), \`host\` for a value the host builds itself or data the
 * plugin owns, or \`readModel\` for a domain read model passed on as the app's own
 * REST route returns it.
 */
export const PLUGIN_METHOD_RESULT: Readonly<Record<string, string>> = {
${pairs(METHOD_RESULT)}
};

/**
 * The plugin-API version this TREK implements. A manifest's \`apiVersion\` must be a
 * positive integer no greater than this, or the install refuses it.
 */
export const PLUGIN_API_VERSION = ${PLUGIN_API_VERSION} as const;

/**
 * The manifest format rules TREK's install loader enforces
 * (server/src/nest/plugins/protocol/manifest-rules.ts), so \`trek-plugin validate\`
 * refuses exactly what an install refuses.
 */
export const MANIFEST_ID_RE = ${PLUGIN_ID_RE};
export const MANIFEST_RESERVED_IDS: readonly string[] = [
${list(RESERVED_PLUGIN_IDS)}
];
export const MANIFEST_SEMVER_RE = ${PLUGIN_SEMVER_RE};
export const MANIFEST_TYPES: readonly string[] = [
${list(PLUGIN_TYPES)}
];
export const MANIFEST_ADDON_ID_RE = ${ADDON_ID_RE};
export const MANIFEST_HOST_RE = ${EGRESS_HOST_RE};
export const MANIFEST_WIDGET_SLOTS: readonly string[] = [
${list(WIDGET_SLOTS)}
];
export const MANIFEST_REPLACEABLE_TABS: readonly string[] = [
${list(REPLACEABLE_TABS)}
];
export const MANIFEST_TRIP_PAGE_POSITION_MAX = ${TRIP_PAGE_POSITION_MAX};
export const MANIFEST_ROUTE_PROFILES_MAX = ${ROUTE_PROFILES_MAX};
export const MANIFEST_ROUTE_PROFILE_ID_RE = ${ROUTE_PROFILE_ID_RE};
export const MANIFEST_CAPABILITY_NAME_RE = ${CAPABILITY_NAME_RE};
export const MANIFEST_MCP_TOOLS_MAX = ${MCP_TOOLS_MAX};
export const MANIFEST_TOOL_NAME_RE = ${TOOL_NAME_RE};
export const MANIFEST_SETTING_KEY_RE = ${SETTING_KEY_RE};
export const MANIFEST_RESERVED_SETTING_KEYS: readonly string[] = [
${list(RESERVED_SETTING_KEYS)}
];
export const MANIFEST_ACTIONS_MAX = ${ACTIONS_MAX};

/** Every attribute a settings-field object may carry; the host silently drops anything else. */
export const SETTING_FIELD_KEYS = [
${list(SETTING_FIELD_KEYS)}
] as const;

/** Events a plugin notification channel may carry. Admin-scoped and in-app-only events are excluded. */
export const CHANNEL_EVENTS: string[] = [
${list(PLUGIN_CHANNEL_EVENTS)}
];
`;

const SHARED_FACTS = `${HEADER}
/** Widened on purpose so client callers can .includes() with a plain string. */
export const PLUGIN_PERMISSIONS: readonly string[] = [
${list(KNOWN_PERMISSIONS)}
];

export const PLUGIN_HOOK_PERMISSION: Readonly<Record<string, string>> = {
${pairs(HOOK_PERMISSION)}
};
`;

const OUTPUTS: Array<[string, string]> = [
  ['plugin-sdk/src/generated/host-facts.ts', SDK_FACTS],
  ['shared/src/plugin-permissions.ts', SHARED_FACTS],
];

/**
 * Coverage assertions the type system cannot make, because the targets are not TypeScript
 * unions. Both failure modes are silent today: a new permission reaches the consent screen
 * as a raw code with no translation, and `trek-plugin permissions` prints it with no hint.
 */
function coverageProblems(): string[] {
  const problems: string[] = [];

  // Match the whole quoted key, not a prefix of it. `includes('plugins.perm.db:own')`
  // also matches 'plugins.perm.db:ownX', and several permissions are prefixes of others
  // ('db:read:files' vs 'db:read:files:content'), so a substring test passes on exactly
  // the drift it is supposed to catch.
  const enAdmin = fs.readFileSync(path.join(REPO, 'shared/src/i18n/en/admin.ts'), 'utf8');
  const missingI18n = KNOWN_PERMISSIONS.filter((p) => !enAdmin.includes(`'admin.plugins.perm.${p}':`));
  if (missingI18n.length) {
    problems.push(
      `shared/src/i18n/en/admin.ts is missing 'admin.plugins.perm.<permission>' for: ${missingI18n.join(', ')}`,
    );
  }

  const ui = fs.readFileSync(path.join(REPO, 'plugin-sdk/src/cli/ui.ts'), 'utf8');
  const missingHint = KNOWN_PERMISSIONS.filter((p) => !ui.includes(`'${p}'`));
  if (missingHint.length) {
    problems.push(`plugin-sdk/src/cli/ui.ts PERMISSION_FAMILIES does not cover: ${missingHint.join(', ')}`);
  }

  return problems;
}

const check = process.argv.includes('--check');
let failed = false;

for (const [rel, content] of OUTPUTS) {
  const abs = path.join(REPO, rel);
  const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (current === content) continue;

  if (check) {
    console.error(`DRIFT: ${rel} does not match envelope.ts.`);
    console.error('       Run: node --import tsx server/scripts/gen-plugin-facts.ts');
    failed = true;
  } else {
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content);
    console.log(`wrote ${rel}`);
  }
}

for (const problem of coverageProblems()) {
  console.error(`COVERAGE: ${problem}`);
  failed = true;
}

if (failed) process.exit(1);
if (check) console.log('plugin facts are in sync with envelope.ts');
