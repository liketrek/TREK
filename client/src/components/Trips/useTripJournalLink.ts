import type { TripJournalCandidate, TripJournalLinkMember, TripJournalLinkRole } from '@trek/shared';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNetworkMode } from '../../hooks/useNetworkMode';
import { useTranslation } from '../../i18n';
import { tripJournalLinkRepo, TripJournalOfflineError, type OwnJournal } from '../../repo/tripJournalLinkRepo';
import { useAddonStore } from '../../store/addonStore';
import { useAuthStore } from '../../store/authStore';
import { useTripJournalLinkStore } from '../../store/tripJournalLinkStore';
import { useServerPing } from '../../sync/useServerPing';
import { useToast } from '../shared/Toast';

/** Who a link lets in, as the member list edits it: a role, or left out. */
export type JournalMemberChoice = Record<number, TripJournalLinkRole | null>;

/** One empty list for "the link holds nobody", so the member effect does not rerun on every render. */
const NOBODY: TripJournalLinkMember[] = [];

/** The status of a failed request, when the server gave one. */
function statusOf(err: unknown): number | undefined {
  return (err as { response?: { status?: number } })?.response?.status;
}

/**
 * The trip's linked journal as everybody on the trip reads it: answered once per
 * trip from the store, asked again on mount, when the connection returns and on
 * every `trip:journal:changed`. With the Journey addon off there is no journal.
 */
export function useTripJournal(tripId: number | null | undefined) {
  const addonsLoaded = useAddonStore((s) => s.loaded);
  const journeyOn = useAddonStore((s) => s.isEnabled('journey'));
  const answer = useTripJournalLinkStore((s) => (tripId != null ? s.byTrip[String(tripId)] : undefined));
  const refresh = useTripJournalLinkStore((s) => s.refresh);
  const { offline } = useNetworkMode();
  const active = journeyOn && tripId != null && !offline;
  const reload = useCallback(async () => {
    if (tripId != null) await refresh(tripId);
  }, [tripId, refresh]);

  useEffect(() => {
    if (active) void reload();
  }, [active, reload]);
  useServerPing('trip:journal:changed', active, reload);

  const link = journeyOn ? (answer?.link ?? null) : null;
  return {
    journeyOn,
    answer: journeyOn ? answer : undefined,
    link,
    /** The journal the trip's Journal tab opens: linked, and open to this person. */
    openJournalId: link?.my_role ? link.journey_id : null,
    /** Whether the answer is in, or none is coming (addon off, offline): the planner may drop the tab then. */
    settled: addonsLoaded && (!journeyOn || offline || answer !== undefined),
  };
}

/** Whether the trip's Settings carry a Journal section for this person, for laying the dialog out. */
export function useTripJournalSectionVisible(tripId: number): boolean {
  const { journeyOn, answer } = useTripJournal(tripId);
  return journeyOn && !!answer && (answer.can_link || !!answer.link);
}

/** The toast for a failed journal request: offline, refused, or anything else. */
function useJournalFailure() {
  const { t } = useTranslation();
  const toast = useToast();
  return useCallback(
    (err: unknown) => {
      if (err instanceof TripJournalOfflineError) toast.error(t('trip.journal.errorOffline'));
      else if (statusOf(err) === 403) toast.error(t('trip.journal.errorForbidden'));
      else toast.error(t('trip.journal.errorGeneric'));
    },
    [t, toast]
  );
}

/**
 * The people of the trip for one journal, each with the role the save would
 * give them. `current` is who the link holds now, to start from; without it
 * everybody starts as a reader, the default the section promises.
 *
 * What loaded is kept with the journal it belongs to, so picking another one
 * shows nothing until its own people are in, never the last journal's.
 */
function useJournalMemberChoice(
  tripId: number,
  journeyId: number | null,
  current: TripJournalLinkMember[] | null,
  fail: (err: unknown) => void
) {
  const [loaded, setLoaded] = useState<{ journeyId: number; list: TripJournalCandidate[] } | null>(null);
  const [choice, setChoice] = useState<JournalMemberChoice>({});

  useEffect(() => {
    if (journeyId == null) return;
    let cancelled = false;
    tripJournalLinkRepo
      .candidates(tripId, journeyId)
      .then((list) => {
        if (cancelled) return;
        const held = new Map((current ?? []).map((m) => [m.user_id, m.role]));
        setLoaded({ journeyId, list });
        setChoice(Object.fromEntries(list.map((c) => [c.user_id, current ? (held.get(c.user_id) ?? null) : 'viewer'])));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        fail(err);
        setLoaded({ journeyId, list: [] });
      });
    return () => {
      cancelled = true;
    };
  }, [tripId, journeyId, current, fail]);

  const candidates = journeyId != null && loaded?.journeyId === journeyId ? loaded.list : null;

  const setRole = useCallback((memberId: number, role: TripJournalLinkRole | null) => {
    setChoice((prev) => ({ ...prev, [memberId]: role }));
  }, []);

  const setAll = useCallback(
    (role: TripJournalLinkRole | null) =>
      setChoice(Object.fromEntries((candidates ?? []).map((c) => [c.user_id, role]))),
    [candidates]
  );

  const chosenMembers = useMemo(
    () => Object.entries(choice).flatMap(([id, role]) => (role ? [{ user_id: Number(id), role }] : [])),
    [choice]
  );

  /** The people the save would let into the journal for the first time; the warning names them. */
  const newlyGranted = useMemo(
    () => (candidates ?? []).filter((c) => c.access === null && choice[c.user_id]),
    [candidates, choice]
  );

  return { candidates, choice, setRole, setAll, chosenMembers, newlyGranted };
}

/**
 * The Journal section of the trip's Settings: link one of your journals, choose
 * who it is open to and as what, change it, or take it off. One hook for the
 * desktop dialog and the phone sheet, so both offer and warn about the same thing.
 *
 * Picking a journal asks the server who of the trip already has access to it;
 * whoever would be let in for the first time is named before anything is saved,
 * because they will see the journal in their own Journey list from then on.
 */
export function useTripJournalLink(tripId: number) {
  const { t } = useTranslation();
  const toast = useToast();
  const fail = useJournalFailure();
  const userId = useAuthStore((s) => s.user?.id ?? null);
  const { journeyOn, answer, link } = useTripJournal(tripId);
  const store = useTripJournalLinkStore.getState;

  /** 'view' shows the link; 'pick' chooses a journal; 'members' changes who it is open to. */
  const [mode, setMode] = useState<'view' | 'pick' | 'members'>('view');
  const [journals, setJournals] = useState<OwnJournal[] | null>(null);
  const [pickedId, setPickedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const journeyId = mode === 'members' ? (link?.journey_id ?? null) : mode === 'pick' ? pickedId : null;
  // Who the link holds, to start from: when editing it, or when re-picking the
  // journal it already shows with people on it.
  const held = link?.members ?? NOBODY;
  const current = mode === 'members' || (link?.journey_id === pickedId && held.length > 0) ? held : null;
  const members = useJournalMemberChoice(tripId, journeyId, current, fail);
  const { chosenMembers } = members;

  const startPick = useCallback(() => {
    setMode('pick');
    setPickedId(null);
    if (userId == null) return;
    tripJournalLinkRepo
      .ownJournals(userId)
      .then(setJournals)
      .catch((err: unknown) => {
        fail(err);
        setJournals([]);
      });
  }, [userId, fail]);

  const editMembers = useCallback(() => setMode('members'), []);

  const cancel = useCallback(() => {
    setMode('view');
    setPickedId(null);
  }, []);

  const run = useCallback(
    async (write: () => Promise<void>, done: string) => {
      setBusy(true);
      try {
        await write();
        toast.success(done);
        cancel();
      } catch (err: unknown) {
        fail(err);
      } finally {
        setBusy(false);
      }
    },
    [cancel, fail, toast]
  );

  const save = useCallback(async () => {
    if (mode === 'pick' && pickedId != null) {
      await run(() => store().link(tripId, pickedId, chosenMembers), t('trip.journal.linked'));
    } else if (mode === 'members') {
      await run(() => store().setMembers(tripId, chosenMembers), t('trip.journal.membersSaved'));
    }
  }, [mode, pickedId, run, store, tripId, chosenMembers, t]);

  const unlink = useCallback(async () => {
    await run(() => store().unlink(tripId), t('trip.journal.unlinked'));
  }, [run, store, tripId, t]);

  return {
    /** The section shows at all: the addon is on and this person may link, or the trip has a journal they see. */
    visible: journeyOn && !!answer && (answer.can_link || !!answer.link),
    link,
    canLink: !!answer?.can_link,
    canUnlink: !!answer?.can_unlink,
    canEditMembers: !!answer?.can_edit_members,
    mode,
    startPick,
    cancel,
    editMembers,
    journals,
    pickedId,
    pickJournal: setPickedId,
    candidates: members.candidates,
    choice: members.choice,
    setRole: members.setRole,
    setAll: members.setAll,
    newlyGranted: members.newlyGranted,
    canSave: !busy && (mode === 'members' || (mode === 'pick' && pickedId != null)),
    busy,
    save,
    unlink,
  };
}
