/**
 * Retro-signing: the missing half of "you can start signing late".
 *
 * Server-side, adding a key at v1.4.0 breaks nobody — TREK pins the key only when a signed
 * version installs. But the REGISTRY refuses a mixed entry (key present, older versions
 * unsigned), and for good reason: once an instance pins your key, it refuses the unsigned
 * older versions, and "install latest compatible" can legitimately resolve an older host to
 * one of them. So every version must be signed the moment a key appears — which used to mean
 * downloading each old artifact and signing it by hand.
 *
 * This does that tedious part: for each unsigned version it downloads the pinned artifact,
 * verifies the bytes still hash to the entry's pinned sha256 (a mismatch means the release
 * asset was changed — a far bigger problem than signing), and signs those exact bytes.
 */
import { createHash } from 'node:crypto';
import { loadPrivateKey, publicKeyBase64, signArtifact } from './sign.js';

export interface RetroSignableEntry {
  id?: string;
  authorPublicKey?: string;
  versions: Array<{ version: string; downloadUrl: string; sha256: string; signature?: string }>;
}

/** True when the entry carries a key but not a signature on every version. */
export function needsRetroSign(entry: RetroSignableEntry): boolean {
  return !!entry.authorPublicKey && entry.versions.some((v) => !v.signature);
}

/**
 * Sign every unsigned version in place with the key at `keyPath`. Returns the versions it
 * signed. Throws — without half-signing the entry — when the key doesn't match the entry's
 * `authorPublicKey`, or when any artifact can't be fetched or no longer matches its pin.
 */
export async function retroSignVersions(
  entry: RetroSignableEntry,
  keyPath: string,
  log: (line: string) => void = () => {},
): Promise<string[]> {
  if (!needsRetroSign(entry)) return [];

  const key = loadPrivateKey(keyPath);
  if (publicKeyBase64(key) !== entry.authorPublicKey) {
    throw new Error(
      'this signing key differs from the entry\'s authorPublicKey — retro-signing older versions with it would produce signatures TREK rejects. Use the original key.',
    );
  }

  const unsigned = entry.versions.filter((v) => !v.signature);
  const signatures = new Map<string, string>();
  const failures: string[] = [];
  for (const v of unsigned) {
    try {
      const r = await fetch(v.downloadUrl, { headers: { 'User-Agent': 'trek-plugin' } });
      if (!r.ok) { failures.push(`v${v.version}: HTTP ${r.status} fetching ${v.downloadUrl}`); continue; }
      const bytes = Buffer.from(await r.arrayBuffer());
      const hash = createHash('sha256').update(bytes).digest('hex');
      if (hash !== v.sha256) {
        failures.push(`v${v.version}: the release asset no longer hashes to its pinned sha256 (got ${hash.slice(0, 12)}…, pinned ${v.sha256.slice(0, 12)}…) — the artifact was changed after publishing, which is a bigger problem than signing`);
        continue;
      }
      signatures.set(v.version, signArtifact(bytes, key));
    } catch (e) {
      failures.push(`v${v.version}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  if (failures.length) {
    throw new Error(
      `could not retro-sign ${failures.length} older version(s) — the registry requires every version signed once a key is present:\n` +
      failures.map((f) => `  ✗ ${f}`).join('\n') +
      '\n\nNothing was signed. Fix the artifacts above (or remove those versions from the entry) and re-run.',
    );
  }

  // All-or-nothing: only mutate the entry once every artifact verified and signed.
  for (const v of unsigned) {
    v.signature = signatures.get(v.version)!;
    log(`      ✓ retro-signed v${v.version}`);
  }
  return unsigned.map((v) => v.version);
}
