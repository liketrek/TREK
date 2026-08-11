/**
 * Every gate that is a pure function of the working tree.
 *
 * This is most of them. See ./types.ts for why that matters: the registry grades
 * `trek-plugin.json` and `README.md` at a pinned commit, but those are the same two files
 * the author has open right now, so there is no reason to make them push a tag to find out.
 *
 * Each check answers ONE question and says what to do about it. The `fix` text is the whole
 * point — a check that reports "README invalid" and stops has told the author nothing they
 * can act on.
 */
import { createHash } from 'node:crypto';
import path from 'node:path';
import { validateManifest, isSatisfiableRange, isUnboundedRange, KNOWN_ADDONS } from '../../manifest.js';
// The hosts a plugin can ACTUALLY reach. See `code.egress-reachable` for why this is the
// only list that counts — and permissions.ts for why dev's egress guard uses the same one.
import { grantedHosts } from '../../permissions.js';
import { LUCIDE_ICON_NAMES } from '../../lucide-icon-names.js';
import { listZipNames } from '../../zip.js';
import { checkSignatureShape } from '../verify-signature.js';
import type { OfflineCheck, CheckContext } from './types.js';
import { pass, fail, skip } from './types.js';
import {
  REQUIRED_SECTIONS,
  MIN_PROSE_CHARS,
  missingSections,
  placeholders,
  proseLength,
  images,
  undocumentedPermissions,
} from './readme.js';

/** Mirrors the registry's native-binary scan (validate-entry.mjs) and the installer's. */
const NATIVE_RE = /(^|\/)[^/]+\.node$|(^|\/)binding\.gyp$|(^|\/)prebuilds?\//i;

const str = (v: unknown): string => (typeof v === 'string' ? v : '');
const arr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

// ── manifest ────────────────────────────────────────────────────────────────────

const manifestPresent: OfflineCheck = {
  id: 'manifest.present',
  blocks: 'artifact',
  stage: 'manifest',
  depth: 'offline',
  severity: 'error',
  title: 'trek-plugin.json exists and parses',
  run: (c) =>
    c.manifest
      ? pass()
      : fail(
          c.manifestError ?? 'no trek-plugin.json',
          'Every plugin is rooted at a trek-plugin.json manifest. Scaffold one rather than writing it by hand.',
          'trek-plugin create',
        ),
};

const manifestValid: OfflineCheck = {
  id: 'manifest.valid',
  blocks: 'artifact',
  stage: 'manifest',
  depth: 'offline',
  severity: 'error',
  title: 'Manifest passes the same rules the TREK installer applies',
  run: (c) => {
    if (!c.manifest) return skip();
    const r = validateManifest(c.manifest);
    if (r.ok) return pass();
    return fail(
      `${r.errors.length} problem${r.errors.length === 1 ? '' : 's'}`,
      r.errors.map((e) => '• ' + e).join('\n'),
    );
  },
};

const manifestIdMatchesDir: OfflineCheck = {
  id: 'manifest.id-matches-dir',
  stage: 'manifest',
  depth: 'offline',
  severity: 'warn',
  title: 'Directory name matches the plugin id',
  run: (c) => {
    const id = str(c.manifest?.id);
    if (!id) return skip();
    const dirName = path.basename(c.dir);
    return dirName === id
      ? pass()
      : fail(
          `directory is "${dirName}", id is "${id}"`,
          'Not fatal, but the registry files your entry under the id, and every doc assumes the two agree.',
        );
  },
};

const manifestTrekRange: OfflineCheck = {
  id: 'manifest.trek-range',
  stage: 'manifest',
  depth: 'offline',
  severity: 'warn',
  title: 'TREK version range is bounded',
  run: (c) => {
    const trek = str(c.manifest?.trek);
    // Unsatisfiable/missing is an ERROR, but manifest.valid already reports it — don't say it twice.
    if (!isSatisfiableRange(trek)) return skip();
    return isUnboundedRange(trek)
      ? fail(
          `trek: "${trek}"`,
          'This claims support for every TREK version, including ones that do not exist yet. It opts you out of the\n' +
            'one mechanism that stops your plugin running on a host it was never tested against. Pin a range like ">=3.4.0 <4.0.0".',
        )
      : pass(trek);
  },
};

const manifestIcon: OfflineCheck = {
  id: 'manifest.icon',
  stage: 'manifest',
  depth: 'offline',
  severity: 'error',
  title: 'Icon is a real lucide name',
  run: (c) => {
    if (!c.manifest) return skip();
    const icon = str(c.manifest.icon);
    // Absent is LEGAL — TREK falls back to Blocks and CI accepts it. But every plugin without
    // an icon is the same grey square in the store, so say so. Warn-shaped, reported as a pass
    // with a caveat rather than a failure, because refusing to publish over it would be absurd.
    if (!icon) return pass('none — TREK will show the generic Blocks glyph');
    return LUCIDE_ICON_NAMES.has(icon)
      ? pass(icon)
      : fail(
          `"${icon}" is not a lucide icon`,
          'TREK resolves the icon against lucide at render time and silently falls back to Blocks, so a typo is\n' +
            'invisible locally — but the registry rejects it. Pick a name from https://lucide.dev/icons (PascalCase).',
        );
  },
};

/**
 * The registry entry's schema, applied to the manifest fields it is built from.
 *
 * These are cheap string-length rules, and every one of them is a gate that today fails in CI
 * — AFTER the release is immutable — because nothing local looks at them. `entry.ts` copies
 * `description` straight out of the manifest and defaults it to `""`, which trips the schema's
 * minLength of 5 with an error that names the ENTRY, not the manifest that caused it.
 */
const manifestEntryFields: OfflineCheck = {
  id: 'manifest.entry-fields',
  stage: 'manifest',
  depth: 'offline',
  severity: 'error',
  title: 'name/description/author fit the registry schema',
  run: (c) => {
    if (!c.manifest) return skip();
    const problems: string[] = [];
    const name = str(c.manifest.name);
    const description = str(c.manifest.description);
    const author = str(c.manifest.author);

    if (name && (name.length < 2 || name.length > 60)) problems.push(`• name is ${name.length} chars (registry allows 2–60)`);
    if (!description) problems.push('• description is missing — the registry requires one (5–200 chars); it is your store-card subtitle');
    else if (description.length < 5) problems.push(`• description is ${description.length} chars (registry requires at least 5)`);
    else if (description.length > 200) problems.push(`• description is ${description.length} chars (registry allows at most 200)`);
    if (!author) problems.push('• author is missing — the entry would be published as "Unknown"');
    else if (author.length > 80) problems.push(`• author is ${author.length} chars (registry allows at most 80)`);

    // Reject a name that mixes Latin with Cyrillic/Greek look-alikes — the registry treats this
    // as a spoofing attempt (a plugin that looks like someone else's in the store).
    if (name && /[A-Za-z]/.test(name) && /[Ѐ-ӿͰ-Ͽ]/.test(name)) {
      problems.push(`• name "${name}" mixes Latin with Cyrillic/Greek characters — the registry reads that as a homoglyph spoof`);
    }

    // `tags` and `homepage` are copied VERBATIM out of the manifest into the entry (entry.ts),
    // and the registry's JSON schema validates both. Nothing local looked at either, so a tag with
    // a capital or a space — the obvious thing to write — produced an entry CI rejected, after the
    // release was cut and its bytes pinned.
    const tags = Array.isArray(c.manifest.tags) ? c.manifest.tags.map(String) : [];
    for (const t of tags) {
      if (!/^[a-z0-9-]{2,24}$/.test(t)) {
        problems.push(`• tag "${t}" is not a lowercase slug of 2–24 chars (the registry's schema rejects it)`);
      }
    }
    if (tags.length > 8) problems.push(`• ${tags.length} tags — the registry allows at most 8`);

    const homepage = str(c.manifest.homepage);
    if (homepage) {
      try {
        // The schema demands format:uri, which in practice means an absolute URL.
        const u = new URL(homepage);
        if (!u.protocol) throw new Error('no protocol');
      } catch {
        problems.push(`• homepage "${homepage}" is not an absolute URL (the registry's schema requires one, e.g. https://…)`);
      }
    }

    return problems.length
      ? fail(`${problems.length} problem${problems.length === 1 ? '' : 's'}`, problems.join('\n'))
      : pass();
  },
};

const manifestAddonsKnown: OfflineCheck = {
  id: 'manifest.addons-known',
  stage: 'manifest',
  depth: 'offline',
  severity: 'warn',
  title: 'requiredAddons are addons TREK has',
  run: (c) => {
    const addons = arr(c.manifest?.requiredAddons);
    if (!addons.length) return skip();
    const unknown = addons.filter((a) => !KNOWN_ADDONS.includes(a));
    return unknown.length
      ? fail(
          unknown.join(', '),
          `Not necessarily wrong — you may be targeting a newer TREK than this SDK knows about — but an addon\nTREK does not have can never be enabled, so the plugin would never activate. Known: ${KNOWN_ADDONS.join(', ')}.`,
        )
      : pass(addons.join(', '));
  },
};

const manifestNoEmoji: OfflineCheck = {
  id: 'manifest.no-emoji',
  stage: 'manifest',
  depth: 'offline',
  severity: 'warn',
  title: 'No emojis in name/description',
  run: (c) => {
    if (!c.manifest) return skip();
    const EMOJI_RE = /[\p{Extended_Pictographic}\u{1F1E6}-\u{1F1FF}]/u;
    const hit = EMOJI_RE.test(str(c.manifest.name)) || EMOJI_RE.test(str(c.manifest.description));
    return hit
      ? fail(
          'name/description contains emojis',
          'TREK renders with lucide icons and STRIPS emojis from plugin-rendered text and notifications, so they\n' +
            'simply vanish at render. Use the `icon` field with a lucide name instead.',
        )
      : pass();
  },
};

// ── code ────────────────────────────────────────────────────────────────────────

const codeServerEntry: OfflineCheck = {
  id: 'code.server-entry',
  blocks: 'artifact',
  stage: 'code',
  depth: 'offline',
  severity: 'error',
  title: 'server/index.js exists',
  run: (c) =>
    c.exists('server/index.js')
      ? pass()
      : fail(
          'server/index.js is missing',
          'Every plugin — even a pure-UI one — is loaded from server/index.js via definePlugin(). If you build from\nTypeScript, build before packing.',
        ),
};

/**
 * The egress trap, and the reason this check exists at all.
 *
 * The manifest has TWO places that look like they control network access, and only one of them
 * does. `spawnActivated` (server plugin-runtime.service.ts) builds the child's allow-list purely
 * from `http:outbound:<host>` PERMISSIONS, and the iframe CSP's connect-src comes from the same
 * place. The manifest's `egress[]` array is never read at runtime at all — it is a declaration
 * for the consent screen.
 *
 * So a plugin with `egress: ["api.example.com"]` and permission `http:outbound` — no host suffix
 * — installs, activates, consents, and is then SILENTLY BLOCKED from the one host it exists to
 * call. Nothing in the manifest validator, the packer or the registry catches it. The author
 * finds out from a production timeout.
 */
const codeEgressReachable: OfflineCheck = {
  id: 'code.egress-reachable',
  stage: 'code',
  depth: 'offline',
  severity: 'error',
  title: 'Every egress host has a matching http:outbound:<host> permission',
  run: (c) => {
    if (!c.manifest) return skip();
    const egress = arr(c.manifest.egress);
    const permissions = arr(c.manifest.permissions);
    if (!egress.length) return skip();

    const granted = grantedHosts(permissions);
    const unreachable = egress.filter((h) => !granted.includes(h));
    if (!unreachable.length) return pass(`${egress.length} host${egress.length === 1 ? '' : 's'}`);

    return fail(
      unreachable.join(', '),
      'TREK opens the network guard and the iframe CSP from the `http:outbound:<host>` PERMISSIONS only — it never\n' +
        'reads egress[]. These hosts are declared but unreachable: the plugin will install, activate, and then have\n' +
        'every request to them silently blocked.\n' +
        'Add to permissions: ' + unreachable.map((h) => `"http:outbound:${h}"`).join(', '),
    );
  },
};

const codeEgressDeclared: OfflineCheck = {
  id: 'code.egress-declared',
  stage: 'code',
  depth: 'offline',
  severity: 'warn',
  title: 'Every reachable host is declared in egress[]',
  run: (c) => {
    if (!c.manifest) return skip();
    const egress = arr(c.manifest.egress);
    const granted = grantedHosts(arr(c.manifest.permissions));
    if (!granted.length) return skip();
    const undeclared = granted.filter((h) => !egress.includes(h));
    return undeclared.length
      ? fail(
          undeclared.join(', '),
          'These hosts are reachable (you granted http:outbound:<host>) but absent from egress[]. egress[] is what the\n' +
            'admin sees on the consent screen, so the plugin is understating its own network reach. Add them to egress[].',
        )
      : pass();
  },
};

const codeDesignKit: OfflineCheck = {
  id: 'code.design-kit',
  stage: 'code',
  depth: 'offline',
  severity: 'warn',
  title: 'Client UI inlines the TREK design kit',
  run: (c) => {
    if (!c.clientHtml) return skip();
    const rawSelect = /<select(?![^>]*\bdata-trek-native\b)(\s|>)/i.test(c.clientHtml);
    const usesKit = c.clientHtml.includes('<!-- trek:ui -->') || c.clientHtml.includes('data-trek-ui');
    return rawSelect && !usesKit
      ? fail(
          'a raw <select> with no design kit',
          'Native dropdowns are drawn by the OS and cannot match TREK. Add the <!-- trek:ui --> marker so selects are\n' +
            'auto-styled, or mark a field data-trek-native to opt out on purpose.',
        )
      : pass();
  },
};

// ── docs ────────────────────────────────────────────────────────────────────────
// The stage where nearly every first publish dies. All four of these are registry gates.

const docsReadmePresent: OfflineCheck = {
  id: 'docs.readme-present',
  stage: 'docs',
  depth: 'offline',
  severity: 'error',
  title: 'README.md exists',
  run: (c) => (c.readme === undefined ? fail('README.md is missing', 'The registry requires one at the repo root.') : pass()),
};

const docsReadmeSections: OfflineCheck = {
  id: 'docs.readme-sections',
  stage: 'docs',
  depth: 'offline',
  severity: 'error',
  title: 'README has all four required sections',
  run: (c) => {
    if (c.readme === undefined) return skip();
    const missing = missingSections(c.readme);
    return missing.length
      ? fail(
          `missing ${missing.map((s) => `"## ${s}"`).join(', ')}`,
          `The registry requires exactly these four headings: ${REQUIRED_SECTIONS.map((s) => `## ${s}`).join(', ')}.`,
        )
      : pass();
  },
};

const docsReadmePlaceholders: OfflineCheck = {
  id: 'docs.readme-placeholders',
  stage: 'docs',
  depth: 'offline',
  severity: 'error',
  title: 'README has no template placeholders left',
  run: (c) => {
    if (c.readme === undefined) return skip();
    const hits = placeholders(c.readme);
    return hits.length
      ? fail(
          hits.map((h) => `"${h}"`).join(', '),
          'This is scaffold text you have not replaced yet. The registry rejects it — it is the signal that a README\nwas never actually written.',
        )
      : pass();
  },
};

const docsReadmeProse: OfflineCheck = {
  id: 'docs.readme-prose',
  stage: 'docs',
  depth: 'offline',
  severity: 'error',
  title: 'README has enough written content',
  run: (c) => {
    if (c.readme === undefined) return skip();
    const n = proseLength(c.readme);
    return n < MIN_PROSE_CHARS
      ? fail(
          `${n}/${MIN_PROSE_CHARS} chars of prose`,
          'Headings, tables, code blocks, links and images do not count — the registry strips them and measures what is\n' +
            'left. It has to be sentences: what the plugin does, why someone would install it, how to set it up.',
        )
      : pass(`${n} chars`);
  },
};

/**
 * A screenshot that RESOLVES.
 *
 * The old check regexed the README for an image *link* and passed if it found one. The scaffold
 * writes `![screenshot](./docs/screenshot.png)` and never creates docs/ — so the old check passed
 * on a link to a file that does not exist, and the author learned the truth from CI, after the
 * release was immutable. Resolve the path on disk instead.
 */
const docsScreenshot: OfflineCheck = {
  id: 'docs.screenshot',
  stage: 'docs',
  depth: 'offline',
  severity: 'error',
  title: 'README screenshot resolves to a real image',
  run: (c) => {
    if (c.readme === undefined) return skip();
    const imgs = images(c.readme);
    if (!imgs.length) {
      return fail(
        'no images in the README',
        'The store card shows this image, and the registry rejects a plugin without one. Capture a 16:9 shot\n' +
          '(1600×900 is ideal — the card crops the edges) and commit it as docs/screenshot.png.',
        'trek-plugin shot',
      );
    }
    const remote = imgs.filter((u) => /^https?:\/\//.test(u));
    const local = imgs.filter((u) => !/^https?:\/\//.test(u));
    const resolved = local.filter((u) => c.exists(u.replace(/^\.?\//, '')));

    if (resolved.length) return pass(resolved[0]);
    // Nothing local resolves. A remote URL might still satisfy CI, but we cannot know offline —
    // don't claim a pass we haven't earned, and don't claim a failure we can't prove.
    if (remote.length) return pass(`${remote.length} remote image(s) — preflight verifies they resolve`);

    const missing = local.filter((u) => !c.exists(u.replace(/^\.?\//, '')));
    return fail(
      `${missing.join(', ')} ${missing.length === 1 ? 'does' : 'do'} not exist`,
      'The README links this image but the file is not there, so the store card would be a broken image and the\n' +
        'registry rejects it. Capture a 16:9 shot (1600×900 is ideal — the card crops the edges).',
      'trek-plugin shot',
    );
  },
};

const docsPermissionsExplained: OfflineCheck = {
  id: 'docs.permissions-explained',
  stage: 'docs',
  depth: 'offline',
  severity: 'error',
  title: 'Every permission is explained in the README',
  run: (c) => {
    if (c.readme === undefined || !c.manifest) return skip();
    const perms = arr(c.manifest.permissions);
    if (!perms.length) return skip();
    const undocumented = undocumentedPermissions(c.readme, perms);
    return undocumented.length
      ? fail(
          undocumented.join(', '),
          'The registry requires every permission string you request to appear verbatim in the README, so a user\n' +
            'installing your plugin can read why you need it. Add a row per permission to the "## Permissions" table.',
        )
      : pass(`${perms.length} permission${perms.length === 1 ? '' : 's'}`);
  },
};

// ── release ─────────────────────────────────────────────────────────────────────
// These need an artifact or an entry, so they skip on the plain `status` path.

const releaseNoNativeBinaries: OfflineCheck = {
  id: 'release.no-native-binaries',
  blocks: 'artifact',
  stage: 'release',
  depth: 'offline',
  severity: 'error',
  title: 'Artifact contains no native binaries',
  run: (c) => {
    if (!c.zipBytes) return skip();
    let names: string[] = [];
    try {
      names = listZipNames(c.zipBytes);
    } catch {
      return fail('could not read the artifact as a zip');
    }
    const native = names.filter((n) => NATIVE_RE.test(n));
    return native.length
      ? fail(
          native.slice(0, 5).join(', '),
          'Native modules (.node / binding.gyp / prebuilds) are forbidden in v1 — TREK runs plugins under Node\'s\n' +
            'permission model in a child process and cannot sandbox native code.',
        )
      : pass(`${names.length} files`);
  },
};

/**
 * Manifest ↔ entry parity, offline.
 *
 * The registry re-derives the manifest from the pinned commit and refuses any entry that
 * disagrees with it. When `entry.ts` builds the entry this is true by construction — but not on
 * the `--merge` or `preflight --entry <file>` paths, where the entry can be hand-edited. And it
 * was NOT true by construction until recently: buildEntry silently omitted requiredAddons and
 * pluginDependencies, so any plugin that actually used one produced an entry CI would reject.
 */
const releaseEntryParity: OfflineCheck = {
  id: 'release.entry-parity',
  stage: 'release',
  depth: 'offline',
  severity: 'error',
  title: 'Registry entry matches the manifest',
  run: (c) => {
    if (!c.entry || !c.manifest) return skip();
    const m = c.manifest;
    const v = c.entry.versions[0];
    if (!v) return fail('entry has no versions');

    const problems: string[] = [];
    if (str(m.id) !== c.entry.id) problems.push(`• manifest id "${str(m.id)}" != entry id "${c.entry.id}"`);
    if (str(m.version) !== v.version) problems.push(`• manifest version "${str(m.version)}" != entry version "${v.version}"`);
    if (str(m.type) !== c.entry.type) problems.push(`• manifest type "${str(m.type)}" != entry type "${c.entry.type}"`);
    const mApi = typeof m.apiVersion === 'number' ? m.apiVersion : 1;
    if (mApi !== v.apiVersion) problems.push(`• manifest apiVersion ${mApi} != entry ${v.apiVersion}`);
    if (str(m.trek) !== v.trek) problems.push(`• manifest trek "${str(m.trek)}" != entry trek "${v.trek}"`);
    if ((m.operatorEgress === true) !== (v.operatorEgress === true)) {
      problems.push(`• manifest operatorEgress ${m.operatorEgress === true} != entry ${v.operatorEgress === true}`);
    }

    const normAddons = (a: unknown) => [...arr(a)].sort();
    if (JSON.stringify(normAddons(m.requiredAddons)) !== JSON.stringify(normAddons(v.requiredAddons))) {
      problems.push(`• manifest requiredAddons [${normAddons(m.requiredAddons)}] != entry [${normAddons(v.requiredAddons)}]`);
    }
    const normDeps = (d: unknown) =>
      (Array.isArray(d) ? d.map((x) => `${(x as { id?: string })?.id}@${(x as { version?: string })?.version}`).sort() : []);
    if (JSON.stringify(normDeps(m.pluginDependencies)) !== JSON.stringify(normDeps(v.pluginDependencies))) {
      problems.push(`• manifest pluginDependencies [${normDeps(m.pluginDependencies)}] != entry [${normDeps(v.pluginDependencies)}]`);
    }

    return problems.length
      ? fail(
          `${problems.length} mismatch${problems.length === 1 ? '' : 'es'}`,
          problems.join('\n') +
            '\nThe registry re-reads your manifest at the pinned commit and refuses an entry that disagrees with it.',
        )
      : pass();
  },
};

const releaseArtifactHash: OfflineCheck = {
  id: 'release.artifact-hash',
  stage: 'release',
  depth: 'offline',
  severity: 'error',
  title: 'Entry sha256/size match the packed artifact',
  run: (c) => {
    if (!c.zipBytes || !c.entry) return skip();
    const v = c.entry.versions[0];
    if (!v) return skip();
    const sha = createHash('sha256').update(c.zipBytes).digest('hex');
    const problems: string[] = [];
    if (sha !== v.sha256) problems.push(`• artifact sha256 ${sha.slice(0, 12)}… != entry ${v.sha256.slice(0, 12)}…`);
    if (c.zipBytes.length !== v.size) problems.push(`• artifact is ${c.zipBytes.length}B, entry declares ${v.size}B`);
    return problems.length
      ? fail(
          `${problems.length} mismatch${problems.length === 1 ? '' : 'es'}`,
          problems.join('\n') + '\nThe entry was built from different bytes than the artifact on disk — re-pack, then rebuild the entry.',
        )
      : pass();
  },
};

/**
 * A key without a signature, or a signature without a key.
 *
 * Passes the registry's JSON schema — the two fields sit at different levels, so no schema can
 * relate them — and is then REFUSED by TREK at install time. A half-signed entry is dead on
 * arrival, and it is a pure function of the entry, so there is no reason to wait for the network
 * to say so.
 */
const releaseSignatureShape: OfflineCheck = {
  id: 'release.signature-shape',
  stage: 'release',
  depth: 'offline',
  severity: 'error',
  title: 'Signature and public key are both present or both absent',
  run: (c) => {
    if (!c.entry) return skip();
    const problems = checkSignatureShape(c.entry);
    return problems.length
      ? fail(
          `${problems.length} problem${problems.length === 1 ? '' : 's'}`,
          problems.map((p) => '• ' + p).join('\n') + '\nTREK refuses to install a half-signed entry, so this one could never be installed.',
        )
      : pass(c.entry.authorPublicKey ? 'signed' : 'unsigned');
  },
};

/** Every offline check, in the order `status` prints them. */
export const OFFLINE_CHECKS: OfflineCheck[] = [
  manifestPresent,
  manifestValid,
  manifestEntryFields,
  manifestIcon,
  manifestTrekRange,
  manifestIdMatchesDir,
  manifestAddonsKnown,
  manifestNoEmoji,
  codeServerEntry,
  codeEgressReachable,
  codeEgressDeclared,
  codeDesignKit,
  docsReadmePresent,
  docsReadmeSections,
  docsReadmePlaceholders,
  docsReadmeProse,
  docsScreenshot,
  docsPermissionsExplained,
  releaseSignatureShape,
  releaseNoNativeBinaries,
  releaseEntryParity,
  releaseArtifactHash,
];

export type { CheckContext };
