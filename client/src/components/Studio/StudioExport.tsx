import { useEffect, useRef, useState } from 'react'
import { BookOpen, FileText, Printer, Scissors, X } from 'lucide-react'
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

  return (
    <div className="st-ex" role="dialog" aria-modal="true" aria-label={t('journey.studio.export')}>
      <div className="st-ex-card">
        <div className="st-ex-head">
          <span>{t('journey.studio.export')}</span>
          <button type="button" className="st-ex-x" onClick={onClose} aria-label={t('common.close')}>
            <X size={15} />
          </button>
        </div>

        <div className="st-ex-body">
          <Choice<SheetMode>
            label={t('journey.studio.exportLayout')}
            options={[
              {
                id: 'pages',
                icon: FileText,
                name: t('journey.studio.exportPages'),
                hint: t('journey.studio.exportPagesHint'),
              },
              {
                id: 'spreads',
                icon: BookOpen,
                name: t('journey.studio.exportSpreads'),
                hint: t('journey.studio.exportSpreadsHint'),
              },
            ]}
            value={mode}
            onPick={setMode}
          />

          <div className="st-ex-field">
            <span className="st-ex-label">{t('journey.studio.exportFinishing')}</span>
            <button type="button"
              className={`st-ex-opt ${marks ? 'is-on' : ''}`}
              onClick={() => setMarks(!marks)}
              aria-pressed={marks}
            >
              <Scissors size={15} />
              <span className="st-ex-text">
                <span className="st-ex-name">{t('journey.studio.exportMarks')}</span>
                <span className="st-ex-hint">
                  {t('journey.studio.exportMarksHint', { bleed: doc.page.bleed })}
                </span>
              </span>
            </button>
          </div>

          <p className="st-ex-note">
            {t('journey.studio.exportNote', {
              sheets: sheets.length,
              width: round1(box.width),
              height: round1(box.height),
            })}
          </p>
        </div>

        <div className="st-ex-foot">
          <button type="button" className="st-ex-btn" onClick={onClose}>{t('common.cancel')}</button>
          <button type="button" className="st-ex-btn is-primary" onClick={() => setBuilding(true)} disabled={building}>
            <Printer size={14} />
            <span>{t('journey.studio.exportOpen')}</span>
          </button>
        </div>
      </div>

      {/*
        The sheets, rendered where nobody can see them.
        Off screen rather than `display: none`: a hidden subtree lays nothing
        out, and these are measured in millimetres by the same CSS that will
        print them — a book built from an unlaid-out tree is a book of empty
        boxes. `aria-hidden` keeps the whole thing out of the reading order.
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
    </div>
  )
}

const round1 = (n: number) => Math.round(n * 10) / 10

function Choice<T extends string>({
  label, options, value, onPick,
}: {
  label: string
  options: { id: T; icon: typeof FileText; name: string; hint: string }[]
  value: T
  onPick: (id: T) => void
}) {
  return (
    <div className="st-ex-field">
      <span className="st-ex-label">{label}</span>
      {options.map(opt => (
        <button type="button"
          key={opt.id}
          className={`st-ex-opt ${value === opt.id ? 'is-on' : ''}`}
          onClick={() => onPick(opt.id)}
          aria-pressed={value === opt.id}
        >
          <opt.icon size={15} />
          <span className="st-ex-text">
            <span className="st-ex-name">{opt.name}</span>
            <span className="st-ex-hint">{opt.hint}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
