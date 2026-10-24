import type { StationImportance } from '@trek/shared';
import { MapPin, ShieldCheck } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from '../../../i18n';
import ToggleSwitch from '../../Settings/ToggleSwitch';
import { EditorField, INPUT, LABEL, Segmented } from '../../shared/dialogParts';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../../shared/DialogShell';
import { parseStay, withStationFields } from './stationModel';
import type { TourPlannerWaypoint } from './tourPlannerWaypoints';

type Importance = StationImportance | 'normal';
const IMPORTANCES: readonly Importance[] = ['normal', 'optional', 'must'];

/**
 * CW-02, CW-03, CW-10: one station of a city walk, as a dialog: its name, how
 * long it is stayed at (empty is unknown, 0 a point passed through), how much
 * it matters and whether a proposed change must leave it. Saving is one step
 * of the history; nothing here plans the route again.
 */
export function StationDialog({
  point,
  fallbackName,
  onSave,
  onClose,
}: {
  point: TourPlannerWaypoint;
  /** The name the row shows while the station has none of its own. */
  fallbackName?: string;
  onSave: (next: TourPlannerWaypoint) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const labelId = useId();
  const nameId = useId();
  const stayId = useId();
  const [name, setName] = useState(point.name ?? '');
  const [stay, setStay] = useState(point.stayMinutes == null ? '' : String(point.stayMinutes));
  const [importance, setImportance] = useState<Importance>(point.importance ?? 'normal');
  const [protectedStation, setProtectedStation] = useState(point.protected === true);
  const stayMinutes = parseStay(stay);
  const stayInvalid = stayMinutes === undefined;

  // The footer sits outside the dialog's form: its button saves by its own click, and a submit of the form stays here.
  const save = (event?: { preventDefault: () => void }) => {
    event?.preventDefault();
    if (stayInvalid) return;
    onSave(
      withStationFields(point, {
        name,
        stayMinutes,
        importance: importance === 'normal' ? null : importance,
        protected: protectedStation,
      })
    );
  };

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      onSubmit={save}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <MapPin size={16} strokeWidth={2} />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          eyebrow={t('tours.walk.station.eyebrow')}
          title={name.trim() || fallbackName || t('tours.walk.station.unnamed')}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton onClick={onClose}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" onClick={() => save()} disabled={stayInvalid} data-testid="station-save">
            {t('common.save')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <div className="flex flex-col gap-4" data-testid="station-dialog">
        <EditorField label={t('tours.walk.station.name')} htmlFor={nameId}>
          <input
            id={nameId}
            className={INPUT}
            value={name}
            maxLength={200}
            placeholder={fallbackName ?? t('tours.walk.station.namePlaceholder')}
            onChange={(event) => setName(event.target.value)}
          />
        </EditorField>
        <EditorField
          label={t('tours.walk.station.stay')}
          htmlFor={stayId}
          hint={t('tours.walk.station.stayHint')}
          error={stayInvalid ? t('tours.walk.station.stayInvalid') : undefined}
        >
          <input
            id={stayId}
            className={INPUT}
            inputMode="numeric"
            value={stay}
            placeholder={t('tours.walk.station.stayUnknown')}
            onChange={(event) => setStay(event.target.value)}
          />
        </EditorField>
        <div className="min-w-0">
          <span className={LABEL}>{t('tours.walk.station.importance')}</span>
          <Segmented<Importance>
            value={importance}
            onChange={setImportance}
            label={t('tours.walk.station.importance')}
            fill
            options={IMPORTANCES.map((value) => ({ value, label: t(`tours.walk.importance.${value}`) }))}
          />
          <span className="mt-1.5 block text-content-faint" style={fs(11, 'body')}>
            {t(`tours.walk.importanceHint.${importance}`)}
          </span>
        </div>
        <div className="flex items-start gap-2.5">
          <ShieldCheck size={15} strokeWidth={2} className="mt-0.5 flex-none text-content-faint" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="font-semibold text-content" style={fs(12.5, 'body')}>
              {t('tours.walk.station.protected')}
            </span>
            <span className="leading-snug text-content-faint" style={fs(11, 'body')}>
              {t('tours.walk.station.protectedHint')}
            </span>
          </span>
          <ToggleSwitch
            on={protectedStation}
            onToggle={() => setProtectedStation((value) => !value)}
            label={t('tours.walk.station.protected')}
          />
        </div>
      </div>
    </DialogShell>
  );
}
