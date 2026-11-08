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
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useToast } from '../../components/shared/Toast';
import { useTranslation } from '../../i18n';
import { saveSharedLink, useSharedImportStore } from '../../native/sharedFiles';
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
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [picked, setPicked] = useState<LinkChoice | null>(null);
  const [saving, setSaving] = useState(false);

  // Each shared item is asked about afresh.
  useEffect(() => {
    setPicked(null);
    setSaving(false);
  }, [file]);

  const choices = file && link ? linkChoicesOf(file, collabOn) : [];
  // With one way to go there is nothing to ask.
  const choice: LinkChoice | null = !link ? 'booking' : (picked ?? (choices.length === 1 ? choices[0] : null));
  const asking = !!link && choice == null && choices.length > 1;
  const nowhere = !!link && choices.length === 0;

  const open = !!file && tripId == null;

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

  // Once a trip is picked (here, or in the share sheet before the app opened), go to
  // it; its planner opens the booking import with the file (MTripShell).
  useEffect(() => {
    if (!file || tripId == null || pathname.startsWith(`/trips/${tripId}`)) return;
    void navigate(`/trips/${tripId}`);
  }, [file, tripId, pathname, navigate]);

  const saveLink = async (id: number) => {
    if (!link || saving) return;
    setSaving(true);
    try {
      await saveSharedLink(id, link);
      toast.success(t('native.share.linkSaved'));
      setFile(null);
      void navigate(`/trips/${id}?tab=collab`);
    } catch {
      toast.error(offlineOr(t, t('common.error')));
      setSaving(false);
    }
  };

  // The trip the share sheet picked, used as soon as it is clear what the link is for.
  // saveLink is a fresh function on every render, so the effect reaches it through a
  // ref and runs on the trip and the choice alone.
  const preset = link?.presetTripId ?? null;
  const saveLinkRef = useRef(saveLink);
  saveLinkRef.current = saveLink;
  useEffect(() => {
    if (preset == null || choice == null || !file) return;
    if (choice === 'booking') chooseTrip(preset);
    else void saveLinkRef.current(preset);
  }, [preset, choice, file, chooseTrip]);

  const pick = (id: number) => (choice === 'link' ? void saveLink(id) : chooseTrip(id));
  // While the picked trip takes the link, there is nothing to choose; should it fail, the trips come back.
  const showTrips = !asking && !nowhere && !(preset != null && choice === 'link' && saving);

  return (
    <MSheet open={open} onClose={() => setFile(null)} variant="bottom" ariaLabel={t('native.share.title')}>
      <div className="px-[18px] pb-4 pt-4">
        <div className="mb-3">
          <TileHeader
            icon={link ? <Link2 size={19} strokeWidth={1.8} /> : <FileText size={19} strokeWidth={1.8} />}
            title={t(
              asking ? 'native.share.linkTitle' : choice === 'link' ? 'native.share.linkTrip' : 'native.share.title'
            )}
            sub={link ? link.title : file?.name}
            onClose={() => setFile(null)}
            closeLabel={t('common.close')}
          />
        </div>
        {asking && (
          <div className="flex flex-col gap-2">
            <ChoiceRow
              icon={<Link2 size={17} strokeWidth={2} />}
              label={t('native.share.saveLink')}
              hint={t('native.share.saveLinkHint')}
              onClick={() => setPicked('link')}
            />
            <ChoiceRow
              icon={<ScanText size={17} strokeWidth={2} />}
              label={t('native.share.readBooking')}
              hint={t('native.share.readBookingHint')}
              onClick={() => setPicked('booking')}
            />
          </div>
        )}
        {nowhere && (
          <p className="px-1 text-[length:calc(12px*var(--fs-scale-body,1))] text-m-muted">
            {t('native.share.linkUnsupported')}
          </p>
        )}
        {showTrips && (
          <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
            {trips.map((trip) => (
              <button
                key={trip.id}
                type="button"
                disabled={saving}
                onClick={() => pick(trip.id)}
                className="flex items-center gap-3 rounded-[16px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-4 py-3 text-start transition-transform active:scale-[.98] disabled:opacity-50"
              >
                <span className="min-w-0 flex-1 truncate text-[length:calc(14px*var(--fs-scale-body,1))] font-bold text-m-ink">
                  {trip.title}
                </span>
                <ChevronRight size={16} className="flex-none text-m-faint" aria-hidden="true" />
              </button>
            ))}
            {trips.length === 0 && (
              <p className="px-1 text-[length:calc(12px*var(--fs-scale-body,1))] text-m-muted">
                {t('native.share.noTrips')}
              </p>
            )}
          </div>
        )}
      </div>
    </MSheet>
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
