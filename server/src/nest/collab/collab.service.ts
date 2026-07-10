import { Injectable } from '@nestjs/common';
import { db } from '../../db/database';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import type { User } from '../../types';
import * as svc from '../../services/collabService';

type Trip = NonNullable<ReturnType<typeof svc.verifyTripAccess>>;

/**
 * Thin Nest wrapper around the existing collab service. Trip access, the
 * 'collab_edit' / 'file_upload' permissions, the SQL and the WebSocket
 * broadcasts reuse the legacy code unchanged.
 */
@Injectable()
export class CollabService {
  verifyTripAccess(tripId: string, userId: number) {
    return svc.verifyTripAccess(tripId, userId);
  }

  canEdit(trip: Trip, user: User): boolean {
    return checkPermission('collab_edit', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  canUploadFiles(trip: Trip, user: User): boolean {
    return checkPermission('file_upload', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  listNotes(tripId: string) { return svc.listNotes(tripId); }
  createNote(tripId: string, userId: number, data: Parameters<typeof svc.createNote>[2]) { return svc.createNote(tripId, userId, data); }
  updateNote(tripId: string, id: string, data: Parameters<typeof svc.updateNote>[2]) { return svc.updateNote(tripId, id, data); }
  deleteNote(tripId: string, id: string): boolean { return svc.deleteNote(tripId, id); }
  addNoteFile(tripId: string, id: string, file: Parameters<typeof svc.addNoteFile>[2]) { return svc.addNoteFile(tripId, id, file); }
  getFormattedNoteById(id: string) { return svc.getFormattedNoteById(id); }
  deleteNoteFile(tripId: string, noteId: string, fileId: string): boolean { return svc.deleteNoteFile(tripId, noteId, fileId); }

  listPolls(tripId: string) { return svc.listPolls(tripId); }
  createPoll(tripId: string, userId: number, data: Parameters<typeof svc.createPoll>[2]) { return svc.createPoll(tripId, userId, data); }
  votePoll(tripId: string, id: string, userId: number, optionIndex: number) { return svc.votePoll(tripId, id, userId, optionIndex); }
  closePoll(tripId: string, id: string) { return svc.closePoll(tripId, id); }
  deletePoll(tripId: string, id: string): boolean { return svc.deletePoll(tripId, id); }

  listMessages(tripId: string, before?: string) { return svc.listMessages(tripId, before); }
  createMessage(tripId: string, userId: number, text: string, replyTo?: number | null) { return svc.createMessage(tripId, userId, text, replyTo); }
  deleteMessage(tripId: string, id: string, userId: number) { return svc.deleteMessage(tripId, id, userId); }
  reactMessage(id: string, tripId: string, userId: number, emoji: string) { return svc.addOrRemoveReaction(id, tripId, userId, emoji); }

  linkPreview(url: string) { return svc.fetchLinkPreview(url); }

  /** Fire-and-forget collab notification (mirrors the route's dynamic import). */
  notifyCollab(tripId: string, actor: User, preview?: string): void {
    import('../../services/notificationService').then(({ send }) => {
      const tripInfo = db.prepare('SELECT title FROM trips WHERE id = ?').get(tripId) as { title: string } | undefined;
      const params: Record<string, string> = { trip: tripInfo?.title || 'Untitled', actor: actor.email, tripId: String(tripId) };
      if (preview !== undefined) params.preview = preview;
      send({ event: 'collab_message', actorId: actor.id, scope: 'trip', targetId: Number(tripId), params }).catch(() => {});
    });
  }
}
