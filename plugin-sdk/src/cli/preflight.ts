/**
 * trek-plugin preflight — run the registry CI checks locally, over the network,
 * BEFORE you open a PR. It mirrors TREK-Plugins' validate-entry.mjs (tag→commit,
 * manifest parity, artifact sha256/size, native-binary scan) and check-readme.mjs
 * (required sections, real prose, a resolving screenshot, permission parity), so
 * you catch what CI would reject without a round-trip through review.
 *
 * Dependency-free: global fetch + Node built-ins + our own zip reader.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { listZipNames } from '../zip.js';

const REQUIRED_HEADINGS = ['what it does', 'screenshots', 'permissions', 'setup'];
const PLACEHOLDER_RE = [/\{\{[^}]*\}\}/, /\bREPLACE_ME\b/i, /\bDescribe (what|the)\b/i, /\byour-name\/trek-plugin/i];
const MIN_PROSE = 400;
const NATIVE_RE = /(^|\/)[^/]+\.node$|(^|\/)binding\.gyp$|(^|\/)prebuilds?\//i;

export interface EntryVersion {
  version: string; gitTag: string; commitSha: string; downloadUrl: string;
  sha256: string; size: number; apiVersion: number; nativeModules?: boolean; operatorEgress?: boolean; signature?: string;
}
export interface Entry {
  id: string; name: string; type: string; repo: string; authorPublicKey?: string; versions: EntryVersion[];
}
export interface PreflightReport { ok: boolean; failures: string[]; passed: string[]; }

function ghToken(): string | undefined {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try { return execFileSync('gh', ['auth', 'token'], { encoding: 'utf8' }).trim() || undefined; } catch { return undefined; }
}

function raw(repo: string, sha: string, p: string): string {
  return `https://raw.githubusercontent.com/${repo}/${sha}/${p.replace(/^\.?\//, '')}`;
}

export async function preflight(entry: Entry, opts: { all?: boolean } = {}): Promise<PreflightReport> {
  const failures: string[] = [];
  const passed: string[] = [];
  const fail = (m: string) => failures.push(m);
  const ok = (m: string) => passed.push(m);

  const token = ghToken();
  const ghHeaders: Record<string, string> = { 'User-Agent': 'trek-plugin-preflight', Accept: 'application/vnd.github+json' };
  if (token) ghHeaders.Authorization = `Bearer ${token}`;

  // Structural checks that mirror the registry schema (fast, offline).
  if (!/^[a-z][a-z0-9-]{2,39}$/.test(entry.id)) fail(`id "${entry.id}" is not a valid slug (^[a-z][a-z0-9-]{2,39}$)`);
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(entry.repo)) fail(`repo "${entry.repo}" is not "owner/name"`);
  if (!['integration', 'page', 'widget', 'trip-page'].includes(entry.type)) fail(`type "${entry.type}" is not integration|page|widget|trip-page`);
  if (entry.authorPublicKey && !entry.versions[0]?.signature) fail('entry has authorPublicKey but the newest version has no signature (sign the version too)');

  const versions = opts.all ? entry.versions : entry.versions.slice(0, 1);
  for (const v of versions) {
    const tag = `${v.version}`;
    // 1. tag exists and resolves to commitSha
    try {
      const r = await fetch(`https://api.github.com/repos/${entry.repo}/git/refs/tags/${encodeURIComponent(v.gitTag)}`, { headers: ghHeaders });
      if (!r.ok) fail(`${tag}: tag ${v.gitTag} not found on GitHub (${r.status}) — push the tag and create the release`);
      else {
        const ref = (await r.json()) as { object?: { sha?: string; type?: string } };
        let sha = ref.object?.sha;
        if (ref.object?.type === 'tag' && sha) {
          const tr = await fetch(`https://api.github.com/repos/${entry.repo}/git/tags/${sha}`, { headers: ghHeaders });
          if (tr.ok) sha = ((await tr.json()) as { object?: { sha?: string } }).object?.sha;
        }
        if (sha && sha !== v.commitSha) fail(`${tag}: tag ${v.gitTag} points at ${sha.slice(0, 8)}, entry pins ${v.commitSha.slice(0, 8)}`);
        else if (sha) ok(`${tag}: tag resolves to the pinned commit`);
      }
    } catch (e) { fail(`${tag}: tag check failed: ${(e as Error).message}`); }

    // 2. manifest parity at the pinned commit (+ collect permissions for the README gate)
    let manifestPerms: string[] = [];
    try {
      const mr = await fetch(raw(entry.repo, v.commitSha, 'trek-plugin.json'), { headers: { 'User-Agent': 'trek-plugin-preflight' } });
      if (!mr.ok) fail(`${tag}: trek-plugin.json not found at ${v.commitSha.slice(0, 8)} (${mr.status})`);
      else {
        const m = JSON.parse(await mr.text()) as Record<string, unknown>;
        if (m.id !== entry.id) fail(`${tag}: manifest id "${m.id}" != entry id "${entry.id}"`);
        if (m.version !== v.version) fail(`${tag}: manifest version "${m.version}" != entry "${v.version}"`);
        if (m.type !== entry.type) fail(`${tag}: manifest type "${m.type}" != entry "${entry.type}"`);
        if (m.apiVersion !== v.apiVersion) fail(`${tag}: manifest apiVersion ${m.apiVersion} != entry ${v.apiVersion}`);
        if (m.nativeModules === true) fail(`${tag}: manifest declares nativeModules:true (forbidden)`);
        // Mirrors the registry's operatorEgress parity check (validate-entry.mjs): the entry
        // must not understate the plugin's network reach.
        const mOperatorEgress = (m as { operatorEgress?: unknown }).operatorEgress === true;
        if (mOperatorEgress !== (v.operatorEgress === true)) {
          fail(`${tag}: manifest operatorEgress ${mOperatorEgress} != entry ${v.operatorEgress === true}`);
        }
        manifestPerms = Array.isArray(m.permissions) ? (m.permissions as string[]) : [];
        if (manifestPerms.some((p) => p === 'http:outbound' || p.startsWith('http:outbound:'))) {
          const egress = Array.isArray(m.egress) ? (m.egress as string[]) : [];
          // Empty egress[] is legal only with operatorEgress (hosts are admin-supplied).
          if (!egress.length && !mOperatorEgress) {
            fail(`${tag}: http:outbound declared but egress[] is empty (set operatorEgress: true if the hosts are admin-supplied)`);
          }
          if (egress.includes('*')) fail(`${tag}: egress[] must not contain a bare "*"`);
        }
        if (!failures.some((f) => f.startsWith(`${tag}: manifest`))) ok(`${tag}: manifest at commit matches the entry`);
      }
    } catch (e) { fail(`${tag}: manifest parity failed: ${(e as Error).message}`); }

    // 3. artifact download → sha256 + size + native-binary scan
    try {
      const dr = await fetch(v.downloadUrl, { redirect: 'follow', headers: { 'User-Agent': 'trek-plugin-preflight' } });
      if (!dr.ok) fail(`${tag}: artifact download failed (${dr.status}) ${v.downloadUrl}`);
      else {
        const bytes = Buffer.from(await dr.arrayBuffer());
        if (bytes.length > v.size + 4096) fail(`${tag}: artifact (${bytes.length}B) larger than declared size (${v.size}B)`);
        const sha = createHash('sha256').update(bytes).digest('hex');
        if (sha !== v.sha256) fail(`${tag}: sha256 mismatch — release has ${sha.slice(0, 12)}…, entry pins ${v.sha256.slice(0, 12)}… (re-pack + re-upload?)`);
        else ok(`${tag}: artifact sha256 matches the release`);
        let names: string[] = [];
        try { names = bytes[0] === 0x50 && bytes[1] === 0x4b ? listZipNames(bytes) : []; } catch { /* not a zip */ }
        if (names.some((n) => NATIVE_RE.test(n))) fail(`${tag}: artifact contains native binaries (.node / binding.gyp / prebuilds)`);
      }
    } catch (e) { fail(`${tag}: artifact check failed: ${(e as Error).message}`); }

    // 4. README quality gate at the pinned commit (mirrors check-readme.mjs)
    await readmeGate(entry.repo, v.commitSha, manifestPerms, tag, fail, ok);
  }

  return { ok: failures.length === 0, failures, passed };
}

async function readmeGate(repo: string, sha: string, perms: string[], tag: string, fail: (m: string) => void, ok: (m: string) => void): Promise<void> {
  let md: string;
  try {
    const r = await fetch(raw(repo, sha, 'README.md'), { headers: { 'User-Agent': 'trek-plugin-preflight' } });
    if (!r.ok) { fail(`${tag}: README.md missing at the repo root (${r.status})`); return; }
    md = await r.text();
  } catch (e) { fail(`${tag}: README fetch failed: ${(e as Error).message}`); return; }

  const headings = [...md.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((m) => m[1].toLowerCase());
  for (const h of REQUIRED_HEADINGS) if (!headings.some((got) => got.includes(h))) fail(`${tag}: README missing required section "## ${h}"`);
  for (const re of PLACEHOLDER_RE) { const hit = md.match(re); if (hit) fail(`${tag}: README still has a template placeholder "${hit[0]}"`); }

  const prose = md
    .replace(/<!--[\s\S]*?-->/g, '').replace(/```[\s\S]*?```/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/^#{1,6}\s+.*$/gm, '').replace(/^\s*\|.*$/gm, '')
    .replace(/[#>*_`|-]/g, '').replace(/\s+/g, ' ').trim();
  if (prose.length < MIN_PROSE) fail(`${tag}: README has too little prose (${prose.length} chars, need ≥ ${MIN_PROSE})`);

  const imgs = [
    ...[...md.matchAll(/!\[[^\]]*\]\(\s*([^)\s]+)/g)].map((m) => m[1]),
    ...[...md.matchAll(/<img[^>]+src\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]),
  ].filter((u) => !u.startsWith('data:'));
  if (!imgs.length) fail(`${tag}: README has no screenshot (at least one image required)`);
  else {
    let anyOk = false;
    for (const src of [...new Set(imgs)]) {
      const url = /^https?:\/\//.test(src)
        ? (src.includes('github.com') && src.includes('/blob/') ? src.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/') : src)
        : raw(repo, sha, src);
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'trek-plugin-preflight', Range: 'bytes=0-2047' } });
        if (r.ok && (r.headers.get('content-type') || '').startsWith('image/')) { anyOk = true; break; }
      } catch { /* try next */ }
    }
    if (!anyOk) fail(`${tag}: no README screenshot resolved to a real image at the pinned commit`);
    else ok(`${tag}: README screenshot resolves`);
  }

  const lower = md.toLowerCase();
  const undocumented = perms.filter((p) => !lower.includes(p.toLowerCase()));
  if (undocumented.length) fail(`${tag}: permissions not explained in the README: ${undocumented.join(', ')}`);
  else if (perms.length) ok(`${tag}: all permissions documented`);
}
