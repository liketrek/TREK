import type { CardView } from '../cardTypes';
import CollabChatBlock, { CollabChatBody } from './CollabChatCard';
import CollabNotesBlock, { CollabNoteFacts, CollabNotesBody } from './CollabNotesCard';
import CollabPollsBlock, { CollabPollsBody } from './CollabPollsCard';

/**
 * How the kinds of the trip chat, polls and notes draw in the chat: an
 * answer as the chat, the polls or the notes the way the Collab tab shows
 * them; a change row as the one bubble, poll or note it will leave, under
 * its faint line, the card naming what the row would otherwise name in bold.
 * A note change states what it changes on the faint line. This file only
 * maps each kind to its view: the components live in sibling files, since a
 * file that exports anything besides components breaks fast refresh, and
 * lint:warnings holds react-refresh/only-export-components at zero for a new
 * file.
 */
export const COLLAB_VIEWS = {
  collabChat: { Block: CollabChatBlock, Body: CollabChatBody, ownsSubject: true },
  collabPolls: { Block: CollabPollsBlock, Body: CollabPollsBody, ownsSubject: true },
  collabNotes: { Block: CollabNotesBlock, Body: CollabNotesBody, Facts: CollabNoteFacts, ownsSubject: true },
} satisfies { [K in 'collabChat' | 'collabPolls' | 'collabNotes']: CardView<K> };
