import { useId, useState } from 'react'
import { Plus, Tags, Trash2 } from 'lucide-react'
import { NOTE_COLORS } from './CollabNotes.constants'
import { EditableCatName } from './CollabNotesEditableCatName'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { INPUT } from '../shared/dialogParts'
import { Tooltip } from '../shared/Tooltip'

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
  const labelId = useId()

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
    // Apply renames to notes in DB. A rejected rename keeps the modal open — closing
    // it would look like the rename went through; the caller has already reported it.
    try {
      for (const [oldName, newName] of Object.entries(renames)) {
        if (oldName !== newName) await onRenameCategory(oldName, newName)
      }
    } catch {
      return
    }
    await onSave(localColors)
    onClose()
  }

  // Merge existing categories from notes with saved colors
  const allCats = [...new Set([...categories, ...Object.keys(localColors)])]

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><Tags size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('collab.notes.categorySettings') || 'Category Settings'}
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('collab.notes.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={handleSave}>{t('collab.notes.save')}</DialogButton>
        </DialogFooter>
      )}
    >
      <DialogSection label={t('collab.notes.category')}>
        {allCats.length === 0 ? (
          <p className="m-0 rounded-[12px] bg-surface-secondary px-4 py-5 text-center text-content-faint" style={fs(12.5, 'body')}>
            {t('collab.notes.noCategoriesYet') || 'No categories yet'}
          </p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {allCats.map(cat => {
              const current = localColors[cat] || NOTE_COLORS[0].value
              return (
                <div key={cat} className="flex items-center gap-2.5 rounded-[12px] bg-surface-secondary py-1.5 pl-3 pr-1.5">
                  <span className="h-2.5 w-2.5 flex-none rounded-full" style={{ background: current }} />
                  {/* Category name — editable */}
                  <EditableCatName name={cat} onRename={(newName) => handleRenameCategory(cat, newName)} renameLabel={t('common.rename')} />
                  {/* Color swatches */}
                  <div className="flex flex-none gap-1.5" role="group" aria-label={t('collab.notes.color')}>
                    {NOTE_COLORS.map(c => {
                      const on = current === c.value
                      return (
                        <button type="button" key={c.value} onClick={() => handleColorChange(cat, c.value)} aria-label={c.label} aria-pressed={on}
                          className="h-5 w-5 rounded-full p-0 transition-transform"
                          style={{
                            background: c.value,
                            outline: on ? '2px solid var(--text-primary)' : '2px solid transparent',
                            outlineOffset: 1.5,
                            transform: on ? 'scale(1.08)' : 'scale(1)',
                          }} />
                      )
                    })}
                  </div>
                  {/* Delete */}
                  <Tooltip label={t('collab.notes.delete')}>
                    <button type="button" onClick={() => handleRemoveCategory(cat)} aria-label={t('collab.notes.delete')}
                      className="grid h-7 w-7 flex-none place-items-center rounded-full text-content-faint hover:bg-surface-card hover:text-danger">
                      <Trash2 size={13} />
                    </button>
                  </Tooltip>
                </div>
              )
            })}
          </div>
        )}
        {/* Add new */}
        <div className="mt-2 flex gap-2">
          <input value={newCatName} onChange={e => setNewCatName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddCategory()}
            placeholder={t('collab.notes.newCategory')}
            className={`${INPUT} flex-1`} />
          <button type="button" onClick={handleAddCategory} disabled={!newCatName.trim()} aria-label={t('collab.notes.newCategory')}
            className="grid w-10 flex-none place-items-center rounded-[10px] bg-accent text-accent-text disabled:cursor-default disabled:opacity-40">
            <Plus size={16} />
          </button>
        </div>
      </DialogSection>

    </DialogShell>
  )
}
