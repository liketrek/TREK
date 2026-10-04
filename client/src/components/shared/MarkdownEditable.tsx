import { useState, type CSSProperties, type ReactNode } from 'react'
import MarkdownText from './MarkdownText'
import { Tooltip } from './Tooltip'

interface EditorProps {
  autoFocus: boolean
  /** Holds the editor open while it has focus, so typing into an empty field does not flip it to text. */
  onFocus: () => void
  onBlur: () => void
}

/**
 * A Markdown field that reads as rendered text and turns into its textarea on a
 * click (#2558): a link in a to-do description is a link, not a line of syntax.
 * An empty field, or one being written, is the editor straight away. A click that
 * lands on a link follows the link and leaves the text alone.
 */
export default function MarkdownEditable({ value, canEdit, editLabel, renderEditor, className = '', style }: {
  value: string
  canEdit: boolean
  /** The hint on the rendered text, which is what opens the editor. */
  editLabel: string
  renderEditor: (props: EditorProps) => ReactNode
  className?: string
  style?: CSSProperties
}) {
  const [editing, setEditing] = useState(false)
  if (canEdit && (editing || !value.trim())) {
    return <>{renderEditor({ autoFocus: editing, onFocus: () => setEditing(true), onBlur: () => setEditing(false) })}</>
  }
  if (!canEdit) return <MarkdownText className={className}>{value}</MarkdownText>
  return (
    <Tooltip label={editLabel} placement="top">
    <div
      role="button"
      tabIndex={0}
      onClick={e => { if (!(e.target as HTMLElement).closest('a')) setEditing(true) }}
      onKeyDown={e => { if (e.key === 'Enter' && e.target === e.currentTarget) { e.preventDefault(); setEditing(true) } }}
      className={`cursor-text ${className}`}
      style={style}
    >
      <MarkdownText>{value}</MarkdownText>
    </div>
    </Tooltip>
  )
}
