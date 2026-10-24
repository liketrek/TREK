import type { BookElement, BookSpread, BookTextElement, BookTheme } from '@trek/shared';
import { MAX_BOOK_TEXT_SIZE, formatBookCoords } from '@trek/shared';
import { AlignCenter, AlignJustify, AlignLeft, AlignRight, Italic } from 'lucide-react';
import type { ReactNode } from 'react';

import { italicTitle } from '../fontPicker';
import { Choice, Line, NumField, Section } from '../StudioControls';
import { StudioFontPicker } from '../StudioFontPicker';
import type { JourneySource } from '../StudioSidebar';
import { Swatches } from '../StudioSwatches';
import { StudioTextEffects } from '../StudioTextEffects';
import { WeightLine } from '../StudioTypeControls';
import { StudioThemeLink } from '../theme/StudioThemeLink';

/**
 * The inspector of a text: its words first, then where it sits, then how it is
 * set (the typeface, its size and spacing, the alignment), its colour, and the
 * rarer settings folded under them: the case and the place of the lines in the
 * frame, and the effects. Each folded group opens on a text that uses it.
 */

type Set = (patch: Partial<BookElement>) => void;

const ALIGNS = [
  { value: 'left', icon: AlignLeft, labelKey: 'journey.studio.align.left' },
  { value: 'center', icon: AlignCenter, labelKey: 'journey.studio.align.center' },
  { value: 'right', icon: AlignRight, labelKey: 'journey.studio.align.right' },
  { value: 'justify', icon: AlignJustify, labelKey: 'journey.studio.align.justify' },
] as const;

/** What the text says, and for a bound coordinate, how the point is written. */
function TextContent({
  el,
  set,
  live,
  source,
  t,
}: {
  el: BookTextElement;
  set: Set;
  live: Set;
  source: JourneySource;
  t: (k: string) => string;
}) {
  const binding = el.binding;
  return (
    <Section label={t('journey.studio.text')}>
      <textarea
        className="st-input st-textarea"
        value={el.text}
        rows={5}
        aria-label={t('journey.studio.text')}
        onChange={(e) => live({ text: e.target.value, overridden: true })}
        onBlur={(e) => set({ text: e.target.value, overridden: true })}
      />
      {binding && !el.overridden && <p className="st-hint st-hint-after">{t('journey.studio.boundHint')}</p>}
      {/*
        How a point is set. Only a coordinate binding has the question, and
        answering it re-sets the words on the spot rather than at the next open.
        Deliberately not `overridden`: choosing a format is not writing the text.
      */}
      {binding?.source === 'entry.location' && binding.format && (
        <div className="st-section-gap">
          <Line label={t('journey.studio.coordsMark')}>
            <Choice
              value={binding.format}
              ariaLabel={t('journey.studio.coordsMark')}
              options={[
                { value: 'dms' as const, label: t('journey.studio.coordsDms') },
                { value: 'decimal' as const, label: t('journey.studio.coordsDecimal') },
              ]}
              onPick={(format) => {
                const entry = source.entries.find((e) => e.id === binding.entryId);
                const text =
                  entry?.lat != null && entry.lng != null ? formatBookCoords(entry.lat, entry.lng, format) : el.text;
                set({ binding: { ...binding, format }, text });
              }}
            />
          </Line>
        </div>
      )}
    </Section>
  );
}

/** How the words are set: each family set in itself, its weight, size, spacing and alignment. */
function TextType({ el, set, t }: { el: BookTextElement; set: Set; t: (k: string) => string }) {
  return (
    <Section label={t('journey.studio.typography')}>
      {/* Each family set in itself, because a list of names tells you nothing about a typeface. */}
      <StudioFontPicker font={el.font} weight={el.weight} onPick={(patch) => set(patch)} t={t} />
      <div className="st-section-gap">
        <WeightLine font={el.font} weight={el.weight} onPick={(weight) => set({ weight })} t={t} />
      </div>
      <div className="st-grid2 st-section-gap">
        <NumField
          label={t('journey.studio.size')}
          value={el.size}
          min={4}
          max={MAX_BOOK_TEXT_SIZE}
          step={0.5}
          unit="pt"
          onChange={(v) => set({ size: v })}
        />
        <NumField
          label={t('journey.studio.leading')}
          value={el.leading}
          min={0.7}
          max={3}
          step={0.05}
          onChange={(v) => set({ leading: v })}
        />
      </div>
      <div className="st-section-gap">
        <NumField
          label={t('journey.studio.tracking')}
          value={el.tracking}
          min={-0.2}
          max={1.5}
          step={0.01}
          unit="em"
          onChange={(v) => set({ tracking: v })}
        />
      </div>
      <div className="st-section-gap">
        <Line label={t('journey.studio.align')}>
          <div className="st-row">
            {ALIGNS.map(({ value, icon: Icon, labelKey }) => (
              <button
                type="button"
                key={value}
                className={`st-chip is-icon ${el.align === value ? 'is-on' : ''}`}
                onClick={() => set({ align: value })}
                aria-label={t(labelKey)}
                title={t(labelKey)}
                aria-pressed={el.align === value}
              >
                <Icon size={14} />
              </button>
            ))}
            {/* Italic sits with the alignment because both are things you do to a line rather than to a typeface. */}
            <button
              type="button"
              className={`st-chip is-icon ${el.italic ? 'is-on' : ''}`}
              onClick={() => set({ italic: !el.italic })}
              title={italicTitle(el.font, el.weight, t)}
              aria-label={t('journey.studio.italic')}
              aria-pressed={el.italic}
            >
              <Italic size={14} />
            </button>
          </div>
        </Line>
      </div>
    </Section>
  );
}

export function StudioTextInspector({
  el,
  set,
  live,
  source,
  spread,
  theme,
  position,
  t,
}: {
  el: BookTextElement;
  /** One undo step. */
  set: Set;
  /** A change while typing or dragging. */
  live: Set;
  source: JourneySource;
  spread: BookSpread | undefined;
  theme: BookTheme | undefined;
  /** The position and size group, which every kind places after what it is. */
  position: ReactNode;
  t: (k: string) => string;
}) {
  return (
    <>
      <TextContent el={el} set={set} live={live} source={source} t={t} />
      {position}
      <TextType el={el} set={set} t={t} />
      <Section label={t('journey.studio.colour')}>
        <Swatches value={el.color} onPick={(color) => set({ color })} />
        <StudioThemeLink
          theme={theme}
          token={el.token}
          t={t}
          onLink={(token, color) => set({ color, token })}
          onUnlink={() => set({ token: undefined })}
        />
      </Section>
      <StudioTextEffects el={el} set={set} live={live} photos={source.photos} spread={spread} t={t} />
    </>
  );
}
