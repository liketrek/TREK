import { Star, Trash2 } from 'lucide-react'
import type { FileManagerState } from './useFileManager'

export function FileManagerToolbar(S: FileManagerState) {
  const { showTrash, t, files, filterType, setFilterType, toggleTrash } = S
  return (
    <div style={{ padding: '24px 28px 0', flexShrink: 0 }} className="max-md:!px-4 max-md:!pt-4">
      <div style={{
        background: 'var(--bg-tertiary)', borderRadius: 18,
        padding: '14px 16px 14px 22px',
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
      }}>
        <h2 style={{ margin: 0, fontSize: 'calc(18px * var(--fs-scale-subtitle, 1))', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.01em', flexShrink: 0 }}>
          {showTrash ? (t('files.trash') || 'Trash') : t('files.title')}
        </h2>

        {!showTrash && (
          <>
            <div className="hidden md:block" style={{ width: 1, height: 22, background: 'var(--border-faint)', flexShrink: 0 }} />
            <div className="hidden md:inline-flex" style={{ gap: 4, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
              {[
                { id: 'all', label: t('files.filterAll') },
                ...(files.some(f => f.starred) ? [{ id: 'starred', icon: Star } as const] : []),
                { id: 'pdf', label: t('files.filterPdf') },
                { id: 'image', label: t('files.filterImages') },
                { id: 'doc', label: t('files.filterDocs') },
                ...(files.some(f => f.note_id) ? [{ id: 'collab', label: t('files.filterCollab') || 'Collab' }] : []),
              ].map(tab => {
                const active = filterType === tab.id
                const TabIcon = 'icon' in tab ? tab.icon : null
                const count = tab.id === 'all' ? files.length
                  : tab.id === 'starred' ? files.filter(f => f.starred).length
                  : tab.id === 'pdf' ? files.filter(f => (f.mime_type || '').includes('pdf') || /\.pdf$/i.test(f.original_name)).length
                  : tab.id === 'image' ? files.filter(f => (f.mime_type || '').startsWith('image/')).length
                  : tab.id === 'doc' ? files.filter(f => /\.(docx?|xlsx?|txt|csv)$/i.test(f.original_name)).length
                  : tab.id === 'collab' ? files.filter(f => f.note_id).length
                  : 0
                return (
                  <button key={tab.id} onClick={() => setFilterType(tab.id)}
                    style={{
                      appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 99, fontSize: 'calc(13px * var(--fs-scale-body, 1))', whiteSpace: 'nowrap',
                      background: active ? 'var(--bg-card)' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-muted)',
                      fontWeight: active ? 500 : 400,
                      boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {TabIcon ? <TabIcon size={13} fill={active ? '#facc15' : 'none'} color={active ? '#facc15' : 'currentColor'} /> : null}
                    {'label' in tab && tab.label}
                    <span style={{
                      fontSize: 'calc(10px * var(--fs-scale-caption, 1))', fontWeight: 600,
                      background: active ? 'var(--bg-tertiary)' : 'rgba(0,0,0,0.06)',
                      color: 'var(--text-faint)',
                      padding: '1px 6px', borderRadius: 99, minWidth: 16, textAlign: 'center',
                    }}>{count}</span>
                  </button>
                )
              })}
            </div>
          </>
        )}

        <button onClick={toggleTrash} style={{
          appearance: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 14px', borderRadius: 10, fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 500,
          background: 'var(--accent)', color: 'var(--accent-text)',
          flexShrink: 0, marginLeft: 'auto',
          opacity: showTrash ? 1 : 0.88,
          transition: 'opacity 0.15s ease',
        }}
          onMouseEnter={e => e.currentTarget.style.opacity = '1'}
          onMouseLeave={e => e.currentTarget.style.opacity = showTrash ? '1' : '0.88'}
        >
          <Trash2 size={14} strokeWidth={2.5} /> <span className="hidden sm:inline">{t('files.trash') || 'Trash'}</span>
        </button>
      </div>
    </div>
  )
}
