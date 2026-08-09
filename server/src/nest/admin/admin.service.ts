import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ADDON_IDS } from '../../addons';
import { readEnv } from '../../app-config';
import { updateJwtSecret } from '../../config';
// Import from sessionManager directly, NOT the ../../mcp barrel: the barrel pulls
// the whole tools fan-out (and via the domain bridges, the Nest services) into
// every consumer of this module — a nest→mcp→nest module cycle. The
// invalidateMcpSessions barrel import below predates the fold and is deliberately
// separate: it is only reached from the controller, never from admin.bridge.
import { revokeUserSessions, revokeUserSessionsForClient } from '../../mcp/sessionManager';
import { invalidateMcpSessions } from '../../mcp';
import { emitUserDeleted } from '../../plugin-user-lifecycle';
import type { User, Addon } from '../../types';
import { maybe_encrypt_api_key, decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { avatarUrl } from '../common/avatarUrl';
import { prepareLlmAddonConfigForWrite, maskLlmAddonConfig } from '../llm-parse/llm-config';
import { getPhotoProviderConfig } from '../memories/memories.helpers';
import { validatePassword } from '../common/passwordPolicy';
import { UserCleanupService } from '../auth/user-cleanup.service';
import { DatabaseService } from '../database/database.service';
import { AddonsService } from '../addons/addons.service';
import { PasskeyService } from '../auth/passkey.service';
import { AuthService } from '../auth/auth.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PERMISSION_ACTIONS } from '../permissions/permissions.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  BCRYPT_COST,
  compareVersions,
  isDocker,
  readVersionCache,
  utcSuffix,
  writeVersionCache,
  type VersionInfo,
} from './admin.helpers';

/** Outbound GitHub calls: hard timeout and response-size cap (server/CLAUDE.md). */
const GITHUB_TIMEOUT_MS = 10_000;
const GITHUB_MAX_BYTES = 2_000_000;
/** Failed version checks cache briefly so an outage isn't refetched per page load. */
const VERSION_FAILURE_TTL = 60_000;

/**
 * Admin domain service — owns the admin SQL (folded from the legacy
 * services/adminService.ts with the 2026-08 migration): user CRUD, instance
 * stats, the permission matrix, the audit-log read side, OIDC settings, the
 * demo baseline, GitHub release/version checks, invite tokens, the three
 * places feature toggles, addons + photo providers, MCP tokens, OAuth sessions
 * and JWT rotation.
 *
 * Every quirk relocated byte-for-byte: the `||` falsy defaults (never `??`),
 * post-insert/post-update re-selects instead of RETURNING, the COALESCE partial
 * update, the #1362 guest exclusions and the exact error strings. The legacy
 * `{ error, status }` envelope is the return contract — the controller's `ok()`
 * helper turns it into an HttpException, so nothing here throws.
 *
 * The bag-tracking/collab-feature toggles, user defaults, passkey reset and
 * packing templates delegate to the services that own those tables. The pure
 * and module-scoped pieces (compareVersions, isDocker, the version cache) live
 * in admin.helpers.ts.
 */
@Injectable()
export class AdminService {
  constructor(
    private readonly db: DatabaseService,
    private readonly addons: AddonsService,
    private readonly passkeys: PasskeyService,
    private readonly auth: AuthService,
    private readonly permissions: PermissionsService,
    private readonly notifications: NotificationsService,
    private readonly userCleanup: UserCleanupService,
  ) {}

  // ── User CRUD ──────────────────────────────────────────────────────────────

  listUsers() {
    // Guests (#1362) are accountless trip participants, not real users — keep them out
    // of admin user management entirely.
    const users = this.db.all<
      Pick<User, 'id' | 'username' | 'email' | 'role' | 'created_at' | 'updated_at' | 'last_login'> & {
        avatar?: string | null;
      }
    >(
      'SELECT id, username, email, role, avatar, created_at, updated_at, last_login FROM users WHERE COALESCE(is_guest, 0) = 0 ORDER BY created_at DESC',
    );
    let onlineUserIds = new Set<number>();
    try {
      // Lazy require: the ws singleton must not become a load-time dependency.
      const { getOnlineUserIds } = require('../../websocket');
      onlineUserIds = getOnlineUserIds();
    } catch {
      /* */
    }
    return users.map((u) => ({
      ...u,
      avatar_url: avatarUrl(u),
      created_at: utcSuffix(u.created_at),
      updated_at: utcSuffix(u.updated_at as string),
      last_login: utcSuffix(u.last_login),
      online: onlineUserIds.has(u.id),
    }));
  }

  createUser(data: { username: string; email: string; password: string; role?: string }) {
    const username = data.username?.trim();
    const email = data.email?.trim();
    const password = data.password?.trim();

    if (!username || !email || !password) {
      return { error: 'Username, email and password are required', status: 400 };
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.ok) return { error: pwCheck.reason, status: 400 };

    if (data.role && !['user', 'admin'].includes(data.role)) {
      return { error: 'Invalid role', status: 400 };
    }

    // Guests (#1362) live in a reserved synthetic namespace; never let one block a real account.
    const existingUsername = this.db.get('SELECT id FROM users WHERE username = ? AND COALESCE(is_guest, 0) = 0', username);
    if (existingUsername) return { error: 'Username already taken', status: 409 };

    const existingEmail = this.db.get('SELECT id FROM users WHERE email = ? AND COALESCE(is_guest, 0) = 0', email);
    if (existingEmail) return { error: 'Email already taken', status: 409 };

    const passwordHash = bcrypt.hashSync(password, BCRYPT_COST);

    const result = this.db.run(
      'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
      username, email, passwordHash, data.role || 'user',
    );

    const user = this.db.get(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?',
      result.lastInsertRowid,
    );

    return {
      user,
      insertedId: Number(result.lastInsertRowid),
      auditDetails: { username, email, role: data.role || 'user' },
    };
  }

  updateUser(id: string, data: { username?: string; email?: string; role?: string; password?: string }) {
    const username = typeof data.username === 'string' ? data.username.trim() : data.username;
    const email = typeof data.email === 'string' ? data.email.trim() : data.email;
    const { role, password } = data;
    const user = this.db.get<User>('SELECT * FROM users WHERE id = ?', id);

    if (!user) return { error: 'User not found', status: 404 };

    if (role && !['user', 'admin'].includes(role)) {
      return { error: 'Invalid role', status: 400 };
    }

    // An empty string used to fall through `username || null` into COALESCE and
    // silently mean "leave unchanged". Say so instead of pretending it worked.
    if (username === '') return { error: 'Username cannot be empty', status: 400 };
    if (email === '') return { error: 'Email cannot be empty', status: 400 };

    if (username && username !== user.username) {
      const conflict = this.db.get('SELECT id FROM users WHERE username = ? AND id != ? AND COALESCE(is_guest, 0) = 0', username, id);
      if (conflict) return { error: 'Username already taken', status: 409 };
    }
    if (email && email !== user.email) {
      const conflict = this.db.get('SELECT id FROM users WHERE email = ? AND id != ? AND COALESCE(is_guest, 0) = 0', email, id);
      if (conflict) return { error: 'Email already taken', status: 409 };
    }

    if (password) {
      const pwCheck = validatePassword(password);
      if (!pwCheck.ok) return { error: pwCheck.reason, status: 400 };
    }
    const passwordHash = password ? bcrypt.hashSync(password, BCRYPT_COST) : null;

    // Don't let the admin UI demote the last remaining admin — that would leave the
    // instance with no one able to manage it (and on OIDC-only setups, no recovery). #1274
    if (role && role !== 'admin') {
      const current = this.db.get<{ role?: string }>('SELECT role FROM users WHERE id = ?', id);
      if (current?.role === 'admin') {
        const adminCount = this.db.get<{ count: number }>("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")!.count;
        if (adminCount <= 1) return { error: 'Cannot remove the last admin', status: 400 };
      }
    }

    this.db.transaction(() => {
      this.db.run(
        `
    UPDATE users SET
      username = COALESCE(?, username),
      email = COALESCE(?, email),
      role = COALESCE(?, role),
      password_hash = COALESCE(?, password_hash),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `,
        username || null, email || null, role || null, passwordHash, id,
      );
    });

    const updated = this.db.get('SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = ?', id);

    const changed: string[] = [];
    if (username) changed.push('username');
    if (email) changed.push('email');
    if (role) changed.push('role');
    if (password) changed.push('password');

    return {
      user: updated,
      previousEmail: user.email,
      changed,
    };
  }

  deleteUser(id: string, currentUserId: number) {
    if (parseInt(id) === currentUserId) {
      return { error: 'Cannot delete own account', status: 400 };
    }

    const userToDel = this.db.get<{ id: number; email: string }>('SELECT id, email FROM users WHERE id = ?', id);
    if (!userToDel) return { error: 'User not found', status: 404 };

    this.userCleanup.deleteUserCompletely(userToDel.id);
    emitUserDeleted(userToDel.id); // let plugins erase their own per-user data
    return { email: userToDel.email };
  }

  resetUserPasskeys(id: string) { return this.passkeys.adminResetPasskeys(Number(id)); }

  // ── Stats ──────────────────────────────────────────────────────────────────

  getStats() {
    const totalUsers = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM users WHERE COALESCE(is_guest, 0) = 0')!.count;
    const totalTrips = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM trips')!.count;
    const totalPlaces = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM places')!.count;
    const totalFiles = this.db.get<{ count: number }>('SELECT COUNT(*) as count FROM trip_files')!.count;
    return { totalUsers, totalTrips, totalPlaces, totalFiles };
  }

  // ── Permissions ────────────────────────────────────────────────────────────

  getPermissions() {
    const current = this.permissions.getAllPermissions();
    const actions = PERMISSION_ACTIONS.map((a) => ({
      key: a.key,
      level: current[a.key],
      defaultLevel: a.defaultLevel,
      allowedLevels: a.allowedLevels,
    }));
    return { permissions: actions };
  }

  savePermissions(permissions: Record<string, string>) {
    const { skipped } = this.permissions.savePermissions(permissions);
    return { permissions: this.permissions.getAllPermissions(), skipped };
  }

  // ── Audit Log ──────────────────────────────────────────────────────────────

  getAuditLog(query: { limit?: string; offset?: string }) {
    const limitRaw = parseInt(String(query.limit || '100'), 10);
    const offsetRaw = parseInt(String(query.offset || '0'), 10);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 100, 1), 500);
    const offset = Math.max(Number.isFinite(offsetRaw) ? offsetRaw : 0, 0);

    type Row = {
      id: number;
      created_at: string;
      user_id: number | null;
      username: string | null;
      user_email: string | null;
      action: string;
      resource: string | null;
      details: string | null;
      ip: string | null;
    };

    const rows = this.db.all<Row>(
      `
    SELECT a.id, a.created_at, a.user_id, u.username, u.email as user_email, a.action, a.resource, a.details, a.ip
    FROM audit_log a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.id DESC
    LIMIT ? OFFSET ?
  `,
      limit, offset,
    );

    const total = this.db.get<{ c: number }>('SELECT COUNT(*) as c FROM audit_log')!.c;

    const entries = rows.map((r) => {
      // Unparseable details fall back to the raw string rather than the old
      // { _parse_error: true } sentinel, which the admin UI rendered literally.
      let details: Record<string, unknown> | string | null = null;
      if (r.details) {
        try {
          details = JSON.parse(r.details) as Record<string, unknown>;
        } catch {
          details = r.details;
        }
      }
      const created_at =
        r.created_at && !r.created_at.endsWith('Z') ? r.created_at.replace(' ', 'T') + 'Z' : r.created_at;
      return { ...r, created_at, details };
    });

    return { entries, total, limit, offset };
  }


  // ── Demo Baseline ──────────────────────────────────────────────────────────

  saveDemoBaseline(): { error?: string; status?: number; message?: string } {
    if (!readEnv().demo.enabled) {
      return { error: 'Not found', status: 404 };
    }
    try {
      // Lazy require: demo-reset is a demo-only module.
      const { saveBaseline } = require('../../demo/demo-reset');
      saveBaseline();
      return { message: 'Demo baseline saved. Hourly resets will restore to this state.' };
    } catch (err: unknown) {
      console.error(err);
      return { error: 'Failed to save baseline', status: 500 };
    }
  }

  // ── GitHub Integration ─────────────────────────────────────────────────────

  /**
   * GitHub fetch with the timeout + size cap the outbound-fetch rule requires
   * (server/CLAUDE.md). Returns null on any failure; callers decide the fallback.
   */
  private async fetchGithub(url: string): Promise<unknown | null> {
    try {
      const resp = await fetch(url, {
        headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'TREK-Server' },
        signal: AbortSignal.timeout(GITHUB_TIMEOUT_MS),
      });
      if (!resp.ok) return null;
      const text = await resp.text();
      if (text.length > GITHUB_MAX_BYTES) {
        console.error(`[admin] GitHub response exceeded ${GITHUB_MAX_BYTES} bytes, ignoring`);
        return null;
      }
      return JSON.parse(text);
    } catch (err: unknown) {
      console.error(`[admin] GitHub request failed: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  async getGithubReleases(perPage: string = '10', page: string = '1') {
    const data = await this.fetchGithub(
      `https://api.github.com/repos/liketrek/TREK/releases?per_page=${perPage}&page=${page}`,
    );
    return Array.isArray(data) ? data : [];
  }

  async checkVersion(): Promise<VersionInfo> {
    const cached = readVersionCache();
    if (cached) return cached;

    // Lazy require, re-anchored for nest/admin/ (was ../../package.json in services/).
    const currentVersion: string = readEnv().app.appVersion || require('../../../package.json').version;
    const isPrerelease = currentVersion.includes('-pre.');
    const fallback: VersionInfo = {
      current: currentVersion,
      latest: currentVersion,
      update_available: false,
      is_docker: isDocker,
      is_prerelease: isPrerelease,
    };

    // Failures cache too (on a shorter TTL), so a GitHub outage doesn't mean a
    // live fetch on every admin page load — the legacy code only cached success.
    const fail = () => {
      writeVersionCache(fallback, VERSION_FAILURE_TTL);
      return fallback;
    };

    let result: VersionInfo;
    if (isPrerelease) {
      // Fetch release list and find the newest prerelease
      const data = await this.fetchGithub('https://api.github.com/repos/liketrek/TREK/releases?per_page=100') as
        | Array<{ tag_name?: string; html_url?: string; prerelease?: boolean }>
        | null;
      if (!data) return fail();
      const prereleases = Array.isArray(data) ? data.filter((r) => r.prerelease) : [];
      if (!prereleases.length) return fail();
      // Pre-compute stripped versions, then sort descending
      const tagged = prereleases.map((r) => ({ r, v: (r.tag_name || '').replace(/^v/, '') }));
      tagged.sort((a, b) => compareVersions(b.v, a.v));
      const latest = tagged[0].v;
      const update_available = !!latest && latest !== currentVersion && compareVersions(latest, currentVersion) > 0;
      result = {
        current: currentVersion,
        latest,
        update_available,
        release_url: tagged[0].r.html_url || '',
        is_docker: isDocker,
        is_prerelease: true,
      };
    } else {
      const data = await this.fetchGithub('https://api.github.com/repos/liketrek/TREK/releases/latest') as
        | { tag_name?: string; html_url?: string }
        | null;
      if (!data) return fail();
      const latest = (data.tag_name || '').replace(/^v/, '');
      const update_available = !!latest && latest !== currentVersion && compareVersions(latest, currentVersion) > 0;
      result = {
        current: currentVersion,
        latest,
        update_available,
        release_url: data.html_url || '',
        is_docker: isDocker,
        is_prerelease: false,
      };
    }

    writeVersionCache(result);
    return result;
  }

  async checkAndNotifyVersion(): Promise<void> {
    try {
      const result = await this.checkVersion();
      if (!result.update_available) return;

      const lastNotified = this.db.get<{ value: string }>(
        'SELECT value FROM app_settings WHERE key = ?', 'last_notified_version',
      )?.value;
      if (lastNotified === result.latest) return;

      this.db.run(
        'INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)',
        'last_notified_version', result.latest,
      );

      await this.notifications.send({
        event: 'version_available',
        actorId: null,
        scope: 'admin',
        targetId: 0,
        params: { version: result.latest },
      });
    } catch {
      // Silently ignore — version check is non-critical
    }
  }

  // ── Invite Tokens ──────────────────────────────────────────────────────────

  listInvites() {
    return this.db.all(`
    SELECT i.*, u.username as created_by_name, t.title as trip_title
    FROM invite_tokens i
    JOIN users u ON i.created_by = u.id
    LEFT JOIN trips t ON i.trip_id = t.id
    ORDER BY i.created_at DESC
  `);
  }

  /** Trips an admin can bind an invite to — id + title only, for the picker (#1402). */
  listTripsForInvite() {
    return this.db.all('SELECT id, title FROM trips ORDER BY title COLLATE NOCASE ASC');
  }

  createInvite(
    createdBy: number,
    data: { max_uses?: string | number; expires_in_days?: string | number; trip_id?: string | number | null },
  ) {
    const rawUses = parseInt(String(data.max_uses));
    const uses = rawUses === 0 ? 0 : Math.min(Math.max(rawUses || 1, 1), 5);
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = data.expires_in_days
      ? new Date(Date.now() + parseInt(String(data.expires_in_days)) * 86400000).toISOString()
      : null;

    // Optional trip binding: only persist a trip that actually exists, so a stale
    // or forged id can never bind (and never auto-adds anyone on registration).
    let tripId: number | null = null;
    if (data.trip_id != null && String(data.trip_id).trim() !== '') {
      const parsed = parseInt(String(data.trip_id));
      if (!Number.isInteger(parsed) || !this.db.get('SELECT id FROM trips WHERE id = ?', parsed)) {
        // Used to bind null silently, handing back a plain registration invite
        // the admin never asked for.
        return { error: 'Trip not found', status: 404 };
      }
      tripId = parsed;
    }

    const ins = this.db.run(
      'INSERT INTO invite_tokens (token, max_uses, expires_at, created_by, trip_id) VALUES (?, ?, ?, ?, ?)',
      token, uses, expiresAt, createdBy, tripId,
    );

    const inviteId = Number(ins.lastInsertRowid);
    const invite = this.db.get(`
    SELECT i.*, u.username as created_by_name, t.title as trip_title
    FROM invite_tokens i
    JOIN users u ON i.created_by = u.id
    LEFT JOIN trips t ON i.trip_id = t.id
    WHERE i.id = ?
  `, inviteId);

    return { invite, inviteId, uses, expiresInDays: data.expires_in_days ?? null, tripId };
  }

  deleteInvite(id: string) {
    const invite = this.db.get('SELECT id FROM invite_tokens WHERE id = ?', id);
    if (!invite) return { error: 'Invite not found', status: 404 };
    this.db.run('DELETE FROM invite_tokens WHERE id = ?', id);
    return {};
  }

  // ── Addons ─────────────────────────────────────────────────────────────────

  listAddons() {
    const addons = this.db.all<Addon>('SELECT * FROM addons ORDER BY sort_order, id');
    const providers = this.db.all<{
      id: string;
      name: string;
      description?: string | null;
      icon: string;
      enabled: number;
      sort_order: number;
    }>(`
    SELECT id, name, description, icon, enabled, sort_order
    FROM photo_providers
    ORDER BY sort_order, id
  `);
    const fields = this.db.all<{
      provider_id: string;
      field_key: string;
      label: string;
      input_type: string;
      placeholder?: string | null;
      required: number;
      secret: number;
      settings_key?: string | null;
      payload_key?: string | null;
      sort_order: number;
    }>(`
    SELECT provider_id, field_key, label, input_type, placeholder, required, secret, settings_key, payload_key, sort_order
    FROM photo_provider_fields
    ORDER BY sort_order, id
  `);
    const fieldsByProvider = new Map<string, typeof fields>();
    for (const field of fields) {
      const arr = fieldsByProvider.get(field.provider_id) || [];
      arr.push(field);
      fieldsByProvider.set(field.provider_id, arr);
    }

    return [
      ...addons.map((a) => ({
        ...a,
        enabled: !!a.enabled,
        config:
          a.id === ADDON_IDS.LLM_PARSING
            ? maskLlmAddonConfig(JSON.parse(a.config || '{}'))
            : JSON.parse(a.config || '{}'),
      })),
      ...providers.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: 'photo_provider',
        icon: p.icon,
        enabled: !!p.enabled,
        config: getPhotoProviderConfig(p.id),
        fields: (fieldsByProvider.get(p.id) || []).map((f) => ({
          key: f.field_key,
          label: f.label,
          input_type: f.input_type,
          placeholder: f.placeholder || '',
          required: !!f.required,
          secret: !!f.secret,
          settings_key: f.settings_key || null,
          payload_key: f.payload_key || null,
          sort_order: f.sort_order,
        })),
        sort_order: p.sort_order,
      })),
    ];
  }

  updateAddon(id: string, data: { enabled?: boolean; config?: Record<string, unknown> }) {
    type ProviderRow = { id: string; name: string; description?: string | null; icon: string; enabled: number; sort_order: number };
    const addon = this.db.get<Addon>('SELECT * FROM addons WHERE id = ?', id);
    const provider = this.db.get<ProviderRow>('SELECT * FROM photo_providers WHERE id = ?', id);
    if (!addon && !provider) return { error: 'Addon not found', status: 404 };

    this.db.transaction(() => {
    if (addon) {
      if (data.enabled !== undefined)
        this.db.run('UPDATE addons SET enabled = ? WHERE id = ?', data.enabled ? 1 : 0, id);
      if (data.config !== undefined) {
        // The AI-parsing addon holds an API key — encrypt it at rest and preserve
        // the stored key when the client echoes the mask sentinel (see llmConfig.ts).
        const configToStore =
          id === ADDON_IDS.LLM_PARSING
            ? prepareLlmAddonConfigForWrite(data.config, JSON.parse(addon.config || '{}'))
            : data.config;
        this.db.run('UPDATE addons SET config = ? WHERE id = ?', JSON.stringify(configToStore), id);
      }
    } else {
      if (data.enabled !== undefined)
        this.db.run('UPDATE photo_providers SET enabled = ? WHERE id = ?', data.enabled ? 1 : 0, id);
    }
    });

    const updatedAddon = this.db.get<Addon>('SELECT * FROM addons WHERE id = ?', id);
    const updatedProvider = this.db.get<ProviderRow>('SELECT * FROM photo_providers WHERE id = ?', id);
    const updated = updatedAddon
      ? {
          ...updatedAddon,
          enabled: !!updatedAddon.enabled,
          config:
            updatedAddon.id === ADDON_IDS.LLM_PARSING
              ? maskLlmAddonConfig(JSON.parse(updatedAddon.config || '{}'))
              : JSON.parse(updatedAddon.config || '{}'),
        }
      : updatedProvider
        ? {
            id: updatedProvider.id,
            name: updatedProvider.name,
            description: updatedProvider.description,
            type: 'photo_provider',
            icon: updatedProvider.icon,
            enabled: !!updatedProvider.enabled,
            config: getPhotoProviderConfig(updatedProvider.id),
            sort_order: updatedProvider.sort_order,
          }
        : null;

    // Only these addons gate MCP tool/resource/prompt registration (see
    // registerTools/registerResources) — and only a real enabled-flip changes
    // what a session would register. Config-only saves, photo providers and
    // MCP-irrelevant addons must not tear down every live session (#1414).
    const MCP_RELEVANT_ADDONS = new Set<string>([
      ADDON_IDS.MCP,
      ADDON_IDS.PACKING,
      ADDON_IDS.BUDGET,
      ADDON_IDS.COLLAB,
      ADDON_IDS.ATLAS,
      ADDON_IDS.VACAY,
      ADDON_IDS.JOURNEY,
    ]);
    const enabledChanged = !!addon && data.enabled !== undefined && (data.enabled ? 1 : 0) !== addon.enabled;

    return {
      addon: updated,
      mcpAffected: enabledChanged && MCP_RELEVANT_ADDONS.has(id),
      auditDetails: {
        enabled: data.enabled !== undefined ? !!data.enabled : undefined,
        config_changed: data.config !== undefined,
      },
    };
  }

  // ── OAuth Sessions ─────────────────────────────────────────────────────────

  listOAuthSessions() {
    const rows = this.db.all<Record<string, unknown> & { scopes: string }>(`
    SELECT ot.id, ot.client_id, oc.name AS client_name, ot.user_id, u.username,
           ot.scopes, ot.access_token_expires_at, ot.refresh_token_expires_at, ot.created_at
    FROM oauth_tokens ot
    JOIN oauth_clients oc ON ot.client_id = oc.client_id
    JOIN users u ON u.id = ot.user_id
    WHERE ot.revoked_at IS NULL
      AND ot.refresh_token_expires_at > CURRENT_TIMESTAMP
    ORDER BY ot.created_at DESC
  `);
    // One malformed row must not 500 the whole admin OAuth-sessions panel.
    return rows.map((r) => {
      let scopes: unknown;
      try {
        scopes = JSON.parse(r.scopes);
      } catch {
        scopes = null;
      }
      return { ...r, scopes };
    });
  }

  revokeOAuthSession(id: string) {
    const row = this.db.get<{ id: number; user_id: number; client_id: string }>(
      'SELECT id, user_id, client_id FROM oauth_tokens WHERE id = ?', id,
    );
    if (!row) return { error: 'Session not found', status: 404 };
    this.db.run('UPDATE oauth_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?', id);
    revokeUserSessionsForClient(row.user_id, row.client_id);
    return {};
  }

  // ── JWT Rotation ───────────────────────────────────────────────────────────

  rotateJwtSecret(): { error?: string; status?: number } {
    const newSecret = crypto.randomBytes(32).toString('hex');
    // Re-anchored one directory deeper for nest/admin/ (was '../../data' in services/).
    const dataDir = path.resolve(__dirname, '../../../data');
    const secretFile = path.join(dataDir, '.jwt_secret');
    try {
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(secretFile, newSecret, { mode: 0o600 });
    } catch {
      return { error: 'Failed to persist new JWT secret to disk', status: 500 };
    }
    updateJwtSecret(newSecret);
    return {};
  }

  invalidateMcpSessions() { invalidateMcpSessions(); }

  // ── Settings + notification preference helpers (non-admin-service modules) ──

}
