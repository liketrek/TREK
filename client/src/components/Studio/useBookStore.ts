import { useCallback, useEffect, useRef, useState } from 'react'
import type { BookDocument, BookRecord } from '@trek/shared'
import { normalizeBookDocument } from '@trek/shared'
import { journeyApi } from '../../api/client'
import { addListener, removeListener } from '../../api/websocket'

/**
 * Saving the book.
 *
 * ── Why autosave rather than a save button ────────────────────────────────
 *
 * The document lived as long as the tab did, which made every session a race
 * against a closed laptop. A save button would fix that and introduce a
 * different failure: the one where you did press it, an hour ago, and cannot
 * remember. Everyone on a journey can edit the same book, so an explicit save
 * would also mean explicit merges.
 *
 * ── Why debounced rather than on every change ─────────────────────────────
 *
 * A drag is hundreds of frames and one edit. The store already models that —
 * a gesture is one undo step — and this follows the same line: quiet for a
 * moment, then write. The wait is short enough that closing the tab loses a
 * sentence at most, and long enough that dragging a photograph across a spread
 * is one request rather than four hundred.
 *
 * ── Why a version rather than a lock ─────────────────────────────────────
 *
 * See book-store.schema.ts. The short version: a save states which version it
 * was made against, and one that has been overtaken is refused *with* the
 * current record, so the client can say what happened instead of quietly
 * discarding someone's afternoon.
 *
 * ── Why the other editors' saves arrive on their own ──────────────────────
 *
 * The server broadcasts `journey:book:saved` to everyone else on the journey,
 * carrying the new version rather than the document — one integer instead of a
 * few hundred kilobytes on every autosave. A client with nothing of its own
 * outstanding fetches the new document and takes it: the book is shared, and
 * sitting on a stale copy only means finding out at save time.
 *
 * A client that *does* have unsaved edits deliberately takes nothing. Its next
 * save conflicts, and the conflict offers a choice, which is the whole point of
 * the version. Quietly replacing someone's open document with somebody else's
 * is exactly the failure this design exists to avoid.
 */

/** How long the document has to stay still before it is written. */
const AUTOSAVE_QUIET_MS = 1200

/** And how long it may go unwritten while someone keeps typing. */
const AUTOSAVE_MAX_MS = 15_000

export type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'saved'; at: number }
  | { status: 'conflict'; current: BookRecord }
  /** The journey is open to this user, but they may not write it (role 'viewer'). */
  | { status: 'readonly' }
  | { status: 'error' }

export function useBookStore(
  journeyId: number,
  /** Called when another editor's version is taken, with their document. */
  onRemote?: (document: BookDocument) => void,
) {
  const [record, setRecord] = useState<BookRecord | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [state, setState] = useState<SaveState>({ status: 'idle' })

  /** The version every save is made against, and what a conflict compares to. */
  const version = useRef<number | null>(null)
  const timer = useRef<number | null>(null)
  const firstDirtyAt = useRef<number | null>(null)
  const pending = useRef<{ document: BookDocument; title: string } | null>(null)
  const inFlight = useRef(false)

  /** The title the last queued save carried, so a re-queue does not lose it. */
  const lastTitle = useRef('')

  /**
   * The document the server and this client agree on, by identity.
   *
   * Loading one — at open, or when another editor's version arrives — puts that
   * exact object into the editor store, so it comes straight back through
   * queueSave on the next render. Without this it would be written back
   * immediately, turning every open and every incoming change into a save and a
   * version bump that changed nothing. Identity rather than a deep compare
   * because queueSave runs on every commit, and stringifying a book per drag
   * frame is not free.
   */
  const synced = useRef<BookDocument | null>(null)

  /** The document the editor currently holds, agreed on or not. */
  const latest = useRef<BookDocument | null>(null)

  /**
   * Whether this client is holding work the server does not have.
   *
   * Broader than "a save is queued": after a conflict nothing is queued, and
   * after keepMine nothing is queued either, yet in both cases the user is
   * sitting on a document that is theirs. Comparing what the editor holds
   * against what we last agreed on covers all three without a flag per case.
   */
  const hasLocalWork = () =>
    !!pending.current || inFlight.current || (!!latest.current && latest.current !== synced.current)

  /**
   * Set while a conflict is on screen, and nothing is written until it clears.
   *
   * Without it the editor keeps offering the same rejected document: every
   * change queues a save, every save is refused, and the refusal re-renders the
   * thing that queued it. The user sees a status that flickers and the server
   * sees a client hammering it — over a question only the user can answer.
   */
  const blocked = useRef(false)

  /** Kept in a ref so the socket listener is not re-subscribed per render. */
  const onRemoteRef = useRef(onRemote)
  onRemoteRef.current = onRemote

  useEffect(() => {
    if (!Number.isFinite(journeyId)) return
    let cancelled = false
    journeyApi.getBook(journeyId)
      .then(res => {
        if (cancelled) return
        /*
         * Normalised here rather than by whoever renders it.
         *
         * A document written by an older build is missing whatever the contract
         * has gained since, and the editor reads those fields without checking —
         * `page.pageNumbers.show` on a book saved before page numbers existed is
         * a white screen, not a missing feature.
         *
         * It has to happen at this seam and nowhere else: `synced` recognises the
         * agreed document by identity, so a consumer that normalised on its own
         * would hand back a different object and turn every open into a save.
         */
        const book = res.book ? { ...res.book, document: normalizeBookDocument(res.book.document) } : null
        setRecord(book)
        version.current = book?.version ?? null
        synced.current = book?.document ?? null
        latest.current = book?.document ?? null
      })
      .catch(() => { /* A book that will not load is a book that gets created. */ })
      .finally(() => { if (!cancelled) setLoaded(true) })
    return () => { cancelled = true }
  }, [journeyId])

  const write = useCallback(async () => {
    const next = pending.current
    if (!next || inFlight.current || blocked.current) return
    inFlight.current = true
    pending.current = null
    firstDirtyAt.current = null
    setState({ status: 'saving' })

    try {
      const saved = await journeyApi.saveBook(journeyId, {
        title: next.title,
        document: next.document,
        baseVersion: version.current ?? undefined,
      })
      setRecord(saved)
      version.current = saved.version
      synced.current = next.document
      setState({ status: 'saved', at: Date.now() })
    } catch (err) {
      /*
       * A 409 is not a failure, it is the other person.
       *
       * The current record comes back in the body precisely so this moment does
       * not need a second request: the editor can offer to take their version
       * or keep going from here, and either way it can say whose work it is.
       */
      const res = (err as { response?: { status?: number; data?: { current?: BookRecord } } }).response
      if (res?.status === 409 && res.data?.current) {
        blocked.current = true
        setState({ status: 'conflict', current: res.data.current })
      } else if (res?.status === 403) {
        /*
         * A viewer can open Studio - the book is part of the journey they were
         * invited to - but the server will not take their writes. Stop trying
         * on the first refusal and say so: retrying forever would let someone
         * lay out an entire book before finding out none of it was ever saved.
         */
        blocked.current = true
        setState({ status: 'readonly' })
      } else {
        setState({ status: 'error' })
      }
    } finally {
      inFlight.current = false
      // Anything that arrived while the request was open goes next, so a save
      // during a save is queued rather than dropped.
      if (pending.current) void write()
    }
  }, [journeyId])

  /**
   * Note that the document changed.
   *
   * Called on every commit. The write happens once the document has been still
   * for a moment, or once it has been dirty long enough that waiting for a
   * pause is no longer reasonable.
   */
  const queueSave = useCallback((document: BookDocument, title: string) => {
    latest.current = document
    lastTitle.current = title
    // The document we already agree on is not an edit — see `synced`.
    if (document === synced.current) return
    pending.current = { document, title }
    if (firstDirtyAt.current == null) firstDirtyAt.current = Date.now()

    if (timer.current != null) window.clearTimeout(timer.current)

    const waited = Date.now() - firstDirtyAt.current
    const delay = waited >= AUTOSAVE_MAX_MS ? 0 : AUTOSAVE_QUIET_MS
    timer.current = window.setTimeout(() => { void write() }, delay)
  }, [write])

  /** Write immediately — for closing the editor, or a save the user asked for. */
  const saveNow = useCallback((document?: BookDocument, title?: string) => {
    if (document) {
      if (title != null) lastTitle.current = title
      pending.current = { document, title: title ?? lastTitle.current }
    }
    if (timer.current != null) window.clearTimeout(timer.current)
    return write()
  }, [write])

  /** Take the other version, discarding the local one. */
  const acceptTheirs = useCallback((current: BookRecord) => {
    const document = normalizeBookDocument(current.document)
    blocked.current = false
    setRecord({ ...current, document })
    version.current = current.version
    synced.current = document
    latest.current = document
    pending.current = null
    setState({ status: 'idle' })
    return document
  }, [])

  /**
   * Keep going from here, on top of their version.
   *
   * Not a merge: it rebases the local document onto their version number so the
   * next save lands. The two documents are not reconciled, and pretending
   * otherwise would be worse than saying so — which is why the editor offers
   * this next to the option of taking theirs.
   */
  const keepMine = useCallback((current: BookRecord) => {
    version.current = current.version
    blocked.current = false
    /*
     * The refused document has to be queued again here, because write() cleared
     * the queue before it made the request that came back 409. Without this,
     * choosing "keep mine" left the work sitting in the tab: the autosave only
     * fires on the next change, and closing the editor writes whatever is
     * queued, which is nothing.
     */
    if (latest.current && latest.current !== synced.current) {
      pending.current = { document: latest.current, title: lastTitle.current }
      void write()
      return
    }
    setState({ status: 'idle' })
  }, [write])

  /**
   * Someone else saved.
   *
   * Only acted on when this client has nothing outstanding — no queued edit, no
   * request open, and no conflict already on screen. Anything else and the user
   * has work of their own that a silent replacement would throw away.
   */
  useEffect(() => {
    if (!Number.isFinite(journeyId)) return
    let cancelled = false

    const handler = (event: Record<string, unknown>) => {
      if (event.type !== 'journey:book:saved') return
      if (event.journeyId !== journeyId) return
      if (hasLocalWork()) return
      // Already ours: the server excludes the saving socket, but a second tab
      // on the same account is a different socket and the same person.
      if (typeof event.version === 'number' && event.version === version.current) return

      void journeyApi.getBook(journeyId)
        .then(res => {
          if (cancelled || !res.book) return
          // Re-checked after the round trip: the user may have started editing
          // while it was in the air, and their work outranks the refresh.
          if (hasLocalWork()) return
          // Normalised for the same reason the initial load is: a document
          // written by an older build is missing whatever the contract has
          // gained since.
          const document = normalizeBookDocument(res.book.document)
          setRecord({ ...res.book, document })
          version.current = res.book.version
          synced.current = document
          latest.current = document
          onRemoteRef.current?.(document)
        })
        .catch(() => { /* The next save will conflict and offer the choice. */ })
    }

    addListener(handler)
    return () => {
      cancelled = true
      removeListener(handler)
    }
  }, [journeyId])

  useEffect(() => () => {
    if (timer.current != null) window.clearTimeout(timer.current)
  }, [])

  return { record, loaded, state, queueSave, saveNow, acceptTheirs, keepMine, version }
}
