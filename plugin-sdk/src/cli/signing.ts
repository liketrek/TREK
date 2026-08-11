/**
 * Signing, proposed rather than buried.
 *
 * `keygen` lived under "Advanced…" in the menu and `--sign` was a flag you had to already know
 * about, so the default path — the one almost everyone takes — shipped unsigned, and nothing
 * anywhere mentioned that signing existed. That is the wrong default to arrive at by accident,
 * because of what signing actually means (server registry.service.ts, verifySignatureAndTofu):
 *
 *   - Unsigned throughout is fine. The sha256 pin is the only guarantee, and TREK accepts it.
 *   - UNSIGNED → SIGNED later is allowed. Nothing is pinned until a signed version installs, so
 *     adding a key at v1.4.0 breaks nobody. Signing late is a real option, not a lost cause.
 *   - SIGNED → UNSIGNED is refused forever (SIGNATURE_MISSING) on every instance that already has
 *     the plugin. And rotating the key needs a registry maintainer override AND an admin re-trust
 *     on every instance.
 *
 * So it is a one-way door you may walk through late, but never back out of. That makes the right
 * prompt an honest recommendation with the consequence attached — not a scare, and not silence.
 *
 * The other half of this file is the guard. If a plugin was published signed and you publish
 * unsigned, the registry refuses it — and `preflight` caught that at step 4, AFTER the immutable
 * GitHub release was cut. Same trap as the one `publish`'s reorder closed. It belongs in step 1.
 */
import fs from 'node:fs';
import { defaultKeyPath, generateKeypair } from './sign.js';
import { DEFAULT_REGISTRY } from './checks/network.js';
import { isInteractive, promptConfirm, note, logWarn, logSuccess } from './ui.js';

export interface SigningState {
  /** A signing key exists on this machine. */
  hasKey: boolean;
  keyPath: string;
  /** This plugin is ALREADY PUBLISHED SIGNED — TREK refuses an unsigned update to it. */
  publishedSigned: boolean;
  /** The key it was published under, when publishedSigned. */
  publishedKey?: string;
}

/**
 * What we know about this plugin's signing situation.
 *
 * The registry lookup is best-effort: offline, or a registry we cannot read, yields
 * `publishedSigned: false`. That is the safe direction — we may fail to *insist* on signing, and
 * preflight still catches it before the PR — but we never wrongly insist on it, which would block
 * an author who has done nothing wrong.
 */
export async function inspectSigning(
  pluginId: string,
  opts: { registry?: string; keyPath?: string } = {},
): Promise<SigningState> {
  const keyPath = opts.keyPath ?? defaultKeyPath();
  const state: SigningState = { hasKey: fs.existsSync(keyPath), keyPath, publishedSigned: false };

  const registry = opts.registry ?? DEFAULT_REGISTRY;
  try {
    const r = await fetch(`https://raw.githubusercontent.com/${registry}/main/registry/plugins/${pluginId}.json`, {
      headers: { 'User-Agent': 'trek-plugin' },
    });
    if (!r.ok) return state; // not published yet — nothing to be bound by
    const published = (await r.json()) as { authorPublicKey?: string };
    if (published.authorPublicKey) {
      state.publishedSigned = true;
      state.publishedKey = published.authorPublicKey;
    }
  } catch {
    /* offline, or an unreadable registry — see the doc comment */
  }
  return state;
}

/**
 * The guard: refuse to start a publish that is going to be rejected for a signing reason.
 *
 * Runs BEFORE anything is packed, tagged or released. Getting this wrong is expensive in a way
 * most check failures are not: the release is immutable, so an author who learns at step 4 that
 * their update had to be signed has burned the tag.
 */
export function assertSigningAllowed(state: SigningState, signKeyPath: string | undefined): void {
  if (!state.publishedSigned || signKeyPath) return;

  throw new Error(
    'this plugin was published SIGNED, so this update must be signed too.\n\n' +
      'TREK pins the author key on first install. An unsigned update to a signed plugin is REFUSED on every\n' +
      'instance that already has it — publishing this would strand every existing user on the version they have.\n\n' +
      (state.hasKey
        ? `Re-run with --sign (your key is at ${state.keyPath}).`
        : `No signing key found at ${state.keyPath}.\n` +
          'If you have a backup of the key you published with, restore it there. If you have LOST it, the key\n' +
          'cannot be rotated without a registry maintainer override (the `allow-key-change` label).'),
  );
}

/**
 * Ask, in a terminal, whether to sign — and create the key if there isn't one.
 *
 * Returns the key path to sign with, or undefined to publish unsigned. Only ever called
 * interactively: a script or CI run that did not pass --sign gets exactly the behaviour it always
 * got, because prompting a pipeline is how you hang a pipeline.
 */
export async function proposeSigning(state: SigningState): Promise<string | undefined> {
  if (!isInteractive()) return undefined;

  // Already published signed: this is not a choice, and pretending it is would be a lie. Say so
  // and sign. (assertSigningAllowed handles the no-key case with a much longer explanation.)
  if (state.publishedSigned) {
    if (!state.hasKey) return undefined; // let the guard produce the real error
    logWarn('This plugin was published signed — TREK refuses an unsigned update, so this release will be signed.');
    return state.keyPath;
  }

  if (state.hasKey) {
    const sign = await promptConfirm({
      message: `Sign this release with your key? (${state.keyPath})`,
      initialValue: true,
    });
    return sign ? state.keyPath : undefined;
  }

  note(
    'A signature proves the artifact came from YOU, not just that its bytes match what the registry saw.\n' +
      'TREK pins your key the first time someone installs a signed version, and refuses anything not signed\n' +
      'with it after that.\n\n' +
      'It is a one-way door — but you can walk through it late. Publishing unsigned now and signing at v1.4.0\n' +
      'breaks nobody. Publishing SIGNED and then unsigned breaks everybody.\n\n' +
      'If you sign: back the key up. Losing it means you cannot ship an update to your own plugin without a\n' +
      'registry maintainer override.',
    'Signing',
  );

  const create = await promptConfirm({
    message: 'Create a signing key and sign this release? (recommended)',
    initialValue: true,
  });
  if (!create) {
    logWarn('Publishing unsigned. You can add signing later with `trek-plugin keygen`, and it will break nobody.');
    return undefined;
  }

  const { publicKey } = generateKeypair(state.keyPath);
  logSuccess(`Signing key written to ${state.keyPath}`);
  note(
    `${publicKey}\n\n` +
      'This is your authorPublicKey — it goes into the registry entry, and `publish` puts it there for you.\n' +
      'BACK UP THE PRIVATE KEY. It is the only thing that can sign an update to this plugin.',
    'Back this up',
  );
  return state.keyPath;
}
