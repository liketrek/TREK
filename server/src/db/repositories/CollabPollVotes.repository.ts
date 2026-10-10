import type { CollabPollVotes } from '../entities/CollabPollVotes.entity';
import { TrekRepository } from './_shared/trek-repository';

/** CB24's joined projection — `v.option_index, v.user_id, u.username, u.avatar`. */
export interface PollVoteJoinRow {
  option_index: number;
  user_id: number;
  username: string;
  avatar: string | null;
}

export class CollabPollVotesRepository extends TrekRepository<CollabPollVotes> {
  /**
   * CB24 (`getPollWithVotes`'s votes half) — `SELECT v.option_index,
   * v.user_id, u.username, u.avatar FROM collab_poll_votes v JOIN users u ON
   * v.user_id = u.id WHERE v.poll_id = ?`.
   */
  async listForPoll(poll_id: number): Promise<PollVoteJoinRow[]> {
    return this.qb('v')
      .join('v.user', 'u')
      .select(['v.option_index', 'u.id as user_id', 'u.username', 'u.avatar'])
      .where({ poll: poll_id })
      .execute<PollVoteJoinRow[]>('all', false);
  }

  /**
   * CB28 (`votePoll`'s existing-vote check) — `SELECT id FROM
   * collab_poll_votes WHERE poll_id = ? AND user_id = ? AND option_index =
   * ?`. Named `findVote`, not `find`: `find` is `EntityRepository`'s own
   * base method (a different, incompatible signature) and a same-named
   * override does not typecheck.
   */
  async findVote(poll_id: number, user_id: number, option_index: number): Promise<{ id: number } | null> {
    return this.findOne({ poll: poll_id, user: user_id, option_index }, { fields: ['id'] });
  }

  /** CB29 (`votePoll`'s toggle-off half, NOT inside the transaction — matching the legacy: only the multi-vote-clear branch below is transacted) — `DELETE FROM collab_poll_votes WHERE id = ?`. */
  async deleteById(id: number): Promise<void> {
    await this.nativeDelete({ id });
  }

  /** CB30 (`votePoll`'s single-choice clear, inside the transaction, only when `!poll.multiple`) — `DELETE FROM collab_poll_votes WHERE poll_id = ? AND user_id = ?`. */
  async deleteForUser(poll_id: number, user_id: number): Promise<void> {
    await this.nativeDelete({ poll: poll_id, user: user_id });
  }

  /** CB31 (`votePoll`, inside the transaction) — `INSERT INTO collab_poll_votes (poll_id, user_id, option_index) VALUES (?, ?, ?)`, the entity's own composite-unique `(poll, user, option_index)`. */
  async insertVote(poll_id: number, user_id: number, option_index: number): Promise<void> {
    await this.insert({ poll: poll_id, user: user_id, option_index });
  }
}
