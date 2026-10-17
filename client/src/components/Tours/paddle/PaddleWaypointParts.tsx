import { DEFAULT_PORTAGE_EXTRA_MINUTES, MAX_PADDLE_STOP_MINUTES, type PaddleLock, type PaddleRole } from '@trek/shared';
import { ChevronDown, X } from 'lucide-react';
import { useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { formatDistance } from '../../../utils/units';
import { fs } from '../../shared/DialogShell';
import { PaddleGlyph } from './PaddleGlyph';
import { PORTAGE_CSS_COLOR } from './paddlePaint';

const ROLE_GLYPH = { put_in: 'put_in', take_out: 'take_out', re_entry: 'put_in', final_take_out: 'take_out' } as const;

/** Put-in, take-out, re-entry or final take-out, as the badge of a waypoint row of a paddle tour. */
export function PaddleRolePill({ role }: { role: PaddleRole }) {
  const { t } = useTranslation();
  const land = role === 'take_out' || role === 're_entry';
  return (
    <span
      data-paddle-role={role}
      className="inline-flex h-[20px] min-w-0 flex-none items-center gap-1 whitespace-nowrap rounded-full bg-surface-secondary px-2 font-geist leading-none text-content-secondary"
      style={fs(10.5)}
    >
      <PaddleGlyph
        kind={ROLE_GLYPH[role]}
        size={11}
        strokeWidth={2.4}
        style={land ? { color: PORTAGE_CSS_COLOR } : undefined}
      />
      {t(`tours.paddle.role.${role}`)}
    </span>
  );
}

/**
 * A number of minutes typed in place: a value or nothing. Text that is no
 * whole number of minutes in range is dropped on leaving the field, and the
 * value before it stays.
 */
function MinutesInput({
  label,
  value,
  placeholder,
  disabled,
  onChange,
  testId,
}: {
  label: string;
  value: number | null;
  /** What shows while there is no value: the starting value, or a dash. */
  placeholder: string;
  disabled: boolean;
  onChange: (minutes: number | null) => void;
  testId?: string;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const commit = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (trimmed === '') return onChange(null);
      const minutes = Number(trimmed);
      if (Number.isInteger(minutes) && minutes >= 0 && minutes <= MAX_PADDLE_STOP_MINUTES) onChange(minutes);
    },
    [onChange]
  );
  return (
    <label className="inline-flex h-[26px] flex-none items-center gap-1 rounded-full border border-edge bg-surface-card pe-2.5 ps-2.5 transition-colors focus-within:border-accent">
      <input
        data-testid={testId}
        type="text"
        inputMode="numeric"
        aria-label={label}
        disabled={disabled}
        value={draft ?? (value === null ? '' : String(value))}
        placeholder={placeholder}
        onFocus={() => setDraft(value === null ? '' : String(value))}
        onChange={(event) => setDraft(event.target.value.replace(/[^\d]/g, '').slice(0, 3))}
        onBlur={() => {
          if (draft !== null) commit(draft);
          setDraft(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.currentTarget.blur();
          if (event.key === 'Escape') {
            setDraft(null);
            event.currentTarget.blur();
          }
        }}
        className="w-[3ch] min-w-0 bg-transparent text-end font-geist font-semibold tabular-nums text-content outline-none placeholder:font-normal placeholder:text-content-faint"
        style={fs(12)}
      />
      <span className="text-content-faint" style={fs(11)}>
        min
      </span>
    </label>
  );
}

/** One labelled value of an opened stop, its input on the right. */
function StopField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="min-w-0 flex-1">
        <span className="block truncate text-content" style={fs(12, 'body')}>
          {label}
        </span>
        {hint && (
          <span className="block truncate text-content-faint" style={fs(10.5, 'body')}>
            {hint}
          </span>
        )}
      </span>
      {children}
    </div>
  );
}

/** A value of a stop as the closed card shows it: quiet, or in the warning tone when it is missing. */
function StopPill({ children, missing = false }: { children: ReactNode; missing?: boolean }) {
  return (
    <span
      className={`flex-none rounded-full px-1.5 font-geist tabular-nums leading-[18px] ${missing ? 'bg-warning-soft text-warning' : 'bg-surface-secondary text-content-secondary'}`}
      style={fs(10.5)}
    >
      {children}
    </span>
  );
}

/** The quiet way to take a stop off again, at the foot of its opened card. */
function RemoveStop({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="flex items-center gap-1 self-start rounded-full px-1 text-danger transition-opacity hover:opacity-80"
      style={fs(11.5, 'body')}
    >
      <X size={12} strokeWidth={2.4} />
      {label}
    </button>
  );
}

/**
 * A portage or a lock under its waypoint, in the shape of the via ferrata leg:
 * a round glyph, the name and its values as pills. A click opens it to change
 * those values in labelled fields, and closes it again.
 */
function StopCard({
  testId,
  glyph,
  color,
  title,
  pills,
  muted = false,
  children,
}: {
  testId: string;
  glyph: ReactNode;
  /** The colour of its ring and its round glyph: the portage brown, or the quiet default. */
  color?: string;
  title: string;
  pills: ReactNode;
  muted?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li data-testid={testId} className="flex min-w-0 flex-col gap-1 py-0.5 ps-[34px]">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-[28px] w-full min-w-0 items-center gap-1.5 rounded-full bg-surface-card pe-1.5 ps-1 text-start shadow-sm ring-1 ring-inset ring-edge-faint transition-colors hover:bg-surface-hover ${muted ? 'opacity-60' : ''}`}
        style={color ? { boxShadow: `inset 0 0 0 1px ${color}` } : undefined}
      >
        <span
          className="grid h-[20px] w-[20px] flex-none place-items-center rounded-full bg-content-secondary text-surface-card"
          style={color ? { background: color } : undefined}
        >
          {glyph}
        </span>
        <span className="min-w-0 flex-1 truncate font-semibold text-content" style={fs(11.5, 'body')}>
          {title}
        </span>
        {pills}
        <ChevronDown
          size={13}
          strokeWidth={2.2}
          className={`flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-2 rounded-[12px] border border-edge-faint bg-surface-card px-2.5 py-2">
          {children}
        </div>
      )}
    </li>
  );
}

/**
 * A portage under the point it starts at, in the earth brown the map draws it
 * in: its length on land and the time for getting out, unloading and back in
 * (the starting value until one is typed).
 */
export function PortageLegRow({
  lengthM,
  extraMinutes,
  disabled,
  onExtraChange,
  position,
  onRemove,
}: {
  lengthM: number;
  extraMinutes: number | null;
  disabled: boolean;
  onExtraChange: (minutes: number | null) => void;
  /** Where it lies on a recorded track ("at 4.2 km"); a planned tour shows it under its waypoint instead. */
  position?: string;
  /** Takes the portage off a recorded track; a planned tour carries it on its leg instead. */
  onRemove?: () => void;
}) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit);
  const extra = extraMinutes ?? DEFAULT_PORTAGE_EXTRA_MINUTES;
  return (
    <StopCard
      testId="tour-planner-portage-leg"
      glyph={<PaddleGlyph kind="portage" size={12} strokeWidth={2.4} />}
      color={PORTAGE_CSS_COLOR}
      title={t('tours.paddle.portage')}
      pills={
        <>
          {position && <StopPill>{position}</StopPill>}
          <StopPill>{formatDistance(lengthM / 1000, unit ?? 'metric')}</StopPill>
          <StopPill>{`+${extra} min`}</StopPill>
        </>
      }
    >
      <p className="m-0 leading-snug text-content-muted" style={fs(11.5, 'body')}>
        {t('tours.paddle.portageInfo')}
      </p>
      {onRemove && !disabled && <RemoveStop label={t('tours.paddle.portageRemove')} onRemove={onRemove} />}
      <StopField
        label={t('tours.paddle.portageExtra')}
        hint={extraMinutes === null ? t('tours.paddle.startValue') : undefined}
      >
        <MinutesInput
          testId="tour-planner-portage-extra"
          label={t('tours.paddle.portageExtra')}
          value={extraMinutes}
          placeholder={String(DEFAULT_PORTAGE_EXTRA_MINUTES)}
          disabled={disabled}
          onChange={onExtraChange}
        />
      </StopField>
    </StopCard>
  );
}

/**
 * A lock at a waypoint with the wait and the passage expected there. A time
 * not typed is missing, never zero, and the closed card says so; a lock a
 * portage carries round is dimmed and its times do not count.
 */
export function LockRow({
  lock,
  bypassed,
  disabled,
  onChange,
  position,
}: {
  lock: PaddleLock;
  bypassed: boolean;
  disabled: boolean;
  onChange: (lock: PaddleLock | null) => void;
  /** Where it lies on a recorded track ("at 4.2 km"). */
  position?: string;
}) {
  const { t } = useTranslation();
  const missing = lock.wait_minutes === null || lock.transit_minutes === null;
  const known = (lock.wait_minutes ?? 0) + (lock.transit_minutes ?? 0);
  const lockPill = bypassed ? (
    <StopPill>{t('tours.paddle.lockBypassed')}</StopPill>
  ) : missing ? (
    <StopPill missing>{t('tours.paddle.timeMissing')}</StopPill>
  ) : (
    <StopPill>{`${known} min`}</StopPill>
  );
  return (
    <StopCard
      testId="tour-planner-lock"
      glyph={<PaddleGlyph kind="lock" size={12} strokeWidth={2.4} />}
      title={t('tours.paddle.lock')}
      muted={bypassed}
      pills={
        <>
          {position && <StopPill>{position}</StopPill>}
          {lockPill}
        </>
      }
    >
      <StopField label={t('tours.paddle.lockWait')}>
        <MinutesInput
          testId="tour-planner-lock-wait"
          label={t('tours.paddle.lockWait')}
          value={lock.wait_minutes}
          placeholder="–"
          disabled={disabled}
          onChange={(minutes) => onChange({ ...lock, wait_minutes: minutes })}
        />
      </StopField>
      <StopField label={t('tours.paddle.lockTransit')}>
        <MinutesInput
          testId="tour-planner-lock-transit"
          label={t('tours.paddle.lockTransit')}
          value={lock.transit_minutes}
          placeholder="–"
          disabled={disabled}
          onChange={(minutes) => onChange({ ...lock, transit_minutes: minutes })}
        />
      </StopField>
      {!disabled && <RemoveStop label={t('tours.paddle.lockRemove')} onRemove={() => onChange(null)} />}
    </StopCard>
  );
}
