import { useState, useEffect, useRef } from 'react'
import { Tooltip } from '../shared/Tooltip'

interface EditableCatNameProps {
  name: string
  onRename: (newName: string) => void
  /** The tooltip on the name, e.g. "Rename". */
  renameLabel?: string
}

export function EditableCatName({ name, onRename, renameLabel = 'Click to rename' }: EditableCatNameProps) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)
  const inputRef = useRef(null)

  useEffect(() => { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [editing])

  const save = () => {
    setEditing(false)
    if (value.trim() && value.trim() !== name) onRename(value.trim())
    else setValue(name)
  }

  if (editing) {
    return <input ref={inputRef} value={value} onChange={e => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={e => {
        if (e.key === 'Enter') save()
        // Escape only drops the rename; the dialog around it stays open.
        if (e.key === 'Escape') { e.preventDefault(); setValue(name); setEditing(false) }
      }}
      className="min-w-0 flex-1 rounded-[8px] border border-edge bg-surface-input px-2 py-0.5 font-semibold text-content outline-none focus:ring-2 focus:ring-[color:var(--text-primary)]"
      style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))' }} />
  }

  return (
    <Tooltip label={renameLabel}>
      <button type="button" onClick={() => { setValue(name); setEditing(true) }}
        className="min-w-0 flex-1 truncate py-0.5 text-start font-semibold text-content hover:underline hover:decoration-edge"
        style={{ fontSize: 'calc(13px * var(--fs-scale-body, 1))' }}>
        {name}
      </button>
    </Tooltip>
  )
}
