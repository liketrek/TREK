import { idSchema } from '../../common/primitives.schema';
import { cardInstantSchema, cardPersonSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * Messages of the trip chat, drawn the way the chat draws them: a bubble per
 * message, the others on one side with their face and name, the user's own on
 * the other in the accent. An answer shows the last few messages a read
 * returned and counts the older ones; a held write shows the one message it
 * sends, removes or reacts to, as it will look afterwards. A file travels as
 * its id only, which the client turns into TREK's own download path.
 */

/** One emoji of a message's reactions; `mine` says the signed-in user is among them, which only the server knows. */
const chatReactionSchema = z.object({
  emoji: z.string().min(1).max(16),
  count: z.number().int().min(1).max(999),
  mine: z.boolean(),
  /** The first names behind it, for the tooltip the chat shows. */
  names: z.array(cardText(80)).max(6),
});

/** A file sent with a message: an image is drawn in the bubble, any other file named. */
const chatFileSchema = z.object({
  fileId: idSchema,
  image: z.boolean(),
  name: cardText(120).nullable(),
});

/** The message a bubble answers, quoted on top of it. */
const chatReplySchema = z.object({
  name: cardText(80),
  text: cardText(120),
});

export const COLLAB_BUBBLE_CHANGES = ['none', 'send', 'remove', 'react'] as const;

export const collabBubbleCardSchema = z.object({
  /** Null while a send waits for its decision. */
  id: idSchema.nullable(),
  author: cardPersonSchema,
  /** Line breaks kept; empty only for a message that is an image alone. */
  text: z.string().max(4000),
  /** The text was cut: an excerpt of a long message, or a send longer than the bubble holds. */
  cut: z.boolean(),
  /** Null while a send waits for its decision. */
  at: cardInstantSchema.nullable(),
  reply: chatReplySchema.nullable(),
  reactions: z.array(chatReactionSchema).max(8),
  files: z.array(chatFileSchema).max(4),
  /** Shared from an assistant answer: the chat marks it so. */
  fromAssistant: z.boolean(),
  change: z.enum(COLLAB_BUBBLE_CHANGES),
  /** The emoji a held reaction toggles. */
  reactEmoji: z.string().min(1).max(16).nullable(),
});
export type CollabBubbleCard = z.infer<typeof collabBubbleCardSchema>;

export const collabChatCardSchema = z.object({
  kind: z.literal('collabChat'),
  /** Oldest first, as the chat lists them. */
  messages: z.array(collabBubbleCardSchema).min(1).max(6),
  /** Older messages of the read that are not shown. */
  earlier: z.number().int().min(0).max(10_000),
});
export type CollabChatCard = z.infer<typeof collabChatCardSchema>;
