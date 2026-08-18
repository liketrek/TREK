# Public Share Link Guest Notes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow public share link visitors to submit notes (with name, category selection, title, content, and file attachments) directly to the trip's Collab Notes, with owner toggle control, real-time sync, and guest badges.

**Architecture:** Extend SQLite schema with `allow_guest_notes` on `share_tokens` and `guest_name` on `collab_notes`. Implement public `POST /api/shared/:token/notes` handling multipart submissions, saving attachments via `trip_files`, broadcasting WebSocket events, and notifying trip owners. Add share modal toggle, guest note submission modal on `SharedTripPage`, and guest badge rendering on `CollabNotesCard`.

**Tech Stack:** NestJS / Express, SQLite (better-sqlite3), Multer, React 18, TypeScript, Tailwind CSS, Lucide Icons, WebSocket (ws), Vitest.

## Global Constraints

- Preserve all existing permissions and token verification behaviors.
- File upload for guests must strictly respect size limits (<= 50MB) and blocked file extensions (`BLOCKED_EXTENSIONS`, no executable or script files).
- Keep public endpoint unauthenticated but strictly scoped and authorized by the share token.

---

### Task 1: Database Migration & Schema Types

**Files:**
- Modify: `server/src/db/migrations.ts`
- Modify: `server/src/db/schema.ts`
- Modify: `server/src/types.ts`
- Modify: `shared/src/collab/collab.schema.ts`
- Modify: `shared/src/share/share.schema.ts`
- Test: `server/tests/integration/share.test.ts`

**Interfaces:**
- Consumes: Existing SQLite database connection and migration runner.
- Produces:
  - `CollabNote.guest_name?: string | null`
  - `SharePermissions.allow_guest_notes?: boolean`
  - `ShareTokenInfo.allow_guest_notes: boolean`

- [ ] **Step 1: Write integration test verifying schema columns and types**

Add test in `server/tests/integration/share.test.ts` checking `allow_guest_notes` in `share_tokens` and `guest_name` in `collab_notes`:

```typescript
it('supports allow_guest_notes in share_tokens and guest_name in collab_notes', () => {
  const trip = createTrip(testUser.id, 'Guest Note Test');
  const { token } = createOrUpdateShareLink(String(trip.id), testUser.id, {
    share_map: true,
    allow_guest_notes: true,
  });
  const link = getShareLink(String(trip.id));
  expect(link?.allow_guest_notes).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix server test -- server/tests/integration/share.test.ts`
Expected: FAIL (missing `allow_guest_notes` column or property).

- [ ] **Step 3: Implement database migration, schema, and types**

In `server/src/db/migrations.ts`, add migration function to `migrations` array:
```typescript
    // Add allow_guest_notes to share_tokens and guest_name to collab_notes
    () => {
      try {
        db.exec('ALTER TABLE share_tokens ADD COLUMN allow_guest_notes INTEGER DEFAULT 0;');
      } catch (err) {
        console.warn('[migrations] Non-fatal migration step failed:', err);
      }
      try {
        db.exec('ALTER TABLE collab_notes ADD COLUMN guest_name TEXT DEFAULT NULL;');
      } catch (err) {
        console.warn('[migrations] Non-fatal migration step failed:', err);
      }
    },
```

In `server/src/db/schema.ts`:
- Add `allow_guest_notes INTEGER DEFAULT 0` to `CREATE TABLE IF NOT EXISTS share_tokens`.
- Add `guest_name TEXT DEFAULT NULL` to `CREATE TABLE IF NOT EXISTS collab_notes`.

In `server/src/types.ts`:
- Update `CollabNote` interface: `guest_name?: string | null;`
- Update `SharePermissions`: `allow_guest_notes?: boolean;`
- Update `ShareTokenInfo`: `allow_guest_notes: boolean;`

In `shared/src/collab/collab.schema.ts` and `shared/src/share/share.schema.ts`:
- Update schemas and types to include `guest_name` and `allow_guest_notes`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix server test -- server/tests/integration/share.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/db/migrations.ts server/src/db/schema.ts server/src/types.ts shared/src/ server/tests/integration/share.test.ts
git commit -m "feat(db): add allow_guest_notes and guest_name columns"
```

---

### Task 2: Backend Share Service & Guest Note Endpoint

**Files:**
- Modify: `server/src/services/shareService.ts`
- Modify: `server/src/services/collabService.ts`
- Modify: `server/src/nest/share/share.controller.ts`
- Test: `server/tests/e2e/share.e2e.test.ts`

**Interfaces:**
- Consumes: `createOrUpdateShareLink`, `getSharedTripData`, `formatNote`, `NOTE_UPLOAD` multer config.
- Produces: `POST /api/shared/:token/notes` endpoint returning `{ success: true, note: CollabNote }`.

- [ ] **Step 1: Write E2E tests for guest note submission**

In `server/tests/e2e/share.e2e.test.ts`:
```typescript
describe('POST /api/shared/:token/notes', () => {
  it('rejects guest note when allow_guest_notes is false', async () => {
    // create trip and share token with allow_guest_notes = false
    const res = await request(app.getHttpServer())
      .post(`/api/shared/${token}/notes`)
      .field('guest_name', 'Guest User')
      .field('title', 'Recommendation')
      .expect(403);
    expect(res.body.error).toMatch(/disabled/i);
  });

  it('accepts guest note with category and attachment when allow_guest_notes is true', async () => {
    // update share token with allow_guest_notes = true
    const res = await request(app.getHttpServer())
      .post(`/api/shared/${token}/notes`)
      .field('guest_name', 'Budi')
      .field('title', 'Great Cafe')
      .field('content', 'Try the coffee near station')
      .field('category', 'Food')
      .attach('file', Buffer.from('fake image content'), 'test.jpg')
      .expect(201);
    expect(res.body.note.guest_name).toBe('Budi');
    expect(res.body.note.title).toBe('Great Cafe');
    expect(res.body.note.attachments.length).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix server test -- server/tests/e2e/share.e2e.test.ts`
Expected: FAIL (route not found / 404).

- [ ] **Step 3: Implement backend service and controller logic**

In `server/src/services/collabService.ts`:
- Update `createNote` to accept `guest_name?: string`:
```typescript
export function createNote(
  tripId: string | number,
  userId: number,
  data: { title: string; content?: string; category?: string; color?: string; website?: string; pinned?: boolean; guest_name?: string }
) {
  const pinned = data.pinned ? 1 : 0;
  const result = db.prepare(`
    INSERT INTO collab_notes (trip_id, user_id, title, content, category, color, website, pinned, guest_name)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(tripId, userId, data.title, data.content || null, data.category || 'General', data.color || '#6366f1', data.website || null, pinned, data.guest_name || null);

  const note = db.prepare(`
    SELECT n.*, u.username, u.avatar FROM collab_notes n JOIN users u ON n.user_id = u.id WHERE n.id = ?
  `).get(result.lastInsertRowid) as CollabNote;

  return formatNote(note);
}
```

In `server/src/services/shareService.ts`:
- Update `createOrUpdateShareLink`, `getShareLink`, and `getSharedTripData` to handle `allow_guest_notes`.
- In `getSharedTripData`:
  - Fetch distinct note categories for the trip:
    ```typescript
    const noteCatsRows = db.prepare('SELECT DISTINCT category FROM collab_notes WHERE trip_id = ? AND category IS NOT NULL').all(tripId) as { category: string }[];
    const noteCategories = noteCatsRows.length > 0 ? noteCatsRows.map(r => r.category) : ['General'];
    ```
  - Include `noteCategories` in the returned object.

In `server/src/nest/share/share.controller.ts`:
- Add `POST :token/notes` handler in `SharedController` with `FileInterceptor('file', NOTE_UPLOAD)`:
```typescript
@Post(':token/notes')
@UseInterceptors(FileInterceptor('file', NOTE_UPLOAD))
async addGuestNote(
  @Param('token') token: string,
  @Body() body: { guest_name?: string; title?: string; content?: string; category?: string },
  @UploadedFile() file: Express.Multer.File | undefined,
) {
  // Validate token & allow_guest_notes
  // Create note via collabService with guest_name
  // If file uploaded, attach via collabService.addNoteFile
  // Broadcast websocket event collab:note:created
  // Notify trip owner
  // Return { success: true, note }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix server test -- server/tests/e2e/share.e2e.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add server/src/services/shareService.ts server/src/services/collabService.ts server/src/nest/share/share.controller.ts server/tests/e2e/share.e2e.test.ts
git commit -m "feat(api): implement POST /api/shared/:token/notes endpoint"
```

---

### Task 3: Client API & Share Modal Toggle

**Files:**
- Modify: `client/src/api/client.ts`
- Modify: `client/src/components/Trips/TripMembersModal.tsx`
- Modify: `client/src/i18n/locales/en.json` (and other locale files if present)
- Test: `client/src/components/Trips/TripMembersModal.test.tsx`

**Interfaces:**
- Consumes: `shareApi.createLink`, `shareApi.getLink`.
- Produces: `shareApi.addGuestNote(token: string, formData: FormData)`, updated `TripMembersModal` with `allow_guest_notes` toggle.

- [ ] **Step 1: Write test for TripMembersModal share toggle**

In `client/src/components/Trips/TripMembersModal.test.tsx`:
```typescript
it('renders allow_guest_notes permission toggle in ShareLinkSection', async () => {
  render(<TripMembersModal trip={mockTrip} onClose={vi.fn()} />);
  expect(await screen.findByText(/allow guest notes/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix client test -- TripMembersModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement client API methods and ShareLinkSection toggle**

In `client/src/api/client.ts`:
- Add `allow_guest_notes?: boolean` to share API payloads.
- Add `addGuestNote: (token: string, formData: FormData) => postMultipart(\`/api/shared/\${token}/notes\`, formData)`.

In `client/src/components/Trips/TripMembersModal.tsx`:
- Include `{ key: 'allow_guest_notes', label: t('share.permGuestNotes') }` in permission options.
- Default `allow_guest_notes: false` in local state.

In `client/src/i18n/`:
- Add translation key `share.permGuestNotes`: `"Allow guest notes"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix client test -- TripMembersModal.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/api/client.ts client/src/components/Trips/TripMembersModal.tsx client/src/components/Trips/TripMembersModal.test.tsx client/src/i18n/
git commit -m "feat(ui): add allow_guest_notes toggle in share modal"
```

---

### Task 4: Public Share Page Guest Note Modal & Submission

**Files:**
- Create: `client/src/components/shared/GuestAddNoteModal.tsx`
- Modify: `client/src/pages/SharedTripPage.tsx`
- Modify: `client/src/pages/sharedTrip/useSharedTrip.ts`
- Test: `client/src/pages/SharedTripPage.test.tsx`

**Interfaces:**
- Consumes: `shareApi.addGuestNote`, `data.permissions.allow_guest_notes`, `data.noteCategories`.
- Produces: `GuestAddNoteModal` component, action button on `SharedTripPage`.

- [ ] **Step 1: Write test for SharedTripPage guest note button and modal**

In `client/src/pages/SharedTripPage.test.tsx`:
```typescript
it('displays "Add Note" button when allow_guest_notes is true', async () => {
  // mock useSharedTrip data with permissions.allow_guest_notes = true
  render(<SharedTripPage />);
  const addBtn = screen.getByRole('button', { name: /kirim catatan|add note/i });
  expect(addBtn).toBeInTheDocument();
  fireEvent.click(addBtn);
  expect(screen.getByLabelText(/nama|name/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix client test -- SharedTripPage.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement GuestAddNoteModal and integrate into SharedTripPage**

Create `client/src/components/shared/GuestAddNoteModal.tsx`:
- Modal containing:
  - Guest Name input
  - Category dropdown selector (using `noteCategories` passed as props)
  - Title input
  - Content textarea
  - File upload input with file size warning (max 50MB) and selected file clear button
  - Submit button with loading spinner
  - Error and success handling with toast notification

In `client/src/pages/SharedTripPage.tsx`:
- If `permissions?.allow_guest_notes`:
  - Render Floating Action Button / Header Button: `➕ {t('shared.addNote') || 'Kirim Catatan / Ide'}`.
  - Render `GuestAddNoteModal` when open state is active.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix client test -- SharedTripPage.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/components/shared/GuestAddNoteModal.tsx client/src/pages/SharedTripPage.tsx client/src/pages/sharedTrip/useSharedTrip.ts client/src/pages/SharedTripPage.test.tsx
git commit -m "feat(ui): add guest note submission modal on public share page"
```

---

### Task 5: Collab Notes Guest Badge & Display

**Files:**
- Modify: `client/src/components/Collab/CollabNotesCard.tsx`
- Modify: `client/src/components/Collab/CollabNotesFormModal.tsx`
- Modify: `client/src/components/Collab/CollabNotes.types.ts`
- Test: `client/src/components/Collab/CollabNotes.test.tsx`

**Interfaces:**
- Consumes: `note.guest_name`.
- Produces: Guest badge and attribution in note cards and details modal.

- [ ] **Step 1: Write test for CollabNotesCard rendering guest badge**

In `client/src/components/Collab/CollabNotes.test.tsx`:
```typescript
it('displays guest badge when note has guest_name', () => {
  const guestNote = { ...mockNote, guest_name: 'Budi' };
  render(<NoteCard note={guestNote} {...mockProps} />);
  expect(screen.getByText(/budi/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix client test -- CollabNotes.test.tsx`
Expected: FAIL

- [ ] **Step 3: Implement guest badge and avatar display in CollabNotesCard**

In `client/src/components/Collab/CollabNotesCard.tsx`:
- Check if `note.guest_name` is present.
- Render badge:
  ```tsx
  {note.guest_name && (
    <span style={{ fontSize: 'calc(8px * var(--fs-scale-caption, 1))', fontWeight: 600, color: '#f59e0b', background: '#fef3c7', padding: '2px 6px', borderRadius: 99, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
      👤 Tamu: {note.guest_name}
    </span>
  )}
  ```
- Tooltip/avatar reflects guest author.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix client test -- CollabNotes.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add client/src/components/Collab/CollabNotesCard.tsx client/src/components/Collab/CollabNotesFormModal.tsx client/src/components/Collab/CollabNotes.types.ts client/src/components/Collab/CollabNotes.test.tsx
git commit -m "feat(ui): display guest author badge in Collab Notes card"
```

---

## Plan Self-Review

1. **Spec coverage:**
   - Database schema with `allow_guest_notes` & `guest_name`: Covered in Task 1.
   - Public endpoint `POST /api/shared/:token/notes` with file upload & real-time broadcast: Covered in Task 2.
   - Toggle switch in Share modal: Covered in Task 3.
   - Public guest submission modal on `SharedTripPage`: Covered in Task 4.
   - Guest badge in Collab Notes: Covered in Task 5.
2. **Placeholder scan:** No TBDs, all endpoints, parameters, and UI flows specified.
3. **Type consistency:** `guest_name`, `allow_guest_notes`, `noteCategories` consistent across backend and frontend tasks.
