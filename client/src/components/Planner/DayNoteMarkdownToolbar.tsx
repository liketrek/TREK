import { useRef } from 'react'
import { Bold, Code, Italic, Link2, List, ListOrdered, Strikethrough } from 'lucide-react'

type MarkdownAction = { type: 'wrap'; before: string; after: string } | { type: 'link' } | { type: 'line'; prefix: string }

interface MarkdownTool {
  Icon: typeof Bold
  labelKey: string
  action: MarkdownAction
}

const MARKDOWN_TOOLS: MarkdownTool[] = [
  { Icon: Bold, labelKey: 'dayplan.markdown.bold', action: { type: 'wrap', before: '**', after: '**' } },
  { Icon: Italic, labelKey: 'dayplan.markdown.italic', action: { type: 'wrap', before: '*', after: '*' } },
  {
    Icon: Strikethrough,
    labelKey: 'dayplan.markdown.strikethrough',
    action: { type: 'wrap', before: '~~', after: '~~' },
  },
  { Icon: List, labelKey: 'dayplan.markdown.bulletList', action: { type: 'line', prefix: '- ' } },
  { Icon: ListOrdered, labelKey: 'dayplan.markdown.numberedList', action: { type: 'line', prefix: '1. ' } },
  { Icon: Code, labelKey: 'dayplan.markdown.inlineCode', action: { type: 'wrap', before: '`', after: '`' } },
  { Icon: Link2, labelKey: 'dayplan.markdown.link', action: { type: 'link' } },
]

interface DayNoteMarkdownToolbarProps {
  getTextarea: () => HTMLTextAreaElement | null
  value: string
  maxLength: number
  onChange: (value: string) => void
  t: (key: string) => string
  mobile?: boolean
}

export function DayNoteMarkdownToolbar({ getTextarea, value, maxLength, onChange, t, mobile = false }: DayNoteMarkdownToolbarProps) {
  const pendingSelection = useRef<{ start: number; end: number } | null>(null)

  const apply = (action: MarkdownAction) => {
    const textarea = getTextarea()
    if (!textarea) return

    const start = pendingSelection.current?.start ?? textarea.selectionStart
    const end = pendingSelection.current?.end ?? textarea.selectionEnd
    pendingSelection.current = null
    const selected = value.slice(start, end)
    let next: string
    let selectionStart = start
    let selectionEnd = end

    if (action.type === 'wrap') {
      next = value.slice(0, start) + action.before + selected + action.after + value.slice(end)
      selectionStart = start + action.before.length
      selectionEnd = selectionStart + selected.length
    } else if (action.type === 'link') {
      const inserted = `[${selected}](https://)`
      next = value.slice(0, start) + inserted + value.slice(end)
      if (selected) {
        selectionStart = start + selected.length + 3
        selectionEnd = selectionStart + 8
      } else {
        selectionStart = start + 1
        selectionEnd = selectionStart
      }
    } else {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const block = value.slice(lineStart, end)
      const prefixed = block
        .split('\n')
        .map(line => action.prefix + line)
        .join('\n')
      next = value.slice(0, lineStart) + prefixed + value.slice(end)
      selectionStart = start + action.prefix.length
      selectionEnd = end + prefixed.length - block.length
    }

    if (next.length > maxLength) return
    onChange(next)

    requestAnimationFrame(() => {
      textarea.focus()
      textarea.setSelectionRange(selectionStart, selectionEnd)
    })
  }

  return (
    <div role="toolbar" aria-label={t('dayplan.markdown.toolbar')} className="flex max-w-full gap-1 overflow-x-auto">
      {MARKDOWN_TOOLS.map(({ Icon, labelKey, action }) => {
        const label = t(labelKey)
        return (
          <button
            key={labelKey}
            type="button"
            aria-label={label}
            title={label}
            onMouseDown={event => {
              const textarea = getTextarea()
              if (textarea) pendingSelection.current = { start: textarea.selectionStart, end: textarea.selectionEnd }
              event.preventDefault()
            }}
            onClick={() => apply(action)}
            className={
              mobile
                ? 'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted'
                : 'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[var(--border-faint)] bg-transparent text-content-muted hover:bg-surface-hover'
            }
          >
            <Icon size={15} strokeWidth={1.8} />
          </button>
        )
      })}
    </div>
  )
}
