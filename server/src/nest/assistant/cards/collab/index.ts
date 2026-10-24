import type { DomainCards } from '../card-types';
import {
  chatAnswer,
  loadForReply,
  loadMessages,
  reactChange,
  removeChange,
  sendApplied,
  sendChange,
} from './collab-chat';
import { COLLAB_DESCRIBERS } from './collab-describe';
import {
  createNoteChange,
  loadNotes,
  noteApplied,
  notesAnswer,
  removeNoteChange,
  updateNoteChange,
} from './collab-notes';
import {
  closeChange,
  createPollChange,
  loadPolls,
  pollApplied,
  pollsAnswer,
  removePollChange,
  voteChange,
} from './collab-polls';
import { DELETE_CREATED_NOTE, DELETE_CREATED_POLL } from './collab-undo';
import { answeredId, namedId } from './collab-values';

/**
 * The cards of the trip chat: messages, polls and shared notes, drawn as the
 * Collab tab draws them. The three reads show what they found; every write
 * shows what it will post, change or remove, and the ones that create keep
 * the answer's id once applied. A new note or poll can be taken back while
 * nobody built on it; a sent message cannot.
 */
export const COLLAB_CARDS: DomainCards = {
  id: 'collab',
  tools: {
    list_collab_messages: { answer: chatAnswer },
    list_collab_polls: { answer: pollsAnswer },
    list_collab_notes: { answer: notesAnswer },
    send_collab_message: {
      write: { verbKey: 'genericCreate', entity: 'collab_message' },
      describe: COLLAB_DESCRIBERS.send_collab_message,
      load: loadForReply,
      change: sendChange,
      applied: sendApplied,
      appliedIds: answeredId('message'),
    },
    delete_collab_message: {
      write: { verbKey: 'genericRemove', entity: 'collab_message' },
      describe: COLLAB_DESCRIBERS.delete_collab_message,
      load: loadMessages,
      change: removeChange,
      appliedIds: namedId('messageId'),
    },
    react_collab_message: {
      write: { verbKey: 'genericUpdate', entity: 'collab_message' },
      describe: COLLAB_DESCRIBERS.react_collab_message,
      load: loadMessages,
      change: reactChange,
      appliedIds: namedId('messageId'),
    },
    create_collab_poll: {
      write: { verbKey: 'genericCreate', entity: 'collab_poll' },
      describe: COLLAB_DESCRIBERS.create_collab_poll,
      change: createPollChange,
      applied: (input) => pollApplied('create', input),
      undo: DELETE_CREATED_POLL,
      appliedIds: answeredId('poll'),
    },
    vote_collab_poll: {
      write: { verbKey: 'genericUpdate', entity: 'collab_poll' },
      describe: COLLAB_DESCRIBERS.vote_collab_poll,
      load: loadPolls,
      change: voteChange,
      applied: (input) => pollApplied('vote', input),
      appliedIds: answeredId('poll'),
    },
    close_collab_poll: {
      write: { verbKey: 'genericUpdate', entity: 'collab_poll' },
      describe: COLLAB_DESCRIBERS.close_collab_poll,
      load: loadPolls,
      change: closeChange,
      applied: (input) => pollApplied('close', input),
      appliedIds: answeredId('poll'),
    },
    delete_collab_poll: {
      write: { verbKey: 'genericRemove', entity: 'collab_poll' },
      describe: COLLAB_DESCRIBERS.delete_collab_poll,
      load: loadPolls,
      change: removePollChange,
      appliedIds: namedId('pollId'),
    },
    create_collab_note: {
      write: { verbKey: 'genericCreate', entity: 'collab_note' },
      describe: COLLAB_DESCRIBERS.create_collab_note,
      load: loadNotes,
      change: createNoteChange,
      applied: (input) => noteApplied('create', input),
      undo: DELETE_CREATED_NOTE,
      appliedIds: answeredId('note'),
    },
    update_collab_note: {
      write: { verbKey: 'genericUpdate', entity: 'collab_note' },
      describe: COLLAB_DESCRIBERS.update_collab_note,
      load: loadNotes,
      change: updateNoteChange,
      applied: (input) => noteApplied('update', input),
      appliedIds: answeredId('note'),
    },
    delete_collab_note: {
      write: { verbKey: 'genericRemove', entity: 'collab_note' },
      describe: COLLAB_DESCRIBERS.delete_collab_note,
      load: loadNotes,
      change: removeNoteChange,
      appliedIds: namedId('noteId'),
    },
  },
};
