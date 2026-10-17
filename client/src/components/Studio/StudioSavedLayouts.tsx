import type { BookPageSetup } from '@trek/shared'
import { MAX_BOOK_LAYOUTS } from '@trek/shared'
import { BookmarkPlus, Trash2 } from 'lucide-react'
import { useStudioStore } from '../../store/studioStore'
import { Tooltip } from '../shared/Tooltip'
import { SpreadView } from './SpreadView'
import { layoutPreview, layoutRole, nextLayoutName } from './savedLayouts'

/**
 * The book's own layouts, above the built-in ones (#2316).
 *
 * One button keeps the page on screen as a layout; each card lays the page on
 * screen out that way, keeping its pictures and words. The cards draw the
 * layout with the same renderer as the page, so what is kept is what is shown.
 */
export function StudioSavedLayouts({
  page, width, pxPerMm, t,
}: { page: BookPageSetup; width: number; pxPerMm: number; t: (k: string) => string }) {
  const doc = useStudioStore(s => s.doc)
  const active = useStudioStore(s => s.activeSpread)
  const saveLayout = useStudioStore(s => s.saveLayout)
  const removeLayout = useStudioStore(s => s.removeLayout)
  const applyLayout = useStudioStore(s => s.applyLayout)
  const spread = doc?.spreads[active]
  if (!doc || !spread) return null

  const all = doc.layouts ?? []
  const role = layoutRole(spread)
  const fitting = all.filter(l => l.role === role)
  const full = all.length >= MAX_BOOK_LAYOUTS
  const canSave = spread.elements.length > 0 && !full
  const single = role !== 'inner'
  const wMm = page.pageWidth * (single ? 1 : 2)
  const scale = width / (wMm * pxPerMm)

  return (
    <div className="st-saved-layouts">
      <div className="st-section-label">{t('journey.studio.myLayouts')}</div>
      {fitting.length === 0 && <p className="st-hint">{t('journey.studio.myLayoutsEmpty')}</p>}
      <div className="st-thumbs">
        {fitting.map(layout => (
          <div className="st-thumb-row" key={layout.id}>
            <button type="button" className="st-thumb" onClick={() => applyLayout(active, layout.id)}>
              <div className="st-thumb-sheet" style={{ width, height: page.pageHeight * pxPerMm * scale }}>
                <div
                  style={{
                    position: 'absolute', left: 0, top: 0,
                    width: `${wMm}mm`, height: `${page.pageHeight}mm`,
                    transform: `scale(${scale})`, transformOrigin: 'top left',
                  }}
                >
                  <SpreadView spread={layoutPreview(layout, page)} page={page} />
                </div>
              </div>
              <span className="st-thumb-label">{layout.name}</span>
            </button>
            <div className="st-thumb-actions">
              <Tooltip label={t('journey.studio.deleteLayout')}>
                <button type="button"
                  className="is-danger"
                  onClick={() => removeLayout(layout.id)}
                  aria-label={t('journey.studio.deleteLayout')}
                >
                  <Trash2 size={12} />
                </button>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
      <Tooltip label={t(full ? 'journey.studio.saveLayoutFull' : 'journey.studio.saveLayoutHint')}>
        <button type="button"
          className="st-add-page"
          disabled={!canSave}
          onClick={() => saveLayout(active, nextLayoutName(all, t('journey.studio.layoutName')))}
        >
          <BookmarkPlus size={14} />
          {t('journey.studio.saveLayout')}
        </button>
      </Tooltip>
      <div className="st-section-label st-builtin-label">{t('journey.studio.builtInLayouts')}</div>
    </div>
  )
}
