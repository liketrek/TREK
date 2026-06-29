import ReactDOM from 'react-dom'
import { useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { FONT, NOTE_COLORS } from './CollabNotes.constants'
import { EditableCatName } from './CollabNotesEditableCatName'

// ── Category Settings Modal ──────────────────────────────────────────────────
interface CategorySettingsModalProps {
  onClose: () => void
  categories: string[]
  categoryColors: Record<string, string>
  onSave: (colors: Record<string, string>) => void
  onRenameCategory: (oldName: string, newName: string) => Promise<void>
  t: (key: string) => string
}

export function CategorySettingsModal({ onClose, categories, categoryColors, onSave, onRenameCategory, t }: CategorySettingsModalProps) {
  const [localColors, setLocalColors] = useState({ ...categoryColors })
  const [renames, setRenames] = useState<Record<string, string>>({}) // { oldName: newName }
  const [newCatName, setNewCatName] = useState('')

  const handleColorChange = (cat, color) => {
    setLocalColors(prev => ({ ...prev, [cat]: color }))
  }

  const handleAddCategory = () => {
    if (!newCatName.trim() || localColors[newCatName.trim()]) return
    setLocalColors(prev => ({ ...prev, [newCatName.trim()]: NOTE_COLORS[Object.keys(prev).length % NOTE_COLORS.length].value }))
    setNewCatName('')
  }

  const handleRemoveCategory = (cat) => {
    setLocalColors(prev => { const n = { ...prev }; delete n[cat]; return n })
  }

  const handleRenameCategory = (oldName, newName) => {
    if (!newName.trim() || newName.trim() === oldName || localColors[newName.trim()]) return
    // Track rename for saving to DB later
    const originalName = Object.entries(renames).find(([, v]) => v === oldName)?.[0] || oldName
    setRenames(prev => ({ ...prev, [originalName]: newName.trim() }))
    setLocalColors(prev => {
      const n = {}
      for (const [k, v] of Object.entries(prev)) {
        n[k === oldName ? newName.trim() : k] = v
      }
      return n
    })
  }

  const handleSave = async () => {
    // Apply renames to notes in DB
    for (const [oldName, newName] of Object.entries(renames)) {
      if (oldName !== newName) await onRenameCategory(oldName, newName)
    }
    await onSave(localColors)
    onClose()
  }

  // Merge existing categories from notes with saved colors
  const allCats = [...new Set([...categories, ...Object.keys(localColors)])]

  return ReactDOM.createPortal(
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--overlay-bg, rgba(0,0,0,0.35))',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16, fontFamily: FONT,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 420,
        maxHeight: '80vh', overflow: 'auto', border: '1px solid var(--border-faint)',
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 12px', borderBottom: '1px solid var(--border-faint)' }}>
          <h3 style={{ fontSize: 'calc(14px * var(--fs-scale-body, 1))', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            {t('collab.notes.categorySettings') || 'Category Settings'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 2, display: 'flex' }}>
            <X size={16} />
          </button>
        </div>

        {/* Categories list */}
        <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {allCats.length === 0 && (
            <p style={{ fontSize: 'calc(12px * var(--fs-scale-body, 1))', color: 'var(--text-faint)', textAlign: 'center', padding: 16 }}>
              {t('collab.notes.noCategoriesYet') || 'No categories yet'}
            </p>
          )}
          {allCats.map(cat => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* Color swatches */}
              <div style={{ display: 'flex', gap: 4 }}>
                {NOTE_COLORS.map(c => (
                  <button key={c.value} onClick={() => handleColorChange(cat, c.value)} style={{
                    width: 20, height: 20, borderRadius: 6, background: c.value, border: 'none', cursor: 'pointer', padding: 0,
                    outline: (localColors[cat] || NOTE_COLORS[0].value) === c.value ? '2px solid var(--text-primary)' : '2px solid transparent',
                    outlineOffset: 1, transition: 'transform 0.1s',
                    transform: (localColors[cat] || NOTE_COLORS[0].value) === c.value ? 'scale(1.1)' : 'scale(1)',
                  }} />
                ))}
              </div>
              {/* Category name — editable */}
              <EditableCatName name={cat} onRename={(newName) => handleRenameCategory(cat, newName)} />
              {/* Delete */}
              <button onClick={() => handleRemoveCategory(cat)} style={{
                background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-faint)', padding: 3, display: 'flex',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-faint)'}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}

          {/* Add new */}
          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
            <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
              placeholder={t('collab.notes.newCategory')}
              style={{
                flex: 1, border: '1px solid var(--border-primary)', borderRadius: 10, padding: '8px 12px',
                fontSize: 'calc(13px * var(--fs-scale-body, 1))', background: 'var(--bg-input)', color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
              }} />
            <button onClick={handleAddCategory} disabled={!newCatName.trim()} style={{
              background: newCatName.trim() ? 'var(--accent)' : 'var(--border-primary)', color: 'var(--accent-text)',
              border: 'none', borderRadius: 10, padding: '8px 14px', cursor: newCatName.trim() ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', flexShrink: 0,
            }}>
              <Plus size={14} />
            </button>
          </div>

          {/* Save */}
          <button onClick={handleSave} style={{
            width: '100%', borderRadius: 99, padding: '9px 14px', background: 'var(--accent)', color: 'var(--accent-text)',
            fontSize: 'calc(13px * var(--fs-scale-body, 1))', fontWeight: 600, border: 'none', cursor: 'pointer', marginTop: 8,
          }}>
            {t('collab.notes.save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
