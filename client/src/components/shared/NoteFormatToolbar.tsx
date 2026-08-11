import { useRef } from 'react'
import { Bold, Italic, Strikethrough, List, ListOrdered, Link2, Quote, Code } from 'lucide-react'
import { useTranslation } from '../../i18n'

type FormatAction =
  | { type: 'wrap'; before: string; after: string }
  | { type: 'line'; prefix: string }

interface Props {
  /** The field being formatted. Must be mounted before a button is pressed. */
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  /** Receives the whole new value — the field stays controlled by its owner. */
  onChange: (value: string) => void
  /** Rendered smaller, for the narrow note dialog. */
  compact?: boolean
  /** Mobile sheets run on their own token family, scoped to `.m-root`. */
  variant?: 'desktop' | 'mobile'
}

const ACTIONS: Array<{ icon: typeof Bold; labelKey: string; action: FormatAction }> = [
  { icon: Bold, labelKey: 'notes.format.bold', action: { type: 'wrap', before: '**', after: '**' } },
  { icon: Italic, labelKey: 'notes.format.italic', action: { type: 'wrap', before: '_', after: '_' } },
  { icon: Strikethrough, labelKey: 'notes.format.strike', action: { type: 'wrap', before: '~~', after: '~~' } },
  { icon: Code, labelKey: 'notes.format.code', action: { type: 'wrap', before: '`', after: '`' } },
  { icon: Link2, labelKey: 'notes.format.link', action: { type: 'wrap', before: '[', after: '](https://)' } },
  { icon: List, labelKey: 'notes.format.list', action: { type: 'line', prefix: '- ' } },
  { icon: ListOrdered, labelKey: 'notes.format.orderedList', action: { type: 'line', prefix: '1. ' } },
  { icon: Quote, labelKey: 'notes.format.quote', action: { type: 'line', prefix: '> ' } },
]

/**
 * Formatting bar for the note fields (#1629).
 *
 * Notes have rendered Markdown for a long time, but only ever offered a bare
 * textarea to write it in, so unless you already knew the syntax there was no
 * way to find out it existed. This is that discovery surface.
 *
 * It edits Markdown rather than being a WYSIWYG editor on purpose: the stored
 * value stays plain text that the PDF export, the plugin API and every existing
 * note keep reading unchanged.
 *
 * Split from Journey's MarkdownToolbar, which is bound to the journal's own
 * `--journal-*` variables and hardcodes English labels; this one runs on theme
 * tokens and goes through i18n, so it can sit in the planner.
 */
export default function NoteFormatToolbar({ textareaRef, onChange, compact, variant = 'desktop' }: Props) {
  const { t } = useTranslation()
  // Applied after the re-render, when the field holds the new text.
  const pendingSelection = useRef<[number, number] | null>(null)

  const apply = (action: FormatAction) => {
    const ta = textareaRef.current
    if (!ta) return

    const { selectionStart: start, selectionEnd: end, value } = ta
    const selected = value.slice(start, end)
    let next: string
    let caret: [number, number]

    if (action.type === 'wrap') {
      next = value.slice(0, start) + action.before + selected + action.after + value.slice(end)
      caret = selected
        // Keep the selection on the text, not on the markers around it, so a
        // second click on another button nests instead of wrapping the syntax.
        ? [start + action.before.length, end + action.before.length]
        : [start + action.before.length, start + action.before.length]
    } else {
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const alreadyPrefixed = value.startsWith(action.prefix, lineStart)
      next = alreadyPrefixed
        ? value.slice(0, lineStart) + value.slice(lineStart + action.prefix.length)
        : value.slice(0, lineStart) + action.prefix + value.slice(lineStart)
      const shift = alreadyPrefixed ? -action.prefix.length : action.prefix.length
      caret = [Math.max(lineStart, start + shift), Math.max(lineStart, end + shift)]
    }

    pendingSelection.current = caret
    onChange(next)

    requestAnimationFrame(() => {
      const el = textareaRef.current
      const sel = pendingSelection.current
      if (!el || !sel) return
      el.focus()
      el.setSelectionRange(sel[0], sel[1])
      pendingSelection.current = null
    })
  }

  const size = compact ? 26 : 30
  const buttonCls = variant === 'mobile'
    ? 'grid place-items-center rounded-[10px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] text-m-muted active:bg-m-act active:text-m-actfg'
    : 'grid place-items-center rounded-lg text-content-muted hover:text-content hover:bg-surface-hover transition-colors'

  return (
    <div className="flex flex-wrap items-center gap-[2px]" role="toolbar" aria-label={t('notes.format.toolbar')}>
      {ACTIONS.map(({ icon: Icon, labelKey, action }) => (
        <button
          key={labelKey}
          type="button"
          title={t(labelKey)}
          aria-label={t(labelKey)}
          // Buttons in a toolbar above a field must not steal focus, or the
          // selection they are about to format is gone before the click lands.
          onMouseDown={e => e.preventDefault()}
          onClick={() => apply(action)}
          className={buttonCls}
          style={{ width: size, height: size, cursor: 'pointer', padding: 0, ...(variant === 'mobile' ? {} : { border: 0, background: 'none' }) }}
        >
          <Icon size={compact ? 13 : 15} strokeWidth={1.9} />
        </button>
      ))}
    </div>
  )
}
