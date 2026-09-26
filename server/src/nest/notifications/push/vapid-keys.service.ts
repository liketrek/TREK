import { Injectable, type OnApplicationBootstrap } from '@nestjs/common';
import { decodeBase64Url, isVapidSubject, readEnv, stripTrailingSlashes } from '../../../app-config';
import { logError, logInfo } from '../../audit/audit-log.logger';
import { decrypt_api_key, encrypt_api_key } from '../../common/crypto/apiKeyCrypto';
import { DatabaseService } from '../../database/database.service';
import { generateVapidKeyPair, isVapidKeyPair, type VapidKeyPair } from './web-push-crypto';

/** app_settings rows holding the generated pair. The private half is stored encrypted. */
export const VAPID_PUBLIC_KEY_SETTING = 'web_push_vapid_public_key';
export const VAPID_PRIVATE_KEY_SETTING = 'web_push_vapid_private_key';

/** The VAPID contact when nothing better is configured: a real https URL every push service accepts. */
export const FALLBACK_VAPID_SUBJECT = 'https://github.com/liketrek/TREK';

/** What the push routes answer while the key pair cannot be used. */
export const PUSH_UNAVAILABLE_ERROR = 'Web Push is currently unavailable on this server';

export interface ResolvedVapidKeys extends VapidKeyPair {
  source: 'env' | 'database';
}

/**
 * Thrown by getKeys() while push is off because the pair it would sign with
 * cannot be used: the VAPID_* variables name one that cannot, or, with them
 * unset, the stored one cannot. The reason is in the server log (once, without
 * key material); this error only says that nothing can be signed right now.
 */
export class PushUnavailableError extends Error {
  constructor() {
    super('there is no usable VAPID key pair; see the earlier Web Push error in the log');
    this.name = 'PushUnavailableError';
  }
}

type UnusableReason = 'incomplete' | 'undecryptable' | 'mismatched';

type StoredPair =
  | { state: 'absent' }
  | { state: 'usable'; keys: VapidKeyPair }
  | { state: UnusableReason; fingerprint: string };

type PresentPair = Exclude<StoredPair, { state: 'absent' }>;

type EnvPair =
  | { state: 'unset' }
  | { state: 'usable'; keys: VapidKeyPair }
  | { state: 'unusable'; fingerprint: string; problem: string };

const DELETE_BOTH_ROWS =
  `delete both app_settings rows ${VAPID_PUBLIC_KEY_SETTING} and ${VAPID_PRIVATE_KEY_SETTING} ` +
  'to generate a new pair (every device then has to turn push on again)';

/** The admin-facing explanation for each unusable state. Never contains key material. */
const UNUSABLE_MESSAGES: Record<UnusableReason, string> = {
  incomplete: `only one half of the stored VAPID key pair exists. To start over, ${DELETE_BOTH_ROWS}.`,
  undecryptable:
    'the stored VAPID private key cannot be decrypted with the current ENCRYPTION_KEY (for example after a ' +
    'restore under a different key). Start the server with the ENCRYPTION_KEY it was encrypted with to bring ' +
    `push back as it was, or ${DELETE_BOTH_ROWS}.`,
  mismatched: `the stored VAPID private key does not belong to the stored public key. To start over, ${DELETE_BOTH_ROWS}.`,
};

/** Re-encoded without padding, so the key the browser gets and the one rows are compared with is one string. */
function canonical(value: string): string {
  return decodeBase64Url(value)?.toString('base64url') ?? value;
}

/** An https URL on a host other than localhost: what APP_URL has to be to serve as the VAPID contact. */
function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname !== 'localhost';
  } catch {
    return false;
  }
}

/**
 * The server's VAPID identity: the key pair every subscription is bound to, and
 * the contact (`sub`) sent with each request.
 *
 * VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY win when both are set and belong
 * together. Otherwise the pair lives in app_settings, created once and then
 * kept: it travels with the database into every backup, where a key file in
 * data/ would not, and a restore that minted a new pair would silently cut off
 * every device.
 *
 * When the pair push should sign with cannot be used, push is off: it never
 * falls back on another pair. A pair in the environment that does not fit
 * together (or only one half of it) is logged rather than refusing to boot,
 * and push stays off until the variables are fixed, even while a usable pair
 * is stored: the devices subscribed with the environment key, so the first
 * send under any other pair would drop every one of them. A stored pair that
 * is there but cannot be used (a private key the current ENCRYPTION_KEY cannot
 * open, halves that do not match, one half missing) is never replaced either.
 * Either way the log says why, every device stays subscribed, and fixing the
 * variables or starting with the right ENCRYPTION_KEY again brings everything
 * back unchanged. A new pair is only ever generated while neither row exists
 * and neither VAPID_* variable is set.
 */
@Injectable()
export class VapidKeysService implements OnApplicationBootstrap {
  /** The last environment problem logged, so a bad pair is reported once and not on every send. */
  private reportedEnvProblem: string | null = null;
  /** The last stored-pair problem logged, for the same reason. */
  private reportedStoredProblem: string | null = null;
  /** The decrypted stored pair, keyed by the ciphertext it came from. */
  private stored: { ciphertext: string; keys: VapidKeyPair } | null = null;

  constructor(private readonly db: DatabaseService) {}

  /**
   * Make sure the pair exists before the first request. The public-key GET is
   * the first thing a browser asks for, and a GET must not write; creating the
   * pair here keeps that route a read. The lazy path in getKeys() covers
   * instances built without the Nest lifecycle and a database restored under a
   * running server.
   */
  onApplicationBootstrap(): void {
    this.succeeds(() => this.getKeys());
  }

  /**
   * Whether there is a pair to sign with right now. Only reads, so the
   * dispatcher and the preference matrix GET can ask on every call: while
   * neither row exists the answer is yes and nothing is written, because the
   * next send or subscribe creates the pair through getKeys(). Never throws;
   * the reason for a no is in the log.
   */
  isAvailable(): boolean {
    return this.succeeds(() => this.checkUsable());
  }

  /**
   * The pair to sign with, creating the stored one first while neither row
   * exists. Throws PushUnavailableError while the pair it would use cannot be.
   */
  getKeys(): ResolvedVapidKeys {
    const fromEnv = this.envKeys();
    if (fromEnv) return { ...fromEnv, source: 'env' };
    return { ...this.usableStored(this.readOrCreateStored()), source: 'database' };
  }

  getPublicKey(): string {
    return this.getKeys().publicKey;
  }

  /**
   * The `sub` claim: VAPID_SUBJECT, else APP_URL when it is public https, else
   * the project URL. Push services use it to reach whoever runs the sender, and
   * Apple refuses a token without a valid one. Only APP_URL itself counts, not
   * getAppUrl()'s stand-ins: the first ALLOWED_ORIGINS entry can be another
   * site that is merely allowed to call this API, and http://localhost is no
   * valid subject.
   */
  getSubject(): string {
    const env = readEnv();
    const configured = env.push.vapidSubject;
    if (configured && isVapidSubject(configured)) return configured;
    const appUrl = env.app.appUrl?.trim();
    return appUrl && isPublicHttpsUrl(appUrl) ? stripTrailingSlashes(appUrl) : FALLBACK_VAPID_SUBJECT;
  }

  /** getKeys() without the create: the same refusals, and a missing stored pair counts as usable. */
  private checkUsable(): void {
    if (this.envKeys()) return;
    const stored = this.readStored();
    if (stored.state !== 'absent') this.usableStored(stored);
  }

  private succeeds(attempt: () => unknown): boolean {
    try {
      attempt();
      return true;
    } catch (err) {
      // An unusable pair has already been explained where it was found.
      if (!(err instanceof PushUnavailableError)) {
        logError(`Web Push: could not prepare the VAPID key pair: ${err instanceof Error ? err.message : err}`);
      }
      return false;
    }
  }

  /**
   * The pair from VAPID_*, or null while neither variable is set. A pair that
   * is set but cannot be used turns push off rather than handing out the
   * stored pair (or a new one) in its place: the devices subscribed with the
   * environment key, and the first send under another pair would drop them
   * all. Push comes back unchanged once the variables are fixed.
   */
  private envKeys(): VapidKeyPair | null {
    const env = this.readEnvPair();
    if (env.state !== 'unusable') {
      this.reportedEnvProblem = null;
      return env.state === 'usable' ? env.keys : null;
    }
    if (this.reportedEnvProblem !== env.fingerprint) {
      this.reportedEnvProblem = env.fingerprint;
      logError(
        `Web Push is off: ${env.problem}. Set both variables to the two halves of one pair to turn it back on. ` +
          'Until then nothing is sent, every device stays subscribed, and no pair stored in the database is ' +
          'used in its place.',
      );
    }
    throw new PushUnavailableError();
  }

  /** What the VAPID_* variables hold. The fingerprint only tells one broken state from the next. */
  private readEnvPair(): EnvPair {
    const { vapidPublicKey, vapidPrivateKey } = readEnv().push;
    if (!vapidPublicKey && !vapidPrivateKey) return { state: 'unset' };
    if (!vapidPublicKey || !vapidPrivateKey) {
      return {
        state: 'unusable',
        fingerprint: `half:${vapidPublicKey ?? ''}`,
        problem: `${vapidPublicKey ? 'VAPID_PUBLIC_KEY' : 'VAPID_PRIVATE_KEY'} is set without its other half`,
      };
    }
    if (!isVapidKeyPair(vapidPublicKey, vapidPrivateKey)) {
      return {
        state: 'unusable',
        fingerprint: `pair:${vapidPublicKey}`,
        problem: 'VAPID_PUBLIC_KEY does not belong to VAPID_PRIVATE_KEY',
      };
    }
    return { state: 'usable', keys: { publicKey: canonical(vapidPublicKey), privateKey: canonical(vapidPrivateKey) } };
  }

  private setting(key: string): string | null {
    return this.db.get<{ value: string | null }>('SELECT value FROM app_settings WHERE key = ?', key)?.value || null;
  }

  private writeSetting(key: string, value: string): void {
    this.db.run(
      `INSERT INTO app_settings (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      key,
      value,
    );
  }

  /** What app_settings holds right now. The fingerprint only tells one broken state from the next. */
  private readStored(): StoredPair {
    const publicKey = this.setting(VAPID_PUBLIC_KEY_SETTING);
    const ciphertext = this.setting(VAPID_PRIVATE_KEY_SETTING);
    if (!publicKey && !ciphertext) return { state: 'absent' };
    const fingerprint = `${publicKey ?? ''}\n${ciphertext ?? ''}`;
    if (!publicKey || !ciphertext) return { state: 'incomplete', fingerprint };
    if (this.stored?.ciphertext === ciphertext && this.stored.keys.publicKey === publicKey) {
      return { state: 'usable', keys: this.stored.keys };
    }
    const privateKey = decrypt_api_key(ciphertext);
    if (!privateKey) return { state: 'undecryptable', fingerprint };
    if (!isVapidKeyPair(publicKey, privateKey)) return { state: 'mismatched', fingerprint };
    const keys = { publicKey, privateKey };
    this.stored = { ciphertext, keys };
    return { state: 'usable', keys };
  }

  /**
   * The stored pair, created first only when neither row exists: checked again
   * inside the transaction and written in it, both rows or neither, so the
   * pair is created exactly once.
   */
  private readOrCreateStored(): PresentPair {
    const first = this.readStored();
    if (first.state !== 'absent') return first;
    return this.db.transaction((): PresentPair => {
      const again = this.readStored();
      if (again.state !== 'absent') return again;
      return { state: 'usable', keys: this.generateAndStore() };
    });
  }

  /** The keys of a stored pair, or PushUnavailableError (logged once per state) when it cannot be used. */
  private usableStored(found: PresentPair): VapidKeyPair {
    if (found.state === 'usable') {
      this.reportedStoredProblem = null;
      return found.keys;
    }
    this.reportStoredProblem(found.state, found.fingerprint);
    throw new PushUnavailableError();
  }

  private reportStoredProblem(reason: UnusableReason, fingerprint: string): void {
    const key = `${reason}:${fingerprint}`;
    if (this.reportedStoredProblem === key) return;
    this.reportedStoredProblem = key;
    logError(`Web Push is off: ${UNUSABLE_MESSAGES[reason]}`);
  }

  private generateAndStore(): VapidKeyPair {
    const keys = generateVapidKeyPair();
    const ciphertext = encrypt_api_key(keys.privateKey);
    this.writeSetting(VAPID_PUBLIC_KEY_SETTING, keys.publicKey);
    this.writeSetting(VAPID_PRIVATE_KEY_SETTING, ciphertext);
    this.stored = { ciphertext, keys };
    logInfo('Web Push: generated the VAPID key pair for this instance.');
    return keys;
  }
}
