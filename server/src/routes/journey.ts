import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { authenticate } from '../middleware/auth';
import { AuthRequest } from '../types';
import * as svc from '../services/journeyService';
import { db } from '../db/database';
import { createOrUpdateJourneyShareLink, getJourneyShareLink, deleteJourneyShareLink, getPublicJourney } from '../services/journeyShareService';
import { uploadToImmich } from '../services/memories/immichService';
import { getAllowedExtensions } from '../services/fileService';

const router = express.Router();

const uploadsBase = path.join(__dirname, '../../uploads/journey');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadsBase)) fs.mkdirSync(uploadsBase, { recursive: true });
    cb(null, uploadsBase);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (!file.mimetype.startsWith('image/') || file.mimetype.includes('svg')) {
    const err: Error & { statusCode?: number } = new Error('Only image files are allowed');
    err.statusCode = 400;
    return cb(err);
  }
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  const allowed = getAllowedExtensions().split(',').map(e => e.trim().toLowerCase());
  if (!allowed.includes('*') && !allowed.includes(ext)) {
    const err: Error & { statusCode?: number } = new Error(`File type .${ext} is not allowed`);
    err.statusCode = 400;
    return cb(err);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: imageFilter,
});

// ── Static prefix routes (MUST come before /:id) ─────────────────────────

router.get('/', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  res.json({ journeys: svc.listJourneys(authReq.user.id) });
});

router.post('/', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { title, subtitle, trip_ids } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Title is required' });
  }
  const journey = svc.createJourney(authReq.user.id, {
    title: title.trim(),
    subtitle,
    trip_ids: Array.isArray(trip_ids) ? trip_ids : [],
  });
  res.status(201).json(journey);
});

router.get('/suggestions', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  res.json({ trips: svc.getSuggestions(authReq.user.id) });
});

router.get('/available-trips', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  res.json({ trips: svc.listUserTrips(authReq.user.id) });
});

// ── Entries (prefix /entries — before /:id) ──────────────────────────────

router.patch('/entries/:entryId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = svc.updateEntry(Number(req.params.entryId), authReq.user.id, req.body || {}, req.headers['x-socket-id'] as string);
  if (!result) return res.status(404).json({ error: 'Entry not found' });
  res.json(result);
});

router.delete('/entries/:entryId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!svc.deleteEntry(Number(req.params.entryId), authReq.user.id, req.headers['x-socket-id'] as string)) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  res.json({ success: true });
});

// ── Photos (prefix /photos and /entries — before /:id) ───────────────────

router.post('/entries/:entryId/photos', authenticate, upload.array('photos', 10), async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });

  const results: any[] = [];
  for (const file of files) {
    const relativePath = `journey/${file.filename}`;
    const photo = svc.addPhoto(
      Number(req.params.entryId),
      authReq.user.id,
      relativePath,
      undefined,
      req.body?.caption
    );
    if (photo) {
      // Mirror to Immich only when the user has explicitly opted in via the
      // Immich integration settings. Avoids the "surprise upload" in #730
      // where a write-capable API key implicitly enabled mirroring.
      const prefs = db.prepare('SELECT immich_auto_upload FROM users WHERE id = ?').get(authReq.user.id) as { immich_auto_upload?: number } | undefined;
      if (prefs?.immich_auto_upload) {
        try {
          const immichId = await uploadToImmich(authReq.user.id, relativePath, file.originalname);
          if (immichId) {
            // photo.id is now the gallery photo id (journey_photos.id)
            svc.setPhotoProvider(photo.id, 'immich', immichId, authReq.user.id);
            (photo as any).provider = 'immich';
            (photo as any).asset_id = immichId;
            (photo as any).owner_id = authReq.user.id;
          }
        } catch {}
      }
      results.push(photo);
    }
  }

  if (!results.length) return res.status(403).json({ error: 'Not allowed' });
  res.status(201).json({ photos: results });
});

router.post('/entries/:entryId/provider-photos', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { provider, asset_id, asset_ids, caption, passphrase } = req.body || {};
  const pp = passphrase && typeof passphrase === 'string' ? passphrase : undefined;

  // Batch mode: { provider, asset_ids: string[] }
  if (Array.isArray(asset_ids) && provider) {
    const added: any[] = [];
    for (const id of asset_ids) {
      const photo = svc.addProviderPhoto(Number(req.params.entryId), authReq.user.id, provider, String(id), caption, pp);
      if (photo) added.push(photo);
    }
    return res.status(201).json({ photos: added, added: added.length });
  }

  // Single mode (backward compat)
  if (!provider || !asset_id) return res.status(400).json({ error: 'provider and asset_id required' });
  const photo = svc.addProviderPhoto(Number(req.params.entryId), authReq.user.id, provider, asset_id, caption, pp);
  if (!photo) return res.status(403).json({ error: 'Not allowed or duplicate' });
  res.status(201).json(photo);
});

// Link a gallery photo to an entry
router.post('/entries/:entryId/link-photo', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  // Accept journey_photo_id (new) or photo_id (legacy alias) for backwards compat
  const journeyPhotoId = (req.body || {}).journey_photo_id ?? (req.body || {}).photo_id;
  if (!journeyPhotoId) return res.status(400).json({ error: 'journey_photo_id required' });
  const result = svc.linkPhotoToEntry(Number(req.params.entryId), Number(journeyPhotoId), authReq.user.id);
  if (!result) return res.status(403).json({ error: 'Not allowed' });
  res.status(201).json(result);
});

// Unlink a photo from a specific entry (gallery row is preserved)
router.delete('/entries/:entryId/photos/:journeyPhotoId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const ok = svc.unlinkPhotoFromEntry(Number(req.params.entryId), Number(req.params.journeyPhotoId), authReq.user.id);
  if (!ok) return res.status(404).json({ error: 'Not found or not allowed' });
  res.status(204).end();
});

router.patch('/photos/:photoId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = svc.updatePhoto(Number(req.params.photoId), authReq.user.id, req.body || {});
  if (!result) return res.status(404).json({ error: 'Photo not found' });
  res.json(result);
});

// Hard-delete: removes gallery row + cascades to all entry links + deletes file if unreferenced
router.delete('/photos/:photoId', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const photo = svc.deletePhoto(Number(req.params.photoId), authReq.user.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found' });
  if (photo.file_path) {
    const fullPath = path.join(__dirname, '../../uploads', photo.file_path);
    try { fs.unlinkSync(fullPath); } catch {}
  }
  res.json({ success: true });
});

// ── Gallery (prefix /:id/gallery — before /:id) ──────────────────────────

// Upload photos directly to the journey gallery (no entry association)
router.post('/:id/gallery/photos', authenticate, upload.array('photos', 20), async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const files = req.files as Express.Multer.File[];
  if (!files?.length) return res.status(400).json({ error: 'No files uploaded' });

  const filePaths = files.map(f => ({ path: `journey/${f.filename}` }));
  const photos = svc.uploadGalleryPhotos(Number(req.params.id), authReq.user.id, filePaths);
  if (!photos.length) return res.status(403).json({ error: 'Not allowed' });
  res.status(201).json({ photos });
});

// Add provider photos to gallery only (no entry link)
router.post('/:id/gallery/provider-photos', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { provider, asset_id, asset_ids, passphrase } = req.body || {};
  const pp = passphrase && typeof passphrase === 'string' ? passphrase : undefined;

  if (Array.isArray(asset_ids) && provider) {
    const added: any[] = [];
    for (const id of asset_ids) {
      const photo = svc.addProviderPhotoToGallery(Number(req.params.id), authReq.user.id, provider, String(id), undefined, pp);
      if (photo) added.push(photo);
    }
    return res.status(201).json({ photos: added, added: added.length });
  }

  if (!provider || !asset_id) return res.status(400).json({ error: 'provider and asset_id required' });
  const photo = svc.addProviderPhotoToGallery(Number(req.params.id), authReq.user.id, provider, asset_id, undefined, pp);
  if (!photo) return res.status(403).json({ error: 'Not allowed or duplicate' });
  res.status(201).json(photo);
});

// Hard-delete a gallery photo (removes from all entries)
router.delete('/:id/gallery/:journeyPhotoId', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const photo = svc.deleteGalleryPhoto(Number(req.params.journeyPhotoId), authReq.user.id);
  if (!photo) return res.status(404).json({ error: 'Photo not found or not allowed' });
  if (photo.file_path) {
    const fullPath = path.join(__dirname, '../../uploads', photo.file_path);
    try { fs.unlinkSync(fullPath); } catch {}
  }
  res.status(204).end();
});

// ── Journeys /:id (parameterized routes AFTER static prefixes) ───────────

router.get('/:id', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const data = svc.getJourneyFull(Number(req.params.id), authReq.user.id);
  if (!data) return res.status(404).json({ error: 'Journey not found' });
  res.json(data);
});

router.patch('/:id', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = svc.updateJourney(Number(req.params.id), authReq.user.id, req.body || {});
  if (!result) return res.status(404).json({ error: 'Journey not found' });
  res.json(result);
});

router.post('/:id/cover', authenticate, upload.single('cover'), (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const relativePath = `journey/${req.file.filename}`;
  const result = svc.updateJourney(Number(req.params.id), authReq.user.id, { cover_image: relativePath });
  if (!result) return res.status(404).json({ error: 'Journey not found' });
  res.json(result);
});

router.delete('/:id', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!svc.deleteJourney(Number(req.params.id), authReq.user.id)) {
    return res.status(404).json({ error: 'Journey not found' });
  }
  res.json({ success: true });
});

// ── Journey trips ────────────────────────────────────────────────────────

router.post('/:id/trips', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { trip_id } = req.body || {};
  if (!trip_id) return res.status(400).json({ error: 'trip_id required' });
  if (!svc.addTripToJourney(Number(req.params.id), trip_id, authReq.user.id)) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  res.json({ success: true });
});

router.delete('/:id/trips/:tripId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!svc.removeTripFromJourney(Number(req.params.id), Number(req.params.tripId), authReq.user.id)) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  res.json({ success: true });
});

// ── Entries under journey ────────────────────────────────────────────────

router.get('/:id/entries', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const entries = svc.listEntries(Number(req.params.id), authReq.user.id);
  if (!entries) return res.status(404).json({ error: 'Journey not found' });
  res.json({ entries });
});

router.post('/:id/entries', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { entry_date } = req.body || {};
  if (!entry_date) return res.status(400).json({ error: 'entry_date is required' });
  const entry = svc.createEntry(Number(req.params.id), authReq.user.id, req.body, req.headers['x-socket-id'] as string);
  if (!entry) return res.status(404).json({ error: 'Journey not found' });
  res.status(201).json(entry);
});

router.put('/:id/entries/reorder', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const orderedIds = (req.body || {}).orderedIds;
  if (!Array.isArray(orderedIds) || !orderedIds.every(id => Number.isFinite(Number(id)))) {
    return res.status(400).json({ error: 'orderedIds must be an array of numbers' });
  }
  if (!svc.reorderEntries(Number(req.params.id), authReq.user.id, orderedIds.map(Number), req.headers['x-socket-id'] as string)) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  res.json({ success: true });
});

// ── Contributors ─────────────────────────────────────────────────────────

router.post('/:id/contributors', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { user_id, role } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'user_id required' });
  if (!svc.addContributor(Number(req.params.id), authReq.user.id, user_id, role || 'viewer')) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  res.status(201).json({ success: true });
});

router.patch('/:id/contributors/:userId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { role } = req.body || {};
  if (!svc.updateContributorRole(Number(req.params.id), authReq.user.id, Number(req.params.userId), role)) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  res.json({ success: true });
});

router.delete('/:id/contributors/:userId', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!svc.removeContributor(Number(req.params.id), authReq.user.id, Number(req.params.userId))) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  res.json({ success: true });
});

// ── User Preferences ─────────────────────────────────────────────────────

router.patch('/:id/preferences', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const result = svc.updateJourneyPreferences(Number(req.params.id), authReq.user.id, req.body);
  if (!result) return res.status(403).json({ error: 'Not allowed' });
  res.json(result);
});

// ── Share Link ────────────────────────────────────────────────────────────

router.get('/:id/share-link', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const link = getJourneyShareLink(Number(req.params.id));
  res.json({ link });
});

router.post('/:id/share-link', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { share_timeline, share_gallery, share_map } = req.body || {};
  const result = createOrUpdateJourneyShareLink(Number(req.params.id), authReq.user.id, { share_timeline, share_gallery, share_map });
  if (!result) return res.status(403).json({ error: 'Not allowed' });
  res.json(result);
});

router.delete('/:id/share-link', authenticate, (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (!deleteJourneyShareLink(Number(req.params.id), authReq.user.id)) {
    return res.status(403).json({ error: 'Not allowed' });
  }
  res.json({ success: true });
});

export default router;
