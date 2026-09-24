import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Download, FileJson, Loader2, Route, type LucideIcon } from 'lucide-react'
import type { TranslationFn } from '../../types'
import { useAnchoredPosition } from '../../hooks/useAnchoredPosition'
import { COLLECTION_FILE_EXTENSION, COLLECTION_GPX_EXTENSION, type CollectionExportFormat } from './collectionFile'

interface CollectionExportMenuProps {
  onExport: (format: CollectionExportFormat) => void
  exporting?: boolean
  t: TranslationFn
}

interface FormatOption {
  format: CollectionExportFormat
  icon: LucideIcon
  label: string
  extension: string
  hint: string
}

/** Wide enough for the longest hint on one or two lines at the default text size. */
const MENU_WIDTH = 300

/**
 * Export in the list hero: a menu of the two formats a list can leave in (#2301).
 *
 * The TREK file carries everything and is for another TREK; GPX carries the
 * places as waypoints and is for every other map app. Choosing is the whole
 * interaction, so it is a menu rather than a dialog.
 *
 * Portalled, because the hero clips its overflow, and placed against the
 * trigger's right edge, where the button sits. A menu in the WAI-ARIA sense:
 * focus moves into it on open, the arrow keys, Home and End walk it, Escape
 * closes it and gives focus back to the button, and Tab leaves it closed.
 */
export default function CollectionExportMenu({ onExport, exporting, t }: CollectionExportMenuProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const anchored = useAnchoredPosition(triggerRef, open, { estimatedHeight: 150, offset: 6 })
  // Focusable only once positioned: until then the menu is hidden, and a hidden
  // element refuses focus.
  const placed = open && anchored !== null

  const options: FormatOption[] = [
    {
      format: 'trek', icon: FileJson, label: t('collections.file.formatTrek'),
      extension: COLLECTION_FILE_EXTENSION, hint: t('collections.file.formatTrekHint'),
    },
    {
      format: 'gpx', icon: Route, label: 'GPX',
      extension: COLLECTION_GPX_EXTENSION, hint: t('collections.file.formatGpxHint'),
    },
  ]

  const items = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])

  const close = useCallback((refocus: boolean) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (placed) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [placed])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return
      close(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, close])

  const onMenuKeyDown = (e: React.KeyboardEvent) => {
    const all = items()
    const at = all.indexOf(document.activeElement as HTMLElement)
    const focus = (index: number) => {
      e.preventDefault()
      all[(index + all.length) % all.length]?.focus()
    }
    if (e.key === 'ArrowDown') focus(at + 1)
    else if (e.key === 'ArrowUp') focus(at - 1)
    else if (e.key === 'Home') focus(0)
    else if (e.key === 'End') focus(all.length - 1)
    else if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'Tab') close(false)
  }

  const pick = (format: CollectionExportFormat) => {
    close(true)
    onExport(format)
  }

  // Pinned by its right edge, under the button, so it grows leftwards into the hero.
  const right = anchored ? Math.max(8, window.innerWidth - anchored.left - anchored.width) : 8

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => {
          if (e.key === 'ArrowDown' && !open) {
            e.preventDefault()
            setOpen(true)
          }
        }}
        disabled={exporting}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={t('collections.file.export')}
        title={t('collections.file.exportTitle')}
        className="col-glass-btn"
      >
        {exporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        <span className="txt">{t('collections.file.export')}</span>
      </button>
      {open && createPortal(
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label={t('collections.file.exportTitle')}
          onKeyDown={onMenuKeyDown}
          className="trek-popover-enter fixed z-[var(--z-toast)] p-1.5 rounded-xl border border-edge bg-surface-card shadow-dropdown"
          style={{
            ...(anchored?.flipped ? { bottom: anchored.bottom } : { top: anchored?.top ?? 0 }),
            right,
            width: MENU_WIDTH,
            maxWidth: 'calc(100vw - 16px)',
            visibility: anchored ? 'visible' : 'hidden',
          }}
        >
          {options.map(option => (
            <button
              key={option.format}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => pick(option.format)}
              className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-colors hover:bg-surface-hover focus:bg-surface-hover focus:outline-none"
            >
              <option.icon size={16} className="mt-0.5 shrink-0 text-content-faint" aria-hidden />
              <span className="flex-1 min-w-0">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-body font-semibold text-content">{option.label}</span>
                  <span className="text-caption text-content-faint">{option.extension}</span>
                </span>
                <span className="block text-caption text-content-muted">{option.hint}</span>
              </span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  )
}
