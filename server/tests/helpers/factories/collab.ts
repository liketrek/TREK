import { CollabMessages } from '../../../src/db/entities/CollabMessages.entity';
import { CollabNotes } from '../../../src/db/entities/CollabNotes.entity';
import type { FactoryOrm } from './context';
import { createRow } from './rows';
import type { EntityData, EntityDTO } from '@mikro-orm/core';

export type CollabNoteRow = EntityDTO<CollabNotes>;
export type CollabMessageRow = EntityDTO<CollabMessages>;

/** A note on the trip's collab board, written by `userId`. */
export function makeCollabNote(
  orm: FactoryOrm,
  tripId: number,
  userId: number,
  overrides: EntityData<CollabNotes> = {},
): Promise<CollabNoteRow> {
  return createRow(orm, CollabNotes, {
    trip: tripId,
    user: userId,
    title: 'Test Note',
    content: null,
    category: 'General',
    color: '#6366f1',
    ...overrides,
  });
}

/** A chat message on the trip; `replyToRef` makes it a reply. */
export function makeCollabMessage(
  orm: FactoryOrm,
  tripId: number,
  userId: number,
  overrides: EntityData<CollabMessages> = {},
): Promise<CollabMessageRow> {
  return createRow(orm, CollabMessages, { trip: tripId, user: userId, text: 'Test message', ...overrides });
}
