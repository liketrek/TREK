import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { broadcast } from '../../websocket';
import { checkPermission } from '../../services/permissions';
import type { User, TripFile } from '../../types';
import * as svc from '../../services/fileService';

type Trip = NonNullable<ReturnType<typeof svc.verifyTripAccess>>;
type FilePermission = 'file_upload' | 'file_edit' | 'file_delete';

/**
 * Thin Nest wrapper around the existing file service. Trip access, the
 * file_* permissions, the SQL, the path-resolution guard, the download-token
 * auth and the WebSocket broadcasts reuse the legacy code unchanged.
 */
@Injectable()
export class FilesService {
  verifyTripAccess(tripId: string, userId: number) {
    return svc.verifyTripAccess(tripId, userId);
  }

  can(action: FilePermission, trip: Trip, user: User): boolean {
    return checkPermission(action, user.role, trip.user_id, user.id, trip.user_id !== user.id);
  }

  broadcast(tripId: string, event: string, payload: Record<string, unknown>, socketId: string | undefined): void {
    broadcast(tripId, event, payload, socketId);
  }

  // Download-token auth + safe path resolution (used by the unguarded download route).
  authenticateDownload(req: Request) { return svc.authenticateDownload(req); }
  resolveFilePath(filename: string) { return svc.resolveFilePath(filename); }

  listFiles(tripId: string, showTrash: boolean) { return svc.listFiles(tripId, showTrash); }
  getFileById(id: string, tripId: string) { return svc.getFileById(id, tripId); }
  getDeletedFile(id: string, tripId: string) { return svc.getDeletedFile(id, tripId); }
  createFile(tripId: string, file: Parameters<typeof svc.createFile>[1], userId: number, opts: Parameters<typeof svc.createFile>[3]) {
    return svc.createFile(tripId, file, userId, opts);
  }
  updateFile(id: string, current: TripFile, updates: Parameters<typeof svc.updateFile>[2]) { return svc.updateFile(id, current, updates); }
  toggleStarred(id: string, currentStarred: number | undefined) { return svc.toggleStarred(id, currentStarred); }
  softDeleteFile(id: string) { return svc.softDeleteFile(id); }
  restoreFile(id: string) { return svc.restoreFile(id); }
  permanentDeleteFile(file: TripFile) { return svc.permanentDeleteFile(file); }
  emptyTrash(tripId: string) { return svc.emptyTrash(tripId); }
  findForeignLinkTarget(tripId: string, opts: Parameters<typeof svc.findForeignLinkTarget>[1]) { return svc.findForeignLinkTarget(tripId, opts); }
  createFileLink(id: string, opts: Parameters<typeof svc.createFileLink>[1]) { return svc.createFileLink(id, opts); }
  deleteFileLink(linkId: string, id: string) { return svc.deleteFileLink(linkId, id); }
  getFileLinks(id: string) { return svc.getFileLinks(id); }
}
