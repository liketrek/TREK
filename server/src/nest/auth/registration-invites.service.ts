import { Injectable } from '@nestjs/common';
import crypto from 'crypto';
import { DatabaseService } from '../database/database.service';

/**
 * Registration invites: the tokens an admin hands out so someone can create an
 * account on a closed instance, optionally dropping them straight into a trip.
 *
 * This lives in auth/ and not in trip-invite/, which is the trap the name sets.
 * invite_tokens and trip_invite_tokens are different tables for different
 * things — the first gates signup, the second adds an existing user to a trip.
 * The consumer of this one is the registration path in AuthService, so the
 * table belongs to the auth domain.
 *
 * The four methods moved verbatim out of AdminService, which held them only
 * because the management routes are under /api/admin. Those routes keep their
 * paths and their guards; AdminController now injects this instead of carrying
 * another domain's SQL.
 */
@Injectable()
export class RegistrationInvitesService {
  constructor(private readonly db: DatabaseService) {}

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
    const rawUses = Number.parseInt(String(data.max_uses));
    const uses = rawUses === 0 ? 0 : Math.min(Math.max(rawUses || 1, 1), 5);
    const token = crypto.randomBytes(16).toString('hex');
    const expiresAt = data.expires_in_days
      ? new Date(Date.now() + Number.parseInt(String(data.expires_in_days)) * 86400000).toISOString()
      : null;

    // Optional trip binding: only persist a trip that actually exists, so a stale
    // or forged id can never bind (and never auto-adds anyone on registration).
    let tripId: number | null = null;
    if (data.trip_id != null && String(data.trip_id).trim() !== '') {
      const parsed = Number.parseInt(String(data.trip_id));
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
}
