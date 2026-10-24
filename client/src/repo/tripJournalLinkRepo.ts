import type { TripJournalCandidate, TripJournalLinkMemberRequest, TripJournalLinkResponse } from '@trek/shared';
import { tripJournalApi } from '../api/tripJournal';
import { isEffectivelyOffline } from '../sync/networkMode';

/** A journal the person owns, as the link picker lists it. */
export interface OwnJournal {
  id: number;
  title: string;
  subtitle: string | null;
}

/**
 * The journal a trip links, and who it is open to.
 *
 * Online-only with no Dexie table, for the reason docSyncRepo gives: every
 * answer is the server's (who may see the link, who would be let in), and the
 * journal it opens is online-only too, as the Journey addon is. Writing it
 * offline would mean granting access nobody could check. The store in front of
 * this keeps the last answer for the session.
 */
export class TripJournalOfflineError extends Error {
  constructor() {
    super('Linking a journal needs a connection');
    this.name = 'TripJournalOfflineError';
  }
}

function requireOnline(): void {
  if (isEffectivelyOffline()) throw new TripJournalOfflineError();
}

export const tripJournalLinkRepo = {
  async get(tripId: number): Promise<TripJournalLinkResponse> {
    requireOnline();
    return tripJournalApi.get(tripId);
  },

  async candidates(tripId: number, journeyId: number): Promise<TripJournalCandidate[]> {
    requireOnline();
    return (await tripJournalApi.candidates(tripId, journeyId)).candidates;
  },

  async link(
    tripId: number,
    journeyId: number,
    members: TripJournalLinkMemberRequest[]
  ): Promise<TripJournalLinkResponse> {
    requireOnline();
    return tripJournalApi.link(tripId, journeyId, members);
  },

  async setMembers(tripId: number, members: TripJournalLinkMemberRequest[]): Promise<TripJournalLinkResponse> {
    requireOnline();
    return tripJournalApi.setMembers(tripId, members);
  },

  async unlink(tripId: number): Promise<TripJournalLinkResponse> {
    requireOnline();
    return tripJournalApi.unlink(tripId);
  },

  /** The journals `userId` owns, newest first, for the picker. Those they only contribute to are not theirs to link. */
  async ownJournals(userId: number): Promise<OwnJournal[]> {
    requireOnline();
    const { journeys } = await tripJournalApi.journals();
    return journeys
      .filter((j) => j.user_id === userId)
      .map((j) => ({ id: j.id, title: j.title, subtitle: j.subtitle ?? null }));
  },
};
