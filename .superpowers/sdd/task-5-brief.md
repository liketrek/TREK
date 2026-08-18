# Task 5: Collab Notes Guest Badge & Display

**Files:**
- Modify: `client/src/components/Collab/CollabNotesCard.tsx`
- Modify: `client/src/components/Collab/CollabNotesFormModal.tsx`
- Modify: `client/src/components/Collab/CollabNotes.types.ts`
- Modify: `shared/src/i18n/*/collab.ts` (if guest label or badge translation needed across all 23 locales)
- Test: `client/src/components/Collab/CollabNotes.test.tsx`

**Interfaces:**
- Consumes: `note.guest_name`, `CollabNote`.
- Produces: Guest badge and author display in Collab Notes card and modals.

## Requirements:
1. In `client/src/components/Collab/CollabNotes.types.ts`:
   - Ensure `CollabNote` interface includes `guest_name?: string | null;`.
2. In `client/src/components/Collab/CollabNotesCard.tsx`:
   - If `note.guest_name` is present:
     - Render a guest badge beside the title or in the header (e.g. `👤 {note.guest_name}` or `👤 Tamu: {note.guest_name}`).
     - In author avatar / tooltip: reflect that the note was created by guest `{note.guest_name}`.
3. In `client/src/components/Collab/CollabNotesFormModal.tsx` and `CollabNotes.tsx`:
   - Ensure viewing/editing a guest note shows the guest attribution clearly.
4. In `shared/src/i18n/*/collab.ts` (if adding translation key like `collab.notes.guestBadge` / `collab.notes.guest`):
   - Add translation key across all 23 locales.
   - Run strict i18n parity check and build shared package.
5. Tests:
   - Add/update tests in `client/src/components/Collab/CollabNotes.test.tsx` verifying that a note with `guest_name` renders the guest badge properly.
   - Run client tests and typechecks (`npm --prefix client test -- CollabNotes.test.tsx`, `npm --prefix client run typecheck`).
