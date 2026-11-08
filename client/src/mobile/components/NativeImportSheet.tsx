/**
 * NativeImportSheet: something was shared to TREK (native/sharedFiles.ts), so this
 * asks which trip it belongs to and opens that trip's booking import with the file
 * already chosen. Trips still ahead come first, the ones that ended after.
 *
 * A web page or a link is asked about first: kept among the trip's links
 * (Collaboration, Links), or read as a booking. A bare link, whose page the phone
 * could not read, can only be kept; with Collaboration off, a page can only be read.
 */
import { ChevronRight, FileText, Link2, ScanText } from 'lucide-react';
import React, { useEffect, useEffectEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useToast } from '../../components/shared/Toast';
import { useTranslation } from '../../i18n';
import { saveSharedLink, useSharedImportStore, type SharedLink } from '../../native/sharedFiles';
import { tripRepo } from '../../repo/tripRepo';
import { useAddonStore } from '../../store/addonStore';
import { offlineOr } from '../../utils/needsConnection';
import { TileHeader } from '../screens/trip/sheets/MTripSheetUi';
import MSheet from './MSheet';

interface TripRow {
  id: number;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
}

type LinkChoice = 'link' | 'booking';

/** What to offer for a shared link: the links when Collaboration is on, the import when there is a page to read. */
function linkChoicesOf(file: File, collabOn: boolean): LinkChoice[] {
  const choices: LinkChoice[] = [];
  if (collabOn) choices.push('link');
  if (file.type !== 'text/uri-list') choices.push('booking');
  return choices;
}

/** Where the sheet stands for the shared item: what it asks, and what a tap on a trip does. */
function stageOf(link: SharedLink | null, choices: LinkChoice[], picked: LinkChoice | null) {
  if (!link) return { choice: 'booking' as LinkChoice | null, asking: false, nowhere: false };
  const choice = picked ?? (choices.length === 1 ? choices[0] : null);
  return { choice, asking: choice == null && choices.length > 1, nowhere: choices.length === 0 };
}

function titleKeyOf(asking: boolean, choice: LinkChoice | null): string {
  if (asking) return 'native.share.linkTitle';
  return choice === 'link' ? 'native.share.linkTrip' : 'native.share.title';
}

/** The trips to choose from, those still ahead first. */
function useTripRows(open: boolean): TripRow[] {
  const [trips, setTrips] = useState<TripRow[]>([]);
  useEffect(() => {
    if (!open) return;
    tripRepo.list().then(
      (data: { trips?: TripRow[] }) => {
        const today = new Date().toISOString().slice(0, 10);
        const list = [...(data.trips ?? [])];
        const ahead = (trip: TripRow) => (trip.end_date ?? '9999') >= today;
        list.sort(
          (a, b) => Number(ahead(b)) - Number(ahead(a)) || (a.start_date ?? '').localeCompare(b.start_date ?? '')
        );
        setTrips(list);
      },
      () => setTrips([])
    );
  }, [open]);
  return trips;
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
  const setFile = useSharedImportStore((s) => s.setFile);
  const collabOn = useAddonStore((s) => s.isEnabled('collab'));
  // Both belong to the item they were made for, so a newly shared one starts afresh.
  const [pick, setPick] = useState<{ file: File; choice: LinkChoice } | null>(null);
  const [savingFile, setSavingFile] = useState<File | null>(null);
  const picked = file && pick?.file === file ? pick.choice : null;
  const saving = !!file && savingFile === file;

  const choices = file && link ? linkChoicesOf(file, collabOn) : [];
  const { choice, asking, nowhere } = stageOf(link, choices, picked);
  const open = !!file && tripId == null;
  const trips = useTripRows(open);

  // Once a trip is picked (here, or in the share sheet before the app opened), go to
  // it; its planner opens the booking import with the file (MTripShell).
  useEffect(() => {
    if (!file || tripId == null || pathname.startsWith(`/trips/${tripId}`)) return;
    void navigate(`/trips/${tripId}`);
  }, [file, tripId, pathname, navigate]);

  const saveLink = async (id: number) => {
    if (!link || !file || saving) return;
    setSavingFile(file);
    try {
      await saveSharedLink(id, link);
      toast.success(t('native.share.linkSaved'));
      setFile(null);
      void navigate(`/trips/${id}?tab=collab`);
    } catch {
      toast.error(offlineOr(t, t('common.error')));
      setSavingFile(null);
    }
  };

  // The trip the share sheet picked, used as soon as it is clear what the link is for.
  const preset = link?.presetTripId ?? null;
  const applyPreset = useEffectEvent((id: number, use: LinkChoice) => {
    if (use === 'booking') chooseTrip(id);
    else void saveLink(id);
  });
  useEffect(() => {
    if (preset != null && choice != null && file) applyPreset(preset, choice);
  }, [preset, choice, file]);

  const pickTrip = (id: number) => (choice === 'link' ? void saveLink(id) : chooseTrip(id));
  // While the picked trip takes the link, there is nothing to choose; should it fail, the trips come back.
  const showTrips = !asking && !nowhere && !(preset != null && choice === 'link' && saving);

  return (
    <MSheet open={open} onClose={() => setFile(null)} variant="bottom" ariaLabel={t('native.share.title')}>
      <div className="px-[18px] pb-4 pt-4">
        <div className="mb-3">
          <TileHeader
            icon={link ? <Link2 size={19} strokeWidth={1.8} /> : <FileText size={19} strokeWidth={1.8} />}
            title={t(titleKeyOf(asking, choice))}
            sub={link ? link.title : file?.name}
            onClose={() => setFile(null)}
            closeLabel={t('common.close')}
          />
        </div>
        {asking && file && <LinkQuestion onPick={(use) => setPick({ file, choice: use })} />}
        {nowhere && (
          <p className="px-1 text-[length:calc(12px*var(--fs-scale-body,1))] text-m-muted">
            {t('native.share.linkUnsupported')}
          </p>
        )}
        {showTrips && <TripPicker trips={trips} disabled={saving} onPick={pickTrip} />}
      </div>
    </MSheet>
  );
}

function LinkQuestion({ onPick }: { onPick: (choice: LinkChoice) => void }): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <ChoiceRow
        icon={<Link2 size={17} strokeWidth={2} />}
        label={t('native.share.saveLink')}
        hint={t('native.share.saveLinkHint')}
        onClick={() => onPick('link')}
      />
      <ChoiceRow
        icon={<ScanText size={17} strokeWidth={2} />}
        label={t('native.share.readBooking')}
        hint={t('native.share.readBookingHint')}
        onClick={() => onPick('booking')}
      />
    </div>
  );
}

function TripPicker({
  trips,
  disabled,
  onPick,
}: {
  trips: TripRow[];
  disabled: boolean;
  onPick: (id: number) => void;
}): React.ReactElement {
  const { t } = useTranslation();
  return (
    <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
      {trips.map((trip) => (
        <button
          key={trip.id}
          type="button"
          disabled={disabled}
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
