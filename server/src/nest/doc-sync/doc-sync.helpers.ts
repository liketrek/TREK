import crypto from 'crypto';
import path from 'path';
import { BLOCKED_EXTENSIONS } from '../files/files.constants';
import { MASS_DELETE_MIN_ITEMS, MASS_DELETE_RATIO } from './doc-sync.constants';
import type { RemoteDocument } from './document-provider';

/**
 * The pure half of the sync core.
 *
 * `planReconcile` takes a snapshot of both sides and returns the actions to
 * take. It touches no database, no HTTP and no container, which is what lets
 * the hard cases (conflict, echo, mass deletion, rename, a document that
 * exists on neither side any more) be tested exhaustively as plain data. The
 * service does nothing but execute the plan.
 */

// ── Identity and incoming names ──────────────────────────────────────────────

/** Per-document anchor, written into provider metadata where there is room. */
export function newTrekDocUid(): string {
  return crypto.randomUUID();
}

/**
 * Names arriving from a provider are hostile input: they can carry path
 * separators, control characters, leading dots and NTFS-illegal characters, and
 * they end up both in a DB column and in a Content-Disposition header.
 *
 * The extension is preserved deliberately: it is what TREK's download route
 * derives the Content-Type from, and what the blocklist check reads.
 */
export function sanitizeIncomingName(raw: string): string {
  // Split on separators by hand rather than through path.basename: the win32
  // flavour reads `a:` as a drive letter and silently drops it, so a perfectly
  // ordinary `a:b.pdf` from a Linux provider would arrive as `b.pdf`. Only
  // slashes are directory separators as far as this is concerned; the colon is
  // dealt with below, as an illegal character.
  const base = (raw || '').split(/[\\/]/).pop()?.trim() ?? '';
  const cleaned = base
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, 200);
  return cleaned || 'document';
}

/**
 * The blocklist is enforced on incoming provider documents for exactly the same
 * reason it is enforced on uploads: TREK serves downloads inline with an
 * extension-derived Content-Type, so an .svg or .html from a Nextcloud folder
 * would be a stored XSS. A rejected document becomes a visible `rejected_type`
 * row rather than a silent skip, so the person who put it there can find out.
 */
export function isBlockedName(name: string): boolean {
  const ext = path.extname(name).toLowerCase();
  return !!ext && BLOCKED_EXTENSIONS.includes(ext);
}

/**
 * The operator's own allowlist, applied to incoming provider documents.
 *
 * Same rule as an upload: `*` admits anything the blocklist above still lets
 * through, and an empty extension is refused rather than waved past, because a
 * file with no extension is served with a Content-Type TREK had to guess.
 */
export function isAllowedByOperator(name: string, allowedCsv: string): boolean {
  const ext = path.extname(name).toLowerCase().replace(/^\./, '');
  if (!ext) return false;
  if (allowedCsv.trim() === '*') return true;
  return allowedCsv
    .split(',')
    .map((e) => e.trim().toLowerCase().replace(/^\./, ''))
    .filter(Boolean)
    .includes(ext);
}

/**
 * Whether two URLs address the same server, for deciding if a stored secret
 * may be reused. Same scheme, same host, same port: a path may differ, because
 * the token still only ever reaches the server it was issued for.
 */
export function sameOrigin(a: string | null | undefined, b: string): boolean {
  if (!a) return false;
  try {
    const x = new URL(a);
    const y = new URL(b);
    return x.protocol === y.protocol && x.host === y.host;
  } catch {
    return false;
  }
}

// ── The plan ─────────────────────────────────────────────────────────────────

/** What the core knows about one pairing before the run. */
export interface SyncItemState {
  id: number;
  fileId: number | null;
  trekDocUid: string;
  remoteId: string | null;
  remoteVersion: string | null;
  /** The name the provider had at the last agreed state: the rename arbiter. */
  remoteName: string | null;
  /**
   * Size and modification time of the provider copy as last seen. Only read
   * where ids are paths, to recognise the same copy after a rename or a move.
   */
  remoteSize: number | null;
  remoteModifiedAt: string | null;
  /** The bytes both sides last agreed on. */
  contentSha256: string | null;
  /** What TREK itself last uploaded: the echo guard. */
  pushedSha256: string | null;
  state: string;
  attempts: number;
  /** When the backoff lets this row be tried again; null once it is shelved. */
  nextAttemptAt: string | null;
  remoteMissingAt: string | null;
  /**
   * When TREK itself put the provider copy in the recycle bin, under the
   * `trash` policy. A copy binned by TREK and one deleted by somebody else
   * leave the same gap in a listing; only this tells them apart once the file
   * comes back out of TREK's trash.
   */
  remoteTrashedAt: string | null;
}

/** What TREK currently holds for this trip. */
export interface LocalDocument {
  fileId: number;
  name: string;
  size: number;
  mimeType: string | null;
  sha256: string | null;
  deletedAt: string | null;
}

export type PlanAction =
  /** Bytes only exist upstream: download and create a trip_files row. */
  | { kind: 'pull'; remote: RemoteDocument; itemId: number | null }
  /** Bytes only exist in TREK: upload. */
  | { kind: 'push'; local: LocalDocument; itemId: number | null; remoteId: string | null }
  /** Upstream moved on while TREK did not: replace local bytes. */
  | { kind: 'pull_update'; remote: RemoteDocument; itemId: number }
  /** TREK moved on while upstream did not: push a new revision. */
  | { kind: 'push_update'; local: LocalDocument; itemId: number; remoteId: string }
  /**
   * Where the id is the path: the paired copy is listed under a new one,
   * because it was renamed or moved. The pairing follows; nothing else changes.
   */
  | { kind: 'relocate'; itemId: number; remote: RemoteDocument }
  /** A name changed on one side only. */
  | { kind: 'rename_remote'; itemId: number; remoteId: string; name: string }
  | { kind: 'rename_local'; itemId: number; fileId: number; name: string }
  /** Both sides changed since the agreed state. */
  | { kind: 'conflict'; itemId: number; remote: RemoteDocument | null; local: LocalDocument | null }
  /** Present upstream last run, absent now. Recorded, never acted on. */
  | { kind: 'mark_remote_missing'; itemId: number }
  /**
   * Deleted in TREK; what happens upstream is the link's delete policy. With
   * `remoteGone`, the provider copy was already on record as missing and the
   * TREK copy has since been purged: the row closes, and no policy runs,
   * because there is nothing left on either side for it to act on.
   */
  | { kind: 'local_deleted'; itemId: number; remoteId: string; remoteGone?: true }
  /**
   * Back out of TREK's trash while the provider copy stayed: the pairing counts
   * again. With `missing`, the copy is gone and TREK did not bin it, so the row
   * comes back flagged the way a vanished copy is.
   */
  | { kind: 'local_restored'; itemId: number; missing?: true }
  /** Back out of TREK's trash after TREK binned the copy: unpaired, so it goes up as a new document. */
  | { kind: 'detach'; itemId: number }
  /** The copy TREK binned is listed again: somebody restored it at the provider. */
  | { kind: 'remote_restored'; itemId: number }
  /** Nothing to do but the row should stop looking stale. */
  | { kind: 'touch'; itemId: number; remote: RemoteDocument | null };

export interface ReconcilePlan {
  actions: PlanAction[];
  /** True when the listing looked like a mass deletion and was not trusted. */
  massDeleteGuardTripped: boolean;
  /** Newly gone upstream: vanished since the last run, or found gone on a restore in TREK. */
  missingCount: number;
}

export interface ReconcileInput {
  items: readonly SyncItemState[];
  remote: readonly RemoteDocument[];
  local: readonly LocalDocument[];
  direction: 'both' | 'pull' | 'push';
  /** A truncated listing must never be read as "the rest was deleted". */
  remoteTruncated: boolean;
  /**
   * The provider says its side has not moved since the stored cursor.
   *
   * Every adapter derives that cursor from the scope's contents (a digest over
   * the documents for Paperless, Papra and Synology, the root ETag for WebDAV),
   * so the flag means "nothing changed upstream" for all of them. The WebDAV
   * adapter acts on it by returning an EMPTY list instead of walking the folder,
   * which is only safe if this is read: otherwise a quiet binding looks like a
   * folder somebody emptied. It was not read, and the third run of every idle
   * Nextcloud or OpenCloud binding tripped the mass-delete guard for good.
   */
  remoteUnchanged: boolean;
  /**
   * What to do when both sides moved since they last agreed.
   *
   * `manual` parks the row for a person. The other two are the reason this
   * field exists: the binding was asked at setup, the answer was stored, and
   * nothing ever read it, so every conflict was manual whatever the binding
   * said, and a person who had chosen a side still had to pick it again.
   */
  conflictPolicy: 'manual' | 'trek_wins' | 'provider_wins';
  /** Providers without stable ids need the rename heuristic. */
  stableRemoteIds: boolean;
  /** How many failures a row gets before it is shelved for a person to look at. */
  maxAttempts: number;
  /** Injected so the backoff window is testable; defaults to now. */
  now?: string;
}

/**
 * Decide what has to happen, from a snapshot of both sides.
 *
 * The three-way comparison is the whole point: `contentSha256` is the state
 * both sides last agreed on, so "changed here" and "changed there" are separate
 * questions and a change on one side alone is never a conflict. Collapsing that
 * into a two-way comparison is what makes naive sync engines either lose edits
 * or ping-pong forever.
 */
export function planReconcile(input: ReconcileInput): ReconcilePlan {
  const { remote, local, direction, remoteTruncated, stableRemoteIds, maxAttempts, conflictPolicy } = input;
  const now = input.now ?? new Date().toISOString().replace('T', ' ').slice(0, 19);
  const actions: PlanAction[] = [];

  /**
   * Rows that must not be tried again on this run.
   *
   * A provider that refuses a document refuses it every time: a file it reads
   * as corrupt, a type it does not accept, a quota that is full. Without this
   * the row is re-planned on every pass, so a single bad document turns into an
   * upload attempt every cron tick forever; rows were found at 46 attempts
   * against a limit of 6, because the limit was written to the database and
   * never read back out.
   *
   * Shelved is not dead: a manual run clears the counter (see resetItemAttempts),
   * which is what "waits for a person" means.
   */
  const blocked = new Set<number>();
  for (const it of input.items) {
    if (it.state !== 'error') continue;
    if (it.attempts >= maxAttempts) { blocked.add(it.id); continue; }
    if (it.nextAttemptAt !== null && it.nextAttemptAt > now) blocked.add(it.id);
  }

  /**
   * Every action goes through here so one rule covers all of them.
   *
   * No exception for `mark_remote_missing`: a row only counts as vanished if it
   * was `synced` last run, and a row is only shelved if it is in `error`, so the
   * two can never describe the same row.
   */
  const add = (action: PlanAction): void => {
    const itemId = 'itemId' in action ? action.itemId : null;
    if (itemId !== null && blocked.has(itemId)) return;
    actions.push(action);
  };

  /**
   * Both sides changed the bytes. The binding's answer decides, and `manual`
   * parks it.
   *
   * A side that wins takes the whole document, name and bytes together, because
   * the two halves of one document coming from different sides is not a state
   * anybody asked for. Direction still has the last word: a pull-only binding
   * cannot push even when TREK is meant to win, so it parks instead of doing
   * the opposite of what was chosen.
   */
  const settle = (it: SyncItemState, r: RemoteDocument, l: LocalDocument | null): void => {
    // Only the two answers that name a winner act; anything else (`manual`, a
    // value from a future version, a column somebody edited by hand) parks the
    // row. Overwriting one side is the destructive move, so it needs a yes.
    const park = (): void => { add({ kind: 'conflict', itemId: it.id, remote: r, local: l }); };
    if (conflictPolicy === 'provider_wins' && direction !== 'push') {
      return add({ kind: 'pull_update', remote: r, itemId: it.id });
    }
    if (conflictPolicy === 'trek_wins' && direction !== 'pull' && l !== null) {
      return add({ kind: 'push_update', local: l, itemId: it.id, remoteId: it.remoteId });
    }
    return park();
  };

  /**
   * Both sides renamed a document whose bytes still agree. Only the name is in
   * dispute, so the winning side's name is carried over and nothing is sent.
   *
   * This went through `settle` once, and `trek_wins` re-uploaded identical
   * bytes. Where the provider replaces in place (WebDAV, Synology) the upload
   * also kept the provider's name, so the next run read that as a rename made
   * upstream and gave TREK's file the name TREK was supposed to win with.
   */
  const settleName = (it: SyncItemState, r: RemoteDocument, l: LocalDocument, incoming: string): void => {
    if (conflictPolicy === 'provider_wins' && direction !== 'push') {
      return add({ kind: 'rename_local', itemId: it.id, fileId: l.fileId, name: incoming });
    }
    if (conflictPolicy === 'trek_wins' && direction !== 'pull') {
      return add({ kind: 'rename_remote', itemId: it.id, remoteId: it.remoteId, name: l.name });
    }
    return add({ kind: 'conflict', itemId: it.id, remote: r, local: l });
  };

  const remoteById = new Map<string, RemoteDocument>();
  for (const r of remote) if (!r.isDeleted) remoteById.set(r.remoteId, r);
  const localById = new Map<number, LocalDocument>();
  for (const l of local) localById.set(l.fileId, l);

  /**
   * Where the id is the path, a rename or a move upstream reads as one copy
   * gone and another one new.
   *
   * This used to be patched up in the upstream-only loop with a `touch`, which
   * went wrong twice. The pairing had already been counted as vanished by then,
   * so the same run flagged it missing (and counted it towards the mass-delete
   * guard); and `touch` wrote the provider's new name into the arbiter, so the
   * next run read the name TREK still had as a rename made in TREK and renamed
   * the provider's copy back.
   *
   * So the pairing is moved first, before anything else looks at it, `reopen`
   * included: onto a new entry that is recognisably the same copy (see
   * `sameCopy`). Only the id and the version move. The agreed name stays, so
   * the pair loop reads the new name the way it reads any rename, and the rest
   * of the plan sees a document that is listed. A rename then ends exactly as
   * it does where ids are stable. A rename TREK sent upstream is found again
   * the same way: the adapter cannot say what the new path is, so the stored id
   * is stale until here.
   *
   * Only a one-to-one match moves anything. Two copies of the same bytes
   * renamed at once cannot be told apart, and pairing them crosswise puts each
   * name on the other file; unless one of them kept its name (a move), neither
   * is moved, and both are handled like any other gap and new document.
   *
   * A copy TREK binned itself only gets an entry nobody else fits. Its gap is
   * TREK's own doing, and letting it make a tie meant that deleting one of two
   * identical files in TREK stopped a rename of the other from being followed,
   * which came back as a missing flag plus a second download. It is still
   * recognised on its own, as a copy restored at the provider somewhere else.
   */
  const followMoves = (list: readonly SyncItemState[]): SyncItemState[] => {
    const paired = new Set(list.map((it) => it.remoteId));
    const fresh = remote.filter((r) => !r.isDeleted && !paired.has(r.remoteId));
    const gone = list.filter((it) => it.remoteId !== null && !remoteById.has(it.remoteId));

    const owner = (r: RemoteDocument): SyncItemState | null => {
      const fits = gone.filter((o) => sameCopy(o, r));
      return soleMatch(fits, (o) => keptName(o, r))
        ?? soleMatch(fits.filter((o) => o.remoteTrashedAt === null), (o) => keptName(o, r));
    };

    const moved = new Map<number, RemoteDocument>();
    for (const it of gone) {
      const r = soleMatch(fresh.filter((d) => sameCopy(it, d)), (d) => keptName(it, d));
      if (!r || owner(r) !== it) continue;
      // Counted above so a shelved row still makes a tie a tie, but not moved:
      // `add` would drop the action while the plan went on with the new id.
      if (blocked.has(it.id)) continue;
      moved.set(it.id, r);
    }

    return list.map((it) => {
      const r = moved.get(it.id);
      if (!r) return it;
      add({ kind: 'relocate', itemId: it.id, remote: r });
      // Same bytes, so the new version marker is not a change: on a path-keyed
      // provider it differs only because the path is part of it.
      return { ...it, remoteId: r.remoteId, remoteVersion: r.remoteVersion };
    });
  };

  // Restored rows whose copy turned out to be gone: missing, but not vanished.
  let foundGone = 0;

  /**
   * A file taken back out of TREK's trash.
   *
   * A deletion TREK has acted on is otherwise left alone for good (see the
   * pair loop), so this is the one way out of `local_deleted`, and which way
   * depends on the provider copy. If it is listed, the pairing counts again and
   * the row is judged like any synced one from here on: an edit made upstream
   * in the meantime comes down. If TREK binned it, TREK took it away and the
   * person asked for it back, so the pairing is dropped and the file goes up as
   * a new document through the ordinary push.
   *
   * A copy gone by somebody else's hand is flagged as missing rather than
   * uploaded over their deletion, and flagged right here rather than counted
   * as vanished. Nothing is recorded about a copy while its row sits in
   * `local_deleted`, so it may have been gone for weeks, and counting it
   * towards the mass-delete guard read a handful of such restores as a listing
   * that shrank: the guard tripped, the run was abandoned before the restores
   * were written, and the next run found the same plan, for good. Only a
   * listing that could have shown the copy may say it is gone, so otherwise
   * the row waits; `needsFullListing` keeps that to a single run.
   *
   * The returned row is what the rest of the plan sees, so it has to match
   * what the executor writes for the action added here.
   */
  const reopen = (it: SyncItemState): SyncItemState => {
    if (!isBackFromTrash(it, localById)) return it;
    if (!input.remoteUnchanged && remoteById.has(it.remoteId)) {
      add({ kind: 'local_restored', itemId: it.id });
      return { ...it, state: 'synced', remoteMissingAt: null, remoteTrashedAt: null };
    }
    if (it.remoteTrashedAt === null) {
      if (input.remoteUnchanged || remoteTruncated) return it;
      foundGone += 1;
      add({ kind: 'local_restored', itemId: it.id, missing: true });
      return { ...it, state: 'remote_missing', remoteMissingAt: now, remoteTrashedAt: null };
    }
    // A pull-only binding cannot upload, and a gap in a truncated listing says
    // nothing about the copy. The row waits for a run that can decide.
    if (direction === 'pull' || remoteTruncated) return it;
    add({ kind: 'detach', itemId: it.id });
    return { ...it, state: 'pending', remoteId: null, remoteVersion: null, remoteTrashedAt: null };
  };

  // Upstream unchanged means there is no listing to follow anything into.
  const followed = stableRemoteIds || input.remoteUnchanged ? input.items : followMoves(input.items);
  const items = followed.map(reopen);

  const itemsByRemote = new Map<string, SyncItemState>();
  const itemsByFile = new Map<number, SyncItemState>();
  for (const it of items) {
    if (it.remoteId) itemsByRemote.set(it.remoteId, it);
    if (it.fileId !== null) itemsByFile.set(it.fileId, it);
  }

  /**
   * A copy on record as gone whose TREK copy has been purged since.
   *
   * The row was kept for a person to decide about the TREK copy, and they
   * did: it is out of the trash and cannot come back, so nothing is left to
   * decide and nothing to restore. Only a purge closes the row. A TREK copy
   * merely in the trash keeps it open, because binning the gap as TREK's own
   * doing would let a later restore upload what somebody else deleted.
   */
  const goneOnBothSides = (it: SyncItemState): boolean =>
    it.state === 'remote_missing' && it.fileId === null && it.remoteId !== null;

  // Upstream is unchanged: only what happened in TREK can need doing, and the
  // remote half of the plan would be reading a list the adapter did not fetch.
  if (input.remoteUnchanged) {
    for (const it of items) {
      if (goneOnBothSides(it)) {
        add({ kind: 'local_deleted', itemId: it.id, remoteId: it.remoteId, remoteGone: true });
        continue;
      }
      // A deletion already acted on stays acted on, as in the pair loop. A copy
      // on record as gone is absent from a full listing too, so a full run
      // plans nothing for it until it comes back; binning it here would also
      // write the gap down as TREK's doing, and a restore would then upload
      // what somebody else deleted.
      if (!it.remoteId || it.state === 'local_deleted' || it.state === 'remote_missing') continue;
      const l = it.fileId !== null ? localById.get(it.fileId) : undefined;
      if (l?.deletedAt || lostItsFile(it)) add({ kind: 'local_deleted', itemId: it.id, remoteId: it.remoteId });
    }
    if (direction !== 'pull') {
      for (const l of local) {
        if (l.deletedAt) continue;
        const it = itemsByFile.get(l.fileId);
        if (it?.remoteId) continue;
        add({ kind: 'push', local: l, itemId: it?.id ?? null, remoteId: null });
      }
    }
    return { actions, massDeleteGuardTripped: false, missingCount: 0 };
  }

  // A listing that lost most of what it had last time is far more likely to be
  // a broken mount, a revoked token or a moved folder than a real mass delete.
  // A row `reopen` resumed is only `synced` here when its copy is listed, so a
  // restore never reads as part of a listing that shrank.
  const known = items.filter((i) => i.remoteId && i.state === 'synced');
  const vanished = known.filter((i) => !remoteById.has(i.remoteId as string));
  const guardTripped =
    !remoteTruncated &&
    known.length >= MASS_DELETE_MIN_ITEMS &&
    vanished.length / known.length > MASS_DELETE_RATIO;

  // ── Pairs that exist on both sides ────────────────────────────────────────
  for (const it of items) {
    if (!it.remoteId) continue;
    const r = remoteById.get(it.remoteId);
    if (!r) continue;
    const l = it.fileId !== null ? localById.get(it.fileId) : undefined;

    const remoteChanged = it.remoteVersion !== null && r.remoteVersion !== it.remoteVersion;
    // The echo guard: bytes TREK itself pushed come back as a change on the
    // provider side. They are only TREK's own write if the hash still matches
    // what was pushed, so this compares content, never timestamps: a time
    // window would misfire on every clock skew.
    const isEcho =
      remoteChanged &&
      r.contentHash !== null &&
      it.pushedSha256 !== null &&
      r.contentHash === it.pushedSha256;
    // The same reading for bytes both sides agreed on: a version marker moves
    // on a tag, a correspondent or a title as much as on a new revision, and
    // where the listing carries a hash it says which. Downloading the same
    // bytes again replaced the TREK file with a fresh row and sent the one
    // that carried the booking link to the trash, on every edit of metadata.
    // A row in error is left out: `touch` leaves that state alone, so it would
    // sit in error for good over bytes that are in step, while the download
    // it gets instead finds the same bytes and settles it without a new row.
    const sameBytes =
      remoteChanged &&
      r.contentHash !== null &&
      it.state !== 'error' &&
      it.contentSha256 !== null &&
      r.contentHash === it.contentSha256;
    const remoteBytesChanged = remoteChanged && !isEcho && !sameBytes;

    const localChanged = !!l && l.sha256 !== null && it.contentSha256 !== null && l.sha256 !== it.contentSha256;

    /**
     * A deletion is acted on once, under the policy in force at that moment.
     *
     * This used to be planned again on every run for as long as the file sat
     * in TREK's trash. Under `unlink` nothing showed; switching the binding to
     * `trash` later then binned every document ever deleted in TREK, months
     * back included, and a binding on `trash` from the start asked the
     * provider to bin the same copy on every run. A row still here is one
     * `reopen` did not take back: its file is still in the trash or purged.
     */
    if (it.state === 'local_deleted') {
      if (it.remoteTrashedAt !== null) add({ kind: 'remote_restored', itemId: it.id });
      continue;
    }
    if (l?.deletedAt || lostItsFile(it)) {
      add({ kind: 'local_deleted', itemId: it.id, remoteId: it.remoteId });
      continue;
    }

    /**
     * Paired upstream, absent in TREK: the download never landed.
     *
     * A failed pull stores the remote's version alongside the error, so on the
     * next run `remoteChanged` is false, there is no local file for the other
     * branches to compare against, and the row fell through to `touch`, which
     * refreshes it and changes nothing. Nothing anywhere planned a second
     * attempt: the document never arrived, no retry ever happened, and pressing
     * "Sync now" did not help either, because the plan was the same.
     *
     * A rejected type and an oversized file are left out on purpose. Those are
     * not transport failures; they are answers, and they stay true until the
     * document upstream changes, which the `remoteChanged` branch below picks
     * up on its own.
     */
    if (!l && it.fileId === null && direction !== 'push'
        && it.state !== 'rejected_type' && it.state !== 'too_large') {
      add({ kind: 'pull_update', remote: r, itemId: it.id });
      continue;
    }

    if (remoteBytesChanged && localChanged) {
      settle(it, r, l ?? null);
      continue;
    }
    if (remoteBytesChanged) {
      if (direction === 'push') { add({ kind: 'touch', itemId: it.id, remote: r }); continue; }
      add({ kind: 'pull_update', remote: r, itemId: it.id });
      continue;
    }
    if (localChanged && l) {
      if (direction === 'pull') { add({ kind: 'touch', itemId: it.id, remote: r }); continue; }
      add({ kind: 'push_update', local: l, itemId: it.id, remoteId: it.remoteId });
      continue;
    }

    // Same bytes, different name. Which side renamed is decided by comparing
    // each against the name they last agreed on, not by direction. Reading
    // `both` as "TREK always wins" silently renamed the provider's copy back
    // every time somebody tidied up a folder, which is the opposite of a
    // two-way sync.
    //
    // Compared through the same sanitiser the local name went through, or a
    // provider name TREK had to clean up (a slash, a control character, a
    // leading dot) reads as "TREK renamed this" on the very next run, and the
    // provider's copy gets renamed to the cleaned version, unasked. For the
    // same reason TREK takes a new name in its cleaned form, the one a download
    // would have given it: a Paperless title with a slash in it used to land
    // in the file manager as it was, and the next run read that as a rename
    // made in TREK and sent it upstream again.
    //
    // TREK's own name goes through it too. An upload keeps whatever name the
    // browser sent, and on Linux and macOS that may hold a colon or a question
    // mark, which a push stores as the agreed name. Compared raw against the
    // cleaned agreed name, such a file read as renamed in TREK on every run:
    // Paperless got the same title again each time, and on Nextcloud, whose
    // own cleaning differs, the row sat in a conflict that "keep TREK" could
    // never settle.
    const incoming = sanitizeIncomingName(r.name);
    if (l && incoming !== l.name) {
      const agreed = it.remoteName === null ? null : sanitizeIncomingName(it.remoteName);
      const providerRenamed = agreed !== null && incoming !== agreed;
      const localRenamed = agreed !== null && sanitizeIncomingName(l.name) !== agreed;

      if (providerRenamed && !localRenamed && direction !== 'push') {
        add({ kind: 'rename_local', itemId: it.id, fileId: l.fileId, name: incoming });
        continue;
      }
      if (localRenamed && !providerRenamed && direction !== 'pull') {
        add({ kind: 'rename_remote', itemId: it.id, remoteId: it.remoteId, name: l.name });
        continue;
      }
      if (providerRenamed && localRenamed) {
        // Both sides renamed. Nothing here can pick the right one on its own,
        // and picking wrong loses a name somebody chose, so it follows the
        // binding's answer, and goes to a person when there is none.
        settleName(it, r, l, incoming);
        continue;
      }
      if (agreed !== null && !providerRenamed && !localRenamed) {
        // Neither side renamed: the two names differ only by what the cleaning
        // did to one of them, and there is nothing to send anywhere.
        add({ kind: 'touch', itemId: it.id, remote: r });
        continue;
      }
      // No stored name to arbitrate with (a row from before this column, or a
      // freshly paired document): follow the binding's direction.
      if (direction === 'pull') add({ kind: 'rename_local', itemId: it.id, fileId: l.fileId, name: incoming });
      else if (direction === 'push') add({ kind: 'rename_remote', itemId: it.id, remoteId: it.remoteId, name: l.name });
      else add({ kind: 'touch', itemId: it.id, remote: r });
      continue;
    }

    add({ kind: 'touch', itemId: it.id, remote: r });
  }

  // ── Gone on both sides ────────────────────────────────────────────────────
  // A copy listed again went through the pair loop, where a purged file is a
  // deletion like any other.
  for (const it of items) {
    if (!goneOnBothSides(it) || remoteById.has(it.remoteId)) continue;
    add({ kind: 'local_deleted', itemId: it.id, remoteId: it.remoteId, remoteGone: true });
  }

  // ── Upstream only ─────────────────────────────────────────────────────────
  if (direction !== 'push') {
    for (const r of remote) {
      if (r.isDeleted) continue;
      // A copy that was only renamed or moved is paired already (followMoves).
      if (itemsByRemote.has(r.remoteId)) continue;
      add({ kind: 'pull', remote: r, itemId: null });
    }
  }

  // ── TREK only ─────────────────────────────────────────────────────────────
  if (direction !== 'pull') {
    for (const l of local) {
      if (l.deletedAt) continue;
      const it = itemsByFile.get(l.fileId);
      if (it?.remoteId && remoteById.has(it.remoteId)) continue;
      // A row that has a remoteId which is no longer listed is handled below as
      // "missing", not re-uploaded. Otherwise a broken listing duplicates the
      // entire trip upstream.
      if (it?.remoteId) continue;
      add({ kind: 'push', local: l, itemId: it?.id ?? null, remoteId: null });
    }
  }

  // ── Vanished upstream ─────────────────────────────────────────────────────
  if (!guardTripped && !remoteTruncated) {
    for (const it of vanished) {
      if (it.remoteMissingAt) continue;
      add({ kind: 'mark_remote_missing', itemId: it.id });
    }
  }

  return { actions, massDeleteGuardTripped: guardTripped, missingCount: vanished.length + foundGone };
}

/**
 * Whether this run has to list the provider in full, whatever its cursor says.
 *
 * A file back out of TREK's trash whose copy TREK did not bin can only be
 * settled by a listing that shows whether that copy is still there (see
 * `reopen`). An unchanged cursor gives the planner nothing to read, and on a
 * quiet binding the cursor stays unchanged until somebody touches the folder,
 * so the restore would wait that long.
 */
export function needsFullListing(items: readonly SyncItemState[], local: readonly LocalDocument[]): boolean {
  const localById = new Map(local.map((l) => [l.fileId, l]));
  return items.some((it) => it.remoteTrashedAt === null && isBackFromTrash(it, localById));
}

/** A deletion TREK acted on whose file has since come back out of TREK's trash. */
function isBackFromTrash(it: SyncItemState, localById: ReadonlyMap<number, LocalDocument>): boolean {
  if (it.state !== 'local_deleted' || !it.remoteId || it.fileId === null) return false;
  const l = localById.get(it.fileId);
  return !!l && !l.deletedAt;
}

/**
 * Whether a listing entry is recognisably the copy a pairing had, judged by
 * content rather than by id.
 *
 * A hash on both sides settles it either way. Without one (Synology offers
 * none), size and modification time together: a rename or a move leaves both
 * alone, and an edit does not.
 */
function sameCopy(it: SyncItemState, r: RemoteDocument): boolean {
  if (r.contentHash !== null && it.contentSha256 !== null) return r.contentHash === it.contentSha256;
  return r.size !== null && r.remoteModifiedAt !== null
    && r.size === it.remoteSize && r.remoteModifiedAt === it.remoteModifiedAt;
}

/** The copy is listed under the name both sides last agreed on: moved, not renamed. */
function keptName(it: SyncItemState, r: RemoteDocument): boolean {
  return it.remoteName !== null && sanitizeIncomingName(it.remoteName) === sanitizeIncomingName(r.name);
}

/** The only candidate, or else the only one that kept its name; otherwise none. */
function soleMatch<T>(candidates: T[], keptItsName: (candidate: T) => boolean): T | null {
  if (candidates.length === 1) return candidates[0];
  const named = candidates.filter(keptItsName);
  return named.length === 1 ? named[0] : null;
}

/**
 * A file purged from TREK's trash before any run saw it deleted.
 *
 * `file_id` is ON DELETE SET NULL, so the row outlives the file with nothing
 * but a NULL to show for it. Read as a download that never landed, which is
 * what happened until now, the document came straight back and the delete
 * policy never ran. A first download that failed has no file either, and is
 * retried, so `error` and `pending` count only with an agreed hash: that is
 * written by a pull or a push that landed and by nothing else, and a failed
 * update keeps the file it had. A row shelved in `error` that the person then
 * deleted and purged is a deletion, not a document to fetch again.
 */
function lostItsFile(it: SyncItemState): boolean {
  if (it.fileId !== null) return false;
  if (it.state === 'synced' || it.state === 'conflict' || it.state === 'remote_missing') return true;
  return (it.state === 'error' || it.state === 'pending') && it.contentSha256 !== null;
}

/** Backoff lookup that saturates instead of running off the end of the curve. */
export function backoffSeconds(curve: readonly number[], failures: number): number {
  if (failures <= 0) return curve[0];
  return curve[Math.min(failures - 1, curve.length - 1)];
}
