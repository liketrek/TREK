import { createPortal } from 'react-dom'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { Loader2, CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { addListener, removeListener } from '../../api/websocket'
import { reservationsApi, healthApi } from '../../api/client'
import { saveImportFiles } from '../../db/offlineDb'
import { useBackgroundTasksStore, taskFoundSomething, type BackgroundImportTask } from '../../store/backgroundTasksStore'
import type { ReceiptRead } from '@trek/shared'

/**
 * One reading of a finished job's result, wherever it arrives from (the push,
 * the reload reconcile, the poll): a booking parse answers `items`, a receipt
 * scan `receipt`.
 */
function settleJob(id: string, tripId: string, result: unknown): void {
  const r = result as { items?: unknown[]; warnings?: string[]; receipt?: ReceiptRead | null } | undefined
  useBackgroundTasksStore.getState().setDone(id, tripId, (r?.items ?? []) as never, r?.warnings ?? [], r?.receipt)
}

/** What a job that is still reading says: a receipt scan reads, a booking import parses. */
function readingKey(task: BackgroundImportTask): string {
  return task.kind === 'costs' ? 'costs.scan.reading' : 'reservations.import.parsing'
}

/**
 * Global, route-independent widget (bottom-right) that tracks background booking
 * imports. Mounted once at the app root so it survives navigation. It listens to the
 * user's WebSocket for import:progress / import:done / import:error and reflects each
 * job; a finished job offers a "review" action that takes the user to the trip, where
 * the per-item review flow opens. Polls running jobs as a backstop for missed pushes.
 */
export default function BackgroundTasksWidget() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const tasks = useBackgroundTasksStore((s) => s.tasks)
  const setProgress = useBackgroundTasksStore((s) => s.setProgress)
  const setError = useBackgroundTasksStore((s) => s.setError)
  const requestReview = useBackgroundTasksStore((s) => s.requestReview)
  const dismiss = useBackgroundTasksStore((s) => s.dismiss)
  const addTask = useBackgroundTasksStore((s) => s.addTask)

  const [aiParsing, setAiParsing] = useState(false)
  useEffect(() => {
    healthApi.features().then((f) => setAiParsing(!!f.aiParsing)).catch(() => setAiParsing(false))
  }, [])

  // Re-runs the same files with force-ai: the LLM sees every file, kitinerary is skipped.
  const [retrying, setRetrying] = useState<string | null>(null)
  const retryWithAi = async (task: BackgroundImportTask) => {
    const files = task.sourceFiles
    if (!files || files.length === 0 || retrying === task.id) return
    setRetrying(task.id)
    try {
      const { jobId } = await reservationsApi.importBookingAsync(task.tripId, files, 'force-ai')
      // Same as the modal's first submit: the review attaches each source document to the
      // booking it created, and only IndexedDB survives a reload mid-parse.
      await saveImportFiles(jobId, files)
      dismiss(task.id)
      addTask({ id: jobId, tripId: task.tripId, label: task.label, total: files.length, files, mode: 'force-ai' })
    } catch (err) {
      // 409 when the addon is enabled but this user has no model configured.
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
      setError(task.id, task.tripId, message ?? t('reservations.import.error'))
    } finally {
      setRetrying(null)
    }
  }

  // On (re)load, reconcile tasks restored from localStorage with the server: a parse
  // that was still running when the page reloaded must keep its widget, so re-fetch each
  // job's real status (and its parsed items) once. A job the server has since dropped
  // (404, expired) is removed so no stale card lingers.
  const didRehydrate = useRef(false)
  useEffect(() => {
    if (didRehydrate.current) return
    didRehydrate.current = true
    const restored = useBackgroundTasksStore.getState().tasks
    for (const task of restored) {
      reservationsApi
        .importJobStatus(task.tripId, task.id)
        .then((s) => {
          if (s.status === 'done') settleJob(task.id, task.tripId, s.result)
          else if (s.status === 'error') setError(task.id, task.tripId, s.error ?? 'error')
          else setProgress(task.id, task.tripId, s.done, s.total)
        })
        .catch((err: { response?: { status?: number } }) => {
          if (err?.response?.status === 404) dismiss(task.id)
        })
    }
    // run once on mount against whatever was rehydrated from storage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Server pushes import:* to the user on whatever page they're on.
  useEffect(() => {
    const handler = (e: Record<string, unknown>) => {
      const type = typeof e.type === 'string' ? e.type : ''
      if (!type.startsWith('import:')) return
      const id = String(e.jobId ?? '')
      const tripId = String(e.tripId ?? '')
      if (!id) return
      if (type === 'import:progress') setProgress(id, tripId, Number(e.done ?? 0), Number(e.total ?? 1))
      else if (type === 'import:done') settleJob(id, tripId, e.result)
      else if (type === 'import:error') setError(id, tripId, String(e.message ?? 'error'))
    }
    addListener(handler)
    return () => removeListener(handler)
  }, [setProgress, setError])

  // Backstop: poll jobs whose state we still need — running ones (in case a WebSocket push
  // was missed) and a restored 'done' task whose items haven't been re-fetched yet (so a
  // failed one-shot rehydrate self-heals instead of getting stuck on "preview empty").
  useEffect(() => {
    const pending = tasks.filter((task) => task.status === 'running' || (task.status === 'done' && task.items === undefined))
    if (pending.length === 0) return
    const iv = setInterval(() => {
      for (const task of pending) {
        reservationsApi
          .importJobStatus(task.tripId, task.id)
          .then((s) => {
            if (s.status === 'done') settleJob(task.id, task.tripId, s.result)
            else if (s.status === 'error') setError(task.id, task.tripId, s.error ?? 'error')
            else setProgress(task.id, task.tripId, s.done, s.total)
          })
          .catch((err: { response?: { status?: number } }) => {
            // The server 404s a job once it has expired (or after a restart). Nothing is
            // ever coming, so end the card instead of spinning and re-polling forever.
            // Not the parse-failure message — the file was fine, the job is just gone.
            if (err?.response?.status === 404) setError(task.id, task.tripId, t('common.unknownError'))
          })
      }
    }, 5000)
    return () => clearInterval(iv)
  }, [tasks, setProgress, setError, t])

  if (tasks.length === 0) return null

  const review = (task: BackgroundImportTask) => {
    requestReview(task.id)
    navigate(`/trips/${task.tripId}`)
  }

  return createPortal(
    <div
      style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 50000, display: 'flex', flexDirection: 'column', gap: 8, width: 380, maxWidth: 'calc(100vw - 32px)', fontFamily: 'var(--font-system)' }}
    >
      {tasks.map((task) => (
        <div
          key={task.id}
          className="bg-surface-card"
          style={{ borderRadius: 12, border: '1px solid var(--border-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.18)', padding: '11px 13px', backdropFilter: 'blur(8px)', display: 'flex', gap: 10, alignItems: 'flex-start' }}
        >
          <div style={{ flexShrink: 0, marginTop: 1 }}>
            {(task.status === 'running' || (task.status === 'done' && task.items === undefined)) && <Loader2 size={16} className="animate-spin" color="var(--accent)" />}
            {task.status === 'done' && task.items !== undefined && taskFoundSomething(task) && <CheckCircle2 size={16} color="var(--success)" />}
            {/* A parse that found nothing is not a success, whatever the job
                status says: the same card used to show a green tick next to
                "no reservations could be extracted" (#2477). */}
            {task.status === 'done' && task.items !== undefined && !taskFoundSomething(task) && <AlertTriangle size={16} color="var(--warning)" />}
            {task.status === 'error' && <AlertCircle size={16} color="var(--danger)" />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 'calc(12.5px * var(--fs-scale-body, 1))', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.label}
            </div>

            {task.status === 'running' && (
              <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginTop: 1 }}>
                {t(readingKey(task))}
                {task.total > 1 ? ` · ${task.done}/${task.total}` : ''}
              </div>
            )}

            {task.status === 'done' && (
              task.items === undefined ? (
                // Restored from a reload; items are being re-fetched (see the poll backstop).
                <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginTop: 1 }}>{t(readingKey(task))}</div>
              ) : taskFoundSomething(task) ? (
                <div>
                  <button type="button"
                    onClick={() => review(task)}
                    className="bg-accent text-accent-text"
                    style={{ marginTop: 4, border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    {t(task.kind === 'costs' ? 'costs.scan.review' : 'common.import')}
                  </button>
                  {/* A partly-understood import warns too. Warnings used to be
                      shown only when nothing at all was found, so anything the
                      parse could not place — a station it could not locate, say
                      (#1969) — was dropped without a word on exactly the imports
                      that did produce something. */}
                  {(task.warnings?.length ?? 0) > 0 && (
                    <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: '#b45309', marginTop: 3, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 96, overflowY: 'auto' }}>
                      {task.warnings!.join('\n')}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: 'var(--text-faint)', marginTop: 1 }}>
                    {t(task.kind === 'costs' ? 'costs.scan.nothingRead' : 'reservations.import.previewEmpty')}
                    {(task.warnings?.length ?? 0) > 0 && (
                      <div style={{ color: '#b45309', marginTop: 3, whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: 96, overflowY: 'auto' }}>
                        {task.warnings!.join('\n')}
                      </div>
                    )}
                  </div>
                  {aiParsing && task.kind !== 'costs' && task.mode !== 'force-ai' && task.sourceFiles && task.sourceFiles.length > 0 && (
                    <button type="button"
                      onClick={() => retryWithAi(task)}
                      disabled={retrying === task.id}
                      className="bg-surface-tertiary text-content"
                      style={{ marginTop: 4, border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 'calc(11.5px * var(--fs-scale-caption, 1))', fontWeight: 600, cursor: retrying === task.id ? 'default' : 'pointer', opacity: retrying === task.id ? 0.6 : 1, fontFamily: 'inherit' }}
                    >
                      {t('reservations.import.tryAi')}
                    </button>
                  )}
                </div>
              )
            )}

            {task.status === 'error' && (
              <div style={{ fontSize: 'calc(11px * var(--fs-scale-caption, 1))', color: '#b91c1c', marginTop: 1, whiteSpace: 'pre-wrap' }}>{task.error}</div>
            )}
          </div>

          {task.status !== 'running' && (
            <button type="button"
              onClick={() => dismiss(task.id)}
              className="bg-transparent text-content-faint"
              style={{ flexShrink: 0, border: 'none', cursor: 'pointer', padding: 2, borderRadius: 6, display: 'flex', alignItems: 'center' }}
              aria-label={t('common.close')}
            >
              <X size={13} />
            </button>
          )}
        </div>
      ))}
    </div>,
    document.body
  )
}
