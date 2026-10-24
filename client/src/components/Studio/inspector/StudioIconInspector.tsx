import type { BookElement, BookIconElement, BookTheme } from '@trek/shared';
import { useMemo, useState, type ReactNode } from 'react';

import { iconComponent, iconLabel, searchIcons } from '../iconLibrary';
import { NumField, Section } from '../StudioControls';
import { StudioSearch } from '../StudioSearch';
import { Swatches } from '../StudioSwatches';
import { StudioThemeLink } from '../theme/StudioThemeLink';

/** How many icons the swap grid offers at once. A search narrows it below this. */
const ICON_CHOICES = 60;

/**
 * The inspector of an icon: the drawing first, swapped from a search of the
 * library, then where it sits, then its colour and the weight of its line.
 *
 * A search rather than the whole library: the inspector is a column beside a
 * page, and its job here is swapping one drawing for a near neighbour. Swapping
 * keeps the position, size and colour that deleting and re-placing would lose.
 */
export function StudioIconInspector({
  el,
  theme,
  set,
  position,
  t,
}: {
  el: BookIconElement;
  theme: BookTheme | undefined;
  set: (patch: Partial<BookElement>) => void;
  position: ReactNode;
  t: (k: string) => string;
}) {
  const [query, setQuery] = useState('');
  // A page of results, memoised: the inspector re-renders on every pointer move of a drag.
  const choices = useMemo(() => searchIcons(query).slice(0, ICON_CHOICES), [query]);
  return (
    <>
      <Section label={t('journey.studio.icon')}>
        <StudioSearch
          value={query}
          onChange={setQuery}
          label={t('journey.studio.searchIcons')}
          clearLabel={t('common.clear')}
        />
        <div className="st-mini-shapes">
          {choices.map((name) => {
            const Glyph = iconComponent(name);
            return (
              <button
                type="button"
                key={name}
                className={`st-mini-shape ${el.name === name ? 'is-on' : ''}`}
                onClick={() => set({ name })}
                aria-label={name}
                aria-pressed={el.name === name}
                title={iconLabel(name)}
              >
                <Glyph strokeWidth={1.7} />
              </button>
            );
          })}
        </div>
        {!choices.length && <p className="st-hint">{t('journey.studio.noMatches')}</p>}
      </Section>

      {position}

      <Section label={t('journey.studio.look')}>
        <Swatches value={el.color} onPick={(color) => set({ color })} />
        <StudioThemeLink
          theme={theme}
          token={el.token}
          t={t}
          onLink={(token, color) => set({ color, token })}
          onUnlink={() => set({ token: undefined })}
        />
        <div className="st-section-gap">
          <NumField
            label={t('journey.studio.lineWidth')}
            value={el.lineWidth}
            min={0.25}
            max={4}
            step={0.25}
            onChange={(v) => set({ lineWidth: v })}
          />
        </div>
      </Section>
    </>
  );
}
