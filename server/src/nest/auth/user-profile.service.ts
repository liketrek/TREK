import { Injectable } from '@nestjs/common';
import path from 'path';
import fs from 'fs';
import { DatabaseService } from '../database/database.service';
import { decrypt_api_key, maybe_encrypt_api_key } from '../common/crypto/apiKeyCrypto';
import { avatarUrl } from '../common/avatarUrl';
import { EMAIL_REGEX, avatarDir, mask_stored_api_key } from './auth.helpers';
import { User } from '../../types';

/**
 * The account a user administers about themselves: display settings, avatar,
 * the third-party API keys they paste in, and the directory listing other
 * members are picked from.
 *
 * Split out of AuthService, which had grown to 1471 lines by owning identity,
 * profile, settings and tokens together. None of this is identity: no password
 * is checked here, no session is issued, no MFA secret is touched. Everything
 * moved verbatim — same SQL, same validation order, same masking, same error
 * strings and status codes.
 *
 * DatabaseService is the only injected dependency, which is what made this the
 * second-cheapest cut after tokens.
 */
@Injectable()
export class UserProfileService {
  constructor(private readonly db: DatabaseService) {}

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
}
