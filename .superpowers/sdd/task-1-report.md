# Task 1 Report: Database Migration & Schema Types

## Status: COMPLETE

### Commit:
- `671fe81d06639401110b6f13ff9fb93fb89c2e62`: `feat(db): add allow_guest_notes and guest_name columns`

### Summary of Changes:
1. **Database Migrations (`server/src/db/migrations.ts`)**:
   - Added a new migration function at the end of the `migrations` array to alter tables:
     - `ALTER TABLE share_tokens ADD COLUMN allow_guest_notes INTEGER DEFAULT 0;`
     - `ALTER TABLE collab_notes ADD COLUMN guest_name TEXT DEFAULT NULL;`
   - Protected statements with try/catch to maintain resilience on partial databases.

2. **Database Schema (`server/src/db/schema.ts`)**:
   - Added `CREATE TABLE IF NOT EXISTS share_tokens` with `allow_guest_notes INTEGER DEFAULT 0` and index `idx_share_tokens_token`.
   - Updated `CREATE TABLE IF NOT EXISTS collab_notes` with column `guest_name TEXT DEFAULT NULL`.

3. **Server TypeScript Types (`server/src/types.ts`)**:
   - Updated `CollabNote` interface to include `guest_name?: string | null;`.
   - Added and exported `SharePermissions` (`allow_guest_notes?: boolean;`) and `ShareTokenInfo` (`allow_guest_notes: boolean;`).

4. **Server Share Service (`server/src/services/shareService.ts`)**:
   - Updated `SharePermissions` and `ShareTokenInfo` imports.
   - Updated `createOrUpdateShareLink` to persist `allow_guest_notes` (default `false`).
   - Updated `getShareLink` to return `allow_guest_notes: boolean`.
   - Updated `getSharedTripData` permissions payload to include `allow_guest_notes: boolean`.

5. **Shared Schemas (`shared/src/collab/collab.schema.ts`, `shared/src/share/share.schema.ts`)**:
   - Updated `collabNoteCreateRequestSchema` to include `guest_name: z.string().optional()`.
   - Updated `shareLinkRequestSchema` to include `allow_guest_notes: z.boolean().optional()`.
   - Rebuilt `@trek/shared` package successfully.

6. **Tests & Verification**:
   - Added unit test cases in `server/tests/unit/shared-contract.test.ts` for Zod schema validation.
   - Added integration tests in `server/tests/integration/share.test.ts` verifying schema columns, `createOrUpdateShareLink`, `getShareLink`, `getSharedTripData`, and inserting collab notes with `guest_name`.
   - Ran `npm --prefix server test -- tests/integration/share.test.ts tests/unit/shared-contract.test.ts` -> 33 tests passed (0 failures).
   - Ran `npm --prefix server run typecheck` -> Passed with 0 errors.
   - Ran `npm run lint:check --workspace=server` and `npm run lint --workspace=shared` -> Passed with 0 errors.
