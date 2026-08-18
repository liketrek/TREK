# Task 4: Public Share Page Guest Note Modal & Submission

**Files:**
- Create: `client/src/components/shared/GuestAddNoteModal.tsx`
- Modify: `client/src/pages/SharedTripPage.tsx`
- Modify: `client/src/pages/sharedTrip/useSharedTrip.ts`
- Modify: `shared/src/i18n/*/share.ts` (add translations for guest modal and add note button across all 23 locales)
- Test: `client/src/pages/SharedTripPage.test.tsx` (and `client/src/components/shared/GuestAddNoteModal.test.tsx` if creating a dedicated test file)

**Interfaces:**
- Consumes: `shareApi.addGuestNote`, `data.permissions.allow_guest_notes`, `data.noteCategories`.
- Produces: `GuestAddNoteModal` component, Action Button on `SharedTripPage`.

## Requirements:
1. Create `client/src/components/shared/GuestAddNoteModal.tsx`:
   - Props:
     - `isOpen: boolean`
     - `onClose: () => void`
     - `token: string`
     - `categories: string[]`
     - `t: (key: string, params?: Record<string, string | number>) => string`
   - UI Fields:
     - Guest Name (required text input)
     - Category (select dropdown populated with `categories`, defaulting to the first item or `'General'`)
     - Title (required text input)
     - Content (multiline textarea)
     - Attach File (file input with selected file name display, size validation <= 50MB, clear file button)
     - Submit button with loading state spinner
   - Action:
     - Constructs `FormData` with `guest_name`, `title`, `content`, `category`, and optional `file`.
     - Calls `shareApi.addGuestNote(token, formData)`.
     - Shows success toast on completion, resets form fields, and closes the modal.
     - Handles errors cleanly with error toast / error message.
2. In `client/src/pages/SharedTripPage.tsx`:
   - Read `permissions?.allow_guest_notes` and `noteCategories` (or `data.noteCategories || ['General']`) from `data`.
   - When `permissions?.allow_guest_notes` is true, render a prominent button:
     - Floating Action Button (FAB) or Header Action Button: `➕ {t('share.addNote') || 'Kirim Catatan / Ide'}`.
     - Clicking opens `GuestAddNoteModal`.
3. In `shared/src/i18n/*/share.ts`:
   - Add i18n keys for all 23 locales:
     - `'share.addNote'`: e.g. `"Add note"` / `"Tambah catatan"`
     - `'share.guestNoteSuccess'`: e.g. `"Note sent successfully!"` / `"Catatan berhasil dikirim!"`
     - `'share.guestName'`: e.g. `"Your name"` / `"Nama Anda"`
     - `'share.noteTitle'`: e.g. `"Note title"` / `"Judul catatan"`
     - `'share.noteContent'`: e.g. `"Note details (optional)"` / `"Isi catatan (opsional)"`
     - `'share.noteCategory'`: e.g. `"Category"` / `"Kategori"`
     - `'share.attachFile'`: e.g. `"Attach file / photo"` / `"Lampirkan file / foto"`
     - `'share.fileTooLarge'`: e.g. `"File size exceeds 50MB limit"` / `"Ukuran file melebihi batas 50MB"`
     - `'share.sendNote'`: e.g. `"Send Note"` / `"Kirim Catatan"`
   - Run strict i18n parity check `npm --prefix shared run i18n:parity:strict` and build shared package `npm --prefix shared run build`.
4. Tests:
   - Update/add tests in `client/src/pages/SharedTripPage.test.tsx` verifying that when `allow_guest_notes` is true, the button is rendered and opening the modal allows submitting a note with `shareApi.addGuestNote`.
   - Verify `npm --prefix client test -- SharedTripPage.test.tsx` and `npm --prefix client run typecheck`.
