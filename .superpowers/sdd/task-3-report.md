# Task 3: Client API & Share Modal Toggle — Report

## Summary of Changes
1. **API Client (`client/src/api/client.ts`)**:
   - Added `ShareLinkInfo` interface supporting `allow_guest_notes?: boolean`.
   - Updated `shareApi.createLink` signature with `ShareLinkRequest | Record<string, boolean>`.
   - Updated `shareApi.getLink` return type to `Promise<ShareLinkInfo>`.
   - Added `shareApi.addGuestNote(token: string, formData: FormData)` method using `postMultipart` to post multipart note data to `/api/shared/:token/notes`.

2. **Trip Members Modal (`client/src/components/Trips/TripMembersModal.tsx`)**:
   - Added `allow_guest_notes: false` to default `perms` state.
   - Updated `useEffect` link fetching logic to load `allow_guest_notes: d.allow_guest_notes ?? false`.
   - Added permission pill button for `allow_guest_notes` with translation key `t('share.permGuestNotes')`.

3. **Translations & i18n (`shared/src/i18n/*/share.ts`)**:
   - Added `'share.permGuestNotes'` translation key across all 23 supported locales (including `en`, `id`, `de`, `es`, `fr`, etc.).
   - Verified strict i18n file and key parity with `npm --prefix shared run i18n:parity:strict`.
   - Rebuilt `@trek/shared` package.

4. **Testing (`client/src/components/Trips/TripMembersModal.test.tsx`)**:
   - Added `FE-COMP-MEMBERS-028`: verifies `allow_guest_notes` pill renders and clicking it calls `shareApi.createLink` with `allow_guest_notes: true`.
   - Added `FE-COMP-MEMBERS-029`: verifies `allow_guest_notes` initialises properly when fetched from existing share link info.

## Verification Results
- `npm --prefix client test -- TripMembersModal.test.tsx`: 29/29 tests passed.
- `npm --prefix client run typecheck`: 0 errors (clean).
- `npm --prefix shared run typecheck`: 0 errors (clean).
- `npm --prefix shared test`: 34/34 test files passed (139 tests).
- `npm --prefix shared run i18n:parity:strict`: File parity: OK, Key parity: OK.

## Git Commit
- Commit hash: `e5539a00`
- Message: `feat(share): add allow_guest_notes toggle and addGuestNote client api`
