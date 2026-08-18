import { Injectable } from '@nestjs/common';
import { db, canAccessTrip } from '../../db/database';
import { checkPermission } from '../../services/permissions';
import { broadcast } from '../../websocket';
import type { User } from '../../types';
import * as svc from '../../services/shareService';
import * as collabSvc from '../../services/collabService';

type Trip = NonNullable<ReturnType<typeof canAccessTrip>>;

/**
 * Thin Nest wrapper around the existing share service. Trip access, the
 * 'share_manage' permission and the token SQL reuse the legacy code unchanged.
 */
@Injectable()
export class ShareService {
  verifyTripAccess(tripId: string, userId: number) {
    return canAccessTrip(tripId, userId);
  }

  canManage(trip: Trip, user: User): boolean {
    return checkPermission('share_manage', user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  createOrUpdate(tripId: string, userId: number, permissions: Parameters<typeof svc.createOrUpdateShareLink>[2]) {
    return svc.createOrUpdateShareLink(tripId, userId, permissions);
  }
  get(tripId: string) { return svc.getShareLink(tripId); }
  remove(tripId: string) { return svc.deleteShareLink(tripId); }
  getSharedTripData(token: string) { return svc.getSharedTripData(token); }
  getSharedPlacePhotoPath(token: string, placeId: string) { return svc.getSharedPlacePhotoPath(token, placeId); }
  getValidShareToken(token: string) { return svc.getValidShareToken(token); }

  createGuestNote(
    tripId: string | number,
    userId: number,
    data: { title: string; content?: string; category?: string; guest_name: string },
    file?: Express.Multer.File,
  ) {
    const createdNote = collabSvc.createNote(tripId, userId, data);
    if (file) {
      collabSvc.addNoteFile(tripId, createdNote.id, file);
    }
    const formattedNote = collabSvc.getFormattedNoteById(createdNote.id);
    broadcast(String(tripId), 'collab:note:created', { note: formattedNote });

    import('../../services/notificationService').then(({ send }) => {
      const tripInfo = db.prepare('SELECT title FROM trips WHERE id = ?').get(tripId) as { title: string } | undefined;
      send({
        event: 'collab_message',
        actorId: null,
        scope: 'trip',
        targetId: Number(tripId),
        params: {
          trip: tripInfo?.title || 'Untitled',
          actor: data.guest_name,
          tripId: String(tripId),
          preview: data.title,
        },
      }).catch(() => {});
    });

    return formattedNote;
  }
}
