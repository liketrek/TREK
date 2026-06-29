import ReactDOM from 'react-dom'
import { NOTE_ICONS } from './DayPlanSidebar.constants'

interface NoteModalUi {
  mode: 'add' | 'edit'
  icon: string
  text: string
  time: string
}

interface DayPlanSidebarNoteModalProps {
  noteUi: Record<string, NoteModalUi | undefined>
  setNoteUi: (updater: (prev: any) => any) => void
  noteInputRef: React.RefObject<HTMLInputElement>
  cancelNote: (dayId: number) => void
  saveNote: (dayId: number) => void
  t: (key: string, params?: Record<string, any>) => string
}

export function DayPlanSidebarNoteModal({ noteUi, setNoteUi, noteInputRef, cancelNote, saveNote, t }: DayPlanSidebarNoteModalProps) {
  return (
    <>
      {Object.entries(noteUi).map(([dayId, ui]) => ui && ReactDOM.createPortal(
        <div key={dayId} className="bg-[rgba(0,0,0,0.3)]" style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(3px)',
        }} onClick={() => cancelNote(Number(dayId))}>
          <div className="bg-surface-card" style={{
            width: 340, borderRadius: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,0.22)', padding: '22px 22px 18px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }} onClick={e => e.stopPropagation()}>
            <div className="text-content" style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 600 }}>
              {ui.mode === 'add' ? t('dayplan.noteAdd') : t('dayplan.noteEdit')}
            </div>
            {/* Icon-Auswahl */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {NOTE_ICONS.map(({ id, Icon }) => (
                <button key={id} onClick={() => setNoteUi(prev => ({ ...prev, [dayId]: { ...prev[dayId], icon: id } }))}
                  title={id}
                  className={ui.icon === id ? 'bg-surface-hover' : 'bg-transparent'}
                  style={{ width: 45, height: 45, borderRadius: 8, border: ui.icon === id ? '2px solid var(--text-primary)' : '2px solid var(--border-faint)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                  <Icon size={18} strokeWidth={1.8} color={ui.icon === id ? 'var(--text-primary)' : 'var(--text-muted)'} />
                </button>
              ))}
            </div>
            <input
              ref={noteInputRef}
              type="text"
              value={ui.text}
              onChange={e => setNoteUi(prev => ({ ...prev, [dayId]: { ...prev[dayId], text: e.target.value } }))}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); saveNote(Number(dayId)) } if (e.key === 'Escape') cancelNote(Number(dayId)) }}
              placeholder={t('dayplan.noteTitle') + ' *'}
              required
              className="text-content"
              style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500, border: `1px solid ${!ui.text?.trim() ? 'var(--border-primary)' : 'var(--border-primary)'}`, borderRadius: 8, padding: '8px 10px', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box' }}
            />
            <textarea
              value={ui.time}
              maxLength={250}
              rows={3}
              onChange={e => setNoteUi(prev => ({ ...prev, [dayId]: { ...prev[dayId], time: e.target.value } }))}
              onKeyDown={e => { if (e.key === 'Escape') cancelNote(Number(dayId)) }}
              placeholder={t('dayplan.noteSubtitle')}
              className="text-content"
              style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '7px 10px', fontFamily: 'inherit', outline: 'none', width: '100%', boxSizing: 'border-box', resize: 'none', lineHeight: 1.4 }}
            />
            <div className={(ui.time?.length || 0) >= 240 ? 'text-[#d97706]' : 'text-content-faint'} style={{ textAlign: 'right', fontSize: 'calc(11px * var(--fs-scale-caption, 1))', marginTop: -2 }}>{ui.time?.length || 0}/250</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => cancelNote(Number(dayId))} className="text-content-muted" style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', background: 'none', border: '1px solid var(--border-primary)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>{t('common.cancel')}</button>
              <button onClick={() => saveNote(Number(dayId))} disabled={!ui.text?.trim()} className={!ui.text?.trim() ? 'bg-[var(--border-primary)] text-content-faint' : 'bg-accent text-accent-text'} style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', border: 'none', borderRadius: 8, padding: '6px 16px', cursor: !ui.text?.trim() ? 'not-allowed' : 'pointer', fontWeight: 600, fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s' }}>
                {ui.mode === 'add' ? t('common.add') : t('common.save')}
              </button>
            </div>
          </div>
        </div>,
        document.body
      ))}
    </>
  )
}
