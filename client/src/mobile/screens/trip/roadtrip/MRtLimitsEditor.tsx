import { useState, type ReactNode } from 'react';
import { valhallaAvailable } from '../../../../components/Map/valhallaRoute';
import { dayWindow } from '../../../../components/Roadtrip/dayWindow';
import { parseAvoid, serializeAvoid, type VehicleKind } from '../../../../components/Roadtrip/roadtripModel';
import { rangeFromSpec, type VehicleSpec } from '../../../../components/Roadtrip/vehicleRange';
import CustomTimePicker from '../../../../components/shared/CustomTimePicker';
import { useRoadtripSettings } from '../../../../hooks/useRoadtripSettings';
import { useTranslation } from '../../../../i18n';
import { useSettingsStore } from '../../../../store/settingsStore';
import type { RouteAvoidClass } from '../../../../types';
import { convertDistance } from '../../../../utils/units';
import MSegmented from '../../../components/MSegmented';
import MToggle from '../../../components/MToggle';
import { Eyebrow } from '../sheets/MTripSheetUi';

/**
 * The driving figures as a form, for an iPad or an unfolded Duo.
 *
 * The phone keeps them read-only (MRtInfoSheet says why: a form in the passenger seat breaks
 * a trip while it is happening). A large screen is the table the figures are set at, so
 * there the same sheet edits what the desktop's limits dialog edits most: the two driving
 * limits, the day's window and where it ends, the vehicle with its range and fill, and what
 * the road may avoid. The vehicle's own figures (tank, consumption, battery) stay on the
 * desktop; once they are stored the range is theirs and shows read-only here, as it does
 * there.
 *
 * Every change goes through the planner's `saveRoadtripLimit`, the desktop dialog's own
 * save, which checks the right to edit days itself. `readOnly` disables the controls for a
 * reader without that right, so nothing takes a value only to drop it.
 */

/** Empty means no limit, and so does zero: both are stored as 0 and read as off. */
function parseFigure(raw: string): number {
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

/** One card of the form: eyebrow plus its rows. */
function EditCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[16px] bg-[color:var(--m-ic)] px-3.5 py-3">
      <Eyebrow>{label}</Eyebrow>
      <div className="mt-1">{children}</div>
    </div>
  );
}

/** A label and its control on one line, with the row rule above every row but the first. */
function EditRow({ label, first, children }: { label: string; first?: boolean; children: ReactNode }) {
  return (
    <div
      className={`flex min-h-11 items-center justify-between gap-3 py-1.5 ${first ? '' : 'border-t border-[color:var(--m-rowbr)]'}`}
    >
      <span className="min-w-0 flex-1 text-body text-m-muted">{label}</span>
      {children}
    </div>
  );
}

/**
 * A number typed in and saved when the field is left or Enter is pressed, not per
 * keystroke: a settings write per digit would plan the trip against "4" on the way to "45".
 */
function FigureField({
  label,
  value,
  suffix,
  placeholder,
  disabled,
  testId,
  onCommit,
}: {
  label: string;
  value: number | undefined;
  suffix: string;
  placeholder: string;
  disabled: boolean;
  testId: string;
  onCommit: (value: number) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? (value ? String(value) : '');
  const commit = () => {
    if (draft === null) return;
    setDraft(null);
    const next = parseFigure(draft);
    if (next !== (value ?? 0)) onCommit(next);
  };
  return (
    <span className="flex flex-none items-center gap-1.5">
      <input
        type="text"
        inputMode="numeric"
        dir="ltr"
        aria-label={label}
        data-testid={testId}
        value={shown}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9.,]/g, ''))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className="h-9 w-[5.5rem] rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-sheet)] px-3 text-end text-body font-semibold tabular-nums text-m-ink outline-none placeholder:font-medium placeholder:text-m-faint disabled:opacity-60"
      />
      <span className="w-7 text-caption text-m-faint">{suffix}</span>
    </span>
  );
}

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

const HINT = 'font-geist text-caption leading-snug text-m-faint';

interface CardProps {
  tripId: number;
  readOnly: boolean;
  onSave: (key: string, value: number | string | boolean) => void;
}

/** How long one stretch and one day may be, in minutes. */
function DrivingCard({ tripId, readOnly, onSave }: CardProps) {
  const { t } = useTranslation();
  const leg = useRoadtripSettings((all) => all.roadtrip_leg_minutes, tripId);
  const day = useRoadtripSettings((all) => all.roadtrip_day_minutes, tripId);
  const rows = [
    { key: 'roadtrip_leg_minutes', label: t('roadtrip.limit.legLabel'), value: leg, testId: 'rt-edit-leg' },
    { key: 'roadtrip_day_minutes', label: t('roadtrip.limit.dayLabel'), value: day, testId: 'rt-edit-day' },
  ];
  return (
    <EditCard label={t('roadtrip.limit.sectionDriving')}>
      {rows.map((row, i) => (
        <EditRow key={row.key} label={row.label} first={i === 0}>
          <FigureField
            label={row.label}
            value={row.value}
            suffix={t('roadtrip.limit.minutes')}
            placeholder={t('roadtrip.limit.off')}
            disabled={readOnly}
            testId={row.testId}
            onCommit={(v) => onSave(row.key, v)}
          />
        </EditRow>
      ))}
      <p className={`pb-1 ${HINT}`}>{t('roadtrip.limit.hint')}</p>
    </EditCard>
  );
}

/** A choice between a few words, faded and out of reach for a reader. */
function Choice<T extends string>({
  readOnly,
  value,
  options,
  onChange,
}: {
  readOnly: boolean;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className={readOnly ? 'pointer-events-none opacity-60' : ''} aria-disabled={readOnly || undefined}>
      <MSegmented value={value} onChange={onChange} options={options} />
    </div>
  );
}

/** When the day may start and end, and whether it ends on the road or at a stop. */
function WindowCard({
  tripId,
  readOnly,
  onSave,
  onResetDayBoundaries,
}: CardProps & {
  onResetDayBoundaries?: () => Promise<void>;
}) {
  const { t } = useTranslation();
  const storedStart = useRoadtripSettings((all) => all.roadtrip_day_start, tripId) ?? '';
  const storedEnd = useRoadtripSettings((all) => all.roadtrip_day_end, tripId) ?? '';
  const endMode = useRoadtripSettings((all) => all.roadtrip_day_end_mode, tripId) === 'stop' ? 'stop' : 'route';
  // What is in the pickers, ahead of a time that is whole enough to save.
  const [times, setTimes] = useState<{ start?: string; end?: string }>({});
  const shown = { start: times.start ?? storedStart, end: times.end ?? storedEnd };
  const stored = { start: storedStart, end: storedEnd };
  const invalid = !!shown.start && !!shown.end && !dayWindow(shown.start, shown.end);
  const setTime = (field: 'start' | 'end', value: string) => {
    setTimes((prev) => ({ ...prev, [field]: value }));
    if (value !== '' && !TIME_RE.test(value)) return;
    if (value !== stored[field]) onSave(`roadtrip_day_${field}`, value);
  };
  return (
    <EditCard label={t('roadtrip.window.title')}>
      {(['start', 'end'] as const).map((field, i) => (
        <EditRow key={field} label={t(`roadtrip.window.${field}`)} first={i === 0}>
          <span className="w-[7rem] flex-none">
            <CustomTimePicker
              value={shown[field]}
              disabled={readOnly}
              aria-label={t(`roadtrip.window.${field}`)}
              aria-invalid={invalid || undefined}
              onChange={(value) => setTime(field, value)}
            />
          </span>
        </EditRow>
      ))}
      <p
        role={invalid ? 'alert' : undefined}
        className={`pb-2 ${invalid ? 'font-geist text-caption leading-snug text-danger' : HINT}`}
      >
        {t(invalid ? 'roadtrip.window.invalid' : 'roadtrip.window.hint')}
      </p>
      <div className="border-t border-[color:var(--m-rowbr)] pt-2.5">
        <div className="mb-2 text-body text-m-muted">{t('roadtrip.window.endAt')}</div>
        <Choice
          readOnly={readOnly}
          value={endMode}
          onChange={(mode) => onSave('roadtrip_day_end_mode', mode)}
          options={[
            { value: 'route', label: t('roadtrip.window.onRoute') },
            { value: 'stop', label: t('roadtrip.window.atStop') },
          ]}
        />
        <p className={`mt-2 ${HINT}`}>
          {t(endMode === 'stop' ? 'roadtrip.window.stopHint' : 'roadtrip.window.routeHint')}
        </p>
        {onResetDayBoundaries && !readOnly && (
          <button
            type="button"
            onClick={() => void onResetDayBoundaries()}
            className="mt-2 min-h-9 text-start text-caption font-semibold text-m-ink underline-offset-2 active:underline"
          >
            {t('roadtrip.window.resetBoundaries')}
          </button>
        )}
      </div>
    </EditCard>
  );
}

/** The vehicle, how far it goes, and how full a stop fills it. */
function VehicleCard({ tripId, readOnly, onSave }: CardProps) {
  const { t } = useTranslation();
  const imperial = useSettingsStore((st) => st.settings.distance_unit) === 'imperial';
  const s = useRoadtripSettings((all) => all, tripId);
  const vehicle = s.roadtrip_vehicle ?? '';
  const vehicleKind: VehicleKind | null = vehicle === 'combustion' || vehicle === 'electric' ? vehicle : null;
  const computedKm = rangeFromSpec(vehicleKind, {
    tankLitres: s.roadtrip_tank_litres,
    litresPer100: s.roadtrip_litres_per_100,
    batteryKwh: s.roadtrip_battery_kwh,
    kwhPer100: s.roadtrip_kwh_per_100,
    degradationPercent: s.roadtrip_battery_degradation,
  } satisfies VehicleSpec);
  const rangeKm = computedKm ?? s.roadtrip_range_km;
  // Kilometres in storage, the traveller's own unit on screen, as on the desktop.
  const rangeShown = rangeKm ? Math.round(convertDistance(rangeKm, imperial ? 'imperial' : 'metric')) : undefined;
  const rangeLabel = t(vehicleKind === 'electric' ? 'roadtrip.limit.rangeLabelCharge' : 'roadtrip.limit.rangeLabel');
  return (
    <EditCard label={t('roadtrip.limit.vehicleLabel')}>
      <div className="pb-1.5 pt-1">
        <Choice
          readOnly={readOnly}
          value={vehicleKind ?? 'any'}
          onChange={(kind) => onSave('roadtrip_vehicle', kind === 'any' ? '' : kind)}
          options={[
            { value: 'any', label: t('roadtrip.limit.vehicleAny') },
            { value: 'combustion', label: t('roadtrip.limit.vehicleCombustion') },
            { value: 'electric', label: t('roadtrip.limit.vehicleElectric') },
          ]}
        />
      </div>
      <EditRow label={rangeLabel}>
        <FigureField
          label={rangeLabel}
          value={rangeShown}
          suffix={imperial ? 'mi' : 'km'}
          placeholder={t('roadtrip.limit.off')}
          // Worked out from the vehicle's own figures: those are set on the desktop, and a
          // second answer here would leave nobody knowing which one the warnings use.
          disabled={readOnly || computedKm !== null}
          testId="rt-edit-range"
          onCommit={(v) => onSave('roadtrip_range_km', Math.round(imperial ? v / 0.621371 : v))}
        />
      </EditRow>
      <EditRow label={t('roadtrip.limit.fillLabel')}>
        <FigureField
          label={t('roadtrip.limit.fillLabel')}
          value={s.roadtrip_fill_percent}
          suffix="%"
          placeholder={t('roadtrip.limit.fillFull')}
          disabled={readOnly}
          testId="rt-edit-fill"
          onCommit={(v) => onSave('roadtrip_fill_percent', Math.min(100, v))}
        />
      </EditRow>
      {computedKm !== null && <p className={`pb-1 ${HINT}`}>{t('roadtrip.limit.computed')}</p>}
    </EditCard>
  );
}

/** What the road may avoid: one stored list that each switch adds to or takes from. */
function AvoidCard({ tripId, readOnly, onSave }: CardProps) {
  const { t } = useTranslation();
  const avoiding = parseAvoid(useRoadtripSettings((all) => all.roadtrip_avoid, tripId));
  // No second engine, no avoidance: the switches stay, disabled, and the hint says why.
  const canAvoid = valhallaAvailable();
  const rows: { cls: RouteAvoidClass; label: string }[] = [
    { cls: 'toll', label: t('roadtrip.avoid.toll') },
    { cls: 'motorway', label: t('roadtrip.avoid.motorway') },
    { cls: 'ferry', label: t('roadtrip.avoid.ferry') },
  ];
  const toggle = (cls: RouteAvoidClass) =>
    onSave(
      'roadtrip_avoid',
      serializeAvoid(avoiding.includes(cls) ? avoiding.filter((c) => c !== cls) : [...avoiding, cls])
    );
  return (
    <EditCard label={t('roadtrip.avoid.section')}>
      {rows.map(({ cls, label }, i) => (
        <EditRow key={cls} label={label} first={i === 0}>
          <MToggle
            checked={avoiding.includes(cls)}
            onChange={() => toggle(cls)}
            ariaLabel={label}
            disabled={readOnly || !canAvoid}
          />
        </EditRow>
      ))}
      <p className={`pb-1 ${HINT}`}>{t(canAvoid ? 'roadtrip.avoid.hint' : 'roadtrip.avoid.unavailable')}</p>
    </EditCard>
  );
}

export default function MRtLimitsEditor({
  onResetDayBoundaries,
  ...card
}: CardProps & {
  onResetDayBoundaries?: () => Promise<void>;
}) {
  return (
    <div className="flex flex-col gap-2.5" data-testid="rt-limits-editor">
      <DrivingCard {...card} />
      <WindowCard {...card} onResetDayBoundaries={onResetDayBoundaries} />
      <VehicleCard {...card} />
      <AvoidCard {...card} />
    </div>
  );
}
