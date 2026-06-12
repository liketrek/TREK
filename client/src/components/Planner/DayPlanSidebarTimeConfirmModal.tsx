import ReactDOM from 'react-dom'
import { Clock } from 'lucide-react'

interface TimeConfirmState {
  dayId: number
  fromId: number
  time: string
  fromType?: string
  toType?: string
  toId?: number
  insertAfter?: boolean
  reorderIds?: number[]
}

interface DayPlanSidebarTimeConfirmModalProps {
  timeConfirm: TimeConfirmState | null
  setTimeConfirm: (v: TimeConfirmState | null) => void
  confirmTimeRemoval: () => void
  t: (key: string, params?: Record<string, any>) => string
}

export function DayPlanSidebarTimeConfirmModal({ timeConfirm, setTimeConfirm, confirmTimeRemoval, t }: DayPlanSidebarTimeConfirmModalProps) {
  if (!timeConfirm) return null
  return ReactDOM.createPortal(
    <div className="bg-[rgba(0,0,0,0.3)]" style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(3px)',
    }} onClick={() => setTimeConfirm(null)}>
      <div className="bg-surface-card" style={{
        width: 340, borderRadius: 16,
        boxShadow: '0 16px 48px rgba(0,0,0,0.22)', padding: '22px 22px 18px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="bg-[rgba(239,68,68,0.12)]" style={{
            width: 36, height: 36, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: '50%',
          }}>
            <Clock size={18} strokeWidth={1.8} color="#ef4444" />
          </div>
          <div className="text-content" style={{ fontSize: 14, fontWeight: 600 }}>
            {t('dayplan.confirmRemoveTimeTitle')}
          </div>
        </div>
        <div className="text-content-secondary" style={{ fontSize: 12.5, lineHeight: 1.5 }}>
          {t('dayplan.confirmRemoveTimeBody', { time: timeConfirm.time })}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={() => setTimeConfirm(null)} className="text-content-muted" style={{
            fontSize: 12, background: 'none', border: '1px solid var(--border-primary)',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit',
          }}>{t('common.cancel')}</button>
          <button onClick={confirmTimeRemoval} className="bg-[#ef4444] text-white" style={{
            fontSize: 12,
            border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 600, fontFamily: 'inherit',
          }}>{t('common.confirm')}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}
