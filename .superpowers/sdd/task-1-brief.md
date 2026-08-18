# Task 1: Database Migration & Schema Types

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

## Requirements:
1. In `server/src/db/migrations.ts`, append a new migration function to `migrations` array:
   - Add column `allow_guest_notes INTEGER DEFAULT 0` to `share_tokens`.
   - Add column `guest_name TEXT DEFAULT NULL` to `collab_notes`.
   - Protect statements with try/catch to be non-fatal on partial databases.
2. In `server/src/db/schema.ts`:
   - Add `allow_guest_notes INTEGER DEFAULT 0` to `CREATE TABLE IF NOT EXISTS share_tokens`.
   - Add `guest_name TEXT DEFAULT NULL` to `CREATE TABLE IF NOT EXISTS collab_notes`.
3. In `server/src/types.ts`:
   - Update `CollabNote`: add `guest_name?: string | null;`.
   - Update `SharePermissions`: add `allow_guest_notes?: boolean;`.
   - Update `ShareTokenInfo`: add `allow_guest_notes: boolean;`.
4. In `shared/src/collab/collab.schema.ts` and `shared/src/share/share.schema.ts`:
   - Update schemas/types to include `guest_name` and `allow_guest_notes`.
5. Test:
   - Add test in `server/tests/integration/share.test.ts` or relevant test file.
   - Run tests with `npm --prefix server test` to verify database migrations and types pass.
