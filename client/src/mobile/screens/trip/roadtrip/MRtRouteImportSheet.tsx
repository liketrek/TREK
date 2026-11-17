import { Link2 } from 'lucide-react';
import { useGoogleRouteImport } from '../../../../components/Roadtrip/useGoogleRouteImport';
import { useIsWide } from '../../../../hooks/sizeClass';
import { useTranslation } from '../../../../i18n';
import MSheet from '../../../components/MSheet';
import { Eyebrow, SHEET_PRIMARY, SHEET_SECONDARY, TileHeader } from '../sheets/MTripSheetUi';
import { FIELD_CLS } from '../sheets/PlSheetChrome';

const NOTE = 'font-geist text-caption leading-snug';

/**
 * A route shared from Google Maps, appended to a day, on an iPad or an unfolded Duo.
 *
 * The desktop's import dialog (GoogleRouteImport) as the stage card's second offer under the
 * track one, over the same useGoogleRouteImport: a link is previewed, its stops listed in
 * order with the ones that did not resolve said so, and the resolved ones appended to the
 * day picked. Absent on the phone, where the stage stays a plan read on the road, and for a
 * reader who may not add places to days, since the import does both.
 */
export default function MRtRouteImport({
  tripId,
  dayId,
  canEdit,
}: {
  tripId: number;
  dayId?: number;
  canEdit: boolean;
}) {
  const { t } = useTranslation();
  const large = useIsWide();
  const flow = useGoogleRouteImport(tripId, dayId);
  if (!large || !canEdit) return null;
  const { days, open, url, setUrl, preview, target, pickDay, busy, failure, saved, show, close, canSubmit, submit } =
    flow;

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="mt-2 flex min-h-10 w-full items-center gap-2 rounded-[13px] bg-[color:var(--m-ic)] px-3 py-2 text-start"
      >
        <Link2 size={15} strokeWidth={1.9} className="flex-none text-m-muted" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-caption font-semibold text-m-ink">
          {t('roadtrip.import.title')}
        </span>
      </button>

      <MSheet open={open} onClose={close} variant="bottom" material="glass" ariaLabel={t('roadtrip.import.title')}>
        <div className="flex-none px-[18px] pt-4">
          <TileHeader
            icon={<Link2 size={19} strokeWidth={1.8} />}
            title={<span className="truncate">{t('roadtrip.import.title')}</span>}
            sub={t('roadtrip.import.note')}
            subWrap
            onClose={close}
            closeLabel={t('common.close')}
          />
        </div>

        <div className="m-scroll-fade mt-2 min-h-0 flex-1 overflow-y-auto px-[18px] pb-3 pt-[14px]">
          {!preview ? (
            <input
              type="url"
              dir="ltr"
              value={url}
              disabled={busy}
              onChange={(e) => setUrl(e.target.value)}
              aria-label="Google Maps URL"
              placeholder="https://maps.app.goo.gl/…"
              className={`${FIELD_CLS} disabled:opacity-50`}
            />
          ) : (
            <>
              <Eyebrow className="mb-[5px]">{t('roadtrip.import.day')}</Eyebrow>
              <select
                value={target}
                disabled={busy || saved}
                onChange={(e) => pickDay(e.target.value)}
                aria-label={t('roadtrip.import.day')}
                className={`${FIELD_CLS} appearance-none`}
              >
                {days.map((day) => (
                  <option key={day.id} value={String(day.id)}>
                    {day.title || `${t('roadtrip.import.day')} ${day.day_number}`}
                  </option>
                ))}
              </select>
              <ol
                className="m-0 mt-3 flex list-none flex-col gap-2.5 rounded-[16px] bg-[color:var(--m-ic)] p-3.5"
                data-testid="rt-import-stops"
              >
                {preview.stops.map((stop, index) => {
                  const unresolved = stop.lat == null || stop.lng == null;
                  return (
                    <li key={index} className="flex items-baseline gap-3">
                      <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-[color:var(--m-card)] text-caption font-semibold tabular-nums text-m-muted">
                        {index + 1}
                      </span>
                      <span className="min-w-0 break-words text-body text-m-ink">
                        <span dir="auto">{stop.name}</span>
                        {unresolved && (
                          <span className={`block ${NOTE} text-m-faint`}>{t('roadtrip.import.unresolved')}</span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
          {failure && (
            <p role="alert" className={`mt-2.5 ${NOTE} text-danger`}>
              {saved ? `${t('common.saved')}: ` : ''}
              {failure}
            </p>
          )}
        </div>

        <div className="flex flex-none items-center justify-end gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
          <button type="button" disabled={busy} onClick={close} className={SHEET_SECONDARY}>
            {t('common.cancel')}
          </button>
          <button type="button" disabled={!canSubmit} onClick={submit} className={SHEET_PRIMARY}>
            {busy ? t('common.loading') : t(preview ? 'common.import' : 'common.preview')}
          </button>
        </div>
      </MSheet>
    </>
  );
}
