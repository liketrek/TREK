import { useEffect, useMemo, useRef, useState } from 'react';

import { FEATURED_ICONS, iconComponent, iconLabel, searchIcons } from '../iconLibrary';
import { Shelf } from '../StudioPanelHead';
import { StudioSearch } from '../StudioSearch';

/**
 * The icon library, as the Icons tab of the Elements panel: a shelf of icons
 * for travel, then all fourteen hundred, and a search over their names.
 *
 * Fourteen hundred icons is fourteen hundred React components, each a
 * forwardRef around several SVG nodes, and rendering them all costs about a
 * second of blocked main thread on the first click of the tab, for a grid
 * whose first rows are all anybody sees. So it grows as it is scrolled, and a
 * search resets it: the results of a search are short, and starting them
 * part-drawn would be wrong.
 */

/** How many icons the grid draws at a time. Two screens' worth at three across. */
const ICON_PAGE = 120;

function IconCell({ name, onPick }: { name: string; onPick: (name: string) => void }) {
  const Icon = iconComponent(name);
  const label = iconLabel(name);
  return (
    <button
      type="button"
      className="st-shape-btn is-glyph"
      onClick={() => onPick(name)}
      aria-label={name}
      title={label}
    >
      <Icon strokeWidth={1.7} />
    </button>
  );
}

export function StudioIconShelf({ onPick, t }: { onPick: (name: string) => void; t: (k: string) => string }) {
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(ICON_PAGE);
  const tail = useRef<HTMLDivElement>(null);
  const matched = useMemo(() => searchIcons(query), [query]);
  const shown = useMemo(() => matched.slice(0, limit), [matched, limit]);

  /*
   * Grow the grid when its foot comes into view. An observer rather than a
   * scroll handler: the panel is the scroller, the foot is the thing that
   * matters, and asking the browser to say when they meet costs nothing.
   */
  useEffect(() => {
    const foot = tail.current;
    if (!foot) return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) setLimit((n) => n + ICON_PAGE);
    });
    io.observe(foot);
    return () => io.disconnect();
  }, [shown.length, matched.length]);

  const search = (value: string) => {
    setQuery(value);
    setLimit(ICON_PAGE);
  };

  return (
    <>
      <StudioSearch
        value={query}
        onChange={search}
        label={t('journey.studio.searchIcons')}
        clearLabel={t('common.clear')}
        count={matched.length}
      />
      <div className="st-panel-scroll">
        {/* The shelf, until somebody searches. */}
        {!query && (
          <Shelf label={t('journey.studio.iconsForTravel')}>
            <div className="st-shape-grid">
              {FEATURED_ICONS.map((name) => (
                <IconCell key={name} name={name} onPick={onPick} />
              ))}
            </div>
          </Shelf>
        )}
        <Shelf label={query ? undefined : t('journey.studio.iconsAll')}>
          <div className="st-shape-grid">
            {shown.map((name) => (
              <IconCell key={name} name={name} onPick={onPick} />
            ))}
          </div>
          {/* What the observer above watches for. */}
          {shown.length < matched.length && <div ref={tail} className="st-shelf-tail" />}
          {!matched.length && <p className="st-hint">{t('journey.studio.noMatches')}</p>}
        </Shelf>
      </div>
    </>
  );
}
