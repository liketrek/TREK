import { useState, useEffect, useRef } from 'react'

interface EditableCatNameProps {
  name: string
  onRename: (newName: string) => void
}

export function EditableCatName({ name, onRename }: EditableCatNameProps) {
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
      onBlur={save} onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setValue(name); setEditing(false) } }}
      style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', border: '1px solid var(--border-primary)', borderRadius: 6, padding: '2px 8px', background: 'var(--bg-input)', fontFamily: 'inherit', outline: 'none' }} />
  }

  return (
    <span onClick={() => { setValue(name); setEditing(true) }}
      style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer', padding: '2px 0' }}
      title="Click to rename">
      {name}
    </span>
  )
}
