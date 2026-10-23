import { idSchema } from '../../common/primitives.schema';
import { cardCountSchema, cardHexColorSchema, cardPersonSchema, cardText } from './card-parts';

import { z } from 'zod';

/**
 * Shared notes of the trip, drawn like the note cards of the Collab tab: a
 * head band tinted by the category's colour with its title, and the start of
 * its text under it. An answer holds up to four notes of a read (pinned
 * first) and counts the rest; a held write holds the one note it adds,
 * changes or deletes, as it will look afterwards. A note's link travels as
 * its host only, never as an address the chat could open.
 */

export const COLLAB_NOTE_CHANGES = ['none', 'create', 'update', 'remove'] as const;

/** The parts of a note a held change sets to something new. */
export const COLLAB_NOTE_FIELDS = ['title', 'body', 'category', 'color', 'website', 'pinned'] as const;

export const collabNoteCardSchema = z.object({
  /** Null while a new note waits for its decision. */
  noteId: idSchema.nullable(),
  title: cardText(200),
  /** Markdown with its line breaks, shown in three lines as the note card does. */
  body: z.string().min(1).max(600).nullable(),
  category: cardText(100).nullable(),
  color: cardHexColorSchema.nullable(),
  pinned: z.boolean(),
  /** "example.org": the host of the note's link. */
  websiteHost: z.string().min(1).max(253).nullable(),
  files: z.number().int().min(0).max(999),
  author: cardPersonSchema.nullable(),
  change: z.enum(COLLAB_NOTE_CHANGES),
  changed: z.array(z.enum(COLLAB_NOTE_FIELDS)).max(6),
});
export type CollabNoteCard = z.infer<typeof collabNoteCardSchema>;

export const collabNotesCardSchema = z.object({
  kind: z.literal('collabNotes'),
  notes: z.array(collabNoteCardSchema).min(1).max(4),
  /** Notes of the read that are not shown. */
  more: cardCountSchema,
});
export type CollabNotesCard = z.infer<typeof collabNotesCardSchema>;
