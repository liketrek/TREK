import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import path from 'path';
import fs from 'fs';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { randomBytes, createHash } from 'crypto';
import type { Request, Response } from 'express';
import { readEnv } from '../../app-config';
import { JWT_SECRET, SESSION_DURATION_SECONDS, SESSION_DURATION_REMEMBER_SECONDS } from '../../config';
import { DatabaseService } from '../database/database.service';
import { PermissionsService } from '../permissions/permissions.service';
import { AtlasService } from '../atlas/atlas.service';
import { getCountryFromCoords } from '../atlas/atlas-geo';
import { validatePassword } from '../../services/passwordPolicy';
import { encryptMfaSecret, decryptMfaSecret } from '../../services/mfaCrypto';
import { decrypt_api_key, maybe_encrypt_api_key, encrypt_api_key } from '../../services/apiKeyCrypto';
import { createEphemeralToken } from '../../services/ephemeralTokens';
// Import from sessionManager directly, NOT the ../../mcp barrel: the barrel pulls
// the whole tools fan-out (and via the domain bridges, the Nest services) into
// every consumer of this module — a nest→mcp→nest module cycle.
import { revokeUserSessions } from '../../mcp/sessionManager';
import { startTripReminders } from '../../scheduler';
import { deleteUserCompletely } from '../../services/userCleanupService';
import { emitUserDeleted } from '../../plugin-user-lifecycle';
import { getFlightDistanceKm } from '../../services/distanceService';
import { verifyJwtAndLoadUser } from '../../middleware/auth';
import { User } from '../../types';
import { DEMO_EMAIL_PRIMARY, isDemoEmail } from '../../services/demo';
import { avatarUrl } from '../../services/avatarUrl';
import { joinTripAsMember } from '../../services/tripMembership';
import { isPasskeyConfigured } from '../../services/webauthnConfig';
import { setAuthCookie, clearAuthCookie } from '../../services/cookie';
import { sendPasswordResetEmail } from '../../services/notifications';
import { getAppUrl } from '../../app-config';
import {
  ADMIN_SETTINGS_KEYS,
  BCRYPT_COST,
  DUMMY_PASSWORD_HASH,
  EMAIL_REGEX,
  KNOWN_COUNTRIES,
  avatarDir,
  generateBackupCodes,
  hashBackupCodeBcrypt,
  mask_stored_api_key,
  matchBackupCode,
  parseBackupCodeHashes,
  stripUserForClient,
} from './auth.helpers';

// Mutates otplib module state; must run before any TOTP verify in either the
// container singleton or the bridge instance (legacy parity — same line sat at
// the top of services/authService.ts).
authenticator.options = { window: 1 };

const MFA_SETUP_TTL_MS = 15 * 60 * 1000;
// Module-scoped on purpose: the bridge instance and the container singleton
// must see the same pending-MFA state (permissions-cache precedent).
const mfaSetupPending = new Map<number, { secret: string; exp: number }>();

// 60 min; long enough to read the email in a second tab, short enough
// that a leaked link is unlikely to still be valid when someone tries it.
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const PASSWORD_RESET_TOKEN_BYTES = 32; // 256-bit entropy

/**
 * Returns the SHA-256 hex hash of a reset token. Raw tokens are never
 * persisted — we only store and compare their hashes.
 */
function hashResetToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/**
 * Shape returned by requestPasswordReset. For enumeration-safety the
 * route ALWAYS returns the same response to the client regardless of
 * whether a user existed — this struct is only consumed internally by
 * the route handler to decide whether to send an email / log a link.
 */
export interface PasswordResetRequestOutcome {
  tokenForDelivery: string | null;   // raw token — send via email or log, never return to client
  userId: number | null;
  userEmail: string | null;
  reason: 'issued' | 'no_user' | 'oidc_only' | 'throttled_per_email' | 'password_login_disabled';
}

// Per-email throttle (defence-in-depth on top of the per-IP limiter).
// Module-scoped + import-time interval on purpose (legacy parity, shared
// between bridge and container instances — atlas-geo interval precedent).
const perEmailResetAttempts = new Map<string, { count: number; first: number }>();
const PASSWORD_RESET_PER_EMAIL_WINDOW_MS = 15 * 60 * 1000;
const PASSWORD_RESET_PER_EMAIL_MAX = 3;
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of perEmailResetAttempts) {
    if (now - record.first >= PASSWORD_RESET_PER_EMAIL_WINDOW_MS) perEmailResetAttempts.delete(key);
  }
}, 5 * 60 * 1000).unref?.();

export interface ResetPasswordOutcome {
  error?: string;
  status?: number;
  success?: boolean;
  /** When true the client must collect a TOTP/backup code and call again. */
  mfa_required?: boolean;
  userId?: number;
}

/**
 * DI-native auth domain service. The SQL moved 1:1 from the legacy
 * src/services/authService.ts (same statements, same `||` falsy-coercion
 * defaults, same post-write re-selects, same error strings); the pure
 * password/backup-code crypto lives in auth.helpers.ts. PermissionsService
 * and AtlasService are injected (they replaced the permissions.bridge and
 * atlas.bridge imports); the JWT cookie set/clear, the reset-email delivery
 * and the remaining legacy helpers keep their plain imports. Non-Nest
 * consumers (legacy MCP registrars, legacy adminService/oidcService/
 * passkeyService) go through auth.bridge.ts.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly permissions: PermissionsService,
    private readonly atlas: AtlasService,
  ) {}

  // Cookie
  setAuthCookie(res: Response, token: string, req: Request, remember?: boolean) { setAuthCookie(res, token, req, remember); }
  clearAuthCookie(res: Response, req: Request) { clearAuthCookie(res, req); }

  // Reset-email delivery (canonical app URL, never request headers)
  getAppUrl() { return getAppUrl(); }
  sendPasswordResetEmail(email: string, url: string, userId: number | null) { return sendPasswordResetEmail(email, url, userId); }

  // -------------------------------------------------------------------------
  // Toggles + tokens
  // -------------------------------------------------------------------------

  resolveAuthToggles(): {
    password_login: boolean;
    password_registration: boolean;
    oidc_login: boolean;
    oidc_registration: boolean;
    passkey_login: boolean;
  } {
    const get = (key: string) =>
      this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = ?", key)?.value ?? null;

    // Passkey login is independent of the password/OIDC "new keys" probe, so it
    // must be resolved OUTSIDE the branch below — otherwise on a fresh install
    // that never touched the password/OIDC toggles it would silently read false
    // even after an admin enabled it. Default OFF (opt-in).
    const passkey_login = get('passkey_login') === 'true';

    const hasNewKeys = ['password_login', 'password_registration', 'oidc_login', 'oidc_registration']
      .some(k => get(k) !== null);

    if (hasNewKeys) {
      const result = {
        password_login: get('password_login') !== 'false',
        password_registration: get('password_registration') !== 'false',
        oidc_login: get('oidc_login') !== 'false',
        oidc_registration: get('oidc_registration') !== 'false',
        passkey_login,
      };
      if (readEnv().oidc.only) {
        result.password_login = false;
        result.password_registration = false;
      }
      return result;
    }

    // Legacy fallback
    const oidcOnlyEnabled = readEnv().oidc.only || get('oidc_only') === 'true';
    const oidcConfigured = !!(
      (readEnv().oidc.issuer || get('oidc_issuer')) &&
      (readEnv().oidc.clientId || get('oidc_client_id'))
    );
    const oidcOnly = oidcOnlyEnabled && oidcConfigured;
    const allowReg = (get('allow_registration') ?? 'true') === 'true';

    return {
      password_login: !oidcOnly,
      password_registration: !oidcOnly && allowReg,
      oidc_login: true,
      oidc_registration: allowReg,
      passkey_login,
    };
  }

  isOidcOnlyMode(): boolean {
    return !this.resolveAuthToggles().password_login;
  }

  generateToken(user: { id: number | bigint; password_version?: number }, rememberMe = false) {
    const pv = typeof user.password_version === 'number'
      ? user.password_version
      : (this.db.get<{ password_version?: number }>('SELECT password_version FROM users WHERE id = ?', user.id)?.password_version ?? 0);
    // "Remember me" extends the JWT lifetime to match the persistent cookie maxAge;
    // the cookie service decides session-vs-persistent off the same flag.
    const expiresIn = rememberMe ? SESSION_DURATION_REMEMBER_SECONDS : SESSION_DURATION_SECONDS;
    return jwt.sign(
      { id: user.id, pv },
      JWT_SECRET,
      { expiresIn, algorithm: 'HS256' }
    );
  }

  getPendingMfaSecret(userId: number): string | null {
    const row = mfaSetupPending.get(userId);
    if (!row || Date.now() > row.exp) {
      mfaSetupPending.delete(userId);
      return null;
    }
    return row.secret;
  }

  // -------------------------------------------------------------------------
  // App config (public)
  // -------------------------------------------------------------------------

  getAppConfig(authenticatedUser: User | undefined | null) {
    const userCount = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE COALESCE(is_guest, 0) = 0')!.count;
    const isDemo = readEnv().demo.enabled;
    const toggles = this.resolveAuthToggles();
    // One directory deeper than the legacy src/services location — the extra
    // '../' keeps resolving to the workspace package.json.
    const version: string = readEnv().app.appVersion ?? require('../../../package.json').version;
    const hasGoogleKey = !!this.db.get("SELECT maps_api_key FROM users WHERE role = 'admin' AND maps_api_key IS NOT NULL AND maps_api_key != '' LIMIT 1");
    const oidcDisplayName = readEnv().oidc.displayName ||
      this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'oidc_display_name'")?.value || null;
    const oidcConfigured = !!(
      (readEnv().oidc.issuer || this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'oidc_issuer'")?.value) &&
      (readEnv().oidc.clientId || this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'oidc_client_id'")?.value)
    );
    const requireMfaRow = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'require_mfa'");
    const notifChannel = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'notification_channel'")?.value || 'none';
    const tripReminderSetting = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'notify_trip_reminder'")?.value;
    const hasSmtpHost = !!(readEnv().smtp.host || this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'smtp_host'")?.value);
    const notifChannelsRaw = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'notification_channels'")?.value || notifChannel;
    const activeChannels = notifChannelsRaw === 'none' ? [] : notifChannelsRaw.split(',').map((c: string) => c.trim()).filter(Boolean);
    const hasWebhookEnabled = activeChannels.includes('webhook');
    const tripRemindersEnabled = tripReminderSetting !== 'false';
    const placesPhotosSetting = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'places_photos_enabled'")?.value;
    const placesPhotosEnabled = placesPhotosSetting !== 'false';
    const placesAutocompleteSetting = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'places_autocomplete_enabled'")?.value;
    const placesAutocompleteEnabled = placesAutocompleteSetting !== 'false';
    const placesDetailsSetting = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'places_details_enabled'")?.value;
    const placesDetailsEnabled = placesDetailsSetting !== 'false';
    const setupComplete = userCount > 0 && !this.db.get("SELECT id FROM users WHERE role = 'admin' AND must_change_password = 1 LIMIT 1");

    return {
      // Legacy fields (backward compat)
      allow_registration: isDemo ? false : (toggles.password_registration || toggles.oidc_registration),
      oidc_only_mode: !toggles.password_login && !toggles.password_registration,
      // Granular toggles
      password_login: toggles.password_login,
      password_registration: isDemo ? false : toggles.password_registration,
      oidc_login: toggles.oidc_login,
      oidc_registration: isDemo ? false : toggles.oidc_registration,
      // Passkey login: the instance toggle + whether a usable RP ID resolves for
      // this deployment. The login page shows the passkey button only when both
      // are true. `passkey_configured` stays a pure boolean — it never leaks the
      // resolved RP ID / origin / APP_URL on this unauthenticated endpoint.
      passkey_login: toggles.passkey_login,
      passkey_configured: isPasskeyConfigured(),
      env_override_oidc_only: readEnv().oidc.only,
      has_users: userCount > 0,
      setup_complete: setupComplete,
      version,
      is_prerelease: version.includes('-pre.'),
      has_maps_key: hasGoogleKey,
      oidc_configured: oidcConfigured,
      oidc_display_name: oidcConfigured ? (oidcDisplayName || 'SSO') : undefined,
      require_mfa: requireMfaRow?.value === 'true',
      allowed_file_types: this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'allowed_file_types'")?.value || 'jpg,jpeg,png,gif,webp,heic,pdf,doc,docx,xls,xlsx,txt,csv',
      demo_mode: isDemo,
      demo_email: isDemo ? DEMO_EMAIL_PRIMARY : undefined,
      demo_password: isDemo ? 'demo12345' : undefined,
      timezone: readEnv().app.tz || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      notification_channel: notifChannel,
      notification_channels: activeChannels,
      available_channels: { email: hasSmtpHost, webhook: hasWebhookEnabled, inapp: true },
      trip_reminders_enabled: tripRemindersEnabled,
      places_photos_enabled: placesPhotosEnabled,
      places_autocomplete_enabled: placesAutocompleteEnabled,
      places_details_enabled: placesDetailsEnabled,
      permissions: authenticatedUser ? this.permissions.getAllPermissions() : undefined,
      // Case-sensitive on purpose (legacy parity).
      dev_mode: readEnv().app.nodeEnv === 'development',
    };
  }

  // -------------------------------------------------------------------------
  // Auth: register, login, demo
  // -------------------------------------------------------------------------

  demoLogin(): { error?: string; status?: number; token?: string; user?: Record<string, unknown> } {
    if (!readEnv().demo.enabled) {
      return { error: 'Not found', status: 404 };
    }
    const user = this.db.get<User>('SELECT * FROM users WHERE email = ?', DEMO_EMAIL_PRIMARY);
    if (!user) return { error: 'Demo user not found', status: 500 };
    const token = this.generateToken(user);
    const safe = stripUserForClient(user) as Record<string, unknown>;
    return { token, user: { ...safe, avatar_url: avatarUrl(user) } };
  }

  validateInviteToken(token: string): { error?: string; status?: number; valid?: boolean; max_uses?: number; used_count?: number; expires_at?: string } {
    const invite = this.db.get('SELECT * FROM invite_tokens WHERE token = ?', token) as any;
    if (!invite) return { error: 'Invalid invite link', status: 404 };
    if (invite.max_uses > 0 && invite.used_count >= invite.max_uses) return { error: 'Invite link has been fully used', status: 410 };
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) return { error: 'Invite link has expired', status: 410 };
    return { valid: true, max_uses: invite.max_uses, used_count: invite.used_count, expires_at: invite.expires_at };
  }

  registerUser(rawBody: unknown): { error?: string; status?: number; token?: string; user?: Record<string, unknown>; auditUserId?: number; auditDetails?: Record<string, unknown> } {
    const body = rawBody as { username?: string; email?: string; password?: string; invite_token?: string };
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const { password, invite_token } = body;

    const userCount = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE COALESCE(is_guest, 0) = 0')!.count;

    let validInvite: any = null;
    if (invite_token) {
      validInvite = this.db.get('SELECT * FROM invite_tokens WHERE token = ?', invite_token);
      if (!validInvite) return { error: 'Invalid invite link', status: 400 };
      if (validInvite.max_uses > 0 && validInvite.used_count >= validInvite.max_uses) return { error: 'Invite link has been fully used', status: 410 };
      if (validInvite.expires_at && new Date(validInvite.expires_at) < new Date()) return { error: 'Invite link has expired', status: 410 };
    }

    if (userCount > 0 && !validInvite) {
      const toggles = this.resolveAuthToggles();
      if (!toggles.password_registration) {
        return { error: 'Password registration is disabled. Contact your administrator.', status: 403 };
      }
    }

    if (!username || !email || !password) {
      return { error: 'Username, email and password are required', status: 400 };
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) return { error: pwCheck.reason, status: 400 };

    if (!EMAIL_REGEX.test(email)) {
      return { error: 'Invalid email format', status: 400 };
    }

    // Ignore guests (#1362): their synthetic username/email must never block a real signup.
    const existingUser = this.db.get('SELECT id FROM users WHERE (LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)) AND COALESCE(is_guest, 0) = 0', email, username);
    if (existingUser) {
      return { error: 'Registration failed. Please try different credentials.', status: 409 };
    }

    const password_hash = bcrypt.hashSync(password, BCRYPT_COST);
    const isFirstUser = userCount === 0;
    const role = isFirstUser ? 'admin' : 'user';

    try {
      // One transaction for the whole signup: a mid-sequence throw (invite
      // bookkeeping, trip auto-join) must not leave a half-registered user.
      return this.db.transaction(() => {
        const result = this.db.run(
          'INSERT INTO users (username, email, password_hash, role, first_seen_version, login_count) VALUES (?, ?, ?, ?, ?, 0)',
          username, email, password_hash, role, readEnv().app.appVersion || '0.0.0'
        );

        const user = { id: result.lastInsertRowid, username, email, role, avatar: null, mfa_enabled: false };
        const token = this.generateToken(user);

        if (validInvite) {
          const updated = this.db.get(
            'UPDATE invite_tokens SET used_count = used_count + 1 WHERE id = ? AND (max_uses = 0 OR used_count < max_uses) RETURNING used_count',
            validInvite.id
          );
          if (!updated) {
            console.warn(`[Auth] Invite token ${validInvite.token.slice(0, 8)}... exceeded max_uses due to race condition`);
          }
          // Trip-bound invite (#1402): auto-add the freshly registered user to the
          // trip. Idempotent + owner-safe; no-ops if the bound trip was since deleted.
          if (validInvite.trip_id) {
            joinTripAsMember(Number(validInvite.trip_id), Number(result.lastInsertRowid), validInvite.created_by ?? null);
          }
        }

        return {
          token,
          user: { ...user, avatar_url: null },
          auditUserId: Number(result.lastInsertRowid),
          auditDetails: { username, email, role },
        };
      });
    } catch {
      return { error: 'Error creating user', status: 500 };
    }
  }

  loginUser(rawBody: unknown): {
    error?: string;
    status?: number;
    token?: string;
    user?: Record<string, unknown>;
    mfa_required?: boolean;
    mfa_token?: string;
    remember?: boolean;
    auditUserId?: number | null;
    auditAction?: string;
    auditDetails?: Record<string, unknown>;
  } {
    const body = rawBody as { email?: string; password?: string; remember_me?: boolean };
    if (this.isOidcOnlyMode()) {
      return { error: 'Password authentication is disabled. Please sign in with SSO.', status: 403 };
    }

    const { email, password, remember_me } = body;
    const remember = remember_me === true;
    if (!email || !password) {
      return { error: 'Email and password are required', status: 400 };
    }

    // Guests (#1362) carry a synthetic email but must never authenticate — treat a
    // matched guest row exactly like an unknown email (dummy-hash timing preserved).
    const user = this.db.get<User>('SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND COALESCE(is_guest, 0) = 0', email);

    // Always run bcrypt — even for unknown/OIDC-only users — so response time
    // does not reveal whether the email exists in the database (CWE-203/208).
    const hashToCheck = user?.password_hash ?? DUMMY_PASSWORD_HASH;
    const validPassword = bcrypt.compareSync(password, hashToCheck);

    if (!user) {
      return {
        error: 'Invalid email or password', status: 401,
        auditUserId: null, auditAction: 'user.login_failed', auditDetails: { email, reason: 'unknown_email' },
      };
    }
    if (!user.password_hash) {
      return {
        error: 'Invalid email or password', status: 401,
        auditUserId: Number(user.id), auditAction: 'user.login_failed', auditDetails: { email, reason: 'oidc_only' },
      };
    }
    if (!validPassword) {
      return {
        error: 'Invalid email or password', status: 401,
        auditUserId: Number(user.id), auditAction: 'user.login_failed', auditDetails: { email, reason: 'wrong_password' },
      };
    }

    if (user.mfa_enabled === 1 || user.mfa_enabled === true) {
      const pv = (user as User & { password_version?: number }).password_version ?? 0;
      const mfa_token = jwt.sign(
        { id: Number(user.id), purpose: 'mfa_login', pv },
        JWT_SECRET,
        { expiresIn: '5m', algorithm: 'HS256' }
      );
      return { mfa_required: true, mfa_token };
    }

    this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?', user.id);
    const token = this.generateToken(user, remember);
    const userSafe = stripUserForClient(user) as Record<string, unknown>;

    return {
      token,
      user: { ...userSafe, avatar_url: avatarUrl(user) },
      remember,
      auditUserId: Number(user.id),
      auditAction: 'user.login',
      auditDetails: { email },
    };
  }

  // -------------------------------------------------------------------------
  // Session
  // -------------------------------------------------------------------------

  getCurrentUser(
    userId: number
  ): (Record<string, unknown> & Pick<User, 'id' | 'username' | 'email' | 'role'> & { avatar_url: string }) | null {
    const user = this.db.get<User>(
      'SELECT id, username, email, role, avatar, oidc_issuer, created_at, mfa_enabled, must_change_password FROM users WHERE id = ?',
      userId
    );
    if (!user) return null;
    const base = stripUserForClient(user as User) as Record<string, unknown>;
    return { ...base, id: user.id, username: user.username, email: user.email, role: user.role, avatar_url: avatarUrl(user) };
  }

  // -------------------------------------------------------------------------
  // Password & account
  // -------------------------------------------------------------------------

  changePassword(
    userId: number,
    userEmail: string,
    rawBody: unknown
  ): { error?: string; status?: number; success?: boolean; token?: string } {
    const body = rawBody as { current_password?: string; new_password?: string };
    if (this.isOidcOnlyMode()) {
      return { error: 'Password authentication is disabled.', status: 403 };
    }
    if (readEnv().demo.enabled && isDemoEmail(userEmail)) {
      return { error: 'Password change is disabled in demo mode.', status: 403 };
    }

    const { current_password, new_password } = body;
    if (!current_password) return { error: 'Current password is required', status: 400 };
    if (!new_password) return { error: 'New password is required', status: 400 };

    const pwCheck = validatePassword(new_password);
    if (!pwCheck.ok) return { error: pwCheck.reason, status: 400 };

    const user = this.db.get<{ password_hash: string; password_version?: number }>('SELECT password_hash, password_version FROM users WHERE id = ?', userId);
    if (!user || !bcrypt.compareSync(current_password, user.password_hash)) {
      return { error: 'Current password is incorrect', status: 401 };
    }

    const hash = bcrypt.hashSync(new_password, BCRYPT_COST);
    const newPv = (user.password_version ?? 0) + 1;

    this.db.transaction(() => {
      this.db.run('UPDATE users SET password_hash = ?, must_change_password = 0, password_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', hash, newPv, userId);
      // A password change rotates the user's sessions: bumping password_version
      // invalidates existing JWT cookie sessions, and the separate MCP static
      // token and OAuth bearer-token stores are pruned to match (same set the
      // password-reset path already revokes).
      this.db.run('DELETE FROM mcp_tokens WHERE user_id = ?', userId);
      try {
        this.db.run("UPDATE oauth_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL", userId);
      } catch { /* oauth_tokens table may not exist in very old installs */ }
    });

    try { revokeUserSessions?.(userId); } catch { /* best-effort */ }

    // Re-issue a session bound to the new password_version so the current device
    // stays logged in while other existing sessions are rotated out by the pv gate.
    const token = this.generateToken({ id: userId, password_version: newPv });
    return { success: true, token };
  }

  deleteAccount(userId: number, userEmail: string, userRole: string): { error?: string; status?: number; success?: boolean } {
    if (readEnv().demo.enabled && isDemoEmail(userEmail)) {
      return { error: 'Account deletion is disabled in demo mode.', status: 403 };
    }
    if (userRole === 'admin') {
      const adminCount = this.db.get<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")!.count;
      if (adminCount <= 1) {
        return { error: 'Cannot delete the last admin account', status: 400 };
      }
    }
    deleteUserCompletely(userId);
    emitUserDeleted(userId); // let plugins erase their own per-user data
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // API keys
  // -------------------------------------------------------------------------

  updateMapsKey(userId: number, key: unknown) {
    const maps_api_key = key as string | null | undefined;
    this.db.run(
      'UPDATE users SET maps_api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      maybe_encrypt_api_key(maps_api_key), userId
    );
    return { success: true, maps_api_key: mask_stored_api_key(maps_api_key) };
  }

  updateApiKeys(userId: number, rawBody: unknown) {
    const body = rawBody as { maps_api_key?: string; openweather_api_key?: string; unsplash_api_key?: string };
    const current = this.db.get<Pick<User, 'maps_api_key' | 'openweather_api_key' | 'unsplash_api_key'>>('SELECT maps_api_key, openweather_api_key, unsplash_api_key FROM users WHERE id = ?', userId);

    // `?? null` instead of the former non-null assertions: a user row deleted
    // mid-request must degrade to a 0-row UPDATE, not a TypeError/500.
    this.db.run(
      'UPDATE users SET maps_api_key = ?, openweather_api_key = ?, unsplash_api_key = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      body.maps_api_key !== undefined ? maybe_encrypt_api_key(body.maps_api_key) : current?.maps_api_key ?? null,
      body.openweather_api_key !== undefined ? maybe_encrypt_api_key(body.openweather_api_key) : current?.openweather_api_key ?? null,
      body.unsplash_api_key !== undefined ? maybe_encrypt_api_key(body.unsplash_api_key) : current?.unsplash_api_key ?? null,
      userId
    );

    const updated = this.db.get<Pick<User, 'id' | 'username' | 'email' | 'role' | 'maps_api_key' | 'openweather_api_key' | 'unsplash_api_key' | 'avatar' | 'mfa_enabled'>>(
      'SELECT id, username, email, role, maps_api_key, openweather_api_key, unsplash_api_key, avatar, mfa_enabled FROM users WHERE id = ?',
      userId
    );

    const u = updated ? { ...updated, mfa_enabled: !!(updated.mfa_enabled === 1 || updated.mfa_enabled === true) } : undefined;
    return {
      success: true,
      user: { ...u, maps_api_key: mask_stored_api_key(u?.maps_api_key), openweather_api_key: mask_stored_api_key(u?.openweather_api_key), unsplash_api_key: mask_stored_api_key(u?.unsplash_api_key), avatar_url: avatarUrl(updated || {}) },
    };
  }

  updateSettings(
    userId: number,
    rawBody: unknown
  ): { error?: string; status?: number; success?: boolean; user?: Record<string, unknown> } {
    const body = rawBody as { maps_api_key?: string; openweather_api_key?: string; unsplash_api_key?: string; username?: string; email?: string };
    const { maps_api_key, openweather_api_key, unsplash_api_key, username, email } = body;

    if (username !== undefined) {
      const trimmed = username.trim();
      if (!trimmed || trimmed.length < 2 || trimmed.length > 50) {
        return { error: 'Username must be between 2 and 50 characters', status: 400 };
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(trimmed)) {
        return { error: 'Username can only contain letters, numbers, underscores, dots and hyphens', status: 400 };
      }
      const conflict = this.db.get('SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ? AND COALESCE(is_guest, 0) = 0', trimmed, userId);
      if (conflict) return { error: 'Username already taken', status: 409 };
    }

    if (email !== undefined) {
      const trimmed = email.trim();
      if (!trimmed || !EMAIL_REGEX.test(trimmed)) {
        return { error: 'Invalid email format', status: 400 };
      }
      const conflict = this.db.get('SELECT id FROM users WHERE LOWER(email) = LOWER(?) AND id != ? AND COALESCE(is_guest, 0) = 0', trimmed, userId);
      if (conflict) return { error: 'Email already taken', status: 409 };
    }

    const updates: string[] = [];
    const params: (string | number | null)[] = [];

    if (maps_api_key !== undefined) { updates.push('maps_api_key = ?'); params.push(maybe_encrypt_api_key(maps_api_key)); }
    if (openweather_api_key !== undefined) { updates.push('openweather_api_key = ?'); params.push(maybe_encrypt_api_key(openweather_api_key)); }
    if (unsplash_api_key !== undefined) { updates.push('unsplash_api_key = ?'); params.push(maybe_encrypt_api_key(unsplash_api_key)); }
    if (username !== undefined) { updates.push('username = ?'); params.push(username.trim()); }
    if (email !== undefined) { updates.push('email = ?'); params.push(email.trim()); }

    if (updates.length > 0) {
      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(userId);
      this.db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, ...params);
    }

    const updated = this.db.get<Pick<User, 'id' | 'username' | 'email' | 'role' | 'maps_api_key' | 'openweather_api_key' | 'unsplash_api_key' | 'avatar' | 'mfa_enabled'>>(
      'SELECT id, username, email, role, maps_api_key, openweather_api_key, unsplash_api_key, avatar, mfa_enabled FROM users WHERE id = ?',
      userId
    );

    const u = updated ? { ...updated, mfa_enabled: !!(updated.mfa_enabled === 1 || updated.mfa_enabled === true) } : undefined;
    return {
      success: true,
      user: { ...u, maps_api_key: mask_stored_api_key(u?.maps_api_key), openweather_api_key: mask_stored_api_key(u?.openweather_api_key), unsplash_api_key: mask_stored_api_key(u?.unsplash_api_key), avatar_url: avatarUrl(updated || {}) },
    };
  }

  getSettings(userId: number): { error?: string; status?: number; settings?: Record<string, unknown> } {
    const user = this.db.get<Pick<User, 'role' | 'maps_api_key' | 'openweather_api_key' | 'unsplash_api_key'>>(
      'SELECT role, maps_api_key, openweather_api_key, unsplash_api_key FROM users WHERE id = ?',
      userId
    );
    if (user?.role !== 'admin') return { error: 'Admin access required', status: 403 };

    return {
      settings: {
        maps_api_key: decrypt_api_key(user.maps_api_key),
        openweather_api_key: decrypt_api_key(user.openweather_api_key),
        unsplash_api_key: decrypt_api_key(user.unsplash_api_key),
      },
    };
  }

  // -------------------------------------------------------------------------
  // Avatar
  // -------------------------------------------------------------------------

  async saveAvatar(userId: number, filename: string) {
    const current = this.db.get<{ avatar: string | null }>('SELECT avatar FROM users WHERE id = ?', userId);
    // Only a locally uploaded file has something to clean up. An OIDC picture URL
    // (#1399) has no file on disk, so skip the rm — path.join on a URL is meaningless.
    if (current?.avatar && !/^https:\/\//i.test(current.avatar)) {
      // Fire-and-forget: leftover files are harmless; the DB update is
      // the source of truth for which avatar is current.
      const oldPath = path.join(avatarDir, current.avatar);
      await fs.promises.rm(oldPath, { force: true }).catch(() => {});
    }

    this.db.run('UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', filename, userId);

    const updated = this.db.get<Pick<User, 'id' | 'username' | 'email' | 'role' | 'avatar'>>('SELECT id, username, email, role, avatar FROM users WHERE id = ?', userId);
    return { success: true, avatar_url: avatarUrl(updated || {}) };
  }

  async deleteAvatar(userId: number) {
    const current = this.db.get<{ avatar: string | null }>('SELECT avatar FROM users WHERE id = ?', userId);
    // An OIDC picture URL (#1399) has no local file — only rm an uploaded one.
    if (current?.avatar && !/^https:\/\//i.test(current.avatar)) {
      const filePath = path.join(avatarDir, current.avatar);
      await fs.promises.rm(filePath, { force: true }).catch(() => {});
    }
    this.db.run('UPDATE users SET avatar = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?', userId);
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // User directory
  // -------------------------------------------------------------------------

  listUsers(excludeUserId: number) {
    // The global user directory feeds the trip member-add / contributor pickers —
    // guests (#1362) are trip-scoped and must never be selectable here.
    const users = this.db.all<Pick<User, 'id' | 'username' | 'avatar'>>(
      'SELECT id, username, avatar FROM users WHERE id != ? AND COALESCE(is_guest, 0) = 0 ORDER BY username ASC',
      excludeUserId
    );
    return users.map(u => ({ ...u, avatar_url: avatarUrl(u) }));
  }

  // -------------------------------------------------------------------------
  // Key validation
  // -------------------------------------------------------------------------

  async validateKeys(userId: number): Promise<{ error?: string; status?: number; maps: boolean; weather: boolean; maps_details: null | { ok: boolean; status: number | null; status_text: string | null; error_message: string | null; error_status: string | null; error_raw: string | null } }> {
    const user = this.db.get<Pick<User, 'role' | 'maps_api_key' | 'openweather_api_key'>>('SELECT role, maps_api_key, openweather_api_key FROM users WHERE id = ?', userId);
    if (user?.role !== 'admin') return { error: 'Admin access required', status: 403, maps: false, weather: false, maps_details: null };

    const result: {
      maps: boolean;
      weather: boolean;
      maps_details: null | {
        ok: boolean;
        status: number | null;
        status_text: string | null;
        error_message: string | null;
        error_status: string | null;
        error_raw: string | null;
      };
    } = { maps: false, weather: false, maps_details: null };

    const maps_api_key = decrypt_api_key(user.maps_api_key);
    if (maps_api_key) {
      try {
        const mapsRes = await fetch(
          `https://places.googleapis.com/v1/places:searchText`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': maps_api_key,
              'X-Goog-FieldMask': 'places.displayName',
            },
            body: JSON.stringify({ textQuery: 'test' }),
          }
        );
        result.maps = mapsRes.status === 200;
        let error_text: string | null = null;
        let error_json: any = null;
        if (!result.maps) {
          try {
            error_text = await mapsRes.text();
            try { error_json = JSON.parse(error_text); } catch { error_json = null; }
          } catch { error_text = null; error_json = null; }
        }
        result.maps_details = {
          ok: result.maps,
          status: mapsRes.status,
          status_text: mapsRes.statusText || null,
          error_message: error_json?.error?.message || null,
          error_status: error_json?.error?.status || null,
          error_raw: error_text,
        };
      } catch (err: unknown) {
        result.maps = false;
        result.maps_details = {
          ok: false,
          status: null,
          status_text: null,
          error_message: err instanceof Error ? err.message : 'Request failed',
          error_status: 'FETCH_ERROR',
          error_raw: null,
        };
      }
    }

    const openweather_api_key = decrypt_api_key(user.openweather_api_key);
    if (openweather_api_key) {
      try {
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=London&appid=${openweather_api_key}`
        );
        result.weather = weatherRes.status === 200;
      } catch {
        result.weather = false;
      }
    }

    return result;
  }

  // -------------------------------------------------------------------------
  // Admin settings
  // -------------------------------------------------------------------------

  getAppSettings(userId: number): { error?: string; status?: number; data?: Record<string, string> } {
    const user = this.db.get<{ role: string }>('SELECT role FROM users WHERE id = ?', userId);
    if (user?.role !== 'admin') return { error: 'Admin access required', status: 403 };

    const result: Record<string, string> = {};
    for (const key of ADMIN_SETTINGS_KEYS) {
      const row = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = ?", key);
      if (row) result[key] = (key === 'smtp_pass' || key === 'admin_webhook_url' || key === 'admin_ntfy_token') ? '••••••••' : row.value;
    }
    return { data: result };
  }

  updateAppSettings(
    userId: number,
    rawBody: unknown
  ): {
    error?: string;
    status?: number;
    success?: boolean;
    auditSummary?: Record<string, unknown>;
    auditDebugDetails?: Record<string, unknown>;
    shouldRestartScheduler?: boolean;
  } {
    const body = rawBody as Record<string, unknown>;
    const user = this.db.get<{ role: string }>('SELECT role FROM users WHERE id = ?', userId);
    if (user?.role !== 'admin') return { error: 'Admin access required', status: 403 };

    const { require_mfa } = body;
    if (require_mfa === true || require_mfa === 'true') {
      const adminMfa = this.db.get<{ mfa_enabled: number }>('SELECT mfa_enabled FROM users WHERE id = ?', userId);
      // A user-verified passkey satisfies the MFA policy, so an admin who secured
      // their own account with a passkey may enable it too (not only TOTP).
      const adminHasPasskey = !!this.db.get('SELECT 1 FROM webauthn_credentials WHERE user_id = ? LIMIT 1', userId);
      if (!(adminMfa?.mfa_enabled === 1) && !adminHasPasskey) {
        return {
          error: 'Secure your own account with two-factor authentication or a passkey before requiring it for all users.',
          status: 400,
        };
      }
    }

    // Lockout prevention: can't disable all login methods
    if (body.password_login !== undefined || body.oidc_login !== undefined) {
      const current = this.resolveAuthToggles();
      const oidcConfigured = !!(
        (readEnv().oidc.issuer || this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'oidc_issuer'")?.value) &&
        (readEnv().oidc.clientId || this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'oidc_client_id'")?.value)
      );
      const nextPasswordLogin = body.password_login !== undefined ? (String(body.password_login) === 'true') : current.password_login;
      const nextOidcLogin = body.oidc_login !== undefined ? (String(body.oidc_login) === 'true') : current.oidc_login;
      if (!nextPasswordLogin && (!nextOidcLogin || !oidcConfigured)) {
        return { error: 'Cannot disable all login methods. At least one must remain enabled.', status: 400 };
      }
    }

    for (const key of ADMIN_SETTINGS_KEYS) {
      if (body[key] !== undefined) {
        let val = String(body[key]);
        if (key === 'require_mfa') {
          val = body[key] === true || val === 'true' ? 'true' : 'false';
        }
        if (key === 'smtp_pass' && val === '••••••••') continue;
        if (key === 'smtp_pass') val = encrypt_api_key(val);
        if (key === 'admin_webhook_url' && val === '••••••••') continue;
        if (key === 'admin_webhook_url' && val) val = maybe_encrypt_api_key(val) ?? val;
        if (key === 'admin_ntfy_token' && val === '••••••••') continue;
        if (key === 'admin_ntfy_token' && val) val = maybe_encrypt_api_key(val) ?? val;
        this.db.run("INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)", key, val);
      }
    }

    const changedKeys = ADMIN_SETTINGS_KEYS.filter(k => body[k] !== undefined && !(k === 'smtp_pass' && String(body[k]) === '••••••••'));

    const summary: Record<string, unknown> = {};
    const smtpChanged = changedKeys.some(k => k.startsWith('smtp_'));
    if (changedKeys.includes('notification_channels')) summary.notification_channels = body.notification_channels;
    if (changedKeys.includes('admin_webhook_url')) summary.admin_webhook_url_updated = true;
    if (changedKeys.some(k => k.startsWith('admin_ntfy_'))) summary.admin_ntfy_updated = true;
    if (smtpChanged) summary.smtp_settings_updated = true;
    if (changedKeys.includes('allow_registration')) summary.allow_registration = body.allow_registration;
    if (changedKeys.includes('allowed_file_types')) summary.allowed_file_types_updated = true;
    if (changedKeys.includes('require_mfa')) summary.require_mfa = body.require_mfa;

    const debugDetails: Record<string, unknown> = {};
    for (const k of changedKeys) {
      debugDetails[k] = k === 'smtp_pass' ? '***' : body[k];
    }

    const notifRelated = ['notification_channels', 'smtp_host'];
    const shouldRestartScheduler = changedKeys.some(k => notifRelated.includes(k));
    if (shouldRestartScheduler) {
      startTripReminders();
    }

    return { success: true, auditSummary: summary, auditDebugDetails: debugDetails, shouldRestartScheduler };
  }

  // -------------------------------------------------------------------------
  // Travel stats
  // -------------------------------------------------------------------------

  getTravelStats(userId: number) {
    const places = this.db.all<{ address: string | null; lat: number | null; lng: number | null }>(`
    SELECT DISTINCT p.address, p.lat, p.lng
    FROM places p
    JOIN trips t ON p.trip_id = t.id
    LEFT JOIN trip_members tm ON t.id = tm.trip_id
    WHERE t.user_id = ? OR tm.user_id = ?
  `, userId, userId);

    // Archived trips still count here, matching the places, countries and flight
    // distance widgets (which never filtered on is_archived) so the dashboard stats
    // stay consistent — archiving a trip no longer zeroes out trips/days.
    const tripStats = this.db.get<{ trips: number; days: number }>(`
    SELECT COUNT(DISTINCT t.id) as trips,
           COUNT(DISTINCT d.id) as days
    FROM trips t
    LEFT JOIN days d ON d.trip_id = t.id
    LEFT JOIN trip_members tm ON t.id = tm.trip_id
    WHERE (t.user_id = ? OR tm.user_id = ?)
  `, userId, userId);

    const cities = new Set<string>();
    const coords: { lat: number; lng: number }[] = [];

    places.forEach(p => {
      // Explicit null checks: lat/lng of exactly 0 (equator / prime meridian)
      // are valid coordinates the former falsy check silently dropped.
      if (p.lat != null && p.lng != null) coords.push({ lat: p.lat, lng: p.lng });
      if (p.address) {
        const parts = p.address.split(',').map(s => s.trim().replace(/\d{3,}/g, '').trim());
        const cityPart = parts.find(s => !KNOWN_COUNTRIES.has(s) && /^[A-Za-z\u00C0-\u00FF\s-]{2,}$/.test(s));
        if (cityPart) cities.add(cityPart);
      }
    });

    // Visited countries \u2014 same source the Atlas page uses: ISO-2 codes from
    // auto-resolved place regions plus countries the user marked manually.
    const countryCodes = new Set<string>();
    const manualCountries = this.db.all<{ country_code: string }>(
      'SELECT country_code FROM visited_countries WHERE user_id = ?',
      userId
    );
    manualCountries.forEach(m => { if (m.country_code) countryCodes.add(m.country_code.toUpperCase()); });

    // Only trips that have already started count as visited — a country you have merely
    // booked a trip to isn't stamped in the passport yet, and one you jotted down without
    // any dates even less so (#1048). date('now') is UTC, matching tripVisitStatus.
    const placeRegionCodes = this.db.all<{ country_code: string }>(`
    SELECT DISTINCT pr.country_code
    FROM place_regions pr
    JOIN places p ON p.id = pr.place_id
    JOIN trips t ON p.trip_id = t.id
    LEFT JOIN trip_members tm ON t.id = tm.trip_id
    WHERE (t.user_id = ? OR tm.user_id = ?) AND pr.country_code IS NOT NULL
      AND COALESCE(t.start_date, t.end_date) IS NOT NULL
      AND COALESCE(t.start_date, t.end_date) <= date('now')
  `, userId, userId);
    placeRegionCodes.forEach(r => { if (r.country_code) countryCodes.add(r.country_code.toUpperCase()); });

    // Transport bookings don't create a place row, so their geocoded endpoints never
    // reached place_regions — a country reached only by a flight/train (no lodging or
    // planned place there) was never counted as visited (#1366). Resolve each endpoint
    // coordinate to a country and fold it in too.
    // Only 'from'/'to' legs count as actually reached — a 'stop' is an intermediate
    // connection/layover (e.g. a plane change) the traveler never really visited (#1486).
    const endpoints = this.db.all<{ lat: number; lng: number }>(`
    SELECT DISTINCT e.lat, e.lng
    FROM reservation_endpoints e
    JOIN reservations r ON e.reservation_id = r.id
    JOIN trips t ON r.trip_id = t.id
    LEFT JOIN trip_members tm ON t.id = tm.trip_id
    WHERE (t.user_id = ? OR tm.user_id = ?) AND e.role IN ('from', 'to')
      AND COALESCE(t.start_date, t.end_date) IS NOT NULL
      AND COALESCE(t.start_date, t.end_date) <= date('now')
  `, userId, userId);
    for (const e of endpoints) {
      const code = getCountryFromCoords(e.lat, e.lng);
      if (code) countryCodes.add(code.toUpperCase());
    }

    // Countries the user removed in Atlas stay removed on the dashboard too, so the
    // passport card and the Atlas map agree (#1490).
    for (const code of this.atlas.getHiddenCountries(userId)) countryCodes.delete(code.toUpperCase());

    return {
      countries: [...countryCodes],
      cities: [...cities],
      coords,
      totalTrips: tripStats?.trips || 0,
      totalDays: tripStats?.days || 0,
      totalPlaces: places.length,
      totalDistanceKm: getFlightDistanceKm(userId),
    };
  }

  // -------------------------------------------------------------------------
  // MFA
  // -------------------------------------------------------------------------

  setupMfa(userId: number, userEmail: string): { error?: string; status?: number; secret?: string; otpauth_url?: string; qrPromise?: Promise<string> } {
    if (readEnv().demo.enabled && isDemoEmail(userEmail)) {
      return { error: 'MFA is not available in demo mode.', status: 403 };
    }
    const row = this.db.get<{ mfa_enabled: number }>('SELECT mfa_enabled FROM users WHERE id = ?', userId);
    if (row?.mfa_enabled) {
      return { error: 'MFA is already enabled', status: 400 };
    }
    let secret: string, otpauth_url: string;
    try {
      secret = authenticator.generateSecret();
      mfaSetupPending.set(userId, { secret, exp: Date.now() + MFA_SETUP_TTL_MS });
      otpauth_url = authenticator.keyuri(userEmail, 'TREK', secret);
    } catch (err) {
      console.error('[MFA] Setup error:', err);
      return { error: 'MFA setup failed', status: 500 };
    }
    return { secret, otpauth_url, qrPromise: QRCode.toString(otpauth_url, { type: 'svg', width: 250 }) };
  }

  enableMfa(userId: number, rawCode: unknown): { error?: string; status?: number; success?: boolean; mfa_enabled?: boolean; backup_codes?: string[] } {
    const code = rawCode as string | undefined;
    if (!code) {
      return { error: 'Verification code is required', status: 400 };
    }
    const pending = this.getPendingMfaSecret(userId);
    if (!pending) {
      return { error: 'No MFA setup in progress. Start the setup again.', status: 400 };
    }
    const tokenStr = String(code).replace(/\s/g, '');
    const ok = authenticator.verify({ token: tokenStr, secret: pending });
    if (!ok) {
      return { error: 'Invalid verification code', status: 401 };
    }
    const backupCodes = generateBackupCodes();
    const backupHashes = backupCodes.map(hashBackupCodeBcrypt);
    const enc = encryptMfaSecret(pending);
    this.db.run('UPDATE users SET mfa_enabled = 1, mfa_secret = ?, mfa_backup_codes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      enc,
      JSON.stringify(backupHashes),
      userId
    );
    mfaSetupPending.delete(userId);
    return { success: true, mfa_enabled: true, backup_codes: backupCodes };
  }

  disableMfa(
    userId: number,
    userEmail: string,
    rawBody: unknown
  ): { error?: string; status?: number; success?: boolean; mfa_enabled?: boolean } {
    const body = rawBody as { password?: string; code?: string };
    if (readEnv().demo.enabled && isDemoEmail(userEmail)) {
      return { error: 'MFA cannot be changed in demo mode.', status: 403 };
    }
    const policy = this.db.get<{ value: string }>("SELECT value FROM app_settings WHERE key = 'require_mfa'");
    if (policy?.value === 'true') {
      return { error: 'Two-factor authentication cannot be disabled while it is required for all users.', status: 403 };
    }
    const { password, code } = body;
    if (!password || !code) {
      return { error: 'Password and authenticator code are required', status: 400 };
    }
    const user = this.db.get<User>('SELECT * FROM users WHERE id = ?', userId);
    if (!user?.mfa_enabled || !user.mfa_secret) {
      return { error: 'MFA is not enabled', status: 400 };
    }
    if (!user.password_hash || !bcrypt.compareSync(password, user.password_hash)) {
      return { error: 'Incorrect password', status: 401 };
    }
    const secret = decryptMfaSecret(user.mfa_secret);
    const tokenStr = String(code).replace(/\s/g, '');
    const ok = authenticator.verify({ token: tokenStr, secret });
    if (!ok) {
      return { error: 'Invalid verification code', status: 401 };
    }
    this.db.run('UPDATE users SET mfa_enabled = 0, mfa_secret = NULL, mfa_backup_codes = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      userId
    );
    mfaSetupPending.delete(userId);
    return { success: true, mfa_enabled: false };
  }

  verifyMfaLogin(rawBody: unknown): {
    error?: string;
    status?: number;
    token?: string;
    user?: Record<string, unknown>;
    remember?: boolean;
    auditUserId?: number;
  } {
    const body = rawBody as { mfa_token?: string; code?: string; remember_me?: boolean };
    const { mfa_token, code, remember_me } = body;
    const remember = remember_me === true;
    if (!mfa_token || !code) {
      return { error: 'Verification token and code are required', status: 400 };
    }
    try {
      const decoded = jwt.verify(mfa_token, JWT_SECRET, { algorithms: ['HS256'] }) as { id: number; purpose?: string };
      if (decoded.purpose !== 'mfa_login') {
        return { error: 'Invalid verification token', status: 401 };
      }
      const user = this.db.get<User>('SELECT * FROM users WHERE id = ?', decoded.id);
      if (!user || !(user.mfa_enabled === 1 || user.mfa_enabled === true) || !user.mfa_secret) {
        return { error: 'Invalid session', status: 401 };
      }
      const secret = decryptMfaSecret(user.mfa_secret);
      const tokenStr = String(code).trim();
      const okTotp = authenticator.verify({ token: tokenStr.replace(/\s/g, ''), secret });
      if (!okTotp) {
        const hashes = parseBackupCodeHashes(user.mfa_backup_codes);
        // matchBackupCode handles both bcrypt and legacy SHA-256 hashes;
        // any store older than the bcrypt migration keeps working.
        const idx = hashes.findIndex((h) => matchBackupCode(tokenStr, h));
        if (idx === -1) {
          return { error: 'Invalid verification code', status: 401 };
        }
        hashes.splice(idx, 1);
        // Consume the backup code and record the login atomically — the code
        // must not burn without the login landing (or vice versa).
        this.db.transaction(() => {
          this.db.run('UPDATE users SET mfa_backup_codes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            JSON.stringify(hashes),
            user.id
          );
          this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?', user.id);
        });
      } else {
        this.db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP, login_count = login_count + 1 WHERE id = ?', user.id);
      }
      const sessionToken = this.generateToken(user, remember);
      const userSafe = stripUserForClient(user) as Record<string, unknown>;
      return {
        token: sessionToken,
        user: { ...userSafe, avatar_url: avatarUrl(user) },
        remember,
        auditUserId: Number(user.id),
      };
    } catch {
      return { error: 'Invalid or expired verification token', status: 401 };
    }
  }

  // -------------------------------------------------------------------------
  // Password reset
  // -------------------------------------------------------------------------

  requestPasswordReset(rawEmail: string, createdIp: string | null): PasswordResetRequestOutcome {
    const email = String(rawEmail || '').trim().toLowerCase();
    // Basic shape check — a fully empty / malformed email is treated like
    // "no user" so we still spend the same time internally.
    const looksLikeEmail = email.length > 0 && /.+@.+\..+/.test(email);

    // Global policy check: password login disabled → no reset possible.
    const toggles = this.resolveAuthToggles();
    if (!toggles.password_login) {
      return { tokenForDelivery: null, userId: null, userEmail: null, reason: 'password_login_disabled' };
    }

    // Per-email throttle. We check this BEFORE the DB lookup so the timing
    // is identical regardless of whether the account exists.
    const throttleKey = email || '__noemail__';
    const now = Date.now();
    const record = perEmailResetAttempts.get(throttleKey);
    if (record && record.count >= PASSWORD_RESET_PER_EMAIL_MAX && now - record.first < PASSWORD_RESET_PER_EMAIL_WINDOW_MS) {
      return { tokenForDelivery: null, userId: null, userEmail: null, reason: 'throttled_per_email' };
    }
    if (!record || now - record.first >= PASSWORD_RESET_PER_EMAIL_WINDOW_MS) {
      perEmailResetAttempts.set(throttleKey, { count: 1, first: now });
    } else {
      record.count++;
    }

    if (!looksLikeEmail) {
      return { tokenForDelivery: null, userId: null, userEmail: null, reason: 'no_user' };
    }

    // A guest (#1362) must never receive a reset link — treat its synthetic email as unknown.
    const user = this.db.get<{ id: number; email: string; password_hash: string | null; oidc_sub: string | null }>(
      'SELECT id, email, password_hash, oidc_sub FROM users WHERE email = ? AND COALESCE(is_guest, 0) = 0',
      email
    );

    if (!user) {
      return { tokenForDelivery: null, userId: null, userEmail: null, reason: 'no_user' };
    }
    // SSO-linked account — refuse a reset. OIDC users are created with a random
    // bcrypt hash (so password_hash is never empty), which is why we must key off
    // oidc_sub rather than a missing hash. Letting the reset proceed would set a
    // local password and revoke session/credential state, which breaks the SSO
    // login; admins (or the user, with their current password) can still set one.
    // The client still gets the generic "if that email exists…" response.
    if (user.oidc_sub) {
      return { tokenForDelivery: null, userId: user.id, userEmail: user.email, reason: 'oidc_only' };
    }

    // Invalidate any prior unconsumed tokens for this user so there is
    // always at most one live reset link in flight.
    this.db.run(
      "UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND consumed_at IS NULL",
      user.id
    );

    const raw = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url');
    const token_hash = hashResetToken(raw);
    const expires_at = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();

    this.db.run(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_ip) VALUES (?, ?, ?, ?)',
      user.id, token_hash, expires_at, createdIp
    );

    return { tokenForDelivery: raw, userId: user.id, userEmail: user.email, reason: 'issued' };
  }

  /**
   * Consume a reset token and set a new password. If the target user has
   * MFA enabled, a valid TOTP code or backup code must be supplied — a
   * compromised email alone therefore does NOT allow taking over a
   * 2FA-protected account.
   */
  resetPassword(rawBody: unknown): ResetPasswordOutcome {
    const body = rawBody as { token?: string; new_password?: string; mfa_code?: string };
    const { token, new_password, mfa_code } = body;
    if (!token || typeof token !== 'string') {
      return { error: 'Reset token is required', status: 400 };
    }
    if (!new_password || typeof new_password !== 'string') {
      return { error: 'New password is required', status: 400 };
    }
    // Check the policy BEFORE touching the token so an invalid password
    // does not burn the user's one-time link.
    const pwCheck = validatePassword(new_password);
    if (!pwCheck.ok) return { error: pwCheck.reason!, status: 400 };

    const tokenHash = hashResetToken(token);
    const row = this.db.get<{ id: number; user_id: number; expires_at: string; consumed_at: string | null }>(
      'SELECT id, user_id, expires_at, consumed_at FROM password_reset_tokens WHERE token_hash = ?',
      tokenHash
    );

    if (!row) return { error: 'Invalid or expired reset link', status: 400 };
    if (row.consumed_at) return { error: 'This reset link has already been used', status: 400 };
    if (new Date(row.expires_at).getTime() < Date.now()) {
      return { error: 'Reset link has expired. Please request a new one.', status: 400 };
    }

    const user = this.db.get<{ id: number; email: string; mfa_enabled: number | boolean; mfa_secret: string | null; mfa_backup_codes: string | null; password_version: number }>(
      'SELECT id, email, mfa_enabled, mfa_secret, mfa_backup_codes, password_version FROM users WHERE id = ?',
      row.user_id
    );

    if (!user) return { error: 'Invalid or expired reset link', status: 400 };

    // MFA gate. If enabled, require a valid TOTP or backup code.
    const mfaOn = user.mfa_enabled === 1 || user.mfa_enabled === true;
    let backupCodeConsumedIndex: number | null = null;
    if (mfaOn) {
      if (!user.mfa_secret) {
        // Data inconsistency — fail closed.
        return { error: 'MFA is enabled but not configured. Contact your administrator.', status: 500 };
      }
      const supplied = typeof mfa_code === 'string' ? mfa_code.trim() : '';
      if (!supplied) return { mfa_required: true, status: 200 };

      const secret = decryptMfaSecret(user.mfa_secret);
      const okTotp = authenticator.verify({ token: supplied.replace(/\s/g, ''), secret });
      if (!okTotp) {
        const hashes = parseBackupCodeHashes(user.mfa_backup_codes);
        const idx = hashes.findIndex((h) => matchBackupCode(supplied, h));
        if (idx === -1) return { error: 'Invalid MFA code', status: 401 };
        backupCodeConsumedIndex = idx;
      }
    }

    const newHash = bcrypt.hashSync(new_password, BCRYPT_COST);
    const newPv = (user.password_version ?? 0) + 1;

    this.db.transaction(() => {
      // Burn the token first to keep it atomic with the password change.
      this.db.run('UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?', row.id);
      // Also burn every OTHER live token for this user — a fresh login
      // should not leave a second door open.
      this.db.run(
        "UPDATE password_reset_tokens SET consumed_at = CURRENT_TIMESTAMP WHERE user_id = ? AND consumed_at IS NULL AND id != ?",
        user.id, row.id
      );
      this.db.run(
        'UPDATE users SET password_hash = ?, must_change_password = 0, password_version = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        newHash, newPv, user.id
      );
      // Consume backup code if one was used.
      if (backupCodeConsumedIndex !== null) {
        const hashes = parseBackupCodeHashes(user.mfa_backup_codes);
        hashes.splice(backupCodeConsumedIndex, 1);
        this.db.run('UPDATE users SET mfa_backup_codes = ? WHERE id = ?', JSON.stringify(hashes), user.id);
      }
      // Revoke every other credential class the user had. The
      // password_version bump alone invalidates JWT cookie sessions, but
      // MCP static tokens and OAuth 2.1 bearer tokens are separate stores
      // that survive the bump unless we prune them here.
      this.db.run('DELETE FROM mcp_tokens WHERE user_id = ?', user.id);
      try {
        this.db.run(
          "UPDATE oauth_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL",
          user.id
        );
      } catch { /* oauth_tokens table may not exist in very old installs */ }
    });

    // Kick off any MCP/WS session cleanup — same hook the account-delete path uses.
    try { revokeUserSessions?.(user.id); } catch { /* best-effort */ }

    return { success: true, userId: user.id };
  }

  // -------------------------------------------------------------------------
  // MCP tokens
  // -------------------------------------------------------------------------

  listMcpTokens(userId: number) {
    return this.db.all(
      'SELECT id, name, token_prefix, created_at, last_used_at FROM mcp_tokens WHERE user_id = ? ORDER BY created_at DESC',
      userId
    );
  }

  createMcpToken(userId: number, rawName: unknown): { error?: string; status?: number; token?: Record<string, unknown> } {
    const name = rawName as string | undefined;
    if (!name?.trim()) return { error: 'Token name is required', status: 400 };
    if (name.trim().length > 100) return { error: 'Token name must be 100 characters or less', status: 400 };

    const tokenCount = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM mcp_tokens WHERE user_id = ?', userId)!.count;
    if (tokenCount >= 10) return { error: 'Maximum of 10 tokens per user reached', status: 400 };

    const rawToken = 'trek_' + randomBytes(24).toString('hex');
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const tokenPrefix = rawToken.slice(0, 13);

    const result = this.db.run(
      'INSERT INTO mcp_tokens (user_id, name, token_hash, token_prefix) VALUES (?, ?, ?, ?)',
      userId, name.trim(), tokenHash, tokenPrefix
    );

    const token = this.db.get(
      'SELECT id, name, token_prefix, created_at, last_used_at FROM mcp_tokens WHERE id = ?',
      result.lastInsertRowid
    );

    return { token: { ...(token as object), raw_token: rawToken } };
  }

  deleteMcpToken(userId: number, tokenId: string): { error?: string; status?: number; success?: boolean } {
    const token = this.db.get('SELECT id FROM mcp_tokens WHERE id = ? AND user_id = ?', tokenId, userId);
    if (!token) return { error: 'Token not found', status: 404 };
    this.db.run('DELETE FROM mcp_tokens WHERE id = ?', tokenId);
    // Best-effort, like the changePassword/resetPassword revocations: a session
    // sweep failure must not turn a successful token delete into a 500.
    try { revokeUserSessions?.(userId); } catch { /* best-effort */ }
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // Ephemeral tokens
  // -------------------------------------------------------------------------

  createWsToken(userId: number): { error?: string; status?: number; token?: string } {
    // Bind the ws-token to the user's current password_version so a token minted
    // before a password reset is rejected on connect (defence-in-depth session gate).
    const pv = this.db.get<{ password_version?: number }>('SELECT password_version FROM users WHERE id = ?', userId)?.password_version ?? 0;
    const token = createEphemeralToken(userId, 'ws', { pv });
    if (!token) return { error: 'Service unavailable', status: 503 };
    return { token };
  }

  createResourceToken(userId: number, rawPurpose: unknown): { error?: string; status?: number; token?: string } {
    const purpose = rawPurpose as string | undefined;
    if (purpose !== 'download') {
      return { error: 'Invalid purpose', status: 400 };
    }
    const token = createEphemeralToken(userId, purpose);
    if (!token) return { error: 'Service unavailable', status: 503 };
    return { token };
  }

  // -------------------------------------------------------------------------
  // MCP auth helpers
  // -------------------------------------------------------------------------

  isDemoUser(userId: number): boolean {
    if (!readEnv().demo.enabled) return false;
    const user = this.db.get<{ email: string }>('SELECT email FROM users WHERE id = ?', userId);
    return isDemoEmail(user?.email);
  }

  verifyMcpToken(rawToken: string): User | null {
    const hash = createHash('sha256').update(rawToken).digest('hex');
    const row = this.db.get<User>(`
    SELECT u.id, u.username, u.email, u.role
    FROM mcp_tokens mt
    JOIN users u ON mt.user_id = u.id
    WHERE mt.token_hash = ?
  `, hash);
    if (row) {
      this.db.run('UPDATE mcp_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token_hash = ?', hash);
      return row;
    }
    return null;
  }

  /**
   * Verify a JWT the same way `middleware/auth.ts#verifyJwtAndLoadUser`
   * does — including the `password_version` check — so that stolen tokens
   * lose access the moment the victim resets their password.
   *
   * This is the single entry point every non-cookie JWT verification path
   * (MCP bearer, WebSocket handshake, file-download query tokens, photo
   * route) should go through.
   */
  verifyJwtToken(token: string): User | null {
    return verifyJwtAndLoadUser(token);
  }
}
