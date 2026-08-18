# Design Document: Guest Note Submissions via Public Share Links

- **Date:** 2026-08-18
- **Topic:** Public Share Link Guest Note Submissions to Collab Notes
- **Status:** Draft (Approved in Brainstorming)

---

## 1. Overview & Problem Statement

Users share trips via public links (`/shared/:token`) with friends, family, or travel companions who might not have an account in MinTrip (TREK). Currently, public links are strictly read-only. Trip organizers want viewers with the share link to be able to suggest ideas, recommend places/notes, and upload attachments (photos, PDFs, docs) directly from the public page, and have those suggestions arrive seamlessly in the trip's **Collab Notes** in the main app.

This design introduces a secure, toggleable guest submission capability for public share links, allowing guests to submit notes (Name, Category, Title, Content, File Attachment) that immediately appear in the main app's Collab Notes with real-time sync and distinct guest badges.

---

## 2. Requirements & User Stories

### 2.1 User Stories
1. **As a Trip Owner / Admin:**
   - I can toggle `Allow Guest Notes` when creating or editing a trip's public share link.
   - I want guest notes to automatically appear in my trip's Collab Notes with a clear badge (e.g. `Guest: [Name]`).
   - I want to receive real-time updates and an in-app notification when a guest submits a note.
   - I can edit, pin, categorize, or delete guest notes just like normal notes.

2. **As a Public Viewer (Guest):**
   - When visiting a public share link with guest submissions enabled, I can click a visible "Add Note / Send Idea" button.
   - I can fill in my Name, select a Category from the trip's existing categories, provide a Title, write Content, and optionally attach a file (image, PDF, etc.).
   - Upon submitting, I receive confirmation that my note was delivered to the trip organizer.

---

## 3. Architecture & Data Model

### 3.1 Database Changes

1. **`share_tokens` table**:
   Add permission column `allow_guest_notes`:
   ```sql
   ALTER TABLE share_tokens ADD COLUMN allow_guest_notes INTEGER DEFAULT 0;
   ```

2. **`collab_notes` table**:
   Add author attribution column `guest_name`:
   ```sql
   ALTER TABLE collab_notes ADD COLUMN guest_name TEXT DEFAULT NULL;
   ```
   * When created by a guest: `user_id` is set to the share token creator's `user_id`, and `guest_name` is set to the submitted name.
   * When created by a registered user: `guest_name` is `NULL`.

3. **`trip_files` table**:
   * Uses existing schema without alterations. The attached file record links to `note_id` and `trip_id`.

4. **Types (`server/src/types.ts` & `shared/src/collab/collab.schema.ts`)**:
   * Update `CollabNote` interface to include `guest_name?: string | null`.
   * Update `SharePermissions` and `ShareTokenInfo` to include `allow_guest_notes?: boolean`.

---

## 4. Backend Endpoints & Logic

### 4.1 New Public Endpoint: `POST /api/shared/:token/notes`
* **Authentication:** Public (scoped and authorized via share token).
* **Payload Format:** `multipart/form-data`
* **Form Fields:**
  * `guest_name` *(string, required, 1–100 chars, trimmed)*
  * `title` *(string, required, 1–200 chars, trimmed)*
  * `content` *(string, optional, max 5000 chars)*
  * `category` *(string, optional, defaults to `'General'`)*
  * `file` *(Express.Multer.File, optional, max 50MB, blocked executable extensions)*

* **Processing Flow:**
  1. Look up `share_tokens` by `token`. Check that token is valid and unexpired (`expires_at IS NULL OR expires_at > datetime('now')`).
  2. Verify `share_token.allow_guest_notes === 1`. If not, return HTTP `403 Forbidden` (`Guest submissions disabled`).
  3. Insert row into `collab_notes` with `trip_id = share_token.trip_id`, `user_id = share_token.created_by`, `guest_name = guest_name`, `title`, `content`, `category`, `color = '#6366f1'`.
  4. If a file is uploaded, store it via existing Multer storage (`uploads/files/`) and insert into `trip_files` linking to the new `note.id`.
  5. Format the newly created note using `formatNote()`.
  6. Broadcast WebSocket event `collab:note:created` to the trip channel (`trip_${tripId}`).
  7. Dispatch in-app notification to the trip owner (`"Guest [Name] added a note: [Title]"`).
  8. Return HTTP `201 Created` with `{ success: true, note }`.

### 4.2 Updates to Existing Endpoints
* **`GET /api/shared/:token` (`SharedController` / `shareService`):**
  * Include `allow_guest_notes: boolean` in `permissions`.
  * Include `noteCategories: string[]` in the payload (distinct categories from `collab_notes` for that trip, falling back to `['General']`).
* **`POST /api/trips/:tripId/share-link` (`TripShareController` / `shareService`):**
  * Accept `allow_guest_notes?: boolean` in the request body and persist it to `share_tokens`.
* **`GET /api/trips/:tripId/share-link`:**
  * Return `allow_guest_notes` in the share link metadata.

---

## 5. Frontend UI & Interaction Design

### 5.1 Main App: Trip Share Modal (`TripShareModal.tsx`)
* Add a permission switch:
  * Label: **"Izinkan Tamu Mengirim Catatan / Allow Guest Notes"**
  * Helper description: *"Pengunjung dengan link ini dapat mengirim catatan, ide, dan file ke Collab Notes trip Anda."*
  * Saves `allow_guest_notes: true/false` when updated.

### 5.2 Public Page: Shared Trip Page (`SharedTripPage.tsx`)
* If `permissions.allow_guest_notes` is `true`:
  * Render a Floating Action Button (FAB) or Header Action Button: **"➕ Kirim Catatan / Ide"**.
  * Clicking opens `GuestAddNoteModal`:
    * Field 1: **Nama Anda** (Required text input).
    * Field 2: **Kategori** (Dropdown selector populated with `noteCategories`).
    * Field 3: **Judul Catatan** (Required text input).
    * Field 4: **Isi Catatan** (Textarea, supports multiline).
    * Field 5: **Lampiran File** (File input supporting images, PDF, documents, with file name indicator and remove button).
    * Submit button with loading state spinner.
  * On success: Display a toast notification (*"Catatan berhasil dikirim!"*), clear form fields, and close the modal.

### 5.3 Main App: Collab Notes View (`CollabNotesCard.tsx` & `CollabNotes.tsx`)
* In the note card header:
  * If `note.guest_name` is present:
    * Display avatar placeholder with guest initials and badge: `👤 Tamu: {note.guest_name}`.
    * Note attachment displays download and preview portals seamlessly.
    * Full edit, delete, pin, and move category controls remain available for trip members.

---

## 6. Security & Error Handling

1. **Token Scoping & Expiry:** Requests to `/api/shared/:token/notes` strictly check token validity and expiry before accepting writes.
2. **File Upload Security:** Reuses the existing secure `NOTE_UPLOAD` multer configuration (`BLOCKED_EXTENSIONS`, MIME validation, 50MB file size limit, randomized UUID file naming).
3. **Input Sanitization:** Strips leading/trailing whitespace, validates required fields, enforces field length limits.
4. **Rate Limiting:** Guard against rapid repeated submissions.

---

## 7. Verification Plan

1. **Unit & Integration Tests:**
   * Test database migration adding `allow_guest_notes` and `guest_name`.
   * Test `POST /api/shared/:token/notes` returns 404 on invalid token, 403 on disabled toggle, 201 on valid submission.
   * Test file attachment uploads correctly and links to `trip_files`.
   * Test WebSocket broadcast upon note creation.
2. **End-to-End Manual Verification:**
   * Enable guest notes in Share Modal for a trip.
   * Open `/shared/:token` in an incognito window.
   * Submit a note with category selection, text, and an image attachment.
   * Verify the note immediately appears on the logged-in session's Collab Notes panel with the `Guest: [Name]` badge and downloadable attachment.
