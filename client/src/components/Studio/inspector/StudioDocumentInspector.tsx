import type { BookPageNumbers, BookPageSetup } from '@trek/shared';
import { BOOK_THEME_PRESETS } from '@trek/shared';
import { MousePointerClick, Palette } from 'lucide-react';

import { useStudioStore } from '../../../store/studioStore';
import '../../../styles/studio-panels.css';
import { StudioBackgroundSection } from '../StudioBackgroundSection';
import { Choice, Line, NumField, Section, Switch } from '../StudioControls';
import { PanelHead } from '../StudioPanelHead';
import type { JourneySource, StudioT } from '../StudioSidebar';
import { Swatches } from '../StudioSwatches';
import { ThemeSheet } from '../theme/ThemeSheet';

/**
 * The inspector with nothing selected: the page and the book.
 *
 * What the panel is for comes first, in a line at its top, since an empty
 * inspector is the first thing a new book shows. Then the page that is open,
 * its background; the book's theme, as the Theme panel draws it, with the way
 * to that panel; and the page numbers, which are no property of any element,
 * because the number a page carries depends on where its spread sits. The page
 * size sits in the head.
 */

type Folio = BookPageNumbers['position'];

const FOLIO_POSITIONS: readonly Folio[] = ['outer', 'inner', 'centre'];

/** The book's theme as a little page and its name, and the button to the Theme panel. */
function ThemeSummary({ t, onOpenTheme }: { t: StudioT; onOpenTheme?: () => void }) {
  const theme = useStudioStore((s) => s.doc?.theme);
  const preset = theme?.id ? BOOK_THEME_PRESETS.find((p) => p.id === theme.id) : undefined;
  return (
    <Section label={t('studio.theme.panel')}>
      {theme ? (
        <div className="st-theme-sum">
          <ThemeSheet palette={theme.palette} display={theme.fonts.display} />
          {preset && <span className="st-theme-sum-name">{t(preset.labelKey)}</span>}
        </div>
      ) : (
        <p className="st-hint st-hint-before">{t('studio.theme.intro')}</p>
      )}
      {onOpenTheme && (
        <button type="button" className="st-chip" onClick={onOpenTheme}>
          <Palette size={13} aria-hidden />
          {t(theme ? 'studio.theme.change' : 'studio.theme.choose')}
        </button>
      )}
    </Section>
  );
}

/** Whether the pages carry numbers, and where, from which number, how large, in what colour. */
function PageNumbersSection({
  folios,
  setPageNumbers,
  t,
}: {
  folios: BookPageNumbers;
  setPageNumbers: (patch: Partial<BookPageNumbers>) => void;
  t: StudioT;
}) {
  return (
    <Section label={t('journey.studio.pageNumbers')}>
      <Switch
        label={t('journey.studio.pageNumbers')}
        on={folios.show}
        onToggle={() => setPageNumbers({ show: !folios.show })}
      />
      {folios.show && (
        <>
          <div className="st-section-gap">
            <Line label={t('journey.studio.position')}>
              <Choice
                value={folios.position}
                ariaLabel={t('journey.studio.position')}
                options={FOLIO_POSITIONS.map((pos) => ({ value: pos, label: t(`journey.studio.folio.${pos}`) }))}
                onPick={(position) => setPageNumbers({ position })}
              />
            </Line>
          </div>
          <div className="st-grid2 st-section-gap">
            <NumField
              label={t('journey.studio.folioStart')}
              value={folios.startAt}
              min={0}
              max={9999}
              step={1}
              onChange={(v) => setPageNumbers({ startAt: Math.round(v) })}
            />
            <NumField
              label={t('journey.studio.size')}
              value={folios.size}
              min={4}
              max={48}
              step={0.5}
              unit="pt"
              onChange={(v) => setPageNumbers({ size: v })}
            />
          </div>
          <div className="st-section-gap">
            <NumField
              label={t('journey.studio.folioMargin')}
              value={folios.margin}
              min={0}
              max={60}
              step={0.5}
              unit="mm"
              onChange={(v) => setPageNumbers({ margin: v })}
            />
          </div>
          <div className="st-section-gap">
            <Switch
              label={t('journey.studio.folioAuto')}
              on={folios.autoColor}
              onToggle={() => setPageNumbers({ autoColor: !folios.autoColor })}
            />
          </div>
          {/* Picking a colour is the other way to turn automatic off, so the row stays reachable and simply
              reads as inactive. */}
          <div className={`st-section-gap ${folios.autoColor ? 'is-quiet' : ''}`}>
            <Line label={t('journey.studio.colour')} wide>
              <Swatches value={folios.color} onPick={(c) => setPageNumbers({ color: c, autoColor: false })} />
            </Line>
          </div>
        </>
      )}
    </Section>
  );
}

export function StudioDocumentInspector({
  spreadIndex,
  page,
  source,
  setPageNumbers,
  onOpenTheme,
  t,
}: {
  spreadIndex: number;
  page: BookPageSetup;
  source: JourneySource;
  setPageNumbers: (patch: Partial<BookPageNumbers>) => void;
  /** Opens the Theme panel in the rail; without it the summary offers no button. */
  onOpenTheme?: () => void;
  t: StudioT;
}) {
  return (
    <aside className="st-panel st-inspector">
      <PanelHead
        label={t('journey.studio.document')}
        meta={`${t('journey.studio.pageHint')} ${page.pageWidth} × ${page.pageHeight} mm`}
      />
      <div className="st-panel-scroll">
        <p className="st-empty-note">
          <MousePointerClick size={15} aria-hidden />
          <span>{t('journey.studio.inspectorEmpty')}</span>
        </p>
        <StudioBackgroundSection spreadIndex={spreadIndex} page={page} source={source} t={t} />
        <ThemeSummary t={t} onOpenTheme={onOpenTheme} />
        <PageNumbersSection folios={page.pageNumbers} setPageNumbers={setPageNumbers} t={t} />
      </div>
    </aside>
  );
}
