/**
 * The four things that genuinely cannot be known from the working tree.
 *
 * Everything else the registry enforces lives in ./offline.ts and fires before you have pushed
 * anything. What is left here needs GitHub or the registry repo to answer:
 *
 *   1. does the tag exist, and does it point at the commit the entry pins?
 *   2. do the released artifact's bytes hash to the sha256 the entry pins — and do they verify
 *      against the author's key?
 *   3. is this plugin id already bound to a different GitHub owner?
 *   4. was this plugin published SIGNED before, and is this update about to drop or rotate the key?
 *
 * (3) and (4) are new. The registry has always enforced them and `preflight` never did, which
 * made a green preflight a promise it could not keep: a signing downgrade merges nowhere and
 * BRICKS THE UPDATE for every instance that already has the plugin, and the author would only
 * find out at review. See scripts/validate-entry.mjs, "signing-downgrade guard".
 *
 * The manifest and README are ALSO re-graded here, at the pinned commit rather than in the tree.
 * That is not redundant with the offline pass: an author who fills the README in and forgets to
 * commit it has a green tree and a red tag, and the tag is what CI grades.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { listZipNames } from '../../zip.js';
import { verifyAuthorSignature, checkSignatureShape, SignatureError } from '../verify-signature.js';
import type { NetworkCheck, CheckContext, RegistryEntry, RegistryEntryVersion } from './types.js';
import { pass, fail, skip } from './types.js';
import { REQUIRED_SECTIONS, MIN_PROSE_CHARS, missingSections, placeholders, proseLength, images, undocumentedPermissions } from './readme.js';

export const DEFAULT_REGISTRY = 'liketrek/TREK-Plugins';

const NATIVE_RE = /(^|\/)[^/]+\.node$|(^|\/)binding\.gyp$|(^|\/)prebuilds?\//i;

/** A GitHub token lifts the anonymous API rate limit. `gh` already has one; borrow it. */
function ghToken(): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || undefined;
  } catch {
    return undefined;
  }
}

function ghHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'User-Agent': 'trek-plugin-preflight', Accept: 'application/vnd.github+json' };
  const t = ghToken();
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

const rawUrl = (repo: string, sha: string, p: string): string =>
  `https://raw.githubusercontent.com/${repo}/${sha}/${p.replace(/^\.?\//, '')}`;

/** The versions a network check grades: the newest by default, all of them with --all. */
function targetVersions(c: CheckContext): RegistryEntryVersion[] {
  const vs = c.entry?.versions ?? [];
  return c.allVersions ? vs : vs.slice(0, 1);
}

async function fetchText(url: string, headers: Record<string, string> = { 'User-Agent': 'trek-plugin-preflight' }): Promise<string | null> {
  try {
    const r = await fetch(url, { headers });
    return r.ok ? await r.text() : null;
  } catch {
    return null;
  }
}

// ── 1. the tag resolves to the pinned commit ────────────────────────────────────

const tagResolves: NetworkCheck = {
  id: 'network.tag-resolves',
  stage: 'release',
  depth: 'network',
  severity: 'error',
  title: 'Git tag exists and points at the pinned commit',
  run: async (c) => {
    if (!c.entry) return skip();
    const problems: string[] = [];
    for (const v of targetVersions(c)) {
      try {
        const r = await fetch(
          `https://api.github.com/repos/${c.entry.repo}/git/refs/tags/${encodeURIComponent(v.gitTag)}`,
          { headers: ghHeaders() },
        );
        if (!r.ok) {
          problems.push(`• ${v.version}: tag ${v.gitTag} not found on ${c.entry.repo} (${r.status}) — push the tag and cut the release`);
          continue;
        }
        const ref = (await r.json()) as { object?: { sha?: string; type?: string } };
        let sha = ref.object?.sha;
        // An annotated tag's ref points at the TAG object, not the commit — deref it, or every
        // annotated tag looks like a mismatch.
        if (ref.object?.type === 'tag' && sha) {
          const tr = await fetch(`https://api.github.com/repos/${c.entry.repo}/git/tags/${sha}`, { headers: ghHeaders() });
          if (tr.ok) sha = ((await tr.json()) as { object?: { sha?: string } }).object?.sha;
        }
        if (sha && sha !== v.commitSha) {
          problems.push(`• ${v.version}: tag ${v.gitTag} points at ${sha.slice(0, 8)}, entry pins ${v.commitSha.slice(0, 8)}`);
        }
      } catch (e) {
        problems.push(`• ${v.version}: tag check failed: ${(e as Error).message}`);
      }
    }
    return problems.length ? fail(`${problems.length} problem(s)`, problems.join('\n')) : pass();
  },
};

// ── 2. the manifest at the pinned commit matches the entry ──────────────────────

const manifestAtCommit: NetworkCheck = {
  id: 'network.manifest-at-commit',
  stage: 'release',
  depth: 'network',
  severity: 'error',
  title: 'Manifest at the pinned commit matches the entry',
  run: async (c) => {
    if (!c.entry) return skip();
    const problems: string[] = [];
    for (const v of targetVersions(c)) {
      const text = await fetchText(rawUrl(c.entry.repo, v.commitSha, 'trek-plugin.json'));
      if (text === null) {
        problems.push(`• ${v.version}: trek-plugin.json not found at ${v.commitSha.slice(0, 8)} — did you push your code?`);
        continue;
      }
      let m: Record<string, unknown>;
      try {
        m = JSON.parse(text) as Record<string, unknown>;
      } catch (e) {
        problems.push(`• ${v.version}: trek-plugin.json at ${v.commitSha.slice(0, 8)} is not valid JSON: ${(e as Error).message}`);
        continue;
      }
      const p = (msg: string) => problems.push(`• ${v.version}: ${msg}`);
      if (m.id !== c.entry.id) p(`manifest id "${String(m.id)}" != entry id "${c.entry.id}"`);
      if (m.version !== v.version) p(`manifest version "${String(m.version)}" != entry "${v.version}"`);
      if (m.type !== c.entry.type) p(`manifest type "${String(m.type)}" != entry "${c.entry.type}"`);
      const mApi = typeof m.apiVersion === 'number' ? m.apiVersion : 1;
      if (mApi !== v.apiVersion) p(`manifest apiVersion ${mApi} != entry ${v.apiVersion}`);
      if (m.nativeModules === true) p('manifest declares nativeModules:true (forbidden in v1)');
      if (typeof m.trek === 'string' && m.trek.trim() !== v.trek) p(`manifest trek "${m.trek.trim()}" != entry trek "${v.trek}"`);
      if ((m.operatorEgress === true) !== (v.operatorEgress === true)) {
        p(`manifest operatorEgress ${m.operatorEgress === true} != entry ${v.operatorEgress === true}`);
      }
      const normAddons = (a: unknown) => (Array.isArray(a) ? [...a].map(String).sort() : []);
      if (JSON.stringify(normAddons(m.requiredAddons)) !== JSON.stringify(normAddons(v.requiredAddons))) {
        p('manifest requiredAddons != entry requiredAddons');
      }
      const normDeps = (d: unknown) =>
        (Array.isArray(d) ? d.map((x) => `${(x as { id?: string })?.id}@${(x as { version?: string })?.version}`).sort() : []);
      if (JSON.stringify(normDeps(m.pluginDependencies)) !== JSON.stringify(normDeps(v.pluginDependencies))) {
        p('manifest pluginDependencies != entry pluginDependencies');
      }
    }
    return problems.length ? fail(`${problems.length} problem(s)`, problems.join('\n')) : pass();
  },
};

// ── 3. the released artifact ────────────────────────────────────────────────────

const artifactMatches: NetworkCheck = {
  id: 'network.artifact',
  stage: 'release',
  depth: 'network',
  severity: 'error',
  title: 'Released artifact downloads, hashes and verifies',
  run: async (c) => {
    if (!c.entry) return skip();
    const problems: string[] = [];
    for (const v of targetVersions(c)) {
      let bytes: Buffer;
      try {
        const r = await fetch(v.downloadUrl, { redirect: 'follow', headers: { 'User-Agent': 'trek-plugin-preflight' } });
        if (!r.ok) {
          problems.push(`• ${v.version}: artifact download failed (${r.status}) ${v.downloadUrl}`);
          continue;
        }
        bytes = Buffer.from(await r.arrayBuffer());
      } catch (e) {
        problems.push(`• ${v.version}: artifact download failed: ${(e as Error).message}`);
        continue;
      }

      // 4096B of slack mirrors the registry: GitHub can pad a release asset slightly.
      if (bytes.length > v.size + 4096) problems.push(`• ${v.version}: artifact is ${bytes.length}B, entry declares ${v.size}B`);
      const sha = createHash('sha256').update(bytes).digest('hex');
      if (sha !== v.sha256) {
        problems.push(
          `• ${v.version}: sha256 mismatch — the release has ${sha.slice(0, 12)}…, the entry pins ${v.sha256.slice(0, 12)}…\n` +
            '  (did you re-pack after building the entry? the entry must be built from the EXACT bytes you uploaded)',
        );
      }

      // The signature proves the bytes came from the AUTHOR's key; the sha256 only proves they
      // are what the registry vouches for. TREK verifies this again at install and aborts on a
      // mismatch, so a bad signature merged here is an entry nobody can install.
      if (v.signature && c.entry.authorPublicKey) {
        try {
          if (!verifyAuthorSignature(bytes, v.signature, c.entry.authorPublicKey)) {
            problems.push(`• ${v.version}: author signature does not verify — signed with a different key, or re-packed after signing?`);
          }
        } catch (e) {
          if (e instanceof SignatureError) problems.push(`• ${v.version}: signature/key is malformed: ${e.message}`);
          else throw e;
        }
      }

      try {
        const names = bytes[0] === 0x50 && bytes[1] === 0x4b ? listZipNames(bytes) : [];
        if (names.some((n) => NATIVE_RE.test(n))) {
          problems.push(`• ${v.version}: artifact contains native binaries (.node / binding.gyp / prebuilds) — forbidden in v1`);
        }
      } catch {
        /* not a zip we can read — the sha check above already speaks to the bytes */
      }
    }
    return problems.length ? fail(`${problems.length} problem(s)`, problems.join('\n')) : pass();
  },
};

// ── 4. the README at the pinned commit ──────────────────────────────────────────

const readmeAtCommit: NetworkCheck = {
  id: 'network.readme-at-commit',
  stage: 'release',
  depth: 'network',
  severity: 'error',
  title: 'README at the pinned commit passes the registry gate',
  run: async (c) => {
    if (!c.entry) return skip();
    const v = c.entry.versions[0];
    if (!v) return skip();

    const md = await fetchText(rawUrl(c.entry.repo, v.commitSha, 'README.md'));
    if (md === null) {
      return fail(
        `README.md not found at ${v.commitSha.slice(0, 8)}`,
        'The registry reads the README at the COMMIT, not from your working tree. Commit and push it.',
      );
    }

    const problems: string[] = [];
    for (const s of missingSections(md)) problems.push(`• missing required section "## ${s}"`);
    for (const p of placeholders(md)) problems.push(`• template placeholder still present: "${p}"`);
    const n = proseLength(md);
    if (n < MIN_PROSE_CHARS) problems.push(`• only ${n}/${MIN_PROSE_CHARS} chars of prose`);

    // Resolve every image against the pinned commit. A relative path that exists in your tree
    // but was never committed 404s here — which is exactly the failure this catches.
    const imgs = images(md);
    if (!imgs.length) problems.push('• no screenshot (the registry requires at least one real image)');
    else {
      let anyOk = false;
      const reasons: string[] = [];
      for (const src of imgs) {
        const url = /^https?:\/\//.test(src)
          ? src.includes('github.com') && src.includes('/blob/')
            ? src.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/')
            : src
          : rawUrl(c.entry.repo, v.commitSha, src);
        try {
          const r = await fetch(url, { headers: { 'User-Agent': 'trek-plugin-preflight', Range: 'bytes=0-2047' } });
          const ct = r.headers.get('content-type') || '';
          if (r.ok && ct.startsWith('image/')) {
            anyOk = true;
            break;
          }
          reasons.push(`${src} → ${r.status} ${ct || 'no content-type'}`);
        } catch {
          reasons.push(`${src} → unreachable`);
        }
      }
      if (!anyOk) problems.push('• no screenshot resolved to a real image:\n  ' + reasons.join('\n  '));
    }

    // Permission parity, against the manifest AT THE COMMIT (not the tree — they can differ).
    const manifestText = await fetchText(rawUrl(c.entry.repo, v.commitSha, 'trek-plugin.json'));
    if (manifestText) {
      try {
        const m = JSON.parse(manifestText) as { permissions?: unknown };
        const perms = Array.isArray(m.permissions) ? m.permissions.map(String) : [];
        const undoc = undocumentedPermissions(md, perms);
        if (undoc.length) problems.push(`• permissions not explained in the README: ${undoc.join(', ')}`);
      } catch {
        /* manifest-at-commit already reports a broken manifest */
      }
    }

    return problems.length
      ? fail(
          `${problems.length} problem(s) at ${v.commitSha.slice(0, 8)}`,
          problems.join('\n') +
            `\nThese are graded at the pinned commit. If your working tree looks fine, you have uncommitted changes —\ncommit, push, and re-tag.\nRequired sections: ${REQUIRED_SECTIONS.map((s) => `## ${s}`).join(', ')}.`,
        )
      : pass();
  },
};

// ── 5. owner binding (NEW — the registry has always enforced this) ───────────────

const ownerBinding: NetworkCheck = {
  id: 'network.owner-binding',
  stage: 'release',
  depth: 'network',
  severity: 'error',
  title: 'Plugin id is not bound to another GitHub owner',
  run: async (c) => {
    if (!c.entry) return skip();
    const registry = c.registry ?? DEFAULT_REGISTRY;
    const text = await fetchText(rawUrl(registry, 'main', 'OWNERS.json'));
    if (text === null) return skip('could not read OWNERS.json — the registry will still check this');
    let owners: { plugins?: Record<string, { boundOwner?: string }> };
    try {
      owners = JSON.parse(text) as typeof owners;
    } catch {
      return skip('OWNERS.json is unreadable — the registry will still check this');
    }
    const bound = owners.plugins?.[c.entry.id]?.boundOwner;
    if (!bound) return pass('unclaimed id — it binds to you on merge');
    const mine = c.entry.repo.split('/')[0];
    return bound === mine
      ? pass(`bound to ${bound}`)
      : fail(
          `"${c.entry.id}" is bound to "${bound}", your repo is "${mine}"`,
          'The registry binds a plugin id to the GitHub owner who first published it, so nobody can hijack an id.\n' +
            'Either pick a different id, or ask a maintainer for the allow-owner-change label if this is a genuine transfer.',
        );
  },
};

// ── 6. signing-downgrade guard (NEW — a green here used to hide a bricked update) ─

const signingDowngrade: NetworkCheck = {
  id: 'network.signing-downgrade',
  stage: 'release',
  depth: 'network',
  severity: 'error',
  title: 'Update does not drop or rotate a published signing key',
  run: async (c) => {
    if (!c.entry) return skip();
    const registry = c.registry ?? DEFAULT_REGISTRY;
    const text = await fetchText(rawUrl(registry, 'main', `registry/plugins/${c.entry.id}.json`));
    if (text === null) return pass('not published yet — nothing to downgrade from');
    let published: RegistryEntry;
    try {
      published = JSON.parse(text) as RegistryEntry;
    } catch {
      return skip('published entry is unreadable');
    }
    if (!published.authorPublicKey) return pass('previously published unsigned');

    // TREK pins the author key on FIRST INSTALL (trust on first use). Once a plugin has shipped
    // signed, an unsigned update — or one signed with a different key — is REFUSED on every
    // instance that already has it. Merging that would not just fail; it would strand every
    // existing user on the version they have.
    const problems: string[] = [];
    if (!c.entry.authorPublicKey) {
      problems.push(
        '• this plugin was published SIGNED, but this entry has no authorPublicKey.\n' +
          '  TREK refuses an unsigned update to a signed plugin — it would break the update for every existing install.\n' +
          '  Sign it: pass --sign (your key should be at ~/.trek-plugin/signing.key).',
      );
    } else if (c.entry.authorPublicKey !== published.authorPublicKey) {
      problems.push(
        '• this entry changes authorPublicKey. TREK refuses a key rotation until an admin re-trusts the plugin.\n' +
          '  Sign with your ORIGINAL key, or ask a maintainer for the allow-key-change label.',
      );
    } else {
      // Every version must stay signed, not just the newest — TREK verifies whichever version it
      // installs, so an unsigned older block is a landmine for a pinned install.
      for (const v of c.entry.versions) {
        if (!v.signature) problems.push(`• ${v.version} has no signature, but this is a signed plugin — TREK will refuse to install it`);
      }
    }
    return problems.length ? fail(`${problems.length} problem(s)`, problems.join('\n')) : pass('signed with the published key');
  },
};

/** Every network check, in the order `preflight` runs them. */
export const NETWORK_CHECKS: NetworkCheck[] = [
  tagResolves,
  manifestAtCommit,
  artifactMatches,
  readmeAtCommit,
  ownerBinding,
  signingDowngrade,
];
