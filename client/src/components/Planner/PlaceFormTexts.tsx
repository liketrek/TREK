import { CalendarDays, Info, StickyNote } from 'lucide-react';
import { useRef, type ReactNode } from 'react';

import { fs } from '../shared/DialogShell';
import NoteFormatToolbar from '../shared/NoteFormatToolbar';
import { PANEL, Segmented } from '../shared/dialogParts';
import { usePlaceTextTabs, type PlaceTextField } from './usePlaceTextTabs';

type Translate = (key: string, params?: Record<string, string | number>) => string;

/** The desktop draws each tab with an icon; the phone keeps to the words. */
const ICONS: Record<PlaceTextField, ReactNode> = {
  description: <Info size={13} strokeWidth={2} />,
  notes: <StickyNote size={13} strokeWidth={2} />,
  assignment_notes: <CalendarDays size={13} strokeWidth={2} />,
};

const DOT = 'h-1.5 w-1.5 flex-none rounded-full bg-current opacity-60';
/** The field's frame, holding the text and, under it, the formatting bar, like a message composer. */
const FIELD_BOX =
  'overflow-hidden rounded-[10px] border border-edge bg-surface-input focus-within:ring-2 focus-within:ring-[color:var(--text-primary)]';
const BARE_TEXTAREA =
  'block w-full min-w-0 resize-y border-0 bg-transparent px-3 py-2 text-[length:calc(13px*var(--fs-scale-body,1))] leading-normal text-content outline-none placeholder:text-content-faint';
const FIELD_BAR = 'flex items-center justify-end border-t border-edge-faint px-1.5 py-0.5';

/**
 * The place's three texts in one card: what the place is, notes on it, and the
 * note for this day's visit. A switch on top picks the one to write; the others
 * stay mounted and only hidden, so each keeps its caret and undo history, and a
 * dot marks a tab that already holds text. The day tab is there only when the
 * form edits one day-assignment.
 */
export function PlaceFormTexts({
  fieldId,
  description,
  notes,
  dayNotes,
  dayNumber = null,
  onChange,
  t,
}: {
  fieldId: string;
  description: string;
  notes: string;
  /** null when no single day-assignment is in context. */
  dayNotes: string | null;
  /** The day that visit is on, to name the tab after it ("Only day 3"). */
  dayNumber?: number | null;
  onChange: (field: PlaceTextField, value: string) => void;
  t: Translate;
}) {
  const { tabs, shown, setActive } = usePlaceTextTabs({ description, notes, dayNotes, dayNumber, t });
  const refs = {
    description: useRef<HTMLTextAreaElement | null>(null),
    notes: useRef<HTMLTextAreaElement | null>(null),
    assignment_notes: useRef<HTMLTextAreaElement | null>(null),
  };

  return (
    <div className={PANEL}>
      <Segmented<PlaceTextField>
        fill
        value={shown.field}
        onChange={setActive}
        label={t('places.notesKind')}
        options={tabs.map((tab) => ({
          value: tab.field,
          label: tab.value.trim() ? (
            <>
              {tab.label}
              <span aria-hidden="true" className={DOT} />
            </>
          ) : (
            tab.label
          ),
          icon: (
            <span aria-hidden="true" className="flex">
              {ICONS[tab.field]}
            </span>
          ),
        }))}
      />
      {tabs.map((tab) => (
        <p
          key={tab.field}
          id={`${fieldId}-${tab.field}-hint`}
          hidden={tab.field !== shown.field}
          className="m-0 -mb-1 leading-snug text-content-muted"
          style={fs(11)}
        >
          {tab.hint}
        </p>
      ))}
      {/* The box hides, not the field: the field's own `block` class would win over `hidden`. */}
      {tabs.map((tab) => (
        <div key={tab.field} hidden={tab.field !== shown.field} className={FIELD_BOX}>
          <textarea
            id={`${fieldId}-${tab.field}`}
            ref={refs[tab.field]}
            aria-label={tab.aria}
            aria-describedby={`${fieldId}-${tab.field}-hint`}
            value={tab.value}
            onChange={(e) => onChange(tab.field, e.target.value)}
            rows={3}
            maxLength={tab.maxLength}
            className={BARE_TEXTAREA}
          />
          {tab.markdown && (
            <div className={FIELD_BAR}>
              <NoteFormatToolbar
                textareaRef={refs[tab.field]}
                onChange={(v) => onChange(tab.field, v)}
                compact
                customTooltips
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
