import { DocumentConnections } from '../../../src/db/entities/DocumentConnections.entity';
import { DocumentProviders } from '../../../src/db/entities/DocumentProviders.entity';
import { TripDocumentLinks } from '../../../src/db/entities/TripDocumentLinks.entity';
import type { DocumentProvider, DocumentProviderCapabilities } from '../../../src/nest/doc-sync/document-provider';
import { DocumentProviderRegistry } from '../../../src/nest/doc-sync/document-provider.registry';
import { NotificationsService } from '../../../src/nest/notifications/notifications.service';
import { addBudgetItemMember } from '../../helpers/factories/budget';
import { linkFile } from '../../helpers/factories/files';
import { insertRow, updateRows } from '../../helpers/factories/rows';
import { addTripMember } from '../../helpers/factories/trips';
import type { CaseGroup, Scene } from './types';
import { MikroORM } from '@mikro-orm/core';
import type { INestApplication } from '@nestjs/common';

import { Readable } from 'node:stream';
import { vi } from 'vitest';

/**
 * Working together on a trip: collab, the trip itself and its members, files,
 * and the account-wide settings, notifications and tags the planner reads.
 *
 * The collab posts and the invitation also notify fellow travellers
 * (notification:new, sent after the write without being awaited). A scene's
 * trip has nobody else on it for a post, so nothing is sent there; the
 * invitation's send is stubbed, and the notifications are held by the tool
 * tests instead (MCP-COLLAB-001/002, MCP-MEMBERS-001).
 */
const TOKEN_ONLY = 'manages a link or feed token: nothing on any screen follows it live, so there is nothing to send';
const onTrip = (s: Scene) => ({ tripId: s.trip.id });
const noArgs = () => ({});
/** A route under the scene's trip. */
const tripPath = (s: Scene, rest = '') => `/api/trips/${s.trip.id}${rest}`;
const orm = (app: INestApplication) => app.get(MikroORM);

/** Ids a setup made for a scene, by the scene's number. */
const fileLinkOf = new Map<number, number>();
const docLinkOf = new Map<number, number>();
const sceneId = (ids: Map<number, number>, s: Scene) => {
  const id = ids.get(s.n);
  if (id === undefined) throw new Error(`scene ${s.n} has no row from its setup`);
  return id;
};

/** The invitation goes out after the answer, so it is stubbed rather than read late. */
function stubNotifications(app: INestApplication) {
  const send = vi.spyOn(app.get(NotificationsService), 'send').mockResolvedValue({ attempted: 0, delivered: 0 });
  return () => send.mockRestore();
}

/**
 * A document store with one PDF in the bound folder, in place of the provider
 * the registry would call over the network. The sync pulls it in, which is
 * the run that tells the trip something changed.
 */
const CAPABILITIES: DocumentProviderCapabilities = {
  push: 'none',
  stableId: true,
  remoteTrash: true,
  replaceInPlace: true,
  contentHashInListing: true,
  maxUploadBytes: null,
  acceptedMimeTypes: null,
  canCreateScope: true,
};
const PDF = Buffer.from('%PDF-1.4 parity');
const SCOPE = { scopeKey: 'tag:1', label: 'Parity', remoteRootId: '1', remoteRootPath: '/TREK/parity' };
const ok = <T>(data: T) => ({ success: true as const, data });
const documentStore = {
  id: 'paperless',
  capabilities: () => CAPABILITIES,
  probe: async () => ok({ account: 'parity', capabilities: CAPABILITIES }),
  listScopes: async () => ok([SCOPE]),
  createScope: async () => ok(SCOPE),
  resolveScope: async () => ok(SCOPE),
  list: async () =>
    ok({
      documents: [
        {
          remoteId: 'r1',
          name: 'boarding.pdf',
          size: PDF.length,
          mimeType: 'application/pdf',
          remoteVersion: 'v1',
          contentHash: null,
          remoteModifiedAt: '2027-05-01T10:00:00Z',
          isDeleted: false,
        },
      ],
      cursor: null,
      cursorUnchanged: false,
      truncated: false,
    }),
  // A stream of its own per call: each scene pulls the document once.
  fetch: async () =>
    ok({ body: Readable.from([PDF]), size: PDF.length, mimeType: 'application/pdf', remoteVersion: 'v1' }),
  push: async () => ok({ remoteId: 'r-pushed', remoteVersion: 'v1', remoteModifiedAt: null, deduplicated: false }),
  rename: async () => ok({ remoteVersion: 'v2' }),
  trash: async () => ok(undefined),
} as unknown as DocumentProvider;

function stubDocumentStore(app: INestApplication) {
  const get = vi.spyOn(app.get(DocumentProviderRegistry), 'get').mockReturnValue(documentStore);
  return () => get.mockRestore();
}

/** The trip bound to that store by its owner, with the provider switched on by the admin. */
async function bindDocumentStore(s: Scene, app: INestApplication) {
  await updateRows(orm(app), DocumentProviders, { id: 'paperless' }, { enabled: 1 });
  const connection = await insertRow(orm(app), DocumentConnections, {
    trip: s.trip.id,
    provider: 'paperless',
    ownerUser: s.owner.id,
    base_url: 'https://paperless.example.com',
    secrets: null,
    settings: '{}',
  });
  const link = await insertRow(orm(app), TripDocumentLinks, {
    trip: s.trip.id,
    connection,
    provider_id: 'paperless',
    remote_scope_key: `tag:${s.n}`,
    remote_root_id: '1',
    remote_root_path: '/TREK/parity',
    remote_label: 'Parity',
    direction: 'both',
    delete_policy: 'unlink',
    conflict_policy: 'manual',
    sync_enabled: 1,
    failure_count: 0,
    next_attempt_at: null,
    createdByRef: s.owner.id,
  });
  docLinkOf.set(s.n, link);
}

const userPing = { user: 'actor' } as const;

export const collabTrip: CaseGroup = {
  name: 'collab-trip',
  prefix: 'BCP-COLLAB',
  cases: [
    // ── Collab ────────────────────────────────────────────────────────────
    {
      tool: 'create_collab_note',
      args: (s) => ({ tripId: s.trip.id, title: 'Ideas' }),
      rest: { method: 'post', path: (s) => tripPath(s, '/collab/notes'), body: () => ({ title: 'Ideas' }) },
      expect: ['collab:note:created'],
    },
    {
      tool: 'update_collab_note',
      needs: ['collabNote'],
      args: (s) => ({ tripId: s.trip.id, noteId: s.collabNote.id, title: 'Plans' }),
      rest: {
        method: 'put',
        path: (s) => tripPath(s, `/collab/notes/${s.collabNote.id}`),
        body: () => ({ title: 'Plans' }),
      },
      expect: ['collab:note:updated'],
    },
    {
      tool: 'delete_collab_note',
      needs: ['collabNote'],
      args: (s) => ({ tripId: s.trip.id, noteId: s.collabNote.id }),
      rest: { method: 'delete', path: (s) => tripPath(s, `/collab/notes/${s.collabNote.id}`) },
      expect: ['collab:note:deleted'],
    },
    {
      tool: 'create_collab_poll',
      args: (s) => ({ tripId: s.trip.id, question: 'Where to eat?', options: ['Pasta', 'Sushi'] }),
      rest: {
        method: 'post',
        path: (s) => tripPath(s, '/collab/polls'),
        body: () => ({ question: 'Where to eat?', options: ['Pasta', 'Sushi'] }),
      },
      expect: ['collab:poll:created'],
    },
    {
      tool: 'vote_collab_poll',
      needs: ['poll'],
      args: (s) => ({ tripId: s.trip.id, pollId: s.poll.id, optionIndex: 0 }),
      rest: {
        method: 'post',
        path: (s) => tripPath(s, `/collab/polls/${s.poll.id}/vote`),
        body: () => ({ option_index: 0 }),
      },
      expect: ['collab:poll:voted'],
    },
    {
      tool: 'close_collab_poll',
      needs: ['poll'],
      args: (s) => ({ tripId: s.trip.id, pollId: s.poll.id }),
      rest: { method: 'put', path: (s) => tripPath(s, `/collab/polls/${s.poll.id}/close`) },
      expect: ['collab:poll:closed'],
    },
    {
      tool: 'delete_collab_poll',
      needs: ['poll'],
      args: (s) => ({ tripId: s.trip.id, pollId: s.poll.id }),
      rest: { method: 'delete', path: (s) => tripPath(s, `/collab/polls/${s.poll.id}`) },
      expect: ['collab:poll:deleted'],
    },
    {
      tool: 'send_collab_message',
      args: (s) => ({ tripId: s.trip.id, text: 'Dinner at 8?' }),
      rest: { method: 'post', path: (s) => tripPath(s, '/collab/messages'), body: () => ({ text: 'Dinner at 8?' }) },
      expect: ['collab:message:created'],
    },
    {
      tool: 'delete_collab_message',
      needs: ['collabMessage'],
      args: (s) => ({ tripId: s.trip.id, messageId: s.collabMessage.id }),
      rest: { method: 'delete', path: (s) => tripPath(s, `/collab/messages/${s.collabMessage.id}`) },
      expect: ['collab:message:deleted'],
    },
    {
      tool: 'react_collab_message',
      needs: ['collabMessage'],
      args: (s) => ({ tripId: s.trip.id, messageId: s.collabMessage.id, emoji: '👍' }),
      rest: {
        method: 'post',
        path: (s) => tripPath(s, `/collab/messages/${s.collabMessage.id}/react`),
        body: () => ({ emoji: '👍' }),
      },
      expect: ['collab:message:reacted'],
    },

    // ── Files and the document store ──────────────────────────────────────
    {
      tool: 'upload_trip_file',
      args: (s) => ({ tripId: s.trip.id, filename: 'ticket.pdf', content: PDF.toString('base64') }),
      twin: 'POST /api/trips/:tripId/files, a multipart upload',
      expect: ['file:created'],
    },
    {
      tool: 'update_trip_file',
      needs: ['file'],
      args: (s) => ({ tripId: s.trip.id, fileId: s.file.id, description: 'Boarding pass' }),
      rest: {
        method: 'put',
        path: (s) => tripPath(s, `/files/${s.file.id}`),
        body: () => ({ description: 'Boarding pass' }),
      },
      expect: ['file:updated'],
    },
    {
      // The file goes out again with every link it now carries, as the file list reads it.
      tool: 'link_trip_file',
      needs: ['file', 'place'],
      args: (s) => ({ tripId: s.trip.id, fileId: s.file.id, place_id: s.place.id }),
      rest: {
        method: 'post',
        path: (s) => tripPath(s, `/files/${s.file.id}/link`),
        body: (s) => ({ place_id: s.place.id }),
      },
      expect: ['file:updated'],
    },
    {
      tool: 'unlink_trip_file',
      needs: ['file', 'place'],
      setup: async (s, app) => {
        fileLinkOf.set(s.n, (await linkFile(orm(app), s.file.id, { place: s.place.id })).id);
      },
      args: (s) => ({ tripId: s.trip.id, fileId: s.file.id, linkId: sceneId(fileLinkOf, s) }),
      rest: { method: 'delete', path: (s) => tripPath(s, `/files/${s.file.id}/link/${sceneId(fileLinkOf, s)}`) },
      expect: ['file:updated'],
    },
    {
      // Sent by the run itself (DocSyncService.syncLink), the same for the scheduler,
      // the route and the tool, to every socket: a pulled document is news to all.
      tool: 'sync_trip_documents',
      setup: bindDocumentStore,
      stub: stubDocumentStore,
      args: (s) => ({ tripId: s.trip.id }),
      rest: {
        method: 'post',
        path: (s) => tripPath(s, `/docsync/links/${sceneId(docLinkOf, s)}/sync`),
        body: () => ({}),
      },
      expect: [
        { event: 'file:created', all: true },
        { event: 'docsync:changed', all: true },
      ],
    },

    // ── The user's own notifications, settings and tags ────────────────────
    {
      tool: 'mark_notification_read',
      needs: ['notification'],
      args: (s) => ({ notificationId: s.notification.id }),
      rest: { method: 'put', path: (s) => `/api/notifications/in-app/${s.notification.id}/read` },
      expect: [{ event: 'notification:updated', ...userPing }],
    },
    {
      tool: 'mark_notification_unread',
      needs: ['notification'],
      args: (s) => ({ notificationId: s.notification.id }),
      rest: { method: 'put', path: (s) => `/api/notifications/in-app/${s.notification.id}/unread` },
      expect: [{ event: 'notification:updated', ...userPing }],
    },
    {
      tool: 'mark_all_notifications_read',
      needs: ['notification'],
      args: noArgs,
      rest: { method: 'put', path: () => '/api/notifications/in-app/read-all' },
      expect: [{ event: 'notification:read-all', ...userPing }],
    },
    {
      tool: 'update_display_settings',
      args: () => ({ settings: { temperature_unit: 'fahrenheit' } }),
      rest: {
        method: 'post',
        path: () => '/api/settings/bulk',
        body: () => ({ settings: { temperature_unit: 'fahrenheit' } }),
      },
      expect: [{ event: 'settings:updated', ...userPing }],
    },
    {
      tool: 'create_tag',
      args: () => ({ name: 'Beach' }),
      rest: { method: 'post', path: () => '/api/tags', body: () => ({ name: 'Beach' }) },
      expect: [{ event: 'tags:changed', ...userPing }],
    },
    {
      tool: 'update_tag',
      needs: ['tag'],
      args: (s) => ({ tagId: s.tag.id, name: 'Coast' }),
      rest: { method: 'put', path: (s) => `/api/tags/${s.tag.id}`, body: () => ({ name: 'Coast' }) },
      expect: [{ event: 'tags:changed', ...userPing }],
    },
    {
      tool: 'delete_tag',
      needs: ['tag'],
      args: (s) => ({ tagId: s.tag.id }),
      rest: { method: 'delete', path: (s) => `/api/tags/${s.tag.id}` },
      expect: [{ event: 'tags:changed', ...userPing }],
    },

    // ── The trip and who is on it ─────────────────────────────────────────
    {
      // The new trip is the owner's: their other tabs read their trip list again.
      tool: 'create_trip',
      args: () => ({ title: 'Lisbon' }),
      rest: { method: 'post', path: () => '/api/trips', body: () => ({ title: 'Lisbon' }) },
      expect: [{ event: 'trips:changed', ...userPing }],
    },
    {
      tool: 'copy_trip',
      args: onTrip,
      rest: { method: 'post', path: (s) => tripPath(s, '/copy'), body: () => ({}) },
      expect: [{ event: 'trips:changed', ...userPing }],
    },
    {
      tool: 'update_trip',
      args: (s) => ({ tripId: s.trip.id, title: 'Lisbon in May' }),
      rest: { method: 'put', path: (s) => tripPath(s), body: () => ({ title: 'Lisbon in May' }) },
      expect: ['trip:updated'],
    },
    {
      tool: 'delete_trip',
      args: onTrip,
      rest: { method: 'delete', path: (s) => tripPath(s) },
      expect: ['trip:deleted'],
    },
    {
      // The admin of the scene has an account and is on no trip of it.
      tool: 'add_trip_member',
      args: (s) => ({ tripId: s.trip.id, identifier: s.admin.username }),
      rest: { method: 'post', path: (s) => tripPath(s, '/members'), body: (s) => ({ identifier: s.admin.username }) },
      stub: stubNotifications,
      expect: ['member:added'],
    },
    {
      tool: 'remove_trip_member',
      needs: ['member'],
      args: (s) => ({ tripId: s.trip.id, memberId: s.member.id }),
      rest: { method: 'delete', path: (s) => tripPath(s, `/members/${s.member.id}`) },
      expect: ['member:removed'],
    },
    {
      // Somebody on the trip who is not its owner leaves it: the admin, put on it first.
      tool: 'leave_trip',
      actor: 'admin',
      setup: async (s, app) => {
        await addTripMember(orm(app), s.trip.id, s.admin.id, s.owner.id);
      },
      args: onTrip,
      rest: { method: 'delete', path: (s) => tripPath(s, `/members/${s.admin.id}`) },
      expect: ['member:removed'],
    },
    {
      tool: 'create_trip_guest',
      args: (s) => ({ tripId: s.trip.id, name: 'Anna' }),
      rest: { method: 'post', path: (s) => tripPath(s, '/guests'), body: () => ({ name: 'Anna' }) },
      expect: ['member:added'],
    },
    {
      tool: 'rename_trip_guest',
      needs: ['guest'],
      args: (s) => ({ tripId: s.trip.id, guestId: s.guest.id, name: 'Anna B.' }),
      rest: { method: 'put', path: (s) => tripPath(s, `/guests/${s.guest.id}`), body: () => ({ name: 'Anna B.' }) },
      expect: ['member:updated'],
    },
    {
      // The guest shares the dinner: it goes out again, split among the rest, after the member.
      tool: 'delete_trip_guest',
      needs: ['guest', 'budgetItem'],
      setup: async (s, app) => {
        await addBudgetItemMember(orm(app), s.budgetItem.id, s.guest.id);
      },
      args: (s) => ({ tripId: s.trip.id, guestId: s.guest.id }),
      rest: { method: 'delete', path: (s) => tripPath(s, `/guests/${s.guest.id}`) },
      expect: ['member:removed', 'budget:updated'],
    },
  ],
  exempt: [
    { tool: 'create_share_link', reason: TOKEN_ONLY, args: onTrip },
    { tool: 'delete_share_link', reason: TOKEN_ONLY, args: onTrip, first: { tool: 'create_share_link', args: onTrip } },
    { tool: 'create_trip_invite_link', reason: TOKEN_ONLY, args: onTrip },
    {
      tool: 'delete_trip_invite_link',
      reason: TOKEN_ONLY,
      args: onTrip,
      first: { tool: 'create_trip_invite_link', args: onTrip },
    },
    { tool: 'enable_trip_calendar_feed', reason: TOKEN_ONLY, args: onTrip },
    {
      tool: 'rotate_trip_calendar_feed',
      reason: TOKEN_ONLY,
      args: onTrip,
      first: { tool: 'enable_trip_calendar_feed', args: onTrip },
    },
    {
      tool: 'disable_trip_calendar_feed',
      reason: TOKEN_ONLY,
      args: onTrip,
      first: { tool: 'enable_trip_calendar_feed', args: onTrip },
    },
    { tool: 'enable_all_trips_calendar_feed', reason: TOKEN_ONLY, args: noArgs },
    {
      tool: 'rotate_all_trips_calendar_feed',
      reason: TOKEN_ONLY,
      args: noArgs,
      first: { tool: 'enable_all_trips_calendar_feed', args: noArgs },
    },
    {
      tool: 'disable_all_trips_calendar_feed',
      reason: TOKEN_ONLY,
      args: noArgs,
      first: { tool: 'enable_all_trips_calendar_feed', args: noArgs },
    },
  ],
};
