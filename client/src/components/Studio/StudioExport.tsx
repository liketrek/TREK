import { useEffect, useId, useRef, useState } from 'react'
import { BookOpen, FileText, Printer, Scissors } from 'lucide-react'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import type { BookDocument } from '@trek/shared'
import { BookSheetsView } from './BookSheetsView'
import { sheetBox, sheetsFor, type SheetMode } from './bookSheets'
import { printSheets } from './printSheets'

/**
 * Getting the book out.
 *
 * ── Two questions, not a settings panel ──────────────────────────────────
 *
 * Leaves or spreads, and marks or no marks. Everything else a print dialog
 * usually asks — resolution, colour profile, embedding — either has one right
 * answer here or is not ours to give: the images go out at full size because
 * anything else is a worse book, and the profile belongs to whoever is doing
 * the printing.
 *
 * ── Why the sheets are rendered here rather than built as a string ───────
 *
 * They are the editor's own components, and those read context — the active
 * locale, most visibly, which is what a stats element and a date line are
 * written in. Rendering them to markup outside the tree would mean standing up
 * that context again and getting a book in English for someone who wrote it in
 * German. So they render inside the app, off screen, and the markup is taken
 * from the DOM afterwards.
 */
export function StudioExport({
  doc, title, t, onClose,
}: {
  doc: BookDocument
  title: string
  t: (key: string, params?: Record<string, string | number>) => string
  onClose: () => void
}) {
  const [mode, setMode] = useState<SheetMode>('pages')
  const [marks, setMarks] = useState(true)
  /** Set once the user has asked for it — this is what triggers the render. */
  const [building, setBuilding] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const labelId = useId()

  const sheets = sheetsFor(doc, mode)

  /*
   * Two sizes, because spread mode mixes them: covers are one page and
   * everything between them is two. The wider one is the document's page box
   * and the narrower gets a named rule — see printSheets.
   */
  const widest = Math.max(...sheets.map(s => s.width), doc.page.pageWidth)
  const box = sheetBox(widest, doc.page.pageHeight, doc.page.bleed, marks)
  const single = sheetBox(doc.page.pageWidth, doc.page.pageHeight, doc.page.bleed, marks)

  useEffect(() => {
    if (!building) return
    const html = stage.current?.innerHTML
    if (!html) return

    printSheets({
      html,
      sheetWidth: box.width,
      sheetHeight: box.height,
      singleWidth: single.width,
      singleHeight: single.height,
      title,
      labels: {
        save: t('journey.studio.exportSave'),
        close: t('common.close'),
        count: t('journey.studio.exportSheetCount', { count: sheets.length }),
        preparing: t('journey.studio.exportPreparing'),
      },
    })
    setBuilding(false)
    onClose()
    // Runs once per build. Re-running on every render of the options would
    // open a second print view behind the first.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [building])

  // Studio closes itself on Escape. While this dialog is open the key is its own,
  // so it is taken in the capture phase before the editor's handler sees it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onClose()
    }
    document.addEventListener('keydown', onKey, true)
    return () => document.removeEventListener('keydown', onKey, true)
  }, [onClose])

  return (
    <>
      <DialogShell
        onClose={onClose}
        labelledBy={labelId}
        width="narrow"
        header={(
          <DialogHeader
            tile={<DialogTile><Printer size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
            tint={NEUTRAL_TINT}
            labelId={labelId}
            onClose={onClose}
            title={t('journey.studio.export')}
          />
        )}
        footer={(
          <DialogFooter>
            <FooterSpacer />
            <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
            <DialogButton variant="primary" onClick={() => setBuilding(true)} disabled={building} icon={<Printer size={14} strokeWidth={2} />}>
              {t('journey.studio.exportOpen')}
            </DialogButton>
          </DialogFooter>
        )}
      >
        <DialogSection label={t('journey.studio.exportLayout')}>
          <div className="flex flex-col gap-2">
            <Option icon={FileText} name={t('journey.studio.exportPages')} hint={t('journey.studio.exportPagesHint')} on={mode === 'pages'} onClick={() => setMode('pages')} />
            <Option icon={BookOpen} name={t('journey.studio.exportSpreads')} hint={t('journey.studio.exportSpreadsHint')} on={mode === 'spreads'} onClick={() => setMode('spreads')} />
          </div>
        </DialogSection>

        <DialogSection label={t('journey.studio.exportFinishing')}>
          <Option icon={Scissors} name={t('journey.studio.exportMarks')} hint={t('journey.studio.exportMarksHint', { bleed: doc.page.bleed })} on={marks} onClick={() => setMarks(!marks)} />
        </DialogSection>

        <p className="m-0 text-content-muted" style={fs(12, 'body')}>
          {t('journey.studio.exportNote', {
            count: sheets.length,
            width: round1(box.width),
            height: round1(box.height),
          })}
        </p>
      </DialogShell>

      {/*
        The sheets, rendered where nobody can see them.
        Off screen rather than `display: none`: a hidden subtree lays nothing
        out, and these are measured in millimetres by the same CSS that will
        print them, a book built from an unlaid-out tree is a book of empty
        boxes. They stay inside Studio's tree, where that CSS applies, while the
        dialog itself is portalled over it. `aria-hidden` keeps them out of the
        reading order.
      */}
      {building && (
        <div
          ref={stage}
          aria-hidden="true"
          style={{ position: 'fixed', left: '-20000mm', top: 0, pointerEvents: 'none' }}
        >
          <BookSheetsView doc={doc} mode={mode} marks={marks} />
        </div>
      )}
    </>
  )
}

const round1 = (n: number) => Math.round(n * 10) / 10

/** One choice of the dialog: an icon, its name and what it means, pressed while it holds. */
function Option({ icon: Icon, name, hint, on, onClick }: {
  icon: typeof FileText
  name: string
  hint: string
  on: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`flex w-full items-start gap-3 rounded-[12px] border px-3 py-2.5 text-start transition-colors ${on ? 'border-[color:var(--text-primary)] bg-surface-card shadow-sm' : 'border-edge-faint bg-surface-card hover:bg-surface-hover'}`}
    >
      <Icon size={16} strokeWidth={1.9} className={`mt-0.5 flex-none ${on ? 'text-content' : 'text-content-muted'}`} />
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-content" style={fs(13, 'body')}>{name}</span>
        <span className="block text-content-muted" style={fs(11.5)}>{hint}</span>
      </span>
    </button>
  )
}
