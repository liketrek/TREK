import type { NotificationChannelPreferences } from '../entities/NotificationChannelPreferences.entity';
import { TrekRepository } from './_shared/trek-repository';

/** NP3's projection — `event_type, channel, enabled` (no need for the `user`/`user_id` PK columns; the caller already knows which user it asked for). */
export interface NotificationChannelPreferenceRow {
  event_type: string;
  channel: string;
  enabled: number;
}

/**
 * `notification_channel_preferences` — per-user, per-event, per-channel
 * opt-outs. A genuine THREE-column composite primary key (`user` relation +
 * `event_type` text + `channel` text, all `.primary()` — R5/§14's "wider
 * than any prior plan's composite-PK precedent" finding): every write here
 * goes through `em.upsert`/`nativeDelete` targeting all three columns as the
 * conflict/filter key, never a synthetic `id`. `user_id` is a `persist(false)`
 * mirror of the `user` relation (the program-wide trap) — filtered/written
 * through the `user` relation property throughout, never the mirror.
 */
export class NotificationChannelPreferencesRepository extends TrekRepository<NotificationChannelPreferences> {
  /** NP2 — `SELECT enabled FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?`. `enabled` is not a persist(false) mirror, so `fields` narrowing is exact. */
  async findEnabled(userId: number, eventType: string, channel: string): Promise<{ enabled: number } | null> {
    return await this.findOne({ user: userId, event_type: eventType, channel }, { fields: ['enabled'] });
  }

  /** NP3 — `SELECT event_type, channel, enabled FROM notification_channel_preferences WHERE user_id = ?` (`getPreferencesMatrix`'s full per-user override set, merged with defaults in the service). */
  async listForUser(userId: number): Promise<NotificationChannelPreferenceRow[]> {
    return await this.find({ user: userId }, { fields: ['event_type', 'channel', 'enabled'] });
  }

  /**
   * NP5 — `applyUserChannelPrefs`'s `INSERT OR REPLACE INTO
   * notification_channel_preferences (user_id, event_type, channel, enabled)
   * VALUES (?, ?, ?, ?)`, run once per explicitly-disabled preference. The
   * composite-PK `em.upsert` shape Task 0 (R5) pinned against the migration
   * DDL (`user_id, event_type, channel` PRIMARY KEY) and worked an example
   * for — `onConflictFields` names the THREE primary-key properties by their
   * entity property names (`user`, not the persist(false) `user_id` mirror),
   * and `onConflictAction: 'merge'` reproduces `OR REPLACE`'s "overwrite the
   * existing row" semantics (the `enabled` column is the only non-key column,
   * so there is nothing REPLACE resets that merge wouldn't also set).
   * Rendered SQL pinned directly (not assumed from the shape alone) by
   * `NotificationChannelPreferences.repository.test.ts`'s
   * `NCPREPO-UPSERT-SQL` case — the FIRST such pin in the program (Task 6/
   * `UserNoticeDismissalsRepository` re-checks against this one, per R5).
   */
  async upsertPreference(userId: number, eventType: string, channel: string, enabled: number): Promise<void> {
    await this.upsert(
      { user: userId, event_type: eventType, channel, enabled },
      { onConflictFields: ['user', 'event_type', 'channel'], onConflictAction: 'merge' },
    );
  }

  /** NP6 — `applyUserChannelPrefs`'s `DELETE FROM notification_channel_preferences WHERE user_id = ? AND event_type = ? AND channel = ?` (removing the row is how "enabled (default)" is represented — never a write of `enabled = 1`). */
  async deletePreference(userId: number, eventType: string, channel: string): Promise<number> {
    return await this.nativeDelete({ user: userId, event_type: eventType, channel });
  }

  /**
   * Plan 3j Task 2 — `plugin-runtime.service.ts#retireNotificationChannel` (PR50,
   * cross-domain): `DELETE FROM notification_channel_preferences WHERE channel = ?`,
   * fired when a plugin's notification channel is retired (uninstall, or the
   * capability disappearing on update). Unlike every other write on this
   * repository, there is no `user`/`event_type` filter — every user's opt-out for
   * THIS channel goes, across every event.
   */
  async deleteAllForChannel(channel: string): Promise<void> {
    await this.nativeDelete({ channel });
  }
}
