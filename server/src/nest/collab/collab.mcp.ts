import {
  McpController, Tool, ResourceTemplate, type McpContext,
  TOOL_ANNOTATIONS_READONLY, TOOL_ANNOTATIONS_WRITE,
  TOOL_ANNOTATIONS_DELETE, TOOL_ANNOTATIONS_NON_IDEMPOTENT,
  demoDenied, errorResult, ok,
} from '../../nest-mcp';
import { McpToolGuardsService } from '../mcp-shared/mcp-tool-guards.service';
import { z } from 'zod';
import { AuthService } from '../auth/auth.service';
import { ADDON_IDS } from '../../addons';
import { noAccess, permissionDenied } from '../../mcp/tools/_shared';
import { CollabService } from './collab.service';
import { collabFeatureGate } from '../addons/addon-gate';
import { AddonsService } from '../addons/addons.service';

/**
 * Legacy registrar gates: the whole collab surface rides the collab addon
 * (whole-registrar early return), and each tool/resource additionally rides
 * its sub-feature flag from getCollabFeatures() — notes, polls or chat.
 */
const collabNotesOn = collabFeatureGate('notes');
const collabPollsOn = collabFeatureGate('polls');
const collabChatOn = collabFeatureGate('chat');

function parseId(value: string | string[]): number | null {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function accessDenied(uri: string) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify({ error: 'Trip not found or access denied' }),
    }],
  };
}

function jsonContent(uri: string, data: unknown) {
  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    }],
  };
}

/**
 * Collab MCP surface — ported 1:1 from the legacy registrars: the twelve tools
 * from src/mcp/tools/collab.ts and the trek://trips/{tripId}/collab-notes,
 * …/collab/polls and …/collab/messages resources from src/mcp/resources.ts
 * (identical names, descriptions, schemas, annotations, error/payload shapes
 * and broadcasts). The registration-time gates map to the composite `when`
 * thunks (collab addon AND per-sub-feature flag) plus the declarative collab
 * read/write access markers (the legacy `if (R)` / `if (W)` checks, resolved
 * by trekMcpAccessPolicy). The list tools check only trip access (as legacy);
 * vote_collab_poll gained the demo-user gate the legacy registrar was missing,
 * matching every other collab write tool. The two note write tools have since
 * gained `website`, which the REST route has always accepted and the note card
 * renders as a link preview.
 */
@McpController()
export class CollabMcp {
  constructor(
    private readonly collab: CollabService,
    private readonly auth: AuthService,
    readonly addons: AddonsService,
    private readonly guards: McpToolGuardsService,
  ) {}

  // --- COLLAB NOTES ---

  @Tool({
    name: 'create_collab_note',
    description: 'Create a shared collaborative note on a trip (visible to all trip members in the Collab tab).',
    inputSchema: {
      tripId: z.number().int().positive(),
      title: z.string().min(1).max(200),
      content: z.string().max(10000).optional(),
      category: z.string().max(100).optional().describe('Note category (e.g. "Ideas", "To-do", "General")'),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Hex color for the note card'),
      website: z.string().max(500).nullable().optional().describe('Link to attach to the note; the card renders it as a preview thumbnail. Pass null to remove it'),
      pinned: z.boolean().optional().default(false).describe('Pin the note to the top'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collabNotesOn,
    access: { group: 'collab', mode: 'write' },
  })
  async createCollabNote(
    { tripId, title, content, category, color, website, pinned }: {
      tripId: number; title: string; content?: string; category?: string; color?: string; website?: string | null; pinned?: boolean;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('collab_edit', tripId, ctx.userId)) return permissionDenied();
    const note = this.collab.createNote(tripId, ctx.userId, { title, content, category, color, website, pinned });
    this.guards.safeBroadcast(tripId, 'collab:note:created', { note });
    return ok({ note });
  }

  @Tool({
    name: 'update_collab_note',
    description: 'Edit an existing collaborative note on a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      noteId: z.number().int().positive(),
      title: z.string().min(1).max(200).optional(),
      content: z.string().max(10000).optional(),
      category: z.string().max(100).optional(),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().describe('Hex color for the note card'),
      website: z.string().max(500).nullable().optional().describe('Link to attach to the note, or null to remove the one it has'),
      pinned: z.boolean().optional().describe('Pin the note to the top'),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collabNotesOn,
    access: { group: 'collab', mode: 'write' },
  })
  async updateCollabNote(
    { tripId, noteId, title, content, category, color, website, pinned }: {
      tripId: number; noteId: number; title?: string; content?: string; category?: string; color?: string; website?: string | null; pinned?: boolean;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('collab_edit', tripId, ctx.userId)) return permissionDenied();
    const note = this.collab.updateNote(tripId, noteId, { title, content, category, color, website, pinned });
    if (!note) return errorResult('Note not found.');
    this.guards.safeBroadcast(tripId, 'collab:note:updated', { note });
    return ok({ note });
  }

  @Tool({
    name: 'delete_collab_note',
    description: 'Delete a collaborative note from a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
      noteId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: collabNotesOn,
    access: { group: 'collab', mode: 'write' },
  })
  async deleteCollabNote({ tripId, noteId }: { tripId: number; noteId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('collab_edit', tripId, ctx.userId)) return permissionDenied();
    const deleted = await this.collab.deleteNote(tripId, noteId);
    if (!deleted) return errorResult('Note not found.');
    this.guards.safeBroadcast(tripId, 'collab:note:deleted', { noteId });
    return ok({ success: true });
  }

  // --- COLLAB POLLS & CHAT ---

  @Tool({
    name: 'list_collab_polls',
    description: 'List all polls for a trip.',
    inputSchema: {
      tripId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: collabPollsOn,
    access: { group: 'collab', mode: 'read' },
  })
  async listCollabPolls({ tripId }: { tripId: number }, ctx: McpContext) {
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    const polls = this.collab.listPolls(tripId);
    return ok({ polls });
  }

  @Tool({
    name: 'create_collab_poll',
    description: 'Create a new poll in the collab panel.',
    inputSchema: {
      tripId: z.number().int().positive(),
      question: z.string().min(1),
      options: z.array(z.string()).min(2).describe('Poll answer options (at least 2)'),
      multiple: z.boolean().optional().describe('Allow multiple choice'),
      deadline: z.string().optional().describe('ISO date string for poll deadline'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collabPollsOn,
    access: { group: 'collab', mode: 'write' },
  })
  async createCollabPoll(
    { tripId, question, options, multiple, deadline }: {
      tripId: number; question: string; options: string[]; multiple?: boolean; deadline?: string;
    },
    ctx: McpContext,
  ) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('collab_edit', tripId, ctx.userId)) return permissionDenied();
    const poll = this.collab.createPoll(tripId, ctx.userId, { question, options, multiple, deadline });
    this.guards.safeBroadcast(tripId, 'collab:poll:created', { poll });
    return ok({ poll });
  }

  @Tool({
    name: 'vote_collab_poll',
    description: 'Vote on a poll option (or remove vote if already voted for that option).',
    inputSchema: {
      tripId: z.number().int().positive(),
      pollId: z.number().int().positive(),
      optionIndex: z.number().int().min(0).describe('Zero-based index of the option to vote for'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collabPollsOn,
    access: { group: 'collab', mode: 'write' },
  })
  async voteCollabPoll({ tripId, pollId, optionIndex }: { tripId: number; pollId: number; optionIndex: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('collab_edit', tripId, ctx.userId)) return permissionDenied();
    const result = this.collab.votePoll(tripId, pollId, ctx.userId, optionIndex);
    if (result.error) return errorResult(result.error);
    this.guards.safeBroadcast(tripId, 'collab:poll:voted', { poll: result.poll });
    return ok({ poll: result.poll });
  }

  @Tool({
    name: 'close_collab_poll',
    description: 'Close a poll so no more votes can be cast.',
    inputSchema: {
      tripId: z.number().int().positive(),
      pollId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_WRITE,
    when: collabPollsOn,
    access: { group: 'collab', mode: 'write' },
  })
  async closeCollabPoll({ tripId, pollId }: { tripId: number; pollId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('collab_edit', tripId, ctx.userId)) return permissionDenied();
    const poll = this.collab.closePoll(tripId, pollId);
    if (!poll) return errorResult('Poll not found.');
    this.guards.safeBroadcast(tripId, 'collab:poll:closed', { poll });
    return ok({ poll });
  }

  @Tool({
    name: 'delete_collab_poll',
    description: 'Delete a poll and all its votes.',
    inputSchema: {
      tripId: z.number().int().positive(),
      pollId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: collabPollsOn,
    access: { group: 'collab', mode: 'write' },
  })
  async deleteCollabPoll({ tripId, pollId }: { tripId: number; pollId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('collab_edit', tripId, ctx.userId)) return permissionDenied();
    const deleted = this.collab.deletePoll(tripId, pollId);
    if (!deleted) return errorResult('Poll not found.');
    this.guards.safeBroadcast(tripId, 'collab:poll:deleted', { pollId });
    return ok({ success: true });
  }

  @Tool({
    name: 'list_collab_messages',
    description: 'List chat messages for a trip (most recent 100, oldest-first).',
    inputSchema: {
      tripId: z.number().int().positive(),
      before: z.number().int().positive().optional().describe('Load messages with ID less than this (pagination)'),
    },
    annotations: TOOL_ANNOTATIONS_READONLY,
    when: collabChatOn,
    access: { group: 'collab', mode: 'read' },
  })
  async listCollabMessages({ tripId, before }: { tripId: number; before?: number }, ctx: McpContext) {
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    const messages = this.collab.listMessages(tripId, before);
    return ok({ messages });
  }

  @Tool({
    name: 'send_collab_message',
    description: "Send a chat message to a trip's collab channel.",
    inputSchema: {
      tripId: z.number().int().positive(),
      text: z.string().min(1),
      replyTo: z.number().int().positive().optional().describe('Reply to a specific message ID'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collabChatOn,
    access: { group: 'collab', mode: 'write' },
  })
  async sendCollabMessage({ tripId, text, replyTo }: { tripId: number; text: string; replyTo?: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('collab_edit', tripId, ctx.userId)) return permissionDenied();
    const result = this.collab.createMessage(tripId, ctx.userId, text, replyTo ?? null);
    if (result.error) return errorResult(result.error);
    this.guards.safeBroadcast(tripId, 'collab:message:created', { message: result.message });
    return ok({ message: result.message });
  }

  @Tool({
    name: 'delete_collab_message',
    description: 'Delete a chat message (only the message owner can delete their own messages).',
    inputSchema: {
      tripId: z.number().int().positive(),
      messageId: z.number().int().positive(),
    },
    annotations: TOOL_ANNOTATIONS_DELETE,
    when: collabChatOn,
    access: { group: 'collab', mode: 'write' },
  })
  async deleteCollabMessage({ tripId, messageId }: { tripId: number; messageId: number }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('collab_edit', tripId, ctx.userId)) return permissionDenied();
    const result = this.collab.deleteMessage(tripId, messageId, ctx.userId);
    if (result.error) return errorResult(result.error);
    this.guards.safeBroadcast(tripId, 'collab:message:deleted', { messageId, username: result.username });
    return ok({ success: true });
  }

  @Tool({
    name: 'react_collab_message',
    description: 'Toggle a reaction emoji on a chat message (adds if not present, removes if already reacted).',
    inputSchema: {
      tripId: z.number().int().positive(),
      messageId: z.number().int().positive(),
      emoji: z.string().describe('Single emoji character'),
    },
    annotations: TOOL_ANNOTATIONS_NON_IDEMPOTENT,
    when: collabChatOn,
    access: { group: 'collab', mode: 'write' },
  })
  async reactCollabMessage({ tripId, messageId, emoji }: { tripId: number; messageId: number; emoji: string }, ctx: McpContext) {
    if (this.auth.isDemoUser(ctx.userId)) return demoDenied();
    if (!this.collab.verifyTripAccess(tripId, ctx.userId)) return noAccess();
    if (!this.guards.hasTripPermission('collab_edit', tripId, ctx.userId)) return permissionDenied();
    const result = this.collab.reactMessage(messageId, tripId, ctx.userId, emoji);
    if (!result.found) return errorResult('Message not found.');
    this.guards.safeBroadcast(tripId, 'collab:message:reacted', { messageId, reactions: result.reactions });
    return ok({ reactions: result.reactions });
  }

  // --- RESOURCES ---

  @ResourceTemplate({
    name: 'trip-collab-notes',
    uriTemplate: 'trek://trips/{tripId}/collab-notes',
    description: 'Shared collaborative notes for a trip',
    mimeType: 'application/json',
    when: collabNotesOn,
    access: { group: 'collab', mode: 'read' },
  })
  async tripCollabNotesResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.collab.verifyTripAccess(id, ctx.userId)) return accessDenied(uri.href);
    const notes = this.collab.listNotes(id);
    return jsonContent(uri.href, notes);
  }

  @ResourceTemplate({
    name: 'trip-collab-polls',
    uriTemplate: 'trek://trips/{tripId}/collab/polls',
    description: 'All polls for a trip with vote counts per option',
    mimeType: 'application/json',
    when: collabPollsOn,
    access: { group: 'collab', mode: 'read' },
  })
  async tripCollabPollsResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.collab.verifyTripAccess(id, ctx.userId)) return accessDenied(uri.href);
    const polls = this.collab.listPolls(id);
    return jsonContent(uri.href, polls);
  }

  @ResourceTemplate({
    name: 'trip-collab-messages',
    uriTemplate: 'trek://trips/{tripId}/collab/messages',
    description: 'Most recent 100 chat messages for a trip',
    mimeType: 'application/json',
    when: collabChatOn,
    access: { group: 'collab', mode: 'read' },
  })
  async tripCollabMessagesResource(uri: URL, { tripId }: { tripId: string | string[] }, ctx: McpContext) {
    const id = parseId(tripId);
    if (id === null || !this.collab.verifyTripAccess(id, ctx.userId)) return accessDenied(uri.href);
    const messages = this.collab.listMessages(id);
    return jsonContent(uri.href, messages);
  }
}
