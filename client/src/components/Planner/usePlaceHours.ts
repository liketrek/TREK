import type { PlaceClientOrigin, PlaceOpeningHours } from '@trek/shared';
import { useEffect, useRef, useState } from 'react';

import { ALL_DAY, cleanWeek, isAllDay, readWeek, writeWeek } from './placeHours';

interface PlaceHoursOptions {
  /** The stored hours text (JSON), empty when the place has none of its own. */
  openingHours: string;
  /** `origin` is set when the hours were taken over from the details lookup rather than typed. */
  onChange: (value: string, origin?: PlaceClientOrigin) => void;
  /**
   * The hours the place details looked up, as a week. A place without hours of
   * its own takes them over on its own; one that has some can take them over
   * on request (takeOver).
   */
  suggestedHours?: PlaceOpeningHours | null;
}

/**
 * The opening hours of the place form (#2472): the one logic path behind the
 * desktop dialog and the phone sheet, which draw their own rows over it. It
 * keeps the editor's own draft, so a half-typed time ("09:3") stays on screen
 * while only finished times reach the place, folds the week away until someone
 * wants it, and switches a day closed or open around the clock.
 */
export function usePlaceHours({ openingHours, onChange, suggestedHours }: PlaceHoursOptions) {
  const [week, setDraft] = useState(() => readWeek(openingHours));
  const written = useRef(openingHours);
  const [editing, setEditing] = useState(() => openingHours !== '');

  // A value from outside (a picked search result, a reopened place) replaces the draft.
  useEffect(() => {
    if (openingHours === written.current) return;
    written.current = openingHours;
    setDraft(readWeek(openingHours));
    if (openingHours) setEditing(true);
  }, [openingHours]);

  const setWeek = (next: PlaceOpeningHours, origin?: PlaceClientOrigin) => {
    setDraft(next);
    const text = writeWeek(cleanWeek(next));
    written.current = text;
    onChange(text, origin);
  };
  const setDay = (i: number, patch: Partial<PlaceOpeningHours[number]>) =>
    setWeek(week.map((day, d) => (d === i ? { ...day, ...patch } : day)));
  const toggleClosed = (i: number) =>
    setDay(i, week[i].closed ? { closed: false } : { closed: true, open: undefined, close: undefined });
  const toggleAllDay = (i: number) =>
    setDay(i, isAllDay(week[i]) ? { open: undefined, close: undefined } : { closed: false, ...ALL_DAY });
  const copyFirstToAll = () => setWeek(week.map(() => ({ ...week[0] })));
  const clearHours = () => {
    setWeek(readWeek(''));
    setEditing(false);
  };

  // Looked-up hours are taken over by a place that has none yet, once per lookup.
  const adopted = useRef<PlaceOpeningHours | null>(null);
  useEffect(() => {
    if (!suggestedHours || adopted.current === suggestedHours) return;
    adopted.current = suggestedHours;
    if (written.current) return;
    setWeek(suggestedHours, 'enrichment');
    setEditing(true);
    // setWeek only reads refs and setters; the lookup is the trigger.
  }, [suggestedHours]);
  const canTakeOver = !!suggestedHours && writeWeek(suggestedHours) !== writeWeek(cleanWeek(week));
  const takeOver = () => {
    if (suggestedHours) setWeek(suggestedHours, 'enrichment');
  };

  return {
    week,
    editing,
    setEditing,
    setDay,
    toggleClosed,
    toggleAllDay,
    copyFirstToAll,
    clearHours,
    canTakeOver,
    takeOver,
  };
}
