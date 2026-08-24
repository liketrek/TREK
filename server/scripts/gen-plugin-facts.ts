/**
 * Regenerates every derived copy of the plugin permission facts from the single source,
 * server/src/nest/plugins/protocol/envelope.ts.
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
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HOOK_PERMISSION, KNOWN_METHODS, KNOWN_PERMISSIONS, METHOD_PERMISSION,
  EVENTS_PERMISSION, JOBS_PERMISSION, USER_DATA_PERMISSION, HTTP_OUTBOUND_PREFIX,
} from '../src/nest/plugins/protocol/envelope';
import { SNAPSHOT_GRANT, ENTITY_ID_KEYS } from '../src/plugin-event-sink';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const HEADER = [
  '// GENERATED — do not edit by hand.',
  '// Source: server/src/nest/plugins/protocol/envelope.ts + server/src/plugin-event-sink.ts',
  '// Regenerate: node --import tsx server/scripts/gen-plugin-facts.ts',
  '',
].join('\n');

const list = (xs: readonly string[]) => xs.map((x) => `  '${x}',`).join('\n');
const pairs = (o: Readonly<Record<string, string>>) =>
  Object.entries(o).map(([k, v]) => `  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: '${v}',`).join('\n');

/**
 * Types here are deliberately WIDE — Readonly<Record<string, string>> and string[] —
 * matching exactly what plugin-sdk published before this file existed. An `as const`
 * literal would be TS7053 under plugin-sdk/tsconfig.json's "strict": true, where
 * grantGaps indexes HOOK_PERMISSION[key] with a plain string, and it would be a
 * source-breaking type change for any plugin author doing a dynamic lookup. Strictness
 * belongs on the host side, where the data source lives.
 */
const EVENT_FAMILIES = [...new Set([...Object.keys(ENTITY_ID_KEYS), ...Object.keys(SNAPSHOT_GRANT)])].sort();

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
    problems.push(
      `plugin-sdk/src/cli/ui.ts PERMISSION_FAMILIES does not cover: ${missingHint.join(', ')}`,
    );
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
