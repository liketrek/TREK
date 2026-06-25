import ReactDOM from 'react-dom'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { addListener, removeListener } from '../../api/websocket'
import { reservationsApi } from '../../api/client'
import { useBackgroundTasksStore, type BackgroundImportTask } from '../../store/backgroundTasksStore'

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
  const setDone = useBackgroundTasksStore((s) => s.setDone)
  const setError = useBackgroundTasksStore((s) => s.setError)
  const requestReview = useBackgroundTasksStore((s) => s.requestReview)
  const dismiss = useBackgroundTasksStore((s) => s.dismiss)

  // Server pushes import:* to the user on whatever page they're on.
  useEffect(() => {
    const handler = (e: Record<string, unknown>) => {
      const type = typeof e.type === 'string' ? e.type : ''
      if (!type.startsWith('import:')) return
      const id = String(e.jobId ?? '')
      const tripId = String(e.tripId ?? '')
      if (!id) return
      if (type === 'import:progress') setProgress(id, tripId, Number(e.done ?? 0), Number(e.total ?? 1))
      else if (type === 'import:done') {
        const result = e.result as { items?: unknown[]; warnings?: string[] } | undefined
        setDone(id, tripId, (result?.items ?? []) as never, result?.warnings ?? [])
      } else if (type === 'import:error') setError(id, tripId, String(e.message ?? 'error'))
    }
    addListener(handler)
    return () => removeListener(handler)
  }, [setProgress, setDone, setError])

  // Backstop: poll running jobs in case a WebSocket push was missed on reconnect.
  useEffect(() => {
    const running = tasks.filter((task) => task.status === 'running')
    if (running.length === 0) return
    const iv = setInterval(() => {
      for (const task of running) {
        reservationsApi
          .importJobStatus(task.tripId, task.id)
          .then((s) => {
            if (s.status === 'done') setDone(task.id, task.tripId, (s.result?.items ?? []) as never, s.result?.warnings ?? [])
            else if (s.status === 'error') setError(task.id, task.tripId, s.error ?? 'error')
            else setProgress(task.id, task.tripId, s.done, s.total)
          })
          .catch(() => {})
      }
    }, 5000)
    return () => clearInterval(iv)
  }, [tasks, setProgress, setDone, setError])

  if (tasks.length === 0) return null

  const review = (task: BackgroundImportTask) => {
    requestReview(task.id)
    navigate(`/trips/${task.tripId}`)
  }

  return ReactDOM.createPortal(
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
            {task.status === 'running' && <Loader2 size={16} className="animate-spin" color="var(--accent)" />}
            {task.status === 'done' && <CheckCircle2 size={16} color="#10b981" />}
            {task.status === 'error' && <AlertCircle size={16} color="#ef4444" />}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.label}
            </div>

            {task.status === 'running' && (
              <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>
                {t('reservations.import.parsing')}
                {task.total > 1 ? ` · ${task.done}/${task.total}` : ''}
              </div>
            )}

            {task.status === 'done' && (
              (task.items?.length ?? 0) > 0 ? (
                <button
                  onClick={() => review(task)}
                  className="bg-accent text-accent-text"
                  style={{ marginTop: 4, border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {t('common.import')}
                </button>
              ) : (
                <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 1 }}>{t('reservations.import.previewEmpty')}</div>
              )
            )}

            {task.status === 'error' && (
              <div style={{ fontSize: 11, color: '#b91c1c', marginTop: 1, whiteSpace: 'pre-wrap' }}>{task.error}</div>
            )}
          </div>

          {task.status !== 'running' && (
            <button
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
