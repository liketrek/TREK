import { useState } from 'react';

type Translate = (key: string, params?: Record<string, string | number>) => string;

export type PlaceTextField = 'description' | 'notes' | 'assignment_notes';

interface PlaceTextTab {
  field: PlaceTextField;
  /** The tab's own short name. */
  label: string;
  /** The field's name for a screen reader, the one it always had. */
  aria: string;
  /** Where the text shows up, under the tabs. */
  hint: string;
  value: string;
  /** Rendered as Markdown where it is shown, so the desktop offers the formatting bar. */
  markdown: boolean;
  maxLength?: number;
}

interface PlaceTextTabsOptions {
  description: string;
  notes: string;
  /** null when no single day-assignment is in context. */
  dayNotes: string | null;
  /** The day that visit is on, to name the tab after it ("Only day 3"). */
  dayNumber?: number | null;
  t: Translate;
}

/**
 * The place form's three texts as tabs: what the place is, notes on it, and the
 * note for one day's visit, which is only there when the form edits one visit.
 * The one logic path behind the desktop card and the phone sheet; each draws its
 * own tabs and field over it.
 */
export function usePlaceTextTabs({ description, notes, dayNotes, dayNumber = null, t }: PlaceTextTabsOptions) {
  const [active, setActive] = useState<PlaceTextField>('description');
  const tabs: PlaceTextTab[] = [
    {
      field: 'description',
      label: t('places.notesTabAbout'),
      aria: t('places.formDescription'),
      hint: t('places.notesHintDescription'),
      value: description,
      markdown: true,
    },
    {
      field: 'notes',
      label: t('places.formNotes'),
      aria: t('places.formNotes'),
      hint: t('places.notesHintNotes'),
      value: notes,
      markdown: true,
      maxLength: 2000,
    },
  ];
  if (dayNotes !== null) {
    tabs.push({
      field: 'assignment_notes',
      label: dayNumber ? t('places.notesTabDayN', { day: dayNumber }) : t('places.notesTabDay'),
      aria: t('places.assignmentNotes'),
      hint: t('places.notesHintDay'),
      value: dayNotes,
      markdown: false,
    });
  }
  // The day tab can go away under an open form (the visit is removed elsewhere).
  const shown = tabs.find((tab) => tab.field === active) ?? tabs[0];
  return { tabs, shown, setActive };
}
