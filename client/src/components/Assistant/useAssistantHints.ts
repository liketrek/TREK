import type { AssistantFocus } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useTranslation } from '../../i18n';
import { accommodationRepo } from '../../repo/accommodationRepo';
import { useAssistantHintsStore } from '../../store/assistantHintsStore';
import { useAssistantStore } from '../../store/assistantStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useTripStore } from '../../store/tripStore';
import type { Accommodation } from '../../types';
import { dayLabel } from '../../utils/dayLabel';
import { localIsoDate } from '../../utils/localDate';
import { useToast } from '../shared/Toast';
import { type AssistantHint, type HintRule, tripHints } from './assistantHintRules';
import { tripPhase } from './assistantModel';

export interface ReadyHint {
  id: string;
  rule: HintRule;
  level: AssistantHint['level'];
  /** The line in the list. */
  text: string;
  /** The question a tap sends. */
  prompt: string;
  focus: AssistantFocus | null;
}

export interface AssistantHintsView {
  /** The hints not dismissed, worded, warnings first. */
  hints: ReadyHint[];
  /** Warnings the user has not been shown yet: what the launcher points at. */
  unseenWarn: number;
  markSeen: (ids: readonly string[]) => void;
  /** Counts every current warning as seen, as when the chat is opened. */
  markWarnsSeen: () => void;
  dismiss: (id: string) => void;
  /** Puts the hint's day or places in focus and sends its question. */
  ask: (hint: ReadyHint) => void;
}

/**
 * The trip's stays, which the planner keeps to itself, read through the
 * offline core for the night rule. Read again when the days or bookings
 * change, since a hotel booking moves its stay. Null while not known, and
 * when they cannot be read, which keeps that rule quiet.
 */
function useTripStays(tripId: number | null, days: unknown, reservations: unknown): Accommodation[] | null {
  const [stays, setStays] = useState<{ tripId: number; list: Accommodation[] } | null>(null);
  useEffect(() => {
    if (tripId === null) return;
    let cancelled = false;
    const read = async () => {
      try {
        const { accommodations } = await accommodationRepo.list(tripId);
        if (!cancelled) setStays({ tripId, list: accommodations });
      } catch {
        // Stays that cannot be read are not known: no word about nights rather than a wrong one.
        if (!cancelled) setStays(null);
      }
    };
    void read();
    return () => {
      cancelled = true;
    };
  }, [tripId, days, reservations]);
  return stays && stays.tripId === tripId ? stays.list : null;
}

/** The planner's data for this trip, or null when the planner holds another trip or none. */
function useTripPlan(tripId: number | null) {
  return useTripStore(
    useShallow((s) =>
      s.trip && s.trip.id === tripId
        ? {
            trip: s.trip,
            days: s.days,
            places: s.places,
            assignments: s.assignments,
            reservations: s.reservations,
            dayNotes: s.dayNotes,
          }
        : null
    )
  );
}

/**
 * The plan hints for a trip, worded and ready, with what the user did with
 * them. Nothing while the assistant cannot run, the user turned hints off,
 * the planner does not hold this trip, or the trip is over or still empty.
 * `withStays` reads the stays as well, for the night rule; only the empty
 * chat asks for that, so the launcher and the phone's tile cost no request.
 */
export function useAssistantHints(tripId: number | null, { withStays }: { withStays: boolean }): AssistantHintsView {
  const { t, locale } = useTranslation();
  const available = useAssistantStore((s) => s.status?.available === true);
  const setFocus = useAssistantStore((s) => s.setFocus);
  const send = useAssistantStore((s) => s.send);
  const on = useSettingsStore((s) => s.settings.assistant_hints !== false);
  const distanceUnit = useSettingsStore((s) => s.settings.distance_unit ?? 'metric');
  const is12h = useSettingsStore((s) => s.settings.time_format === '12h');
  const plan = useTripPlan(tripId);
  const today = localIsoDate();

  const phase = plan
    ? tripPhase({
        startDate: plan.trip.start_date ?? null,
        endDate: plan.trip.end_date ?? null,
        hasPlaces: plan.places.length > 0,
        today,
      })
    : null;
  const active = available && on && (phase === 'upcoming' || phase === 'running');
  const stays = useTripStays(withStays && active ? tripId : null, plan?.days, plan?.reservations);

  const marks = useAssistantHintsStore((s) => (tripId === null ? undefined : s.byTrip[tripId]));
  const load = useAssistantHintsStore((s) => s.load);
  const storeDismiss = useAssistantHintsStore((s) => s.dismiss);
  const storeMarkSeen = useAssistantHintsStore((s) => s.markSeen);
  useEffect(() => {
    if (tripId !== null) load(tripId);
  }, [tripId, load]);

  const raw = useMemo(
    () =>
      active && plan
        ? tripHints({ today, ...plan, accommodations: withStays ? stays : null, distanceUnit, is12h })
        : [],
    [active, plan, today, withStays, stays, distanceUnit, is12h]
  );

  // Until the marks are read, a dismissed hint would flash back for a frame: show none instead.
  const hints = useMemo((): ReadyHint[] => {
    if (!marks || !plan) return [];
    return raw
      .filter((h) => !marks.dismissed.includes(h.id))
      .map((h) => {
        const index = h.dayId === null ? -1 : plan.days.findIndex((d) => d.id === h.dayId);
        const params = index < 0 ? h.params : { ...h.params, day: dayLabel(plan.days[index], index, t, locale) };
        return {
          id: h.id,
          rule: h.rule,
          level: h.level,
          text: t(h.textKey, params),
          prompt: t(h.promptKey, params),
          focus: h.focus,
        };
      });
  }, [raw, marks, plan, t, locale]);

  const unseen = useMemo(
    () => (marks ? hints.filter((h) => h.level === 'warn' && !marks.seen.includes(h.id)).map((h) => h.id) : []),
    [hints, marks]
  );

  const markSeen = useCallback(
    (ids: readonly string[]) => {
      if (tripId !== null && ids.length > 0) storeMarkSeen(tripId, ids);
    },
    [tripId, storeMarkSeen]
  );

  return {
    hints,
    unseenWarn: unseen.length,
    markSeen,
    markWarnsSeen: () => markSeen(unseen),
    dismiss: (id) => {
      if (tripId !== null) storeDismiss(tripId, id);
    },
    ask: (hint) => {
      if (tripId === null) return;
      // A hint about the trip as a whole leaves the focus the user had.
      if (hint.focus) setFocus(tripId, hint.focus);
      void send(tripId, hint.prompt);
    },
  };
}

/** The menu switch for the hints, in the window's menu and the phone's. On unless turned off. */
export function useAssistantHintsSetting(): { on: boolean; toggle: () => void } {
  const on = useSettingsStore((s) => s.settings.assistant_hints !== false);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const toast = useToast();
  const { t } = useTranslation();
  return {
    on,
    toggle: () => {
      updateSetting('assistant_hints', !on).catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : t('common.error'))
      );
    },
  };
}
