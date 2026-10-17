import type { CollabMessageReactions } from '../entities/CollabMessageReactions.entity';
import { TrekRepository } from './_shared/trek-repository';

/** CB1/CB46's joined projection — `r.emoji, r.user_id, u.username` (CB46 additionally carries `message_id`, the batch key). */
export interface ReactionJoinRow {
  message_id: number;
  emoji: string;
  user_id: number;
  username: string;
}

export class CollabMessageReactionsRepository extends TrekRepository<CollabMessageReactions> {
  /**
   * CB1 (`CollabService.loadReactions`) — `SELECT r.emoji, r.user_id,
   * u.username FROM collab_message_reactions r JOIN users u ON r.user_id =
   * u.id WHERE r.message_id = ?`. `r.user_id`/`r.message_id` are
   * `persist(false)` mirrors of the `message`/`user` relations — selecting
   * the relation property (not the mirror) is what actually hydrates it
   * (`PlaceRatingsRepository.listForPlaces`'s docstring, the same trap).
   */
  async listForMessage(message_id: number): Promise<Omit<ReactionJoinRow, 'message_id'>[]> {
    return this.qb('r')
      .join('r.user', 'u')
      .select(['r.emoji', 'u.id as user_id', 'u.username'])
      .where({ message: message_id })
      .execute<Omit<ReactionJoinRow, 'message_id'>[]>('all', false);
  }

  /**
   * CB46 (`CollabService.listMessages`'s batch reactions) — `SELECT
   * r.message_id, r.emoji, r.user_id, u.username FROM collab_message_reactions
   * r JOIN users u ON r.user_id = u.id WHERE r.message_id IN (dynamic)`.
   * Empty `message_ids` short-circuits, matching the service's own guard
   * (`if (msgIds.length > 0)`).
   */
  async listForMessages(message_ids: number[]): Promise<ReactionJoinRow[]> {
    if (message_ids.length === 0) return [];
    return this.qb('r')
      .join('r.user', 'u')
      .select(['r.message', 'r.emoji', 'u.id as user_id', 'u.username'])
      .where({ 'r.message': { $in: message_ids } })
      .execute<ReactionJoinRow[]>('all', false);
  }

  /**
   * CB3 (`CollabService.reactMessage`'s toggle check) — `SELECT id FROM
   * collab_message_reactions WHERE message_id = ? AND user_id = ? AND
   * emoji = ?`. Named `findReaction`, not `find`: `find` is `EntityRepository`'s
   * own base method (a different, incompatible signature) and a same-named
   * override does not typecheck.
   */
  async findReaction(message_id: number, user_id: number, emoji: string): Promise<{ id: number } | null> {
    return this.findOne({ message: message_id, user: user_id, emoji }, { fields: ['id'] });
  }

  /**
   * CB4 (`reactMessage`'s toggle-off half) — `DELETE FROM
   * collab_message_reactions WHERE id = ?`. Deliberately NOT wrapped in a
   * transaction with {@link insertReaction}/{@link find}: the legacy
   * check-then-toggle (CB3→CB4/CB5) has no `uow.transactional` either — a
   * duplicate/missing reaction under a race is cosmetic, not the
   * data-integrity class of defect the R2/`toggleMemberPaid` fixes address
   * (task-5-brief.md's own ruling; left as-is rather than "fixed"
   * unilaterally).
   */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /** CB5 (`reactMessage`'s toggle-on half) — `INSERT INTO collab_message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)`. */
  async insertReaction(message_id: number, user_id: number, emoji: string): Promise<void> {
    await this.insert({ message: message_id, user: user_id, emoji });
  }
}
