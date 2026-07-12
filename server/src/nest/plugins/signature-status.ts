import { db } from '../../db/database';

/**
 * Signature/trust status shared between the registry installer, the read-side
 * plugin service and the admin controller (#plugins).
 *
 * TREK verifies an author's Ed25519 signature and TOFU-pins the key on first
 * install, but until now none of that was ever surfaced: a successfully-installed
 * UNSIGNED plugin looked identical to a signed one, and a signature-refused update
 * left the plugin quietly pinned at its old version with the reason in a toast.
 * These helpers give the four failure conditions machine-readable codes and
 * persist the refusal so the admin list can keep showing it.
 */

/**
 * Machine-readable reason a signature check refused an install.
 *
 * Only SIGNATURE_KEY_CHANGED is overridable (an author can legitimately rotate a
 * key). The other three mean the bytes are not what the author signed — there is
 * no story where waving that through is the right answer, so no override exists
 * for them, not even a disabled one.
 */
export type SignatureCode =
  | 'SIGNATURE_MISSING'
  | 'SIGNATURE_INCOMPLETE'
  | 'SIGNATURE_KEY_CHANGED'
  | 'SIGNATURE_INVALID';

/** The one code an admin may override, via POST /api/admin/plugins/:id/retrust. */
export const RETRUSTABLE_CODE: SignatureCode = 'SIGNATURE_KEY_CHANGED';

export function isSignatureCode(code: string | undefined): code is SignatureCode {
  return (
    code === 'SIGNATURE_MISSING' ||
    code === 'SIGNATURE_INCOMPLETE' ||
    code === 'SIGNATURE_KEY_CHANGED' ||
    code === 'SIGNATURE_INVALID'
  );
}

/**
 * A short, human-comparable form of a minisign/base64 public key — the thing an
 * admin reads out to the author over the phone to confirm a rotation ("pinned
 * A1b2c3d4…w7x8y9z0, new …"). Display only: the re-trust round-trip carries the
 * FULL key, because a truncated fingerprint is a weak equality check. There is
 * nothing secret about either — it is a public key.
 */
export function keyFingerprint(pubkey: string | null | undefined): string | null {
  if (!pubkey) return null;
  const payload = pubkey
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('untrusted comment'))
    .pop();
  if (!payload) return null;
  return payload.length <= 20 ? payload : `${payload.slice(0, 8)}…${payload.slice(-8)}`;
}

/**
 * Remember WHY an update was refused, so the Installed row can keep saying so
 * instead of making the admin re-attempt the update to rediscover the reason.
 * `version` is the registry version that was refused — the block is treated as
 * stale (and the admin can just re-attempt) once the registry offers a newer one.
 *
 * Deliberately does NOT touch `status`: the plugin is still running fine on its
 * old code. A blocked update is not a broken runtime, and conflating them would
 * make the isolation-health dot lie.
 */
export function setUpdateBlock(id: string, code: SignatureCode, detail: string, version: string | null): void {
  try {
    db.prepare('UPDATE plugins SET update_block_code = ?, update_block_detail = ?, update_block_version = ? WHERE id = ?').run(
      code,
      detail,
      version,
      id,
    );
  } catch {
    // Columns absent (a slimmed test app) — the block is a nicety, never a gate.
  }
}

/** Clear a recorded block. Called on a successful install/update — NOT on activate:
 * activating the plugin at its OLD version resolves nothing, and letting an off/on
 * toggle erase the warning is exactly the silent-stops-updating failure this exists
 * to prevent. (Uninstall drops the row entirely, so it needs no explicit clear.) */
export function clearUpdateBlock(id: string): void {
  try {
    db.prepare('UPDATE plugins SET update_block_code = NULL, update_block_detail = NULL, update_block_version = NULL WHERE id = ?').run(id);
  } catch {
    // See setUpdateBlock.
  }
}
