import type { PluginOauthState } from '../entities/PluginOauthState.entity';
import { TrekRepository } from './_shared/trek-repository';

/**
 * Plan 3j Task 2 note: this repository's ONLY method today is the uninstall
 * cascade's own delete (PR43) — the rest of this table's surface belongs to
 * Task 4's `oauth/plugin-oauth.service.ts`, which adds its own additive methods.
 */

/** `consumeByState`'s own projection — PO5's columns plus `plugin_id` (the
 *  legacy SELECT's own WHERE-bound column, re-checked in JS once the atomic
 *  delete below no longer filters on it — see that method's docstring). */
export interface PluginOauthStateRow {
  plugin_id: string;
  user_id: number;
  verifier: string;
  created_at: number;
}

/** `consumeByState`'s own Kysely DB shape. */
interface PluginOauthStateKyselyDB {
  plugin_oauth_state: {
    state: string;
    plugin_id: string;
    user_id: number;
    verifier: string;
    created_at: number;
  };
}

export class PluginOauthStateRepository extends TrekRepository<PluginOauthState> {
  /** PR43 (uninstall cascade, `deleteData` branch) — `DELETE FROM plugin_oauth_state WHERE plugin_id = ?`. */
  async deleteAllForPlugin(pluginId: string): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId });
  }

  /**
   * PO3 (`startConnect`'s stale-state clear, before minting a fresh one) / PO10
   * (`disconnect`) — dup text `DELETE FROM plugin_oauth_state WHERE plugin_id = ?
   * AND user_id = ?`, one method for both call sites.
   */
  async deleteForUser(pluginId: string, userId: number): Promise<void> {
    await this.nativeDelete({ plugin_id: pluginId, user_id: userId });
  }

  /** PO4 (`startConnect`) — `INSERT INTO plugin_oauth_state (state, plugin_id, user_id, verifier, created_at) VALUES (?, ?, ?, ?, ?)`. */
  async insertState(
    state: string,
    pluginId: string,
    userId: number,
    verifier: string,
    createdAt: number,
  ): Promise<void> {
    await this.insert({ state, plugin_id: pluginId, user_id: userId, verifier, created_at: createdAt });
  }

  /**
   * PO5+PO6+PO7 combined (`completeCallback`'s one-shot consume). The legacy
   * sequence was SELECT-then-DELETE — `SELECT verifier, user_id, created_at
   * FROM plugin_oauth_state WHERE state = ? AND plugin_id = ?`, then an
   * UNCONDITIONAL `DELETE FROM plugin_oauth_state WHERE state = ?` on EVERY
   * path out of `completeCallback` (the refused branch and the success
   * branch both delete by `state` alone) — but every statement was a
   * synchronous `better-sqlite3` call with no `await` anywhere between the
   * read and the delete, so two concurrent `completeCallback` calls for the
   * SAME state could never interleave: JS ran one call's check+delete to
   * completion before the other's synchronous block even started.
   *
   * Splitting that into a `findOne` (PO5) and a separate `nativeDelete`
   * (PO6/PO7) — each now genuinely async through MikroORM/Kysely — reopens
   * exactly that window: a second concurrent caller's read can land before
   * the first caller's delete does, and BOTH would see a live row and both
   * would proceed to exchange the code, spending the one-shot state twice.
   * Collapsed into ONE atomic `DELETE ... RETURNING`, unconditional on
   * `state` alone (matching the legacy delete's own condition exactly —
   * `plugin_id`/`user_id`/TTL are re-checked by the caller against the
   * RETURNED row, same as it always did against the SELECTed one), the same
   * `WebauthnChallengesRepository.claimChallenge` precedent this program
   * already uses for an identical single-use-consume race. Whichever
   * concurrent caller's DELETE the database serialises first gets the real
   * row back; the other gets `null` and fails closed — restoring the
   * legacy's effectively-atomic outcome instead of reopening a TOCTOU
   * window the conversion would otherwise introduce. Built on `this.kysely()`
   * (validates the request context first), not `em.getKysely()` directly,
   * and `.returning([...])` (not the QueryBuilder's own `.returning()` —
   * `claimChallenge`'s docstring records the installed MikroORM version's
   * gap on a bare DELETE).
   */
  async consumeByState(state: string): Promise<PluginOauthStateRow | null> {
    const row = await this.kysely<PluginOauthStateKyselyDB>()
      .deleteFrom('plugin_oauth_state')
      .where('state', '=', state)
      .returning(['plugin_id', 'user_id', 'verifier', 'created_at'])
      .executeTakeFirst();
    return row ?? null;
  }
}
