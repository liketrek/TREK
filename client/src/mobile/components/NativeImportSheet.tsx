/**
 * NativeImportSheet: something was shared to TREK (native/sharedFiles.ts), so this
 * asks which trip it belongs to and opens that trip's booking import with the file
 * already chosen. Trips still ahead come first, the ones that ended after.
 *
 * A web page or a link is asked about first: kept among the trip's links
 * (Collaboration, Links), or read as a booking. A bare link, whose page the phone
 * could not read, can only be kept; with Collaboration off, a page can only be read.
 * Collaboration counts per trip: a link goes only to a trip that has it on.
 * A map link (Google Maps, Amap) can also become a place of the
 * trip (#2582): the trip's new place sheet opens and looks the link up.
 */
import { ChevronRight, FileText, Link2, MapPin, ScanText } from 'lucide-react';
import React, { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useShallow } from 'zustand/react/shallow';
import { isMapUrl } from '../../components/Planner/PlaceFormModal.helpers';
import { useToast } from '../../components/shared/Toast';
import { useTranslation } from '../../i18n';
import { saveSharedLink, useSharedImportStore, type SharedLink } from '../../native/sharedFiles';
import { tripRepo } from '../../repo/tripRepo';
import { useAddonStore } from '../../store/addonStore';
import { tripAddonsEntry, useTripAddonsStore } from '../../store/tripAddonsStore';
import { getApiErrorMessage } from '../../utils/apiError';
import { offlineOr } from '../../utils/needsConnection';
import { tripAddonEnabled } from '../../utils/tripAddons';
import { TileHeader } from '../screens/trip/sheets/MTripSheetUi';
import MSheet from './MSheet';

interface TripRow {
  id: number;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
}

type LinkChoice = 'link' | 'booking' | 'place';

/**
 * What to offer for a shared link: a place first when it points at a map, the links
 * when Collaboration is on, the import when there is a page to read.
 */
function linkChoicesOf(file: File, collabOn: boolean, url: string): LinkChoice[] {
  const choices: LinkChoice[] = [];
  if (isMapUrl(url)) choices.push('place');
  if (collabOn) choices.push('link');
  if (file.type !== 'text/uri-list') choices.push('booking');
  return choices;
}

interface StageInput {
  file: File | null;
  link: SharedLink | null;
  collabOn: boolean;
  picked: LinkChoice | null;
  /** The share sheet's trip could not take the link: the trips are offered after all. */
  presetFailed: boolean;
  /** Whether the trips and their Collaboration are read, so what a link may be for is known. */
  settled: boolean;
}

/** Where the sheet stands for the shared item: what it asks, and what a tap on a trip does. */
function stageOf({ file, link, collabOn, picked, presetFailed, settled }: StageInput) {
  const none: LinkChoice[] = [];
  if (!file || !link)
    return { choice: 'booking' as LinkChoice | null, asking: false, nowhere: false, choices: none, showTrips: true };
  if (!settled) return { choice: null, asking: false, nowhere: false, choices: none, showTrips: false };
  const choices = linkChoicesOf(file, collabOn, link.url);
  const choice = picked ?? (choices.length === 1 ? choices[0] : null);
  const asking = choice == null && choices.length > 1;
  const nowhere = choices.length === 0;
  // While the share sheet's trip takes the link there is nothing to choose.
  const presetTakes = link.presetTripId != null && choice === 'link' && !presetFailed;
  return { choice, asking, nowhere, choices, showTrips: !asking && !nowhere && !presetTakes };
}

function sheetTitle(t: (key: string) => string, asking: boolean, choice: LinkChoice | null): string {
  if (asking) return t('native.share.linkTitle');
  if (choice === 'place') return t('native.share.placeTrip');
  return choice === 'link' ? t('native.share.linkTrip') : t('native.share.title');
}

const NO_TRIPS: TripRow[] = [];

/** The trips to choose from, those still ahead first, and whether they are read yet. */
function useTripRows(open: boolean): { trips: TripRow[]; loaded: boolean } {
  const [rows, setRows] = useState<{ trips: TripRow[]; loaded: boolean }>({ trips: NO_TRIPS, loaded: false });
  useEffect(() => {
    if (!open) return;
    let live = true;
    tripRepo.list().then(
      (data: { trips?: TripRow[] }) => {
        const today = new Date().toISOString().slice(0, 10);
        const list = [...(data.trips ?? [])];
        const ahead = (trip: TripRow) => (trip.end_date ?? '9999') >= today;
        list.sort(
          (a, b) => Number(ahead(b)) - Number(ahead(a)) || (a.start_date ?? '').localeCompare(b.start_date ?? '')
        );
        if (live) setRows({ trips: list, loaded: true });
      },
      () => {
        if (live) setRows({ trips: NO_TRIPS, loaded: true });
      }
    );
    return () => {
      live = false;
      setRows({ trips: NO_TRIPS, loaded: false });
    };
  }, [open]);
  return rows;
}

const NOTHING_READ: ReadonlySet<number> = new Set();

/**
 * The trips a shared link may go to: those with Collaboration on, each by its
 * own list (the owner's choice, else the instance switch). Every trip's list is
 * read again once the sheet opens for a link, since a change made on a trip that
 * is not open here never reaches this device, so a trip that switched
 * Collaboration on is offered while the instance has it off, and one that
 * switched it off is not. `settled` once each of those reads answered or failed;
 * a later reload, a sync say, keeps the list held meanwhile and settles nothing again.
 */
function useCollabTrips(trips: TripRow[], active: boolean): { collabTrips: TripRow[]; settled: boolean } {
  const instanceOn = useAddonStore((s) => s.isEnabled('collab'));
  const load = useTripAddonsStore((s) => s.load);
  const [read, setRead] = useState(NOTHING_READ);
  useEffect(() => {
    if (!active) return;
    let live = true;
    trips.forEach((trip) => {
      void load(trip.id).then(() => {
        if (live) setRead((done) => new Set(done).add(trip.id));
      });
    });
    return () => {
      live = false;
      setRead(NOTHING_READ);
    };
  }, [active, trips, load]);
  const states = useTripAddonsStore(
    useShallow((state) =>
      trips.map((trip) => {
        if (!read.has(trip.id)) return 'waiting';
        return tripAddonEnabled(tripAddonsEntry(state, trip.id)?.addons, 'collab', instanceOn) ? 'on' : 'off';
      })
    )
  );
  return {
    collabTrips: trips.filter((_trip, i) => states[i] === 'on'),
    settled: states.every((state) => state !== 'waiting'),
  };
}

export default function NativeImportSheet(): React.ReactElement | null {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const file = useSharedImportStore((s) => s.file);
  const tripId = useSharedImportStore((s) => s.tripId);
  const link = useSharedImportStore((s) => s.link);
  const chooseTrip = useSharedImportStore((s) => s.chooseTrip);
  const choosePlaceTrip = useSharedImportStore((s) => s.choosePlaceTrip);
  const setFile = useSharedImportStore((s) => s.setFile);
  const instanceCollab = useAddonStore((s) => s.isEnabled('collab'));
  const open = !!file && tripId == null;
  const { trips, loaded: tripsLoaded } = useTripRows(open);
  const { collabTrips, settled } = useCollabTrips(trips, open && !!link);
  // Without a trip of its own to ask, the instance switch decides, as it always did.
  const collabOn = trips.length === 0 ? instanceCollab : collabTrips.length > 0;
  // Both belong to the item they were made for, so a newly shared one starts afresh.
  const [pick, setPick] = useState<{ file: File; choice: LinkChoice } | null>(null);
  const [failedFile, setFailedFile] = useState<File | null>(null);
  // The save in flight, kept off the state: it guards a second tap, it is not shown.
  const savingRef = useRef<File | null>(null);
  const picked = pick && pick.file === file ? pick.choice : null;
  const { choice, asking, nowhere, choices, showTrips } = stageOf({
    file,
    link,
    collabOn,
    picked,
    presetFailed: failedFile != null && failedFile === file,
    settled: tripsLoaded && settled,
  });

  // Once a trip is picked (here, or in the share sheet before the app opened), go to
  // it; its planner opens the booking import with the file (MTripShell).
  useEffect(() => {
    if (!file || tripId == null || pathname.startsWith(`/trips/${tripId}`)) return;
    void navigate(`/trips/${tripId}`);
  }, [file, tripId, pathname, navigate]);

  const saveLink = (id: number) => {
    if (!link || !file || savingRef.current === file) return;
    savingRef.current = file;
    saveSharedLink(id, link).then(
      () => {
        toast.success(t('native.share.linkSaved'));
        setFile(null);
        void navigate(`/trips/${id}?tab=collab`);
      },
      (err: unknown) => {
        // The server says why, such as a trip that has Collaboration off.
        toast.error(offlineOr(t, getApiErrorMessage(err, t('common.error'))));
        savingRef.current = null;
        setFailedFile(file);
      }
    );
  };

  // The trip's new place sheet takes the map link from here (MTripShell, MPlaceEditSheet).
  const addPlace = (id: number) => {
    choosePlaceTrip(id);
    void navigate(`/trips/${id}`);
  };

  // The trip the share sheet picked, used as soon as it is clear what the link is for.
  const preset = link?.presetTripId ?? null;
  const applyPreset = useEffectEvent((id: number, use: LinkChoice) => {
    if (use === 'booking') chooseTrip(id);
    else if (use === 'place') addPlace(id);
    else if (failedFile !== file) saveLink(id);
  });
  useEffect(() => {
    if (preset != null && choice != null && file) applyPreset(preset, choice);
  }, [preset, choice, file]);

  const pickTrip = (id: number) => {
    if (choice === 'link') saveLink(id);
    else if (choice === 'place') addPlace(id);
    else chooseTrip(id);
  };

  return (
    <MSheet open={open} onClose={() => setFile(null)} variant="bottom" ariaLabel={t('native.share.title')}>
      <div className="px-[18px] pb-4 pt-4">
        <div className="mb-3">
          <TileHeader
            icon={link ? <Link2 size={19} strokeWidth={1.8} /> : <FileText size={19} strokeWidth={1.8} />}
            title={sheetTitle(t, asking, choice)}
            sub={link ? link.title : file?.name}
            onClose={() => setFile(null)}
            closeLabel={t('common.close')}
          />
        </div>
        {asking && file && <LinkQuestion choices={choices} onPick={(use) => setPick({ file, choice: use })} />}
        {nowhere && (
          <p className="px-1 text-[length:calc(12px*var(--fs-scale-body,1))] text-m-muted">
            {t('native.share.linkUnsupported')}
          </p>
        )}
        {showTrips && <TripPicker trips={choice === 'link' ? collabTrips : trips} onPick={pickTrip} />}
      </div>
    </MSheet>
  );
}

function LinkQuestion({
  choices,
  onPick,
}: {
  choices: LinkChoice[];
  onPick: (choice: LinkChoice) => void;
}): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      {choices.includes('place') && (
        <ChoiceRow
          icon={<MapPin size={17} strokeWidth={2} />}
          label={t('native.share.addPlace')}
          hint={t('native.share.addPlaceHint')}
          onClick={() => onPick('place')}
        />
      )}
      {choices.includes('link') && (
        <ChoiceRow
          icon={<Link2 size={17} strokeWidth={2} />}
          label={t('native.share.saveLink')}
          hint={t('native.share.saveLinkHint')}
          onClick={() => onPick('link')}
        />
      )}
      {choices.includes('booking') && (
        <ChoiceRow
          icon={<ScanText size={17} strokeWidth={2} />}
          label={t('native.share.readBooking')}
          hint={t('native.share.readBookingHint')}
          onClick={() => onPick('booking')}
        />
      )}
    </div>
  );
}

function TripPicker({ trips, onPick }: { trips: TripRow[]; onPick: (id: number) => void }): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
      {trips.map((trip) => (
        <button
          key={trip.id}
          type="button"
          onClick={() => onPick(trip.id)}
          className="flex items-center gap-3 rounded-[16px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-4 py-3 text-start transition-transform active:scale-[.98] disabled:opacity-50"
        >
          <span className="min-w-0 flex-1 truncate text-[length:calc(14px*var(--fs-scale-body,1))] font-bold text-m-ink">
            {trip.title}
          </span>
          <ChevronRight size={16} className="flex-none text-m-faint" aria-hidden="true" />
        </button>
      ))}
      {trips.length === 0 && (
        <p className="px-1 text-[length:calc(12px*var(--fs-scale-body,1))] text-m-muted">{t('native.share.noTrips')}</p>
      )}
    </div>
  );
}

function ChoiceRow({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 rounded-[16px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-4 py-3 text-start transition-transform active:scale-[.98]"
    >
      <span
        className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-[color:var(--m-ic)] text-m-ink"
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[length:calc(14px*var(--fs-scale-body,1))] font-bold text-m-ink">
          {label}
        </span>
        <span className="block truncate text-[length:calc(12px*var(--fs-scale-body,1))] text-m-muted">{hint}</span>
      </span>
      <ChevronRight size={16} className="flex-none text-m-faint" aria-hidden="true" />
    </button>
  );
}
