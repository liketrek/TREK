import { useEffect, useState, useRef, type HTMLAttributes } from 'react'
import { ChevronRight } from 'lucide-react'
import { useTranslation } from '../../i18n'
import JournalBody from './JournalBody'

export function ExpandableStory({ story }: { story: string }) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const [clamped, setClamped] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const measuredRef = useRef(false)

  useEffect(() => {
    measuredRef.current = false
  }, [story])

  useEffect(() => {
    if (measuredRef.current) return
    const el = ref.current
    if (el && !expanded) {
      setClamped(el.scrollHeight > el.clientHeight)
      measuredRef.current = true
    }
  })

  // The text block toggles the same clamp as the Show more / Show less buttons
  // below it. It only takes focus while there is something to toggle, so a
  // short story stays plain text instead of an empty stop in the tab order.
  const toggle: HTMLAttributes<HTMLDivElement> = clamped || expanded
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-expanded': expanded,
        onClick: () => setExpanded(e => !e),
        onKeyDown: e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(v => !v) } },
      }
    : {}

  return (
    <div>
      <div
        ref={ref}
        {...toggle}
        className={`text-[13px] text-zinc-700 dark:text-zinc-300 leading-relaxed ${
          expanded ? '' : 'line-clamp-3 md:line-clamp-[9]'
        } ${clamped || expanded ? 'cursor-pointer' : ''}`}
      >
        <JournalBody text={story} />
      </div>
      {clamped && !expanded && (
        <button type="button"
          onClick={() => setExpanded(true)}
          className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
        >
          {t('common.showMore')} <ChevronRight size={10} />
        </button>
      )}
      {expanded && (
        <button type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 active:scale-95 transition-all"
        >
          {t('common.showLess')} <ChevronRight size={10} className="rotate-[-90deg]" />
        </button>
      )}
    </div>
  )
}
