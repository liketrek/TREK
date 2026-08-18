# Task 2: Backend Share Service & Guest Note Endpoint

**Files:**
- Modify: `server/src/services/shareService.ts`
- Modify: `server/src/services/collabService.ts`
- Modify: `server/src/nest/share/share.controller.ts`
- Modify: `server/src/nest/share/share.service.ts`
- Test: `server/tests/e2e/share.e2e.test.ts` (or `server/tests/integration/share.test.ts`)

**Interfaces:**
- Consumes: `createOrUpdateShareLink`, `getSharedTripData`, `formatNote`, `NOTE_UPLOAD` multer interceptor/config.
- Produces: `POST /api/shared/:token/notes` endpoint returning `{ success: true, note: CollabNote }`, and updated `GET /api/shared/:token` returning `noteCategories: string[]` and `permissions.allow_guest_notes`.

## Requirements:
1. In `server/src/services/collabService.ts`:
   - Update `createNote` to accept `guest_name?: string` and persist it into `collab_notes.guest_name`.
2. In `server/src/services/shareService.ts`:
   - In `getSharedTripData(token)`:
     - Query distinct categories from `collab_notes` for that trip:
       ```typescript
       const noteCatRows = db.prepare('SELECT DISTINCT category FROM collab_notes WHERE trip_id = ? AND category IS NOT NULL').all(tripId) as { category: string }[];
       const noteCategories = noteCatRows.length > 0 ? noteCatRows.map(r => r.category) : ['General'];
       ```
     - Return `noteCategories` in the response payload.
     - Include `allow_guest_notes: !!shareRow.allow_guest_notes` in `permissions`.
3. In `server/src/nest/share/share.controller.ts` (and `share.service.ts` if helper methods are needed):
   - In `TripShareController.create`:
     - Accept `allow_guest_notes?: boolean` in the body and pass it to `share.createOrUpdate`.
   - In `SharedController`:
     - Add `POST :token/notes` endpoint.
     - Use `FileInterceptor('file', NOTE_UPLOAD)` to handle file upload (reuse the `NOTE_UPLOAD` configuration from `collab.controller.ts` or export/import it).
     - Validation:
       - Validate token exists and `expires_at` is valid in `share_tokens`.
       - Check `allow_guest_notes === 1`. If not, throw `HttpException({ error: 'Guest note submissions are disabled for this link' }, 403)`.
       - Validate `guest_name` and `title` are required non-empty strings (throw 400 if missing).
       - Sanitize / trim fields.
     - Action:
       - Call `collabService.createNote(tripId, shareRow.created_by, { title, content, category, guest_name })`.
       - If `file` is uploaded: call `collabService.addNoteFile(tripId, note.id, file)` to save file to `trip_files`.
       - Re-fetch formatted note via `collabService.getFormattedNoteById(note.id)`.
       - Broadcast WebSocket event `collab:note:created` with `{ note: formattedNote }` to the trip.
       - Send notification to trip owner via `collabService.notifyCollab(tripId, ...)` or notification service.
       - Return HTTP 201 with `{ success: true, note: formattedNote }`.
4. Tests:
   - Add integration / E2E tests in `server/tests/integration/share.test.ts` or `server/tests/e2e/share.e2e.test.ts` to test:
     - Rejection (403) when `allow_guest_notes` is false.
     - Rejection (400) when required fields are missing.
     - Success (201) when valid, with category and file attachment, verifying returned note and attachment.
   - Run tests to verify all tests pass.
