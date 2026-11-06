/**
 * NativeImportSheet: a booking document was shared to TREK (native/sharedFiles.ts),
 * so this asks which trip it belongs to and opens that trip's booking import with
 * the file already chosen. Trips still ahead come first, the ones that ended after.
 */
import { ChevronRight, FileText } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../i18n';
import { useSharedImportStore } from '../../native/sharedFiles';
import { tripRepo } from '../../repo/tripRepo';
import { TileHeader } from '../screens/trip/sheets/MTripSheetUi';
import MSheet from './MSheet';

interface TripRow {
  id: number;
  title: string;
  start_date?: string | null;
  end_date?: string | null;
}

export default function NativeImportSheet(): React.ReactElement | null {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const file = useSharedImportStore((s) => s.file);
  const tripId = useSharedImportStore((s) => s.tripId);
  const chooseTrip = useSharedImportStore((s) => s.chooseTrip);
  const setFile = useSharedImportStore((s) => s.setFile);
  const [trips, setTrips] = useState<TripRow[]>([]);

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

  const pick = (id: number) => {
    chooseTrip(id);
    void navigate(`/trips/${id}`);
  };

  return (
    <MSheet open={open} onClose={() => setFile(null)} variant="bottom" ariaLabel={t('native.share.title')}>
      <div className="px-[18px] pb-4 pt-4">
        <div className="mb-3">
          <TileHeader
            icon={<FileText size={19} strokeWidth={1.8} />}
            title={t('native.share.title')}
            sub={file?.name}
            onClose={() => setFile(null)}
            closeLabel={t('common.close')}
          />
        </div>
        <div className="flex max-h-[50vh] flex-col gap-2 overflow-y-auto">
          {trips.map((trip) => (
            <button
              key={trip.id}
              type="button"
              onClick={() => pick(trip.id)}
              className="flex items-center gap-3 rounded-[16px] border border-[color:var(--m-gbr)] bg-[color:var(--m-glass)] px-4 py-3 text-start transition-transform active:scale-[.98]"
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
      </div>
    </MSheet>
  );
}
