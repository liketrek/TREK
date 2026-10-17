import { ExternalLink, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import type { DistanceUnit } from '../../../types';
import { formatDistance } from '../../../utils/units';
import { MAP_CARD_GLASS } from '../../Map/mapControlShadow';
import { SoftPill } from '../../Planner/planParts';
import { fs } from '../../shared/DialogShell';
import { FigureBadge } from './FigureBadge';
import { PaddleGlyph } from './PaddleGlyph';
import { OBSTACLE_GLYPH } from './paddleGlyphPaths';
import { KNOWN_ACCESS_VALUES, metresOf, osmUrlOf, type PaddleObstacleDetail } from './paddleObstacleModel';
import { paddleKindCss } from './paddlePaint';

const ACCESS_KEYS: readonly string[] = KNOWN_ACCESS_VALUES;

/** How the object stands to the route: on it at a distance along it, near it and uncertain, or only in the area. */
function RelationBadges({ detail, unit }: { detail: PaddleObstacleDetail; unit: DistanceUnit }) {
  const { t } = useTranslation();
  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5" data-testid="paddle-obstacle-relation">
      {detail.relation === 'on_route' && (
        <FigureBadge
          label={t('tours.paddle.obstacleCard.onRoute')}
          value={formatDistance((detail.alongM ?? 0) / 1000, unit)}
          info={t('tours.paddle.obstacleCard.alongInfo')}
        />
      )}
      {detail.relation === 'near' && (
        <>
          <FigureBadge
            label={t('tours.paddle.obstacleCard.near')}
            value={formatDistance((detail.distanceM ?? 0) / 1000, unit)}
            info={t('tours.paddle.obstacleCard.distanceInfo')}
          />
          <SoftPill>{t('tours.paddle.obstacleCard.uncertain')}</SoftPill>
        </>
      )}
      {detail.relation === 'area' && <SoftPill>{t('tours.paddle.obstacleCard.area')}</SoftPill>}
      {detail.privateWay && <SoftPill tone="warning">{t('tours.paddle.obstacleCard.privateWay')}</SoftPill>}
    </div>
  );
}

/** The paddling rule the tags give (canoe read before boat), its condition as written, and the facts worth knowing. */
function AccessAndFacts({ detail, unit }: { detail: PaddleObstacleDetail; unit: DistanceUnit }) {
  const { t } = useTranslation();
  const { access } = detail;
  const accessValue = (value: string) =>
    ACCESS_KEYS.includes(value) ? t(`tours.paddle.obstacleCard.accessValue.${value}`) : value;
  const factValue = (key: string, value: string) => {
    const metres = key === 'height' || key === 'width' ? metresOf(value) : null;
    return metres === null ? value : formatDistance(metres / 1000, unit);
  };
  const ruled = access.source !== null && access.value !== null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5" data-testid="paddle-obstacle-access">
      {ruled && (
        <FigureBadge
          label={t(`tours.paddle.obstacleCard.access.${access.source ?? 'access'}`)}
          value={accessValue(access.value ?? '')}
          tone={access.forbidden || access.private ? 'warning' : 'neutral'}
        />
      )}
      {!ruled && !access.condition && <SoftPill>{t('tours.paddle.obstacleCard.noAccessInfo')}</SoftPill>}
      {access.condition && (
        <FigureBadge
          label={t('tours.paddle.obstacleCard.condition')}
          value={access.condition}
          info={access.condition}
        />
      )}
      {detail.facts.map((fact) => (
        <FigureBadge
          key={fact.key}
          label={t(`tours.paddle.obstacleCard.fact.${fact.key === 'whitewater:section_grade' ? 'grade' : fact.key}`)}
          value={factValue(fact.key, fact.value)}
          info={fact.value}
        />
      ))}
    </div>
  );
}

/** The way to the source and how current it is; a record in the data is no check on site. */
function SourceLines({ detail }: { detail: PaddleObstacleDetail }) {
  const { t, language } = useTranslation();
  const date = detail.dataAsOf ? new Date(detail.dataAsOf).toLocaleDateString(language, { dateStyle: 'medium' }) : null;
  return (
    <>
      <a
        href={osmUrlOf(detail.feature.ref)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center gap-1 font-medium text-content hover:underline"
        style={fs(12, 'body')}
      >
        {t('ferratas.viewInOsm')}
        <ExternalLink size={13} aria-hidden="true" />
      </a>
      <p className="mt-2 border-t border-edge-faint pt-2 text-content-faint" style={fs(9)}>
        {date ? t('tours.paddle.obstacleCard.source', { date }) : t('tours.paddle.obstacleCard.sourceUndated')}{' '}
        {t('ferratas.attribution')}
      </p>
    </>
  );
}

/**
 * One paddle object picked on the map or in the checklist (PAD-05B), in the
 * look of the via ferrata card: what it is, how it stands to the route (an
 * object only near it is said to be uncertain, never on it), the paddling
 * rule its tags give with canoe read before boat, the facts worth knowing,
 * and where the data comes from and how current it is. A missing rule reads
 * as unknown, never as allowed; the card says it is data, not a check on site.
 * `children` takes what the checklist adds below the facts.
 */
export default function PaddleObstacleCard({
  detail,
  onClose,
  width,
  children,
}: {
  detail: PaddleObstacleDetail;
  onClose?: () => void;
  width?: number;
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  const unit = useSettingsStore((s) => s.settings.distance_unit) ?? 'metric';
  const { feature } = detail;
  const kind = t(`tours.paddle.obstacle.kind.${feature.kind}`);
  const color = paddleKindCss(feature.kind);
  return (
    <article
      className={`max-h-[70vh] overflow-y-auto overscroll-contain rounded-2xl p-3 text-content ${width ? '' : 'w-max min-w-[min(18rem,calc(100vw_-_2rem))] max-w-[22.5rem]'}`}
      style={{ ...MAP_CARD_GLASS, width }}
      data-testid="paddle-obstacle-card"
    >
      <div className="flex items-start gap-2">
        <span
          className="grid h-7 w-7 flex-none place-items-center rounded-full bg-surface-card shadow-sm"
          style={{ color, boxShadow: `inset 0 0 0 2px ${color}` }}
        >
          <PaddleGlyph kind={OBSTACLE_GLYPH[feature.kind]} size={15} strokeWidth={2.3} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 break-words font-semibold" style={fs(14, 'body')} title={feature.name ?? kind}>
            {feature.name ?? kind}
          </h3>
          {feature.name && <p className="truncate text-caption text-content-muted">{kind}</p>}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="flex-none rounded-lg p-1 text-content-muted hover:bg-surface-hover hover:text-content"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
      </div>
      <RelationBadges detail={detail} unit={unit} />
      <AccessAndFacts detail={detail} unit={unit} />
      {detail.note && (
        <p className="mt-2 line-clamp-3 break-words text-content-muted" style={fs(11.5, 'body')} title={detail.note}>
          {detail.note}
        </p>
      )}
      {children}
      <SourceLines detail={detail} />
    </article>
  );
}
