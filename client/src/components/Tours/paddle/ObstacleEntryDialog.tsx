import type { TourObstacleEntry } from '@trek/shared';
import { ExternalLink } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { DialogHeader, DialogShell, DialogTile, NEUTRAL_TINT, PILL } from '../../shared/DialogShell';
import { ChecklistEntryPanel } from './ObstacleDecisionPanel';
import { ChecklistGlyph } from './PaddleCheckBadges';
import { osmUrlOf } from './paddleObstacleModel';
import type { PaddleChecklist } from './usePaddleChecklist';

/** The pills of the head band: how far along the route the object lies and the object on OpenStreetMap. */
function EntryPills({ entry }: { entry: TourObstacleEntry }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const ref = entry.refs[0];
  return (
    <>
      {entry.along_m !== null && (
        <span className={`${PILL} tabular-nums`}>{formatDistance(entry.along_m / 1000, unit)}</span>
      )}
      {ref && (
        <a href={osmUrlOf(ref)} target="_blank" rel="noopener noreferrer" className={`${PILL} hover:underline`}>
          {t('ferratas.viewInOsm')}
          <ExternalLink size={12} strokeWidth={2.2} aria-hidden="true" />
        </a>
      )}
    </>
  );
}

/** The dialog for an entry the checklist holds: its head band, then the decision panel. */
function EntryDialog({ checklist, entry }: { checklist: PaddleChecklist; entry: TourObstacleEntry }) {
  const { t } = useTranslation();
  const labelId = useId();
  const kind = t(`tours.paddle.obstacle.kind.${entry.kind}`);
  return (
    <DialogShell
      onClose={checklist.closeDialog}
      labelledBy={labelId}
      width="narrow"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <ChecklistGlyph kind={entry.kind} dashed={entry.relation === 'near'} />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={checklist.closeDialog}
          title={entry.name ?? kind}
          sub={entry.name ? kind : undefined}
          pills={<EntryPills entry={entry} />}
        />
      }
    >
      <ChecklistEntryPanel checklist={checklist} entry={entry} />
    </DialogShell>
  );
}

/**
 * PAD-06: one entry of the checklist in a narrow dialog, for an object the
 * map holds no card for (offline, or an earlier decision the data or the
 * route no longer carries): what it is, how far along the route it lies, its
 * object on OpenStreetMap and the same decision panel the map card carries.
 */
export function ObstacleEntryDialog({ checklist }: { checklist: PaddleChecklist }) {
  const { check, dialogKey } = checklist;
  const entry = dialogKey === null ? null : (check?.entries.find((item) => item.key === dialogKey) ?? null);
  if (!entry) return null;
  return <EntryDialog checklist={checklist} entry={entry} />;
}
