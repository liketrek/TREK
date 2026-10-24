import { Fragment, useRef, type KeyboardEvent } from 'react';

import '../../../styles/studio-panels.css';
import { rovingTarget } from '../studioRoving';
import { RAIL_IDS, RAIL_SECTIONS, type RailSection } from './railSections';

/**
 * The rail down the side of Studio: one tab per section, each an icon over its
 * name.
 *
 * A list of tabs to a screen reader and to the keyboard, as it is to the eye:
 * Tab reaches the open section, the arrows move up and down the rail, Home and
 * End jump to its ends, and Enter or Space opens a section (studioRoving.ts).
 * A name longer than the rail is wide wraps onto a second line and breaks
 * inside a word only when the word alone is wider than the rail; the title
 * carries it whole either way.
 */
export function StudioRail({
  section,
  onSection,
  t,
}: {
  section: RailSection;
  onSection: (id: RailSection) => void;
  t: (k: string) => string;
}) {
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const next = rovingTarget(e.key, index, RAIL_SECTIONS.length, { vertical: true, rtl: false });
    if (next === null) return;
    e.preventDefault();
    tabs.current[next]?.focus();
  };

  return (
    <div className="st-rail">
      <div
        className="st-rail-tabs"
        role="tablist"
        aria-orientation="vertical"
        aria-label={t('journey.studio.sections')}
      >
        {RAIL_SECTIONS.map((entry, i) => {
          const on = entry.id === section;
          const label = t(entry.labelKey);
          const Icon = entry.icon;
          return (
            <Fragment key={entry.id}>
              {entry.startsGroup && <span className="st-rail-sep" aria-hidden />}
              <button
                type="button"
                role="tab"
                id={RAIL_IDS.tab(entry.id)}
                aria-selected={on}
                aria-controls={RAIL_IDS.panel}
                tabIndex={on ? 0 : -1}
                className={`st-rail-btn ${on ? 'is-on' : ''}`}
                ref={(el) => {
                  tabs.current[i] = el;
                }}
                onClick={() => onSection(entry.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                title={label}
                aria-label={label}
              >
                <Icon size={18} strokeWidth={1.7} aria-hidden />
                <span className="st-rail-label" aria-hidden>
                  {label}
                </span>
              </button>
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
