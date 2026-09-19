import { describe, expect, it } from 'vitest';
import {
  backoffSeconds,
  isAllowedByOperator,
  isBlockedName,
  needsFullListing,
  planReconcile,
  sanitizeIncomingName,
  type LocalDocument,
  type SyncItemState,
} from '../../../../src/nest/doc-sync/doc-sync.helpers';
import type { RemoteDocument } from '../../../../src/nest/doc-sync/document-provider';

/**
 * The planner decides everything that matters about two-way sync, and it does
 * it without a database, a container or a network. That is the point of having
 * it: the cases that are painful to reproduce against a live provider (an
 * unmounted share, a rename with no stable id, TREK's own write echoing back)
 * are cheap to state here as data.
 */

const remote = (over: Partial<RemoteDocument> = {}): RemoteDocument => ({
  remoteId: 'r1',
  name: 'boarding.pdf',
  size: 1024,
  mimeType: 'application/pdf',
  remoteVersion: 'v1',
  contentHash: null,
  remoteModifiedAt: '2026-09-18T10:00:00Z',
  isDeleted: false,
  ...over,
});

const local = (over: Partial<LocalDocument> = {}): LocalDocument => ({
  fileId: 1,
  name: 'boarding.pdf',
  size: 1024,
  mimeType: 'application/pdf',
  sha256: 'aaa',
  deletedAt: null,
  ...over,
});

const item = (over: Partial<SyncItemState> = {}): SyncItemState => ({
  id: 10,
  fileId: 1,
  trekDocUid: 'uid-1',
  remoteId: 'r1',
  remoteVersion: 'v1',
  remoteName: 'boarding.pdf',
  remoteSize: null,
  remoteModifiedAt: null,
  contentSha256: 'aaa',
  pushedSha256: null,
  state: 'synced',
  attempts: 0,
  nextAttemptAt: null,
  remoteMissingAt: null,
  remoteTrashedAt: null,
  ...over,
});

const plan = (over: Partial<Parameters<typeof planReconcile>[0]> = {}) =>
  planReconcile({
    items: [],
    remote: [],
    local: [],
    direction: 'both',
    remoteTruncated: false,
    remoteUnchanged: false,
    conflictPolicy: 'manual',
    stableRemoteIds: true,
    maxAttempts: 6,
    ...over,
  });

describe('planReconcile', () => {
  it('pulls a document that only exists at the provider', () => {
    const p = plan({ remote: [remote()] });
    expect(p.actions).toEqual([{ kind: 'pull', remote: remote(), itemId: null }]);
  });

  it('pushes a document that only exists in TREK', () => {
    const p = plan({ local: [local()] });
    expect(p.actions).toEqual([{ kind: 'push', local: local(), itemId: null, remoteId: null }]);
  });

  it('does nothing when both sides match', () => {
    const p = plan({ items: [item()], remote: [remote()], local: [local()] });
    expect(p.actions).toEqual([{ kind: 'touch', itemId: 10, remote: remote() }]);
  });

  it('pulls an update when only the provider moved on', () => {
    const p = plan({ items: [item()], remote: [remote({ remoteVersion: 'v2' })], local: [local()] });
    expect(p.actions[0].kind).toBe('pull_update');
  });

  it('pushes an update when only TREK moved on', () => {
    const p = plan({ items: [item()], remote: [remote()], local: [local({ sha256: 'bbb' })] });
    expect(p.actions[0]).toMatchObject({ kind: 'push_update', remoteId: 'r1' });
  });

  it('reports a conflict when both sides moved on', () => {
    const p = plan({
      items: [item()],
      remote: [remote({ remoteVersion: 'v2' })],
      local: [local({ sha256: 'bbb' })],
    });
    expect(p.actions[0].kind).toBe('conflict');
  });

  /**
   * The echo guard. A provider reports TREK's own upload as a change, and
   * without this the file would be pulled back down, re-uploaded, and bounce
   * forever. It compares content rather than timestamps on purpose: a time
   * window misfires on any clock skew between TREK and a NAS.
   */
  it('treats a change whose content matches TREK\'s own push as no change', () => {
    const p = plan({
      items: [item({ pushedSha256: 'aaa' })],
      remote: [remote({ remoteVersion: 'v2', contentHash: 'aaa' })],
      local: [local()],
    });
    expect(p.actions[0].kind).toBe('touch');
  });

  it('still sees a real foreign change when the content differs from what was pushed', () => {
    const p = plan({
      items: [item({ pushedSha256: 'aaa' })],
      remote: [remote({ remoteVersion: 'v2', contentHash: 'ccc' })],
      local: [local()],
    });
    expect(p.actions[0].kind).toBe('pull_update');
  });

  /**
   * An unmounted share and a revoked token both answer with a short listing.
   * Reading that as a mass deletion would empty a trip, so the run refuses
   * everything rather than acting on a listing it cannot trust.
   */
  it('refuses the run when most known documents vanish at once', () => {
    const items = Array.from({ length: 10 }, (_, i) => item({ id: i, remoteId: `r${i}`, fileId: i }));
    const p = plan({ items, remote: [remote({ remoteId: 'r0' })], local: [] });
    expect(p.massDeleteGuardTripped).toBe(true);
    expect(p.actions.filter((a) => a.kind === 'mark_remote_missing')).toHaveLength(0);
  });

  it('records a single disappearance without acting on it', () => {
    const items = Array.from({ length: 10 }, (_, i) => item({ id: i, remoteId: `r${i}`, fileId: i }));
    const stillThere = items.slice(1).map((i) => remote({ remoteId: i.remoteId as string }));
    const p = plan({ items, remote: stillThere, local: [] });
    expect(p.massDeleteGuardTripped).toBe(false);
    expect(p.actions.filter((a) => a.kind === 'mark_remote_missing')).toHaveLength(1);
  });

  it('never marks anything missing from a truncated listing', () => {
    const items = Array.from({ length: 10 }, (_, i) => item({ id: i, remoteId: `r${i}`, fileId: i }));
    const p = plan({ items, remote: [], local: [], remoteTruncated: true });
    expect(p.actions.filter((a) => a.kind === 'mark_remote_missing')).toHaveLength(0);
  });

  /**
   * Which side renamed is decided against the name both sides last agreed on.
   * Reading a `both` binding as "TREK always wins" renamed the provider's copy
   * back every time somebody tidied a folder, which is the opposite of what a
   * two-way sync is for.
   */
  it('renames at the provider when TREK is the side that renamed', () => {
    const p = plan({
      items: [item({ remoteName: 'old.pdf' })],
      remote: [remote({ name: 'old.pdf' })],
      local: [local({ name: 'new.pdf' })],
    });
    expect(p.actions[0]).toMatchObject({ kind: 'rename_remote', name: 'new.pdf' });
  });

  it('renames in TREK when the provider is the side that renamed', () => {
    const p = plan({
      items: [item({ remoteName: 'old.pdf' })],
      remote: [remote({ name: 'new-upstream.pdf' })],
      local: [local({ name: 'old.pdf' })],
    });
    expect(p.actions[0]).toMatchObject({ kind: 'rename_local', name: 'new-upstream.pdf' });
  });

  it('lets the provider win when the binding says so', () => {
    // The answer was stored at setup and never read: every conflict was manual
    // whatever the binding said, so a person who had already picked a side was
    // asked to pick it again, for good.
    const p = plan({
      conflictPolicy: 'provider_wins',
      items: [item({ contentSha256: 'old', remoteVersion: 'v1' })],
      remote: [remote({ remoteVersion: 'v2' })],
      local: [local({ sha256: 'newer' })],
    });
    expect(p.actions.map((a) => a.kind)).toEqual(['pull_update']);
  });

  it('lets TREK win when the binding says so', () => {
    const p = plan({
      conflictPolicy: 'trek_wins',
      items: [item({ contentSha256: 'old', remoteVersion: 'v1' })],
      remote: [remote({ remoteVersion: 'v2' })],
      local: [local({ sha256: 'newer' })],
    });
    expect(p.actions.map((a) => a.kind)).toEqual(['push_update']);
  });

  it('will not resolve a conflict by doing what the direction forbids', () => {
    // A pull-only binding cannot push, so "TREK wins" cannot mean "upload it".
    // Parking is the honest answer; the alternative is silently doing the
    // opposite of one of the two settings.
    const p = plan({
      conflictPolicy: 'trek_wins',
      direction: 'pull',
      items: [item({ contentSha256: 'old', remoteVersion: 'v1' })],
      remote: [remote({ remoteVersion: 'v2' })],
      local: [local({ sha256: 'newer' })],
    });
    expect(p.actions.map((a) => a.kind)).toEqual(['conflict']);
  });

  it('asks a person when both sides renamed', () => {
    const p = plan({
      items: [item({ remoteName: 'old.pdf' })],
      remote: [remote({ name: 'theirs.pdf' })],
      local: [local({ name: 'mine.pdf' })],
    });
    expect(p.actions[0].kind).toBe('conflict');
  });

  it('does nothing about a name difference it cannot arbitrate', () => {
    // No stored name: a row from before the column existed, or a pairing made
    // in the same run. Guessing here would rename somebody's file.
    const p = plan({
      items: [item({ remoteName: null })],
      remote: [remote({ name: 'a.pdf' })],
      local: [local({ name: 'b.pdf' })],
    });
    expect(p.actions[0].kind).toBe('touch');
  });

  it('honours a pull-only binding by never pushing', () => {
    const p = plan({ local: [local()], remote: [], direction: 'pull' });
    expect(p.actions).toHaveLength(0);
  });

  it('honours a push-only binding by never pulling', () => {
    const p = plan({ remote: [remote()], direction: 'push' });
    expect(p.actions).toHaveLength(0);
  });

  it('does not re-upload a document whose remote copy is merely unlisted', () => {
    // The row has a remoteId but the listing does not contain it. Re-pushing
    // here would duplicate the whole trip upstream every time a listing fails.
    const p = plan({ items: [item()], remote: [], local: [local()] });
    expect(p.actions.some((a) => a.kind === 'push')).toBe(false);
  });

  it('reports a local deletion instead of acting on it', () => {
    const p = plan({ items: [item()], remote: [remote()], local: [local({ deletedAt: '2026-09-18' })] });
    expect(p.actions[0]).toMatchObject({ kind: 'local_deleted', remoteId: 'r1' });
  });

  it('ignores a provider-side tombstone rather than pulling it', () => {
    const p = plan({ remote: [remote({ isDeleted: true })] });
    expect(p.actions).toHaveLength(0);
  });
});

describe('sanitizeIncomingName', () => {
  it('strips directory traversal from both path flavours', () => {
    expect(sanitizeIncomingName('../../etc/passwd')).toBe('passwd');
    expect(sanitizeIncomingName('C:\\Windows\\system32\\evil.pdf')).toBe('evil.pdf');
  });

  it('removes control characters and leading dots', () => {
    expect(sanitizeIncomingName('.hidden\u0000.pdf')).toBe('hidden.pdf');
  });

  it('replaces characters that are illegal in a filename', () => {
    expect(sanitizeIncomingName('a:b*c?.pdf')).toBe('a_b_c_.pdf');
  });

  it('never returns an empty name', () => {
    expect(sanitizeIncomingName('...')).toBe('document');
    expect(sanitizeIncomingName('')).toBe('document');
  });
});

describe('isBlockedName', () => {
  it('blocks the extensions TREK serves inline', () => {
    // A download is served with a Content-Type derived from the extension, so
    // these would be stored XSS if a provider folder could introduce them.
    expect(isBlockedName('map.svg')).toBe(true);
    expect(isBlockedName('page.html')).toBe(true);
    expect(isBlockedName('run.exe')).toBe(true);
  });

  it('allows ordinary documents', () => {
    expect(isBlockedName('boarding.pdf')).toBe(false);
  });
});

describe('isAllowedByOperator', () => {
  it('honours the wildcard', () => {
    expect(isAllowedByOperator('x.pdf', '*')).toBe(true);
  });

  it('matches case-insensitively and tolerates dots and spaces in the list', () => {
    expect(isAllowedByOperator('x.PDF', ' .pdf , jpg ')).toBe(true);
  });

  it('refuses a file with no extension even under the wildcard', () => {
    expect(isAllowedByOperator('README', '*')).toBe(false);
  });
});

describe('backoffSeconds', () => {
  it('saturates at the end of the curve instead of running off it', () => {
    expect(backoffSeconds([60, 300], 1)).toBe(60);
    expect(backoffSeconds([60, 300], 2)).toBe(300);
    expect(backoffSeconds([60, 300], 99)).toBe(300);
  });

  it('treats a zero failure count as the first step', () => {
    expect(backoffSeconds([60, 300], 0)).toBe(60);
  });
});

/**
 * The retry limit, read back out.
 *
 * Found in a live database at 46 attempts against a limit of 6: the counter and
 * the backoff were written on every failure and never consulted when planning
 * the next run, so a document a provider refuses (a file it reads as corrupt,
 * a type it will not take, a full quota) was re-uploaded on every cron tick
 * for as long as it existed.
 */
describe('planReconcile > shelving a row that keeps failing', () => {
  const failing = (over: Partial<SyncItemState> = {}) =>
    item({ id: 20, remoteId: null, remoteVersion: null, remoteName: null, contentSha256: null, state: 'error', ...over });

  it('re-plans a failed push while attempts are left', () => {
    const p = plan({
      items: [failing({ attempts: 2 })],
      local: [local({ fileId: 1 })],
      maxAttempts: 6,
    });
    expect(p.actions.map(a => a.kind)).toContain('push');
  });

  it('stops re-planning once the attempts are used up', () => {
    const p = plan({
      items: [failing({ attempts: 6 })],
      local: [local({ fileId: 1 })],
      maxAttempts: 6,
    });
    expect(p.actions.map(a => a.kind)).not.toContain('push');
  });

  it('stops re-planning past the limit as well, not only exactly at it', () => {
    const p = plan({
      items: [failing({ attempts: 46 })],
      local: [local({ fileId: 1 })],
      maxAttempts: 6,
    });
    expect(p.actions).toEqual([]);
  });

  it('holds off while the backoff window is still open', () => {
    const p = plan({
      items: [failing({ attempts: 1, nextAttemptAt: '2030-01-01 00:00:00' })],
      local: [local({ fileId: 1 })],
      maxAttempts: 6,
      now: '2026-01-01 00:00:00',
    });
    expect(p.actions).toEqual([]);
  });

  it('tries again once the backoff window has passed', () => {
    const p = plan({
      items: [failing({ attempts: 1, nextAttemptAt: '2026-01-01 00:00:00' })],
      local: [local({ fileId: 1 })],
      maxAttempts: 6,
      now: '2026-06-01 00:00:00',
    });
    expect(p.actions.map(a => a.kind)).toContain('push');
  });

  it('leaves a healthy row alone however high its old attempt count is', () => {
    // attempts is not reset on success, so a row that failed twice and then
    // went through must not be mistaken for a shelved one.
    const p = plan({
      items: [item({ attempts: 9, state: 'synced' })],
      remote: [remote({ remoteId: 'r1', remoteVersion: 'v2' })],
      local: [local({ fileId: 1 })],
      maxAttempts: 6,
    });
    expect(p.actions.map(a => a.kind)).toContain('pull_update');
  });

  it('leaves a shelved row alone even when its provider copy is gone too', () => {
    // "Vanished" is only said about a row that was synced last run, and a row is
    // only shelved while it is in error, so these two never describe the same
    // row. Nothing is planned for it either way.
    const p = plan({
      items: [item({ id: 30, attempts: 99, state: 'error', remoteId: 'r-gone' })],
      remote: [],
      local: [],
      maxAttempts: 6,
    });
    expect(p.actions).toEqual([]);
  });
});

/**
 * An unchanged upstream, which the WebDAV adapters report by NOT fetching.
 *
 * Their root-ETag probe answers "nothing has happened here" in one request, and
 * they then return an empty document list. The core ignored the flag and read
 * that emptiness as a folder somebody had emptied: from the third run of every
 * idle Nextcloud or OpenCloud binding onward, every run ended in the mass-delete
 * guard: `partial`, `missing: 6`, forever, until the failure counter opened the
 * circuit and the scheduler dropped the binding entirely. Reproduced against a
 * live Nextcloud before this was written.
 */
describe('planReconcile > upstream reported as unchanged', () => {
  it('does not read an empty listing as a mass deletion', () => {
    const p = plan({
      items: [item({ id: 1, remoteId: 'r1' }), item({ id: 2, fileId: 2, remoteId: 'r2' })],
      remote: [],
      local: [local({ fileId: 1 }), local({ fileId: 2 })],
      remoteUnchanged: true,
    });
    expect(p.massDeleteGuardTripped).toBe(false);
    expect(p.missingCount).toBe(0);
  });

  it('marks nothing as gone from the provider', () => {
    const p = plan({
      items: [item({ id: 1, remoteId: 'r1' })],
      remote: [],
      local: [local({ fileId: 1 })],
      remoteUnchanged: true,
    });
    expect(p.actions.map(a => a.kind)).not.toContain('mark_remote_missing');
  });

  it('still pushes a document TREK gained in the meantime', () => {
    const p = plan({
      items: [],
      remote: [],
      local: [local({ fileId: 7, name: 'new.pdf' })],
      remoteUnchanged: true,
    });
    expect(p.actions).toEqual([{ kind: 'push', local: expect.objectContaining({ fileId: 7 }), itemId: null, remoteId: null }]);
  });

  it('still reports a document TREK deleted in the meantime', () => {
    const p = plan({
      items: [item({ id: 5, fileId: 3, remoteId: 'r3' })],
      remote: [],
      local: [local({ fileId: 3, deletedAt: '2026-09-18 10:00:00' })],
      remoteUnchanged: true,
    });
    expect(p.actions).toEqual([{ kind: 'local_deleted', itemId: 5, remoteId: 'r3' }]);
  });

  it('does not push out of a pull-only binding', () => {
    const p = plan({
      items: [],
      remote: [],
      local: [local({ fileId: 7 })],
      direction: 'pull',
      remoteUnchanged: true,
    });
    expect(p.actions).toEqual([]);
  });

  it('plans nothing at all when neither side moved', () => {
    const p = plan({
      items: [item({ id: 1, remoteId: 'r1' })],
      remote: [],
      local: [local({ fileId: 1 })],
      remoteUnchanged: true,
    });
    expect(p.actions).toEqual([]);
  });

  it('works the old way when the provider does report a change', () => {
    // The same shape with the flag off is exactly the case that used to break:
    // an empty listing then really does mean everything vanished.
    const many = Array.from({ length: 6 }, (_, i) =>
      item({ id: i + 1, fileId: i + 1, remoteId: `r${i + 1}` }));
    const p = plan({
      items: many,
      remote: [],
      local: many.map((_, i) => local({ fileId: i + 1 })),
      remoteUnchanged: false,
    });
    expect(p.massDeleteGuardTripped).toBe(true);
  });
});

/**
 * A download that failed once must be tried again.
 *
 * `pull()` records the failure together with the remote's current version, so
 * the next run computed `remoteChanged = false`; with no local file the other
 * branches had nothing to compare and the row fell through to `touch`. Nothing
 * in the planner ever planned a second attempt, so the document never arrived,
 * the attempt counter never grew past one, and "Sync now" produced the same
 * plan. The asymmetry was visible in these tests: a failed PUSH was covered,
 * because the TREK-only branch re-plans it; a failed PULL was not.
 */
describe('planReconcile > a pairing whose download never landed', () => {
  const failedPull = (over: Partial<SyncItemState> = {}) =>
    item({ id: 40, fileId: null, remoteId: 'r1', remoteVersion: 'v1', contentSha256: null, state: 'error', ...over });

  it('plans another download', () => {
    const p = plan({
      items: [failedPull()],
      remote: [remote({ remoteId: 'r1', remoteVersion: 'v1' })],
      local: [],
    });
    expect(p.actions).toEqual([{ kind: 'pull_update', remote: expect.objectContaining({ remoteId: 'r1' }), itemId: 40 }]);
  });

  it('does not on a push-only binding, which has no business pulling', () => {
    const p = plan({
      items: [failedPull()],
      remote: [remote({ remoteId: 'r1', remoteVersion: 'v1' })],
      local: [],
      direction: 'push',
    });
    expect(p.actions.map(a => a.kind)).not.toContain('pull_update');
  });

  it('leaves a rejected type alone: that answer does not change by trying again', () => {
    const p = plan({
      items: [failedPull({ state: 'rejected_type' })],
      remote: [remote({ remoteId: 'r1', remoteVersion: 'v1' })],
      local: [],
    });
    expect(p.actions.map(a => a.kind)).not.toContain('pull_update');
  });

  it('leaves an oversized document alone for the same reason', () => {
    const p = plan({
      items: [failedPull({ state: 'too_large' })],
      remote: [remote({ remoteId: 'r1', remoteVersion: 'v1' })],
      local: [],
    });
    expect(p.actions.map(a => a.kind)).not.toContain('pull_update');
  });

  it('does try a rejected one again once the document upstream changes', () => {
    const p = plan({
      items: [failedPull({ state: 'rejected_type' })],
      remote: [remote({ remoteId: 'r1', remoteVersion: 'v2' })],
      local: [],
    });
    expect(p.actions.map(a => a.kind)).toContain('pull_update');
  });

  it('gives up with the rest once the attempts are spent', () => {
    const p = plan({
      items: [failedPull({ attempts: 6 })],
      remote: [remote({ remoteId: 'r1', remoteVersion: 'v1' })],
      local: [],
      maxAttempts: 6,
    });
    expect(p.actions).toEqual([]);
  });

  it('leaves a healthy pairing on touch, not on a pointless re-download', () => {
    const p = plan({
      items: [item({ remoteId: 'r1', remoteVersion: 'v1' })],
      remote: [remote({ remoteId: 'r1', remoteVersion: 'v1' })],
      local: [local({ fileId: 1 })],
    });
    expect(p.actions.map(a => a.kind)).toEqual(['touch']);
  });
});

/**
 * Names are compared through the same sanitiser the local one went through.
 *
 * A provider name TREK had to clean up (a slash, a control character, a
 * leading dot) otherwise reads as "TREK renamed this document" on the very
 * next run, and the provider's copy is renamed to the cleaned version without
 * anybody asking for it.
 */
describe('planReconcile > a provider name TREK had to clean up', () => {
  it('does not read the cleaning as a local rename', () => {
    const p = plan({
      items: [item({ remoteName: 'a/b.pdf', contentSha256: 'aaa' })],
      remote: [remote({ remoteId: 'r1', name: 'a/b.pdf', remoteVersion: 'v1' })],
      local: [local({ fileId: 1, name: 'b.pdf' })],   // what sanitizeIncomingName made of it
    });
    expect(p.actions.map(a => a.kind)).toEqual(['touch']);
  });

  it('still follows a real rename at the provider', () => {
    const p = plan({
      items: [item({ remoteName: 'b.pdf', contentSha256: 'aaa' })],
      remote: [remote({ remoteId: 'r1', name: 'invoice.pdf', remoteVersion: 'v1' })],
      local: [local({ fileId: 1, name: 'b.pdf' })],
    });
    expect(p.actions.map(a => a.kind)).toEqual(['rename_local']);
  });

  it('takes a new name into TREK the way a download would have written it, so it stays', () => {
    // Taken over raw, the next run compared the cleaned provider name with the
    // raw one in TREK, read the difference as a rename made in TREK, and sent
    // the name back upstream: a Paperless title with a colon, renamed to itself.
    const renamed = remote({ remoteId: 'r1', name: 'Hotel: Kyoto.pdf', remoteVersion: 'v1' });
    const first = plan({
      items: [item({ remoteName: 'b.pdf' })],
      remote: [renamed],
      local: [local({ fileId: 1, name: 'b.pdf' })],
    });
    expect(first.actions).toEqual([{ kind: 'rename_local', itemId: 10, fileId: 1, name: 'Hotel_ Kyoto.pdf' }]);

    const second = plan({
      items: [item({ remoteName: 'Hotel_ Kyoto.pdf' })],
      remote: [renamed],
      local: [local({ fileId: 1, name: 'Hotel_ Kyoto.pdf' })],
    });
    expect(second.actions).toEqual([{ kind: 'touch', itemId: 10, remote: renamed }]);
  });
});

/**
 * A rename upstream where the id is the path, which is Synology FileStation.
 *
 * It bounced. The upstream-only loop re-paired the renamed copy with a `touch`,
 * and `touch` wrote the provider's new name into the rename arbiter while the
 * trip file kept the old one: the next run read that as a rename made in TREK
 * and renamed the provider's copy back. The same run had flagged the pairing
 * missing too, because the vanished list was drawn up before the re-pairing.
 * Observed: run 1 [touch b.pdf, mark_remote_missing], run 2 [rename_remote a.pdf].
 */
describe('planReconcile > a rename upstream where the id is the path', () => {
  const at = '2026-09-18T10:00:00Z';
  const paired = (over: Partial<SyncItemState> = {}) => item({
    remoteId: '/trek/a.pdf', remoteVersion: 'va', remoteName: 'a.pdf', contentSha256: 'hash-a',
    remoteSize: 1024, remoteModifiedAt: at, ...over,
  });
  const listed = (over: Partial<RemoteDocument> = {}) => remote({
    remoteId: '/trek/b.pdf', name: 'b.pdf', remoteVersion: 'vb', contentHash: 'hash-a',
    size: 1024, remoteModifiedAt: at, ...over,
  });
  // No local hash, as in production: TREK has no way to change a file's bytes,
  // so the service never reports one (see loadLocalDocuments).
  const file = (over: Partial<LocalDocument> = {}) => local({ name: 'a.pdf', sha256: null, ...over });
  const pathIds = (over: Partial<Parameters<typeof planReconcile>[0]> = {}) => plan({ stableRemoteIds: false, ...over });
  const kinds = (p: ReturnType<typeof plan>) => p.actions.map(a => a.kind);

  it('takes the new name into TREK and leaves it there on the next run', () => {
    const first = pathIds({ items: [paired()], remote: [listed()], local: [file()] });
    expect(first.actions).toEqual([
      { kind: 'relocate', itemId: 10, remote: listed() },
      { kind: 'rename_local', itemId: 10, fileId: 1, name: 'b.pdf' },
    ]);

    // What the executor leaves behind: the pairing on the new path, the agreed
    // name moved on by rename_local, the trip file renamed.
    const second = pathIds({
      items: [paired({ remoteId: '/trek/b.pdf', remoteVersion: 'vb', remoteName: 'b.pdf' })],
      remote: [listed()],
      local: [file({ name: 'b.pdf' })],
    });
    expect(second.actions).toEqual([{ kind: 'touch', itemId: 10, remote: listed() }]);
  });

  it('ends the way it ends where ids are stable, apart from moving the pairing', () => {
    const pathKeyed = pathIds({ items: [paired()], remote: [listed()], local: [file()] });
    const stable = plan({
      items: [paired({ remoteId: '/trek/b.pdf', remoteVersion: 'vb' })],
      remote: [listed()],
      local: [file()],
    });
    expect(pathKeyed.actions.filter(a => a.kind !== 'relocate')).toEqual(stable.actions);
  });

  it('does not flag the renamed copy as missing', () => {
    const p = pathIds({ items: [paired()], remote: [listed()], local: [file()] });
    expect(p.missingCount).toBe(0);
    expect(kinds(p)).not.toContain('mark_remote_missing');
  });

  it('does not read a whole folder moved in one go as a mass deletion', () => {
    const rows = Array.from({ length: 10 }, (_, i) => paired({
      id: 100 + i, fileId: 100 + i, remoteId: `/trek/${i}.pdf`, remoteName: `${i}.pdf`, contentSha256: `hash-${i}`,
    }));
    const p = pathIds({
      items: rows,
      remote: rows.map((_, i) => listed({ remoteId: `/trek/2026/${i}.pdf`, name: `${i}.pdf`, contentHash: `hash-${i}` })),
      local: rows.map((r, i) => file({ fileId: r.fileId as number, name: `${i}.pdf` })),
    });
    expect(p.massDeleteGuardTripped).toBe(false);
    expect(p.missingCount).toBe(0);
    expect(kinds(p).filter(k => k === 'relocate')).toHaveLength(10);
    expect(kinds(p)).not.toContain('pull');
  });

  it('follows a copy moved to another folder and leaves its name alone', () => {
    const moved = listed({ remoteId: '/trek/receipts/a.pdf', name: 'a.pdf' });
    const p = pathIds({ items: [paired()], remote: [moved], local: [file()] });
    expect(p.actions).toEqual([
      { kind: 'relocate', itemId: 10, remote: moved },
      { kind: 'touch', itemId: 10, remote: moved },
    ]);
  });

  it('recognises the copy by size and time where the listing carries no hash', () => {
    // Synology offers no sha256 at all, so this is the case that actually
    // happens there; the hash-only version of this never fired.
    const p = pathIds({ items: [paired()], remote: [listed({ contentHash: null })], local: [file()] });
    expect(kinds(p)).toEqual(['relocate', 'rename_local']);
  });

  it('does not follow into a copy with other bytes, whatever its size and time', () => {
    const p = pathIds({ items: [paired()], remote: [listed({ contentHash: 'hash-other' })], local: [file()] });
    expect(kinds(p)).toEqual(['pull', 'mark_remote_missing']);
  });

  it('does not follow into a copy that was edited as well', () => {
    const edited = listed({ contentHash: null, remoteModifiedAt: '2026-09-19T08:00:00Z' });
    const p = pathIds({ items: [paired()], remote: [edited], local: [file()] });
    expect(kinds(p)).toEqual(['pull', 'mark_remote_missing']);
  });

  it('does not guess from size and time it never recorded', () => {
    const p = pathIds({
      items: [paired({ remoteSize: null, remoteModifiedAt: null })],
      remote: [listed({ contentHash: null })],
      local: [file()],
    });
    expect(kinds(p)).toEqual(['pull', 'mark_remote_missing']);
  });

  it('pairs nothing when two copies of the same bytes were renamed at once', () => {
    // Either way round fits the content, and the crosswise one puts each name
    // on the other trip file. A missing flag and a second download can be seen
    // and undone; a swapped pairing cannot be seen at all.
    const p = pathIds({
      items: [
        paired({ id: 1, fileId: 1, remoteId: '/trek/a1.pdf', remoteName: 'a1.pdf' }),
        paired({ id: 2, fileId: 2, remoteId: '/trek/a2.pdf', remoteName: 'a2.pdf' }),
      ],
      remote: [listed({ remoteId: '/trek/b1.pdf', name: 'b1.pdf' }), listed({ remoteId: '/trek/b2.pdf', name: 'b2.pdf' })],
      local: [file({ fileId: 1, name: 'a1.pdf' }), file({ fileId: 2, name: 'a2.pdf' })],
    });
    expect(kinds(p).sort()).toEqual(['mark_remote_missing', 'mark_remote_missing', 'pull', 'pull']);
  });

  it('tells two copies of the same bytes apart when they were moved and kept their names', () => {
    const one = listed({ remoteId: '/trek/2026/a1.pdf', name: 'a1.pdf' });
    const two = listed({ remoteId: '/trek/2026/a2.pdf', name: 'a2.pdf' });
    const p = pathIds({
      items: [
        paired({ id: 1, fileId: 1, remoteId: '/trek/a1.pdf', remoteName: 'a1.pdf' }),
        paired({ id: 2, fileId: 2, remoteId: '/trek/a2.pdf', remoteName: 'a2.pdf' }),
      ],
      remote: [two, one],
      local: [file({ fileId: 1, name: 'a1.pdf' }), file({ fileId: 2, name: 'a2.pdf' })],
    });
    expect(p.actions.filter(a => a.kind === 'relocate')).toEqual([
      { kind: 'relocate', itemId: 1, remote: one },
      { kind: 'relocate', itemId: 2, remote: two },
    ]);
    expect(kinds(p).filter(k => k !== 'relocate')).toEqual(['touch', 'touch']);
  });

  it('follows the one of two identical copies that was renamed and leaves the other', () => {
    const kept = listed({ remoteId: '/trek/a2.pdf', name: 'a2.pdf', remoteVersion: 'va' });
    const renamed = listed({ remoteId: '/trek/b1.pdf', name: 'b1.pdf' });
    const p = pathIds({
      items: [
        paired({ id: 1, fileId: 1, remoteId: '/trek/a1.pdf', remoteName: 'a1.pdf' }),
        paired({ id: 2, fileId: 2, remoteId: '/trek/a2.pdf', remoteName: 'a2.pdf' }),
      ],
      remote: [kept, renamed],
      local: [file({ fileId: 1, name: 'a1.pdf' }), file({ fileId: 2, name: 'a2.pdf' })],
    });
    expect(p.actions).toEqual([
      { kind: 'relocate', itemId: 1, remote: renamed },
      { kind: 'rename_local', itemId: 1, fileId: 1, name: 'b1.pdf' },
      { kind: 'touch', itemId: 2, remote: kept },
    ]);
  });

  it('finds a copy again after TREK renamed it upstream', () => {
    // The adapter cannot say what path a rename produced, so the row keeps the
    // old one (and the name rename_remote agreed) until the next listing.
    const p = pathIds({
      items: [paired({ remoteName: 'b.pdf', remoteVersion: 'vb' })],
      remote: [listed({ contentHash: null })],
      local: [file({ name: 'b.pdf' })],
    });
    expect(kinds(p)).toEqual(['relocate', 'touch']);
  });

  it('keeps a document deleted in TREK deleted when its copy is renamed upstream', () => {
    // Where ids are stable a pairing already acted on stays put. Here the
    // renamed copy would otherwise come back as a new document.
    const p = pathIds({
      items: [paired({ state: 'local_deleted' })],
      remote: [listed()],
      local: [file({ deletedAt: '2026-09-18 08:00:00' })],
    });
    expect(p.actions).toEqual([{ kind: 'relocate', itemId: 10, remote: listed() }]);
  });

  describe('next to a twin TREK binned', () => {
    // Deleting one of two identical files in TREK is the usual way two rows
    // come to share content. The binned one used to count as a candidate, so a
    // rename of the live one was a tie and came back as missing plus new.
    const binned = (over: Partial<SyncItemState> = {}) => paired({
      id: 1, fileId: 1, remoteId: '/trek/a1.pdf', remoteName: 'a1.pdf',
      state: 'local_deleted', remoteTrashedAt: '2026-09-18 08:05:00', ...over,
    });
    const live = paired({ id: 2, fileId: 2, remoteId: '/trek/a2.pdf', remoteName: 'a2.pdf' });
    const renamed = listed({ remoteId: '/trek/b.pdf', name: 'b.pdf', contentHash: null });

    it('follows the rename of the live one', () => {
      const p = pathIds({
        items: [binned(), live],
        remote: [renamed],
        local: [file({ fileId: 1, name: 'a1.pdf', deletedAt: '2026-09-18 08:00:00' }), file({ fileId: 2, name: 'a2.pdf' })],
      });
      expect(p.actions).toEqual([
        { kind: 'relocate', itemId: 2, remote: renamed },
        { kind: 'rename_local', itemId: 2, fileId: 2, name: 'b.pdf' },
      ]);
      expect(p.missingCount).toBe(0);
    });

    it('does so once the binned one is purged as well', () => {
      const p = pathIds({ items: [binned({ fileId: null }), live], remote: [renamed], local: [file({ fileId: 2, name: 'a2.pdf' })] });
      expect(kinds(p)).toEqual(['relocate', 'rename_local']);
      expect(p.actions[0]).toMatchObject({ itemId: 2 });
    });

    it('still recognises the binned copy when it comes back elsewhere on its own', () => {
      const back = listed({ remoteId: '/trek/restored/a1.pdf', name: 'a1.pdf', contentHash: null });
      const p = pathIds({
        items: [binned()],
        remote: [back],
        local: [file({ fileId: 1, name: 'a1.pdf', deletedAt: '2026-09-18 08:00:00' })],
      });
      expect(p.actions).toEqual([
        { kind: 'relocate', itemId: 1, remote: back },
        { kind: 'remote_restored', itemId: 1 },
      ]);
    });
  });

  it('leaves a shelved row where it is: that waits for a person', () => {
    const p = pathIds({
      items: [paired({ state: 'error', attempts: 6, fileId: null, contentSha256: null })],
      remote: [listed({ contentHash: null })],
      local: [],
    });
    expect(kinds(p)).not.toContain('relocate');
  });

  it('follows nothing where ids are stable: a new id there is a new document', () => {
    const p = plan({ items: [paired()], remote: [listed()], local: [file()] });
    expect(kinds(p)).toEqual(['pull', 'mark_remote_missing']);
  });

  it('follows nothing under an unchanged upstream, which lists nothing to follow into', () => {
    const p = pathIds({ items: [paired()], remote: [listed()], local: [file()], remoteUnchanged: true });
    expect(p.actions).toEqual([]);
  });
});

/**
 * Both sides renamed a document whose bytes agree: only the name is in dispute.
 *
 * `trek_wins` used to settle it like changed bytes, with a push_update. That
 * re-sent identical bytes, and where the provider replaces in place (WebDAV,
 * and Synology once renames there were followed) the upload kept the
 * provider's name: the next run read it as a rename made upstream and renamed
 * TREK's file to it. Observed: run 1 [relocate, push_update], run 2 [rename_local].
 */
describe('planReconcile > both sides renamed', () => {
  const at = '2026-09-18T10:00:00Z';
  const paired = item({ remoteId: '/trek/a.pdf', remoteName: 'a.pdf', remoteSize: 1024, remoteModifiedAt: at });
  const theirs = remote({ remoteId: '/trek/c.pdf', name: 'c.pdf', remoteModifiedAt: at });
  const mine = local({ name: 'b.pdf', sha256: null });
  const pathIds = (over: Partial<Parameters<typeof planReconcile>[0]> = {}) =>
    plan({ stableRemoteIds: false, items: [paired], remote: [theirs], local: [mine], ...over });

  it('carries TREK\'s name upstream when TREK wins, and sends no bytes', () => {
    const p = pathIds({ conflictPolicy: 'trek_wins' });
    expect(p.actions).toEqual([
      { kind: 'relocate', itemId: 10, remote: theirs },
      { kind: 'rename_remote', itemId: 10, remoteId: '/trek/c.pdf', name: 'b.pdf' },
    ]);
  });

  it('takes the provider\'s name into TREK when the provider wins, and fetches nothing', () => {
    const p = pathIds({ conflictPolicy: 'provider_wins' });
    expect(p.actions).toEqual([
      { kind: 'relocate', itemId: 10, remote: theirs },
      { kind: 'rename_local', itemId: 10, fileId: 1, name: 'c.pdf' },
    ]);
  });

  it('does the same where ids are stable', () => {
    const stable = (conflictPolicy: 'trek_wins' | 'provider_wins') => plan({
      conflictPolicy,
      items: [item({ remoteName: 'old.pdf' })],
      remote: [remote({ name: 'theirs.pdf' })],
      local: [local({ name: 'mine.pdf' })],
    }).actions;
    expect(stable('trek_wins')).toEqual([{ kind: 'rename_remote', itemId: 10, remoteId: 'r1', name: 'mine.pdf' }]);
    expect(stable('provider_wins')).toEqual([{ kind: 'rename_local', itemId: 10, fileId: 1, name: 'theirs.pdf' }]);
  });

  it('parks it when the direction forbids what the winner would need', () => {
    expect(pathIds({ conflictPolicy: 'trek_wins', direction: 'pull' }).actions.map(a => a.kind))
      .toEqual(['relocate', 'conflict']);
    expect(pathIds({ conflictPolicy: 'provider_wins', direction: 'push' }).actions.map(a => a.kind))
      .toEqual(['relocate', 'conflict']);
  });
});

/**
 * A deletion in TREK is acted on once.
 *
 * Both branches used to plan `local_deleted` for as long as the file sat in
 * TREK's trash, so the policy was applied again on every run. Under `unlink`
 * that was invisible until the binding was switched to `trash`: the next run
 * then binned every document ever deleted in TREK.
 */
describe('planReconcile > a deletion TREK already acted on', () => {
  const settled = (over: Partial<SyncItemState> = {}) =>
    item({ id: 50, fileId: 5, remoteId: 'r5', state: 'local_deleted', ...over });
  const inTrash = local({ fileId: 5, deletedAt: '2026-09-18 08:00:00' });

  it('plans nothing more while the file sits in the trash', () => {
    const p = plan({ items: [settled()], remote: [remote({ remoteId: 'r5' })], local: [inTrash] });
    expect(p.actions).toEqual([]);
  });

  it('plans nothing more under an unchanged upstream either', () => {
    const p = plan({ items: [settled()], remote: [], local: [inTrash], remoteUnchanged: true });
    expect(p.actions).toEqual([]);
  });

  it('does not download the document again once the file is purged', () => {
    // file_id is ON DELETE SET NULL, and a row without a file used to read as
    // a download that never landed.
    const p = plan({ items: [settled({ fileId: null })], remote: [remote({ remoteId: 'r5' })], local: [] });
    expect(p.actions).toEqual([]);
  });

  it('reads a file purged before any run saw it deleted as a deletion', () => {
    const p = plan({ items: [item({ fileId: null, state: 'synced' })], remote: [remote()], local: [] });
    expect(p.actions).toEqual([{ kind: 'local_deleted', itemId: 10, remoteId: 'r1' }]);
  });

  it('does the same under an unchanged upstream', () => {
    const p = plan({ items: [item({ fileId: null, state: 'synced' })], remote: [], local: [], remoteUnchanged: true });
    expect(p.actions).toEqual([{ kind: 'local_deleted', itemId: 10, remoteId: 'r1' }]);
  });

  it('leaves a copy already on record as gone alone under an unchanged upstream', () => {
    // Binning it would record the gap as TREK's doing, and a restore would
    // later upload a document somebody else deleted.
    const p = plan({
      items: [item({ state: 'remote_missing', remoteMissingAt: '2026-09-17 08:00:00' })],
      remote: [],
      local: [local({ deletedAt: '2026-09-18 08:00:00' })],
      remoteUnchanged: true,
    });
    expect(p.actions).toEqual([]);
  });

  it('notices when the copy TREK binned is listed again', () => {
    const p = plan({
      items: [settled({ remoteTrashedAt: '2026-09-18 08:05:00' })],
      remote: [remote({ remoteId: 'r5' })],
      local: [inTrash],
    });
    expect(p.actions).toEqual([{ kind: 'remote_restored', itemId: 50 }]);
  });

  /**
   * A failed update keeps the file it had and sets `error`. Deleted and purged
   * while the row was held back, it read as a first download that never
   * landed, and the next attempt ("Sync now" clears the counter) brought the
   * deleted document straight back.
   */
  describe('on a row that failed an update first', () => {
    const failedUpdate = (over: Partial<SyncItemState> = {}) =>
      item({ fileId: null, state: 'error', attempts: 2, contentSha256: 'aaa', ...over });

    it('reads the purge as a deletion', () => {
      const p = plan({ items: [failedUpdate()], remote: [remote()], local: [] });
      expect(p.actions).toEqual([{ kind: 'local_deleted', itemId: 10, remoteId: 'r1' }]);
    });

    it('does the same under an unchanged upstream', () => {
      const p = plan({ items: [failedUpdate()], remote: [], local: [], remoteUnchanged: true });
      expect(p.actions).toEqual([{ kind: 'local_deleted', itemId: 10, remoteId: 'r1' }]);
    });

    it('waits out the backoff like any other action for the row', () => {
      const p = plan({
        items: [failedUpdate({ nextAttemptAt: '2030-01-01 00:00:00' })],
        remote: [remote()],
        local: [],
        now: '2026-09-19 08:00:00',
      });
      expect(p.actions).toEqual([]);
    });

    it('treats a row waiting on a conflict answer the same way', () => {
      const p = plan({ items: [failedUpdate({ state: 'pending', attempts: 0 })], remote: [remote()], local: [] });
      expect(p.actions).toEqual([{ kind: 'local_deleted', itemId: 10, remoteId: 'r1' }]);
    });

    it('still retries a first download, which never agreed on a hash', () => {
      const p = plan({ items: [failedUpdate({ contentSha256: null })], remote: [remote()], local: [] });
      expect(p.actions.map(a => a.kind)).toEqual(['pull_update']);
    });
  });
});

/**
 * A file taken back out of TREK's trash.
 *
 * Which way the row goes depends on what became of the provider copy while
 * TREK's sat in the bin: still there, binned by TREK itself, or deleted by
 * somebody else.
 */
describe('planReconcile > a file taken back out of TREK trash', () => {
  const settled = (over: Partial<SyncItemState> = {}) =>
    item({ id: 50, fileId: 5, remoteId: 'r5', state: 'local_deleted', ...over });
  const binnedByTrek = (over: Partial<SyncItemState> = {}) =>
    settled({ remoteTrashedAt: '2026-09-18 08:05:00', ...over });
  const back = local({ fileId: 5 });

  it('resumes the pairing when the provider copy stayed', () => {
    const p = plan({ items: [settled()], remote: [remote({ remoteId: 'r5' })], local: [back] });
    expect(p.actions.map(a => a.kind)).toEqual(['local_restored', 'touch']);
  });

  it('brings down an edit made upstream in the meantime, as for any synced row', () => {
    const p = plan({ items: [settled()], remote: [remote({ remoteId: 'r5', remoteVersion: 'v2' })], local: [back] });
    expect(p.actions.map(a => a.kind)).toEqual(['local_restored', 'pull_update']);
  });

  it('flags a copy somebody else deleted meanwhile instead of uploading it', () => {
    const p = plan({ items: [settled()], remote: [], local: [back] });
    expect(p.actions).toEqual([{ kind: 'local_restored', itemId: 50, missing: true }]);
    expect(p.missingCount).toBe(1);
  });

  it('waits under an unchanged upstream, which shows nothing of the copy', () => {
    // Resumed as synced here, a copy that was long gone counted as one that
    // vanished on the next real listing, and could trip the guard with it.
    const p = plan({ items: [settled()], remote: [], local: [back], remoteUnchanged: true });
    expect(p.actions).toEqual([]);
  });

  it('waits on a truncated listing that does not show the copy', () => {
    const p = plan({ items: [settled()], remote: [], local: [back], remoteTruncated: true });
    expect(p.actions).toEqual([]);
  });

  it('resumes from a truncated listing that does show the copy', () => {
    const p = plan({ items: [settled()], remote: [remote({ remoteId: 'r5' })], local: [back], remoteTruncated: true });
    expect(p.actions.map(a => a.kind)).toEqual(['local_restored', 'touch']);
  });

  it('uploads it again when TREK was the one that binned the copy', () => {
    const p = plan({ items: [binnedByTrek()], remote: [], local: [back] });
    expect(p.actions).toEqual([
      { kind: 'detach', itemId: 50 },
      { kind: 'push', local: back, itemId: 50, remoteId: null },
    ]);
  });

  it('does so under an unchanged upstream too', () => {
    const p = plan({ items: [binnedByTrek()], remote: [], local: [back], remoteUnchanged: true });
    expect(p.actions.map(a => a.kind)).toEqual(['detach', 'push']);
  });

  it('is not held back by the echo guard: nothing about it is a remote change', () => {
    const p = plan({ items: [binnedByTrek({ pushedSha256: 'aaa' })], remote: [], local: [local({ fileId: 5, sha256: 'aaa' })] });
    expect(p.actions.map(a => a.kind)).toEqual(['detach', 'push']);
  });

  it('waits on a pull-only binding, which cannot upload', () => {
    const p = plan({ items: [binnedByTrek()], remote: [], local: [back], direction: 'pull' });
    expect(p.actions).toEqual([]);
  });

  it('waits on a truncated listing, where a gap proves nothing', () => {
    const p = plan({ items: [binnedByTrek()], remote: [], local: [back], remoteTruncated: true });
    expect(p.actions).toEqual([]);
  });

  it('resumes instead when the binned copy was restored at the provider as well', () => {
    const p = plan({ items: [binnedByTrek()], remote: [remote({ remoteId: 'r5' })], local: [back] });
    expect(p.actions.map(a => a.kind)).toEqual(['local_restored', 'touch']);
  });

  it('reads many restores after TREK binned them as uploads, not as a mass deletion', () => {
    const rows = Array.from({ length: 10 }, (_, i) =>
      binnedByTrek({ id: 100 + i, fileId: 100 + i, remoteId: `r${100 + i}` }));
    const p = plan({ items: rows, remote: [], local: rows.map((r) => local({ fileId: r.fileId as number })) });
    expect(p.massDeleteGuardTripped).toBe(false);
    expect(p.actions.filter(a => a.kind === 'detach')).toHaveLength(10);
    expect(p.actions.filter(a => a.kind === 'push')).toHaveLength(10);
  });

  it('does not read many restores whose copies are gone as a mass deletion', () => {
    // Nothing was recorded about those copies while TREK's files sat in the
    // bin, so they may have been gone for weeks: the listing did not shrink.
    // Counted as vanished, they tripped the guard, the run was dropped before
    // the restores were written, and every run after it planned the same.
    const rows = Array.from({ length: 10 }, (_, i) =>
      settled({ id: 100 + i, fileId: 100 + i, remoteId: `r${100 + i}` }));
    const p = plan({ items: rows, remote: [], local: rows.map((r) => local({ fileId: r.fileId as number })) });
    expect(p.massDeleteGuardTripped).toBe(false);
    expect(p.actions).toEqual(rows.map((r) => ({ kind: 'local_restored', itemId: r.id, missing: true })));
    expect(p.missingCount).toBe(10);
  });

  describe('beside a binding that is otherwise in step', () => {
    const synced = Array.from({ length: 6 }, (_, i) => item({ id: 200 + i, fileId: 200 + i, remoteId: `s${i}` }));
    const restored = Array.from({ length: 5 }, (_, i) => settled({ id: 300 + i, fileId: 300 + i, remoteId: `g${i}` }));
    const files = [...synced, ...restored].map((r) => local({ fileId: r.fileId as number }));
    const newUpstream = remote({ remoteId: 'fresh', name: 'visa.pdf' });

    it('leaves the guard alone and syncs the rest as usual', () => {
      const p = plan({
        items: [...synced, ...restored],
        remote: [...synced.map((s) => remote({ remoteId: s.remoteId as string })), newUpstream],
        local: files,
      });
      expect(p.massDeleteGuardTripped).toBe(false);
      expect(p.actions.filter(a => a.kind === 'local_restored'))
        .toEqual(restored.map((r) => ({ kind: 'local_restored', itemId: r.id, missing: true })));
      expect(p.actions).toContainEqual({ kind: 'pull', remote: newUpstream, itemId: null });
      expect(p.actions.map(a => a.kind)).not.toContain('mark_remote_missing');
    });

    it('still trips the guard when the synced rows themselves vanish', () => {
      const p = plan({ items: synced, remote: [remote({ remoteId: 's0' })], local: files });
      expect(p.massDeleteGuardTripped).toBe(true);
    });
  });

  it('resumes when the binned copy was restored at the provider under a new path', () => {
    // Detached first, the row lost its id before the move could be followed:
    // the restored copy came down as a new document and TREK's file went up as
    // another, two of each.
    const p = plan({
      stableRemoteIds: false,
      items: [binnedByTrek({ remoteId: '/trek/a.pdf', remoteName: 'a.pdf', remoteSize: 1024, remoteModifiedAt: '2026-09-18T10:00:00Z' })],
      remote: [remote({ remoteId: '/trek/a restored.pdf', name: 'a restored.pdf' })],
      local: [local({ fileId: 5, name: 'a.pdf', sha256: null })],
    });
    expect(p.actions.map(a => a.kind)).toEqual(['relocate', 'local_restored', 'rename_local']);
  });

  it('follows a copy moved while the file was in the bin, when TREK did not bin it', () => {
    const moved = remote({ remoteId: '/trek/2026/a.pdf', name: 'a.pdf' });
    const p = plan({
      stableRemoteIds: false,
      items: [settled({ remoteId: '/trek/a.pdf', remoteName: 'a.pdf', remoteSize: 1024, remoteModifiedAt: '2026-09-18T10:00:00Z' })],
      remote: [moved],
      local: [local({ fileId: 5, name: 'a.pdf', sha256: null })],
    });
    expect(p.actions).toEqual([
      { kind: 'relocate', itemId: 50, remote: moved },
      { kind: 'local_restored', itemId: 50 },
      { kind: 'touch', itemId: 50, remote: moved },
    ]);
  });
});

describe('needsFullListing', () => {
  const settled = (over: Partial<SyncItemState> = {}) =>
    item({ id: 50, fileId: 5, remoteId: 'r5', state: 'local_deleted', ...over });

  it('asks for one once a file whose copy TREK left alone is back', () => {
    expect(needsFullListing([settled()], [local({ fileId: 5 })])).toBe(true);
  });

  it('does not while the file is still in the trash', () => {
    expect(needsFullListing([settled()], [local({ fileId: 5, deletedAt: '2026-09-18 08:00:00' })])).toBe(false);
  });

  it('does not for a copy TREK binned: that gap is known, and the file goes up again', () => {
    expect(needsFullListing([settled({ remoteTrashedAt: '2026-09-18 08:05:00' })], [local({ fileId: 5 })])).toBe(false);
  });

  it('does not once the file is purged', () => {
    expect(needsFullListing([settled({ fileId: null })], [])).toBe(false);
  });

  it('does not for pairings that are simply in step', () => {
    expect(needsFullListing([item()], [local()])).toBe(false);
  });
});
