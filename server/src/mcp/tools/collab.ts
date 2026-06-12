import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';
import { canAccessTrip } from '../../db/database';
import { isDemoUser } from '../../services/authService';
import {
  createNote as createCollabNote, updateNote as updateCollabNote, deleteNote as deleteCollabNote,
  listPolls, createPoll, votePoll, closePoll, deletePoll,
  listMessages, createMessage, deleteMessage, addOrRemoveReaction,
} from '../../services/collabService';
import { isAddonEnabled, getCollabFeatures } from '../../services/adminService';
import { ADDON_IDS } from '../../addons';
import {
  safeBroadcast, TOOL_ANNOTATIONS_WRITE, TOOL_ANNOTATIONS_DELETE,
  TOOL_ANNOTATIONS_NON_IDEMPOTENT, TOOL_ANNOTATIONS_READONLY,
  demoDenied, noAccess, ok, hasTripPermission, permissionDenied,
} from './_shared';
import { canRead, canWrite } from '../scopes';

export function registerCollabTools(server: McpServer, userId: number, scopes: string[] | null): void {
  const R = canRead(scopes, 'collab');
  const W = canWrite(scopes, 'collab');

  if (!isAddonEnabled(ADDON_IDS.COLLAB)) return;

  const features = getCollabFeatures();

  // --- COLLAB NOTES ---

  if (features.notes && W) server.registerTool(
    'create_collab_note',
    {
      description: 'Create a shared collaborative note on a trip (visible to all trip members in the Collab tab).',
      inputSchema: {
        tripId: z.number().int().positive(),
        title: z.string().min(1).max(200),
        content: z.string().max(10000).optional(),
        category: z.string().max(100).optional().describe('Note category (e.g. "Ideas", "To-do", "General")'),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Hex color for the note card'),
        pinned: z.boolean().optional().default(false).describe('Pin the note to the top'),
      },
      annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    },
    async ({ tripId, title, content, category, color, pinned }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('collab_edit', tripId, userId)) return permissionDenied();
      const note = createCollabNote(tripId, userId, { title, content, category, color, pinned });
      safeBroadcast(tripId, 'collab:note:created', { note });
      return ok({ note });
    }
  );

  if (features.notes && W) server.registerTool(
    'update_collab_note',
    {
      description: 'Edit an existing collaborative note on a trip.',
      inputSchema: {
        tripId: z.number().int().positive(),
        noteId: z.number().int().positive(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().max(10000).optional(),
        category: z.string().max(100).optional(),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Hex color for the note card'),
        pinned: z.boolean().optional().describe('Pin the note to the top'),
      },
      annotations: TOOL_ANNOTATIONS_WRITE,
    },
    async ({ tripId, noteId, title, content, category, color, pinned }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('collab_edit', tripId, userId)) return permissionDenied();
      const note = updateCollabNote(tripId, noteId, { title, content, category, color, pinned });
      if (!note) return { content: [{ type: 'text' as const, text: 'Note not found.' }], isError: true };
      safeBroadcast(tripId, 'collab:note:updated', { note });
      return ok({ note });
    }
  );

  if (features.notes && W) server.registerTool(
    'delete_collab_note',
    {
      description: 'Delete a collaborative note from a trip.',
      inputSchema: {
        tripId: z.number().int().positive(),
        noteId: z.number().int().positive(),
      },
      annotations: TOOL_ANNOTATIONS_DELETE,
    },
    async ({ tripId, noteId }) => {
      if (isDemoUser(userId)) return demoDenied();
      if (!canAccessTrip(tripId, userId)) return noAccess();
      if (!hasTripPermission('collab_edit', tripId, userId)) return permissionDenied();
      const deleted = deleteCollabNote(tripId, noteId);
      if (!deleted) return { content: [{ type: 'text' as const, text: 'Note not found.' }], isError: true };
      safeBroadcast(tripId, 'collab:note:deleted', { noteId });
      return ok({ success: true });
    }
  );

  // --- COLLAB POLLS & CHAT ---

  if (features.polls && R) server.registerTool(
    'list_collab_polls',
      {
        description: 'List all polls for a trip.',
        inputSchema: {
          tripId: z.number().int().positive(),
        },
        annotations: TOOL_ANNOTATIONS_READONLY,
      },
      async ({ tripId }) => {
        if (!canAccessTrip(tripId, userId)) return noAccess();
        const polls = listPolls(tripId);
        return ok({ polls });
      }
    );

    if (features.polls && W) server.registerTool(
      'create_collab_poll',
      {
        description: 'Create a new poll in the collab panel.',
        inputSchema: {
          tripId: z.number().int().positive(),
          question: z.string().min(1),
          options: z.array(z.string()).min(2).describe('Poll answer options (at least 2)'),
          multiple: z.boolean().optional().describe('Allow multiple choice'),
          deadline: z.string().optional().describe('ISO date string for poll deadline'),
        },
        annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
      },
      async ({ tripId, question, options, multiple, deadline }) => {
        if (isDemoUser(userId)) return demoDenied();
        if (!canAccessTrip(tripId, userId)) return noAccess();
        if (!hasTripPermission('collab_edit', tripId, userId)) return permissionDenied();
        const poll = createPoll(tripId, userId, { question, options, multiple, deadline });
        safeBroadcast(tripId, 'collab:poll:created', { poll });
        return ok({ poll });
      }
    );

    if (features.polls && W) server.registerTool(
      'vote_collab_poll',
      {
        description: 'Vote on a poll option (or remove vote if already voted for that option).',
        inputSchema: {
          tripId: z.number().int().positive(),
          pollId: z.number().int().positive(),
          optionIndex: z.number().int().min(0).describe('Zero-based index of the option to vote for'),
        },
        annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
      },
      async ({ tripId, pollId, optionIndex }) => {
        if (!canAccessTrip(tripId, userId)) return noAccess();
        if (!hasTripPermission('collab_edit', tripId, userId)) return permissionDenied();
        const result = votePoll(tripId, pollId, userId, optionIndex);
        if (result.error) return { content: [{ type: 'text' as const, text: result.error }], isError: true };
        safeBroadcast(tripId, 'collab:poll:voted', { poll: result.poll });
        return ok({ poll: result.poll });
      }
    );

    if (features.polls && W) server.registerTool(
      'close_collab_poll',
      {
        description: 'Close a poll so no more votes can be cast.',
        inputSchema: {
          tripId: z.number().int().positive(),
          pollId: z.number().int().positive(),
        },
        annotations: TOOL_ANNOTATIONS_WRITE,
      },
      async ({ tripId, pollId }) => {
        if (isDemoUser(userId)) return demoDenied();
        if (!canAccessTrip(tripId, userId)) return noAccess();
        if (!hasTripPermission('collab_edit', tripId, userId)) return permissionDenied();
        const poll = closePoll(tripId, pollId);
        if (!poll) return { content: [{ type: 'text' as const, text: 'Poll not found.' }], isError: true };
        safeBroadcast(tripId, 'collab:poll:closed', { poll });
        return ok({ poll });
      }
    );

    if (features.polls && W) server.registerTool(
      'delete_collab_poll',
      {
        description: 'Delete a poll and all its votes.',
        inputSchema: {
          tripId: z.number().int().positive(),
          pollId: z.number().int().positive(),
        },
        annotations: TOOL_ANNOTATIONS_DELETE,
      },
      async ({ tripId, pollId }) => {
        if (isDemoUser(userId)) return demoDenied();
        if (!canAccessTrip(tripId, userId)) return noAccess();
        if (!hasTripPermission('collab_edit', tripId, userId)) return permissionDenied();
        const deleted = deletePoll(tripId, pollId);
        if (!deleted) return { content: [{ type: 'text' as const, text: 'Poll not found.' }], isError: true };
        safeBroadcast(tripId, 'collab:poll:deleted', { pollId });
        return ok({ success: true });
      }
    );

    if (features.chat && R) server.registerTool(
      'list_collab_messages',
      {
        description: 'List chat messages for a trip (most recent 100, oldest-first).',
        inputSchema: {
          tripId: z.number().int().positive(),
          before: z.number().int().positive().optional().describe('Load messages with ID less than this (pagination)'),
        },
        annotations: TOOL_ANNOTATIONS_READONLY,
      },
      async ({ tripId, before }) => {
        if (!canAccessTrip(tripId, userId)) return noAccess();
        const messages = listMessages(tripId, before);
        return ok({ messages });
      }
    );

    if (features.chat && W) server.registerTool(
      'send_collab_message',
      {
        description: "Send a chat message to a trip's collab channel.",
        inputSchema: {
          tripId: z.number().int().positive(),
          text: z.string().min(1),
          replyTo: z.number().int().positive().optional().describe('Reply to a specific message ID'),
        },
        annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
      },
      async ({ tripId, text, replyTo }) => {
        if (isDemoUser(userId)) return demoDenied();
        if (!canAccessTrip(tripId, userId)) return noAccess();
        if (!hasTripPermission('collab_edit', tripId, userId)) return permissionDenied();
        const result = createMessage(tripId, userId, text, replyTo ?? null);
        if (result.error) return { content: [{ type: 'text' as const, text: result.error }], isError: true };
        safeBroadcast(tripId, 'collab:message:created', { message: result.message });
        return ok({ message: result.message });
      }
    );

    if (features.chat && W) server.registerTool(
      'delete_collab_message',
      {
        description: 'Delete a chat message (only the message owner can delete their own messages).',
        inputSchema: {
          tripId: z.number().int().positive(),
          messageId: z.number().int().positive(),
        },
        annotations: TOOL_ANNOTATIONS_DELETE,
      },
      async ({ tripId, messageId }) => {
        if (isDemoUser(userId)) return demoDenied();
        if (!canAccessTrip(tripId, userId)) return noAccess();
        if (!hasTripPermission('collab_edit', tripId, userId)) return permissionDenied();
        const result = deleteMessage(tripId, messageId, userId);
        if (result.error) return { content: [{ type: 'text' as const, text: result.error }], isError: true };
        safeBroadcast(tripId, 'collab:message:deleted', { messageId, username: result.username });
        return ok({ success: true });
      }
    );

    if (features.chat && W) server.registerTool(
      'react_collab_message',
      {
        description: 'Toggle a reaction emoji on a chat message (adds if not present, removes if already reacted).',
        inputSchema: {
          tripId: z.number().int().positive(),
          messageId: z.number().int().positive(),
          emoji: z.string().describe('Single emoji character'),
        },
        annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
      },
      async ({ tripId, messageId, emoji }) => {
        if (isDemoUser(userId)) return demoDenied();
        if (!canAccessTrip(tripId, userId)) return noAccess();
        if (!hasTripPermission('collab_edit', tripId, userId)) return permissionDenied();
        const result = addOrRemoveReaction(messageId, tripId, userId, emoji);
        if (!result.found) return { content: [{ type: 'text' as const, text: 'Message not found.' }], isError: true };
        safeBroadcast(tripId, 'collab:message:reacted', { messageId, reactions: result.reactions });
        return ok({ reactions: result.reactions });
      }
    );
}
