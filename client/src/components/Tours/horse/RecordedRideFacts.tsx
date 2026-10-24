import { useId, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { SoftPill } from '../../Planner/planParts';
import { Tooltip } from '../../shared/Tooltip';
import { RailCard } from '../tourParts';
import { ACCESS_TONE_DOT } from './horseAccess';
import { Horseshoe } from './HorseshoeIcon';

/**
 * HOR-02: what a ride taken from a GPX file is, said as badges with the why in
 * their tooltips. Its line stays as the file recorded it, no riding time is
 * worked out for it, and nothing checked whether its ways may be ridden: the
 * import makes no ride allowed or passable. Heights the file did not carry are
 * named as missing rather than shown as zero.
 */

/** One badge of the row; with a reason, it takes the focus and says the reason in a tooltip. */
function FactPill({ icon, label, info }: { icon?: ReactNode; label: string; info?: string }) {
  const id = useId();
  const pill = <SoftPill icon={icon}>{label}</SoftPill>;
  if (!info) return pill;
  return (
    <Tooltip label={info}>
      <span
        tabIndex={0}
        aria-describedby={id}
        className="inline-flex rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {pill}
        <span id={id} className="sr-only">
          {info}
        </span>
      </span>
    </Tooltip>
  );
}

export function RecordedRideFacts({ heightsMissing = false }: { heightsMissing?: boolean }) {
  const { t } = useTranslation();
  return (
    <div data-testid="recorded-ride-facts" className="flex min-w-0 flex-wrap items-center gap-1.5">
      <FactPill
        icon={
          <Horseshoe
            size={11}
            strokeWidth={2.4}
            aria-hidden="true"
            className="flex-none text-[color:var(--horse-route)]"
          />
        }
        label={t('tours.horse.recorded.asRecorded')}
        info={t('tours.horse.recorded.asRecordedInfo')}
      />
      <FactPill label={t('tours.horse.recorded.noTime')} info={t('tours.horse.recorded.noTimeInfo')} />
      <FactPill
        icon={<span aria-hidden="true" className={`h-2 w-2 flex-none rounded-full ${ACCESS_TONE_DOT.unknown}`} />}
        label={t('tours.horse.recorded.accessUnchecked')}
        info={t('tours.horse.recorded.accessUncheckedInfo')}
      />
      {heightsMissing && <FactPill label={t('tours.import.previewNoHeights')} />}
    </div>
  );
}

/** The ride's card in the rail of a recorded ride in view, above its measures. */
export function RecordedRideCard({ heightsMissing }: { heightsMissing: boolean }) {
  const { t } = useTranslation();
  return (
    <RailCard icon={<Horseshoe size={14} strokeWidth={2} />} title={t('tours.horse.recorded.title')}>
      <RecordedRideFacts heightsMissing={heightsMissing} />
    </RailCard>
  );
}
