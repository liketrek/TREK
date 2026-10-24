import { horseAccessTone, type HorseRoute } from '@trek/shared';
import { AlertTriangle, ArrowLeft, ArrowLeftRight, ArrowRight, Link2, Spline } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from '../../../i18n';
import type { DistanceUnit } from '../../../types';
import { formatDistance } from '../../../utils/units';
import { SoftPill } from '../../Planner/planParts';
import ToggleSwitch from '../../Settings/ToggleSwitch';
import { Segmented } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { InfoDot, TourNotice } from '../tourParts';
import { ACCESS_TONE_DOT, ACCESS_TONE_PILL, accessToneOf } from './horseAccess';
import type { HorseSectionLeg } from './horseSection';
import type { HorseSectionPick } from './useHorseSectionPick';

/**
 * HOR-01: the parts of the dialog that takes a section of a horse route onto
 * a ride: the sections to choose from, the direction, what the `horse=*` tags
 * say along the one chosen, and how it joins the ride.
 */

/**
 * The route's sections as numbered chips, in the order the route lists its
 * ways: the number carries a dot in its corner for what the tags say along the
 * section, hollow where they say nothing, and the chip its length.
 */
export function SectionChips({
  route,
  chosen,
  onPick,
  unit,
}: {
  route: HorseRoute;
  chosen: number | undefined;
  onPick: (number: number) => void;
  unit: DistanceUnit;
}) {
  const { t } = useTranslation();
  return (
    <ul className="m-0 flex max-h-[176px] list-none flex-wrap gap-1.5 overflow-y-auto p-0">
      {route.sections.map((section) => {
        const on = section.number === chosen;
        const tone = accessToneOf(section.access) ?? 'unknown';
        const length = formatDistance(section.length_m / 1000, unit);
        const label = t('tours.horse.dialog.section', { number: section.number });
        return (
          <li key={section.number}>
            <Tooltip label={`${label}: ${t(`tours.horse.access.summary.${tone}`)}`}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`${label}, ${length}`}
                data-testid={`horse-section-${section.number}`}
                onClick={() => onPick(section.number)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-full pe-2.5 ps-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent ${on ? 'bg-surface-card shadow-sm ring-1 ring-inset ring-accent' : 'bg-surface-secondary hover:bg-surface-tertiary'}`}
              >
                <span
                  className={`relative grid h-6 w-6 place-items-center rounded-full font-geist font-semibold tabular-nums ${on ? 'bg-accent text-accent-text' : 'bg-surface-card text-content'}`}
                  style={fs(11)}
                >
                  {section.number}
                  <span
                    aria-hidden="true"
                    className={`absolute -end-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-surface-card ${ACCESS_TONE_DOT[tone]}`}
                  />
                </span>
                <span className="font-geist tabular-nums text-content-secondary" style={fs(11)}>
                  {length}
                </span>
                {section.signposted && (
                  <ArrowRight size={11} strokeWidth={2.4} aria-hidden="true" className="text-content-faint" />
                )}
              </button>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
}

/** As mapped or the other way round, with what the route's own signposting says about the choice. */
export function DirectionField({ pick }: { pick: HorseSectionPick }) {
  const { t } = useTranslation();
  const signposted = pick.leg?.signposted ?? null;
  return (
    <div className="flex flex-col gap-2">
      <Segmented<'mapped' | 'reversed'>
        value={pick.reversed ? 'reversed' : 'mapped'}
        onChange={(value) => pick.turn(value === 'reversed')}
        label={t('tours.horse.dialog.direction')}
        fill
        options={[
          {
            value: 'mapped',
            label: t('tours.horse.dialog.asMapped'),
            icon: <ArrowRight size={13} strokeWidth={2.2} />,
          },
          {
            value: 'reversed',
            label: t('tours.horse.dialog.reversed'),
            icon: <ArrowLeft size={13} strokeWidth={2.2} />,
          },
        ]}
      />
      {signposted === 'with' && (
        <span className="inline-flex">
          <SoftPill tone="success" icon={<ArrowRight size={11} strokeWidth={2.4} />}>
            {t('tours.horse.dialog.signedWith')}
          </SoftPill>
        </span>
      )}
      {signposted === 'against' && (
        <TourNotice tone="warning" icon={<ArrowLeftRight size={13} strokeWidth={2} />}>
          {t('tours.horse.dialog.signedAgainst')}
        </TourNotice>
      )}
    </div>
  );
}

/** The label of the access block, with what it can and cannot say behind its info dot. */
export function AccessLabel() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1">
      {t('tours.horse.access.title')}
      <InfoDot label={t('tours.horse.routes.infoLabel')} description={t('tours.horse.access.note')} />
    </span>
  );
}

/**
 * What the `horse=*` tags say along the section chosen, one pill per value
 * with the metres it covers, the most restrictive first: the tags as they
 * are, unknown where there are none. A tag that closes part of it is said.
 */
export function AccessPills({ leg, unit }: { leg: HorseSectionLeg; unit: DistanceUnit }) {
  const { t } = useTranslation();
  const shares = leg.access ?? [];
  const closed = accessToneOf(shares) === 'closed';
  return (
    <div className="flex flex-col gap-2">
      <span data-testid="horse-section-access" className="flex flex-wrap gap-1.5">
        {shares.map((share) => {
          const tone = horseAccessTone(share.value);
          return (
            <SoftPill
              key={share.value}
              tone={ACCESS_TONE_PILL[tone]}
              icon={<span aria-hidden="true" className={`h-2 w-2 rounded-full ${ACCESS_TONE_DOT[tone]}`} />}
            >
              {t(`tours.horse.access.value.${share.value}`)}
              <span className="font-geist tabular-nums text-content-faint">
                {formatDistance(share.length_m / 1000, unit)}
              </span>
            </SoftPill>
          );
        })}
      </span>
      {closed && (
        <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
          {t('tours.horse.access.closedNotice')}
        </TourNotice>
      )}
    </div>
  );
}

/**
 * How the section joins the ride: as its first leg, from its end, or across a
 * gap no horse route covers. A gap is only drawn by hand, straight and
 * unchecked, once the rider switched that on; it is never closed by itself.
 */
export function ConnectionField({ pick, unit }: { pick: HorseSectionPick; unit: DistanceUnit }) {
  const { t } = useTranslation();
  const hintId = useId();
  if (pick.gapM === null)
    return (
      <span className="inline-flex">
        <SoftPill tone="info" icon={<Link2 size={11} strokeWidth={2.4} />}>
          {t('tours.horse.dialog.firstSection')}
        </SoftPill>
      </span>
    );
  if (!pick.gapOpen)
    return (
      <span className="inline-flex">
        <SoftPill tone="success" icon={<Link2 size={11} strokeWidth={2.4} />}>
          {t('tours.horse.dialog.joins')}
        </SoftPill>
      </span>
    );
  return (
    <div data-testid="horse-section-gap" className="flex flex-col gap-2">
      <TourNotice tone="warning" icon={<AlertTriangle size={13} strokeWidth={2} />}>
        {t('tours.horse.dialog.gap', { distance: formatDistance(pick.gapM / 1000, unit) })}
      </TourNotice>
      <div className="flex items-center gap-3 rounded-[10px] border border-dashed border-edge px-3 py-2">
        <Spline size={14} strokeWidth={2} aria-hidden="true" className="flex-none text-content-muted" />
        <span className="min-w-0 flex-1">
          <span className="block font-semibold text-content" style={fs(12.5, 'body')}>
            {t('tours.horse.dialog.joinGap')}
          </span>
          <span id={hintId} className="block text-content-faint" style={fs(11, 'body')}>
            {t('tours.horse.dialog.joinGapHint')}
          </span>
        </span>
        <ToggleSwitch
          on={pick.joinGap}
          onToggle={pick.toggleJoinGap}
          label={t('tours.horse.dialog.joinGap')}
          describedBy={hintId}
        />
      </div>
    </div>
  );
}
