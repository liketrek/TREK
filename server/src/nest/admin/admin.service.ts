import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@mikro-orm/nestjs';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ADDON_IDS, MCP_GATED_ADDON_IDS } from '../../addons';
import { readEnv } from '../../app-config';
import { updateJwtSecret } from '../../config';
// Import from sessionManager directly, NOT the ../../mcp barrel — the direct
// path keeps this module's graph minimal, and the split predates the barrel's
// shrink to process-wide state. The invalidateMcpSessions barrel import below
// is deliberately separate: it is only reached from the controller, never from
// the cron path.
import { revokeUserSessions, revokeUserSessionsForClient } from '../../mcp/sessionManager';
import { invalidateMcpSessions } from '../../mcp';
import { emitUserDeleted } from '../../plugin-user-lifecycle';
import { maybe_encrypt_api_key, decrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { avatarUrl } from '../common/avatarUrl';
import { prepareLlmAddonConfigForWrite, maskLlmAddonConfig } from '../llm-parse/llm-config';
import { getPhotoProviderConfig } from '../memories/memories.helpers';
import { validatePassword } from '../common/passwordPolicy';
import { UserCleanupService } from '../auth/user-cleanup.service';
import { UnitOfWork } from '../database/unit-of-work';
import { AddonsService } from '../addons/addons.service';
import { RealtimeService } from '../realtime/realtime.service';
import { PasskeyService } from '../auth/passkey.service';
import { AuthService } from '../auth/auth.service';
import { PermissionsService } from '../permissions/permissions.service';
import { PERMISSION_ACTIONS } from '../permissions/permissions.service';
import { NotificationsService } from '../notifications/notifications.service';
import { Users } from '../../db/entities/Users.entity';
import type { UsersRepository, AdminEditPatch } from '../../db/repositories/Users.repository';
import { AuditLog } from '../../db/entities/AuditLog.entity';
import type { AuditLogRepository } from '../../db/repositories/AuditLog.repository';
import { AppSettings } from '../../db/entities/AppSettings.entity';
import type { AppSettingsRepository } from '../../db/repositories/AppSettings.repository';
import { Addons } from '../../db/entities/Addons.entity';
import type { AddonsRepository } from '../../db/repositories/Addons.repository';
import { PhotoProviders } from '../../db/entities/PhotoProviders.entity';
import type { PhotoProvidersRepository } from '../../db/repositories/PhotoProviders.repository';
import { PhotoProviderFields } from '../../db/entities/PhotoProviderFields.entity';
import type { PhotoProviderFieldsRepository } from '../../db/repositories/PhotoProviderFields.repository';
import { DocumentProviders } from '../../db/entities/DocumentProviders.entity';
import type { DocumentProvidersRepository } from '../../db/repositories/DocumentProviders.repository';
import { McpTokens } from '../../db/entities/McpTokens.entity';
import type { McpTokensRepository } from '../../db/repositories/McpTokens.repository';
import { OauthTokens } from '../../db/entities/OauthTokens.entity';
import type { OauthTokensRepository } from '../../db/repositories/OauthTokens.repository';
import { Trips } from '../../db/entities/Trips.entity';
import type { TripsRepository } from '../../db/repositories/Trips.repository';
import { Places } from '../../db/entities/Places.entity';
import type { PlacesRepository } from '../../db/repositories/Places.repository';
import { TripFiles } from '../../db/entities/TripFiles.entity';
import type { TripFilesRepository } from '../../db/repositories/TripFiles.repository';
import { PushSubscriptions } from '../../db/entities/PushSubscriptions.entity';
import type { PushSubscriptionsRepository } from '../../db/repositories/PushSubscriptions.repository';
import type { AddonConfig } from '../../db/entities/Addons.entity';
import {
  BCRYPT_COST,
  compareVersions,
  isDocker,
  readVersionCache,
  utcSuffix,
  writeVersionCache,
  type VersionInfo,
} from './admin.helpers';
import { MANAGED_FORBIDDEN_ERROR } from '../common/managed';

/** Outbound GitHub calls: hard timeout and response-size cap (server/CLAUDE.md). */
const GITHUB_TIMEOUT_MS = 10_000;
const GITHUB_MAX_BYTES = 2_000_000;
/** Failed version checks cache briefly so an outage isn't refetched per page load. */
const VERSION_FAILURE_TTL = 60_000;

/**
 * Admin domain service — owns admin's data access (folded from the legacy
 * services/adminService.ts with the 2026-08 migration, converted onto
 * repositories by Plan 3i Task 1): user CRUD, instance stats, the permission
 * matrix, the audit-log read side, OIDC settings, the demo baseline, GitHub
 * release/version checks, invite tokens, the three places feature toggles,
 * addons + photo providers, MCP tokens, OAuth sessions and JWT rotation.
 *
 * Every quirk stays byte-for-byte: the `||` falsy defaults (never `??`),
 * post-insert/post-update re-selects instead of RETURNING, the COALESCE-shaped
 * partial update (now a repository call that omits unchanged keys — the same
 * net effect), the #1362 guest exclusions and the exact error strings. The
 * legacy `{ error, status }` envelope is the return contract — the
 * controller's `ok()` helper turns it into an HttpException, so nothing here
 * throws.
 *
 * The three self-protection invariants (own-account delete, own-MFA reset,
 * last-admin demote) stay exactly where the legacy had them: plain JS
 * comparisons in this service, never folded into a repository method's WHERE
 * clause (R4).
 *
 * The bag-tracking/collab-feature toggles, user defaults, passkey reset and
 * packing templates delegate to the services that own those tables. The pure
 * and module-scoped pieces (compareVersions, isDocker, the version cache) live
 * in admin.helpers.ts.
 */
@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Users) private readonly users: UsersRepository,
    @InjectRepository(AuditLog) private readonly auditLog: AuditLogRepository,
    @InjectRepository(AppSettings) private readonly appSettings: AppSettingsRepository,
    @InjectRepository(Addons) private readonly addonsRepo: AddonsRepository,
    @InjectRepository(PhotoProviders) private readonly photoProviders: PhotoProvidersRepository,
    @InjectRepository(PhotoProviderFields) private readonly photoProviderFields: PhotoProviderFieldsRepository,
    @InjectRepository(DocumentProviders) private readonly documentProviders: DocumentProvidersRepository,
    @InjectRepository(McpTokens) private readonly mcpTokens: McpTokensRepository,
    @InjectRepository(OauthTokens) private readonly oauthTokens: OauthTokensRepository,
    @InjectRepository(Trips) private readonly trips: TripsRepository,
    @InjectRepository(Places) private readonly places: PlacesRepository,
    @InjectRepository(TripFiles) private readonly tripFiles: TripFilesRepository,
    @InjectRepository(PushSubscriptions) private readonly pushSubscriptions: PushSubscriptionsRepository,
    private readonly addons: AddonsService,
    private readonly passkeys: PasskeyService,
    private readonly auth: AuthService,
    private readonly permissions: PermissionsService,
    private readonly notifications: NotificationsService,
    private readonly userCleanup: UserCleanupService,
    private readonly realtime: RealtimeService,
    private readonly uow: UnitOfWork,
  ) {}

  // ── User CRUD ──────────────────────────────────────────────────────────────

  async listUsers() {
    // Guests (#1362) are accountless trip participants, not real users — keep them out
    // of admin user management entirely.
    const users = await this.users.listForAdmin();
    let onlineUserIds = new Set<number>();
    try {
      // The catch stays here rather than in the facade: an admin list that shows
      // everyone as offline is a better answer than a 500, and that judgement
      // belongs to this caller, not to every future one.
      onlineUserIds = this.realtime.getOnlineUserIds();
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

  async createUser(data: { username: string; email: string; password: string; role?: string }) {
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
    const existingUsername = await this.users.findIdByUsernameExact(username);
    if (existingUsername) return { error: 'Username already taken', status: 409 };

    const existingEmail = await this.users.findIdByEmailExact(email);
    if (existingEmail) return { error: 'Email already taken', status: 409 };

    const passwordHash = bcrypt.hashSync(password, BCRYPT_COST);

    const insertedId = await this.users.insertAdminCreatedUser({
      username, email, password_hash: passwordHash, role: data.role || 'user',
    });

    const user = await this.users.findAdminSummary(insertedId);

    return {
      user,
      insertedId,
      auditDetails: { username, email, role: data.role || 'user' },
    };
  }

  async updateUser(id: string, data: { username?: string; email?: string; role?: string; password?: string }) {
    const userId = Number(id);
    const username = typeof data.username === 'string' ? data.username.trim() : data.username;
    const email = typeof data.email === 'string' ? data.email.trim() : data.email;
    const { role, password } = data;
    const user = await this.users.findById(userId);

    if (!user) return { error: 'User not found', status: 404 };

    if (role && !['user', 'admin'].includes(role)) {
      return { error: 'Invalid role', status: 400 };
    }

    // An empty string used to fall through `username || null` into COALESCE and
    // silently mean "leave unchanged". Say so instead of pretending it worked.
    if (username === '') return { error: 'Username cannot be empty', status: 400 };
    if (email === '') return { error: 'Email cannot be empty', status: 400 };

    if (username && username !== user.username) {
      const conflict = await this.users.findIdByUsernameExactExcluding(username, userId);
      if (conflict) return { error: 'Username already taken', status: 409 };
    }
    if (email && email !== user.email) {
      const conflict = await this.users.findIdByEmailExactExcluding(email, userId);
      if (conflict) return { error: 'Email already taken', status: 409 };
    }

    if (password) {
      const pwCheck = validatePassword(password);
      if (!pwCheck.ok) return { error: pwCheck.reason, status: 400 };
    }
    const passwordHash = password ? bcrypt.hashSync(password, BCRYPT_COST) : null;

    // Don't let the admin UI demote the last remaining admin — that would leave the
    // instance with no one able to manage it (and on OIDC-only setups, no recovery). #1274
    // SECURITY: plain JS comparisons, deliberately never folded into a
    // repository method's WHERE clause (R4) — two repository reads, one
    // service-level `if`.
    if (role && role !== 'admin') {
      const currentRole = await this.users.getRole(userId);
      if (currentRole === 'admin') {
        const adminCount = await this.users.countAdmins();
        if (adminCount <= 1) return { error: 'Cannot remove the last admin', status: 400 };
      }
    }

    // An admin sets a password for exactly one reason: the account is believed
    // compromised. Without bumping password_version, verifyJwtAndLoadUser keeps
    // accepting every cookie the intruder already holds, so the one action taken
    // to lock them out was the one action that did not. Both self-service paths
    // (changePassword, resetPassword) have always done this; this one had not.
    const newPv = password ? (user.password_version ?? 0) + 1 : null;

    const patch: AdminEditPatch = {};
    if (username) patch.username = username;
    if (email) patch.email = email;
    if (role) patch.role = role;
    if (password) {
      patch.password_hash = passwordHash!;
      patch.password_version = newPv!;
    }

    // The password-reset transaction's CURRENT boundary, preserved exactly
    // (R4): the users UPDATE, the mcp_tokens DELETE, the oauth_tokens revoke
    // and the push_subscriptions DELETE stay inside the SAME uow.transactional
    // call, never split across separate un-transacted repository calls.
    await this.uow.transactional(async () => {
      await this.users.applyAdminEdit(userId, patch);

      if (password) {
        // The version bump only invalidates JWT cookies. These two stores carry
        // their own credentials and are revoked separately, exactly as the
        // self-service paths do it.
        await this.mcpTokens.deleteAllForUser(userId);
        try {
          await this.oauthTokens.revokeAllForUser(userId);
        } catch { /* very old installs predate oauth_tokens */ }
        // Push devices outlive every session, so the intruder's browser would
        // keep receiving this account's notifications. They go with the rest.
        await this.pushSubscriptions.deleteAllForUser(userId);
      }
    });

    if (password) {
      try { revokeUserSessions(Number(id)); } catch { /* best-effort, same as elsewhere */ }
    }

    const updated = await this.users.findAdminSummary(userId);

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

  async deleteUser(id: string, currentUserId: number) {
    // SECURITY: plain JS comparison, deliberately kept exactly here — never
    // folded into a repository method's WHERE clause (R4).
    if (Number.parseInt(id) === currentUserId) {
      return { error: 'Cannot delete own account', status: 400 };
    }

    const userToDel = await this.users.findIdAndEmail(Number(id));
    if (!userToDel) return { error: 'User not found', status: 404 };

    await this.userCleanup.deleteUserCompletely(userToDel.id);
    await emitUserDeleted(userToDel.id); // let plugins erase their own per-user data
    return { email: userToDel.email };
  }

  resetUserPasskeys(id: string) { return this.passkeys.adminResetPasskeys(Number(id)); }

  /**
   * Clear another account's TOTP so its owner can enrol again.
   *
   * The passkey half of this has existed since passkeys landed; the TOTP half
   * never did, which left one ordinary event with no answer: somebody on a trip
   * loses their phone. Without this the only ways out are an operator reaching
   * into the database or the account being deleted and rebuilt.
   *
   * Never for the caller themselves. An admin who wants their own MFA gone
   * disables it through Settings, where the current password is required —
   * making that reachable from here would turn a stolen admin session into a
   * way to strip the second factor off the very account it came from.
   */
  async resetUserMfa(id: string, actingUserId: number): Promise<{ error?: string; status?: number; success?: boolean; email?: string }> {
    const targetId = Number(id);
    // SECURITY: plain JS comparison, deliberately kept exactly here — never
    // folded into a repository method's WHERE clause (R4).
    if (targetId === actingUserId) {
      return { error: 'Use Settings to change your own two-factor setup', status: 400 };
    }
    const target = await this.users.findIdEmailMfaEnabled(targetId);
    if (!target) return { error: 'User not found', status: 404 };

    // Same three columns disableMfa clears, so an admin reset and a self-service
    // disable leave the account in exactly one state rather than two.
    await this.users.disableMfa(targetId);

    return { success: true, email: target.email };
  }

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getStats() {
    const totalUsers = await this.users.countNonGuest();
    const totalTrips = await this.trips.count();
    const totalPlaces = await this.places.count();
    const totalFiles = await this.tripFiles.count();
    return { totalUsers, totalTrips, totalPlaces, totalFiles };
  }

  // ── Permissions ────────────────────────────────────────────────────────────

  async getPermissions() {
    const current = await this.permissions.getAllPermissions();
    const actions = PERMISSION_ACTIONS.map((a) => ({
      key: a.key,
      level: current[a.key],
      defaultLevel: a.defaultLevel,
      allowedLevels: a.allowedLevels,
    }));
    return { permissions: actions };
  }

  async savePermissions(permissions: Record<string, string>) {
    const { skipped } = await this.permissions.savePermissions(permissions);
    return { permissions: await this.permissions.getAllPermissions(), skipped };
  }

  // ── Audit Log ──────────────────────────────────────────────────────────────

  async getAuditLog(query: { limit?: string; offset?: string }) {
    const limitRaw = Number.parseInt(String(query.limit || '100'), 10);
    const offsetRaw = Number.parseInt(String(query.offset || '0'), 10);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 100, 1), 500);
    const offset = Math.max(Number.isFinite(offsetRaw) ? offsetRaw : 0, 0);

    const rows = await this.auditLog.listPage(limit, offset);
    const total = await this.auditLog.count();

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

  async saveDemoBaseline(): Promise<{ error?: string; status?: number; message?: string }> {
    if (!readEnv().demo.enabled) {
      return { error: 'Not found', status: 404 };
    }
    try {
      // Lazy require: demo-reset is a demo-only module.
      const { saveBaseline } = require('../../demo/demo-reset');
      await saveBaseline();
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
    // The query arrives as raw strings from the admin UI; clamp to what the
    // GitHub API accepts instead of interpolating them into the URL as given.
    const per = Math.min(Math.max(Number.parseInt(perPage, 10) || 10, 1), 100);
    const pg = Math.max(Number.parseInt(page, 10) || 1, 1);
    const qs = new URLSearchParams({ per_page: String(per), page: String(pg) });
    const data = await this.fetchGithub(`https://api.github.com/repos/liketrek/TREK/releases?${qs}`);
    return Array.isArray(data) ? data : [];
  }

  async checkVersion(): Promise<VersionInfo> {
    // Lazy require, re-anchored for nest/admin/ (was ../../package.json in services/).
    const currentVersion: string = readEnv().app.appVersion || require('../../../package.json').version;
    const isPrerelease = currentVersion.includes('-pre.');

    // Answered rather than refused on a centrally administered install: the admin
    // page calls this on open, and a 403 there would be an error message where a
    // quiet surface belongs. The operator decides when to upgrade, so from inside
    // the instance there is nothing available.
    if (readEnv().managed.enabled) {
      return {
        current: currentVersion,
        latest: currentVersion,
        update_available: false,
        is_docker: isDocker,
        is_prerelease: isPrerelease,
      };
    }

    const cached = readVersionCache();
    if (cached) return cached;
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

      const lastNotified = await this.appSettings.getValue('last_notified_version');
      if (lastNotified === result.latest) return;

      // INSERT OR REPLACE shape — the SAME dialect storage's `upsertOrReplace`
      // (Plan 3i Task 2, SS1) already added to AppSettingsRepository, reused
      // here rather than adding a second method for the identical SQL text
      // (`INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`).
      await this.appSettings.upsertOrReplace('last_notified_version', result.latest);

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

  // ── Addons ─────────────────────────────────────────────────────────────────

  async listAddons() {
    const addons = (await this.addonsRepo.listAllOrdered())
      // Hidden rather than shown-and-refused, because a toggle that answers 403
      // is worse than no toggle.
      //
      // AI parsing: the endpoint, the model and what a document costs all belong
      // to the operator, so there is no instance decision left to make — not even
      // whether it runs.
      //
      // AirTrail and Dawarich: both addons exist to reach a server the admin
      // runs themselves, and a managed instance has no route to one.
      .filter(
        (a) =>
          !(
            readEnv().managed.enabled &&
            (a.id === ADDON_IDS.LLM_PARSING ||
              a.id === ADDON_IDS.AIRTRAIL ||
              a.id === ADDON_IDS.DAWARICH)
          ),
      );
    const providers = (await this.photoProviders.listAllOrdered())
      // Immich and Synology Photos are servers the admin runs at home. A managed
      // instance cannot reach one (its egress does not go there, and it should
      // not), so offering the connection would only produce a timeout.
      .filter(() => !readEnv().managed.enabled);
    const fields = await this.photoProviderFields.listAllOrderedForAdminShelf();
    const fieldsByProvider = new Map<string, typeof fields>();
    for (const field of fields) {
      const arr = fieldsByProvider.get(field.provider_id) || [];
      arr.push(field);
      fieldsByProvider.set(field.provider_id, arr);
    }

    // Document providers are the Documents addon's shelf rows, the same way
    // photo providers are Journey's. Hidden on a managed instance for the same
    // reason: Paperless, Papra, Nextcloud, OpenCloud and a Synology NAS are all
    // servers the admin runs at home, and a hosted TREK has no route to one.
    //
    // They carry no `config` routes, unlike photo providers: the credentials do
    // not belong to a user here but to a trip, so they are entered in the trip
    // rather than in settings. The admin decides only whether a provider may be
    // offered at all.
    const docProviders = (await this.documentProviders.listAllOrdered())
      .filter(() => !readEnv().managed.enabled);

    return [
      ...addons.map((a) => ({
        ...a,
        enabled: !!a.enabled,
        config:
          a.id === ADDON_IDS.LLM_PARSING
            ? maskLlmAddonConfig(a.config ?? {})
            : (a.config ?? {}),
      })),
      ...providers.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: 'photo_provider',
        icon: p.icon,
        enabled: !!p.enabled,
        config: getPhotoProviderConfig(p.id!),
        fields: (fieldsByProvider.get(p.id!) || []).map((f) => ({
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
      ...docProviders.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        type: 'document_provider',
        icon: p.icon,
        enabled: !!p.enabled,
        config: {},
        fields: [],
        sort_order: p.sort_order,
      })),
    ];
  }

  async updateAddon(id: string, data: { enabled?: boolean; config?: Record<string, unknown> }) {
    const addon = await this.addonsRepo.findById(id);
    const provider = await this.photoProviders.findById(id);
    const docProvider = await this.documentProviders.findById(id);
    if (!addon && !provider && !docProvider) return { error: 'Addon not found', status: 404 };

    // The whole addon, not just its config: on a centrally administered install
    // the operator owns the endpoint, the model and the per-document cost, so
    // there is nothing here for an instance admin to set — including whether it
    // runs at all. listAddons hides the row; this closes the route behind it.
    if (readEnv().managed.enabled && id === ADDON_IDS.LLM_PARSING) {
      return { error: MANAGED_FORBIDDEN_ERROR.error, status: 403 };
    }

    // Photo providers are Journey's shelf rows — their whole UI lives inside
    // journeys, so enabling one under a disabled journey addon would only
    // advertise an integration nothing can reach.
    if (provider && data.enabled === true && !(await this.addons.isAddonEnabled(ADDON_IDS.JOURNEY))) {
      return { error: 'Enable the Journey addon first', status: 409 };
    }

    // Same rule one shelf down: a document provider only exists to serve the
    // file manager, so switching one on under a disabled Documents addon would
    // advertise a sync nothing can reach.
    if (docProvider && data.enabled === true && !(await this.addons.isAddonEnabled(ADDON_IDS.DOCUMENTS))) {
      return { error: 'Enable the Documents addon first', status: 409 };
    }

    await this.uow.transactional(async () => {
      if (addon) {
        if (data.enabled !== undefined) {
          await this.addonsRepo.setEnabled(id, !!data.enabled);
          // Journey off takes its providers with it: a row left enabled would
          // resurface the moment journey returns, which nobody switched on.
          if (id === ADDON_IDS.JOURNEY && !data.enabled)
            await this.photoProviders.disableAll();
          // Documents off takes its providers with it, for the reason above: a
          // row left enabled would resurface the moment the addon returns.
          if (id === ADDON_IDS.DOCUMENTS && !data.enabled)
            await this.documentProviders.disableAll();
        }
        if (data.config !== undefined) {
          // The AI-parsing addon holds an API key — encrypt it at rest and preserve
          // the stored key when the client echoes the mask sentinel (see llmConfig.ts).
          const configToStore =
            id === ADDON_IDS.LLM_PARSING
              ? prepareLlmAddonConfigForWrite(data.config, addon.config ?? {})
              : data.config;
          await this.addonsRepo.setConfig(id, configToStore as AddonConfig);
        }
      } else if (provider) {
        if (data.enabled !== undefined)
          await this.photoProviders.setEnabled(id, data.enabled ? 1 : 0);
      } else {
        if (data.enabled !== undefined)
          await this.documentProviders.setEnabled(id, data.enabled ? 1 : 0);
      }
    });

    const updatedAddon = await this.addonsRepo.findById(id);
    const updatedProvider = await this.photoProviders.findById(id);
    const updated = updatedAddon
      ? {
          ...updatedAddon,
          enabled: !!updatedAddon.enabled,
          config:
            updatedAddon.id === ADDON_IDS.LLM_PARSING
              ? maskLlmAddonConfig(updatedAddon.config ?? {})
              : (updatedAddon.config ?? {}),
        }
      : updatedProvider
        ? {
            id: updatedProvider.id,
            name: updatedProvider.name,
            description: updatedProvider.description,
            type: 'photo_provider',
            icon: updatedProvider.icon,
            enabled: !!updatedProvider.enabled,
            config: getPhotoProviderConfig(updatedProvider.id!),
            sort_order: updatedProvider.sort_order,
          }
        : null;

    // Only addons that gate MCP registration matter here — and only a real
    // enabled-flip changes what a session would register. Config-only saves,
    // photo providers and MCP-irrelevant addons must not tear down every live
    // session (#1414).
    //
    // The list lives beside ADDON_IDS and is held to the gates by a parity test.
    // As a copy kept here it had drifted: airtrail and collections gate tools
    // and were missing, so their write tools stayed callable on an open session
    // after an admin switched them off, while the REST half answered 404 for the
    // same user in the same moment.
    const MCP_RELEVANT_ADDONS = new Set<string>(MCP_GATED_ADDON_IDS);
    // `addon.enabled` is a JS boolean now (the repository's `AddonRow.enabled`
    // shape, not the raw stored int the legacy `SELECT *` returned) — comparing
    // two booleans for a real flip is the same predicate the legacy int
    // comparison (`(data.enabled ? 1 : 0) !== addon.enabled`) expressed.
    const enabledChanged = !!addon && data.enabled !== undefined && !!data.enabled !== addon.enabled;

    return {
      addon: updated,
      mcpAffected: enabledChanged && MCP_RELEVANT_ADDONS.has(id),
      auditDetails: {
        enabled: data.enabled !== undefined ? !!data.enabled : undefined,
        config_changed: data.config !== undefined,
      },
    };
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
