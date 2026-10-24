import { idSchema } from '../../common/primitives.schema';
import { cardCountSchema, cardInstantSchema, cardPersonSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * Polls of the trip, drawn like the poll cards of the Collab tab: the
 * question, what kind of poll it is, and its options with their bars. An
 * answer holds up to four polls of a read (open ones first) and counts the
 * rest; a held write holds the one poll it starts, votes in, closes or
 * deletes, as it will look afterwards. Whether the signed-in user voted for
 * an option is something only the server knows, so it travels as `mine`.
 */

const pollOptionCardSchema = z.object({
  text: cardText(160),
  votes: z.number().int().min(0).max(9999),
  mine: z.boolean(),
  /** The first three voters, as the poll card shows them. */
  voters: z.array(cardPersonSchema).max(3),
});

export const COLLAB_POLL_CHANGES = ['none', 'create', 'vote', 'close', 'remove'] as const;

/** Why the server would refuse a held vote: the poll is closed, or it has no such option. */
export const COLLAB_POLL_WARNINGS = ['closed', 'unknownOption'] as const;

export const collabPollCardSchema = z.object({
  /** Null while a new poll waits for its decision. */
  pollId: idSchema.nullable(),
  question: cardText(300),
  options: z.array(pollOptionCardSchema).min(1).max(12),
  moreOptions: z.number().int().min(0).max(500),
  multiple: z.boolean(),
  /** Closed by hand; the client adds the deadline, as the Collab tab does. */
  closed: z.boolean(),
  deadline: cardInstantSchema.nullable(),
  author: cardPersonSchema.nullable(),
  change: z.enum(COLLAB_POLL_CHANGES),
  /** The option a held vote toggles. */
  votedIndex: z.number().int().min(0).max(499).nullable(),
  /** True when the held vote is cast, false when it is taken back. */
  votedAdds: z.boolean(),
  warning: z.enum(COLLAB_POLL_WARNINGS).nullable(),
});
export type CollabPollCard = z.infer<typeof collabPollCardSchema>;

export const collabPollsCardSchema = z.object({
  kind: z.literal('collabPolls'),
  polls: z.array(collabPollCardSchema).min(1).max(4),
  /** Polls of the read that are not shown. */
  more: cardCountSchema,
});
export type CollabPollsCard = z.infer<typeof collabPollsCardSchema>;
