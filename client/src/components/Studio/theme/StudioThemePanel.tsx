import {
  BOOK_FONT_SLOTS,
  BOOK_PALETTE_KEYS,
  BOOK_THEME_DECORATIONS,
  BOOK_THEME_MOTIFS,
  BOOK_THEME_PRESETS,
  bookThemeOf,
  type BookFontSlot,
  type BookPaletteKey,
  type BookThemeFont,
  type BookThemePreset,
} from '@trek/shared';
import { Check, ImageIcon, RotateCcw } from 'lucide-react';
import { useMemo } from 'react';
import '../../../styles/studio-theme.css';
import { useToast } from '../../shared/Toast';
import { Choice, Line, Picks, Section, Switch } from '../StudioControls';
import { StudioFontPicker } from '../StudioFontPicker';
import { PanelHead, Shelf } from '../StudioPanelHead';
import type { StudioT } from '../StudioSidebar';
import { ThemeSheet } from './ThemeSheet';
import { useStudioTheme } from './useStudioTheme';

/**
 * The Theme section of the rail: twelve built-in looks, the palette, the
 * typefaces and the motifs of the one being put together, and applying it to
 * the book or to the page that is open.
 *
 * Nothing changes on the page until it is applied: picking a theme and
 * trying colours is a draft, so the panel can be played with freely, and an
 * apply is one undo step however many pages it recoloured.
 */

/** One built-in theme as a card: its paper, its display face in its ink, its three accents. */
function ThemeCard({
  preset,
  on,
  inUse,
  onPick,
  t,
}: {
  preset: BookThemePreset;
  on: boolean;
  inUse: boolean;
  onPick: () => void;
  t: StudioT;
}) {
  const display = useMemo(() => bookThemeOf(preset.id).fonts.display, [preset.id]);
  return (
    <button
      type="button"
      className={`st-theme-card ${on ? 'is-on' : ''}`}
      aria-pressed={on}
      onClick={onPick}
      title={t(preset.descrKey)}
    >
      <ThemeSheet palette={preset.palette} display={display} />
      <span className="st-theme-name">
        <span>{t(preset.labelKey)}</span>
        {inUse && (
          <span className="st-theme-inuse" title={t('studio.theme.inUse')} aria-label={t('studio.theme.inUse')}>
            <Check size={12} strokeWidth={2.6} />
          </span>
        )}
      </span>
    </button>
  );
}

/**
 * One palette entry: its colour, which is the picker, and its name. The three
 * accents share one name under them, so each shows its colour alone and says
 * its own name to a screen reader and on hover.
 */
function PaletteEntry({
  name,
  hex,
  onPick,
  t,
}: {
  name: BookPaletteKey;
  hex: string;
  onPick: (hex: string) => void;
  t: StudioT;
}) {
  const accent = name.startsWith('accent');
  const label = t(`studio.theme.token.${name}`);
  return (
    <label className="st-theme-colour" title={label}>
      <span className="st-theme-chip" style={{ background: hex }}>
        <input type="color" value={hex} aria-label={label} onChange={(e) => onPick(e.target.value)} />
      </span>
      {!accent && <span className="st-theme-colour-name">{label}</span>}
    </label>
  );
}

/** The script a theme falls back to when one is switched on: the handwriting most themes pair with. */
const DEFAULT_SCRIPT = 'caveat';

/**
 * One typeface slot, in the Studio's own font picker. The script can be
 * switched off, since a calm theme sets no handwriting at all.
 */
function FontSlot({
  slot,
  face,
  onPick,
  t,
}: {
  slot: BookFontSlot;
  face: BookThemeFont | null;
  onPick: (font: string | null, weight?: number) => void;
  t: StudioT;
}) {
  const label = t(`studio.theme.slot.${slot}`);
  const picker = face && (
    <StudioFontPicker font={face.font} weight={face.weight ?? 400} onPick={(p) => onPick(p.font, p.weight)} t={t} />
  );
  if (slot !== 'script')
    return (
      <Line label={label} wide>
        {picker}
      </Line>
    );
  return (
    <div className="st-theme-script">
      <Switch label={label} on={!!face} onToggle={() => onPick(face ? null : DEFAULT_SCRIPT)} />
      {picker ?? <p className="st-hint">{t('studio.theme.noScript')}</p>}
    </div>
  );
}

export function StudioThemePanel({ t }: { t: StudioT }) {
  const theme = useStudioTheme();
  const toast = useToast();
  const { draft } = theme;

  const apply = (scope: 'book' | 'page') => {
    const done = theme.apply(scope);
    if (!done) return;
    if (done.pages > 0) toast.success(t('studio.theme.applied'));
    else toast.info(t('studio.theme.nothing'));
  };

  const fromPhotos = async () => {
    if (!(await theme.fromPhotos())) toast.info(t('studio.theme.noPhotoColours'));
  };

  return (
    <>
      <PanelHead label={t('studio.theme.panel')} />
      <div className="st-panel-scroll st-theme">
        <p className="st-hint">{t('studio.theme.intro')}</p>

        <Shelf label={t('studio.theme.themes')}>
          <div className="st-theme-grid">
            {BOOK_THEME_PRESETS.map((preset) => (
              <ThemeCard
                key={preset.id}
                preset={preset}
                on={draft.id === preset.id}
                inUse={theme.current?.id === preset.id}
                onPick={() => theme.pick(preset.id)}
                t={t}
              />
            ))}
          </div>

          {theme.edited && (
            <button type="button" className="st-theme-reset" onClick={theme.reset}>
              <RotateCcw size={13} />
              {t('studio.theme.reset')}
            </button>
          )}
        </Shelf>

        <Section label={t('studio.theme.palette')}>
          <div className="st-theme-palette">
            {BOOK_PALETTE_KEYS.map((key) => (
              <PaletteEntry
                key={key}
                name={key}
                hex={draft.palette[key]}
                onPick={(hex) => theme.setColour(key, hex)}
                t={t}
              />
            ))}
            <span className="st-theme-colour-name st-theme-accents-name">{t('studio.theme.accents')}</span>
          </div>
          <button
            type="button"
            className="st-theme-photos"
            onClick={() => void fromPhotos()}
            disabled={!theme.hasPhotos || theme.reading}
          >
            <ImageIcon size={14} />
            {t('studio.theme.fromPhotos')}
          </button>
        </Section>

        <Section label={t('studio.theme.fonts')}>
          {BOOK_FONT_SLOTS.map((slot) => (
            <FontSlot
              key={slot}
              slot={slot}
              face={draft.fonts[slot]}
              onPick={(font, weight) => theme.setFont(slot, font, weight)}
              t={t}
            />
          ))}
        </Section>

        <Section label={t('studio.theme.motifs')} hint={t('studio.theme.motifsHint')} defaultOpen={false}>
          <Picks
            value={draft.motifs}
            options={BOOK_THEME_MOTIFS.map((m) => ({ value: m, label: t(`studio.theme.motif.${m}`) }))}
            onToggle={theme.toggleMotif}
          />
        </Section>

        <Section label={t('studio.theme.decoration')} defaultOpen={false}>
          <Choice
            value={draft.decoration}
            options={BOOK_THEME_DECORATIONS.map((d) => ({ value: d, label: t(`studio.theme.decoration.${d}`) }))}
            onPick={theme.setDecoration}
            ariaLabel={t('studio.theme.decoration')}
          />
        </Section>

        <div className="st-theme-apply">
          <Switch label={t('studio.theme.adopt')} on={theme.adopt} onToggle={() => theme.setAdopt(!theme.adopt)} />
          <p className="st-hint">{t('studio.theme.adoptHint')}</p>
          <button
            type="button"
            className="st-theme-btn is-primary"
            onClick={() => apply('book')}
            disabled={!theme.canApply}
          >
            {t('studio.theme.applyBook')}
          </button>
          <button type="button" className="st-theme-btn" onClick={() => apply('page')} disabled={!theme.canApply}>
            {t('studio.theme.applyPage')}
          </button>
        </div>
      </div>
    </>
  );
}
