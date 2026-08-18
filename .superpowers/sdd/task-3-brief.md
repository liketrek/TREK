# Task 3: Client API & Share Modal Toggle

**Files:**
- Modify: `client/src/api/client.ts`
- Modify: `client/src/components/Trips/TripMembersModal.tsx`
- Modify: `client/src/i18n/locales/en.json` (and any other locale files if present)
- Test: `client/src/components/Trips/TripMembersModal.test.tsx`

**Interfaces:**
- Consumes: `shareApi.createLink`, `shareApi.getLink`.
- Produces: `shareApi.addGuestNote(token: string, formData: FormData)`, updated `TripMembersModal` with `allow_guest_notes` toggle in `ShareLinkSection`.

## Requirements:
1. In `client/src/api/client.ts`:
   - Update `shareApi`:
     - In `createLink(tripId, perms)`: Ensure `allow_guest_notes?: boolean` is supported in `perms`.
     - In `getLink(tripId)`: Ensure returned type includes `allow_guest_notes?: boolean`.
     - Add `addGuestNote: (token: string, formData: FormData) => postMultipart<{ success: boolean; note: any }>(`/api/shared/${token}/notes`, formData)` or helper function using `fetch` to send FormData to `/api/shared/:token/notes`.
2. In `client/src/components/Trips/TripMembersModal.tsx`:
   - In `ShareLinkSection`:
     - Update initial `perms` state to include `allow_guest_notes: false`.
     - In `useEffect` when fetching link info, set `allow_guest_notes: d.allow_guest_notes ?? false`.
     - Add permission checkbox button for `allow_guest_notes` with label `t('share.permGuestNotes')`.
3. In `client/src/i18n/locales/` (e.g. `en.json` and any other locales):
   - Add `"share.permGuestNotes"` translation string, e.g. `"Allow guest notes"` (or `"Izinkan catatan tamu"` for Indonesian if id.json exists).
4. Tests:
   - Add/update tests in `client/src/components/Trips/TripMembersModal.test.tsx` verifying that `allow_guest_notes` toggle renders, toggles, and updates via `shareApi.createLink`.
   - Run `npm --prefix client test -- TripMembersModal.test.tsx` and typecheck `npm --prefix client run typecheck`.
