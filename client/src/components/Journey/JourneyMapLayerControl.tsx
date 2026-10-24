import { CalendarRange, Images, Info, Loader2, NotebookPen, Route } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import { FROSTED_SHELL, segmentStyle } from '../Map/mapControlShadow';
import { LABEL, PopoverListPanel } from '../shared/dialogParts';
import { fs } from '../shared/DialogShell';
import { Tooltip } from '../shared/Tooltip';
import { usePopoverList } from '../shared/usePopoverList';
import { LAYER_TEXT, type JourneyMapLayerControl as Control, type JourneyMapLayer } from './journeyMapLayers';
import { PLAN_FALLBACK_COLOR } from './journeyMapMarks';
import type { JourneyMapLayersView } from './useJourneyMapLayers';

const ICONS: Record<JourneyMapLayer, ComponentType<{ size?: number; strokeWidth?: number }>> = {
  plan: CalendarRange,
  recorded: Route,
  entries: NotebookPen,
  photos: Images,
};

/** The sample colours of the key: an entry pin of the first day and a recorded line, as the map draws them. */
const SAMPLE_DAY = '#6366f1';
const SAMPLE_ROUTE = '#2563eb';

/** What a switch says about its layer: its name, and why it shows nothing when it does not. */
function hintOf(control: Control, t: (key: string, params?: Record<string, string | number>) => string): string {
  const text = LAYER_TEXT[control.layer];
  const name = t(text.labelKey);
  if (control.state === 'unavailable') return `${name}: ${t(text.unavailableKey)}`;
  if (control.state === 'empty') return `${name}: ${t(text.emptyKey)}`;
  if (control.state === 'loading') return `${name}: ${t('journey.map.layer.loading')}`;
  return name;
}

function LayerToggle({
  control,
  on,
  onToggle,
  compact,
}: {
  control: Control;
  on: boolean;
  onToggle: () => void;
  compact: boolean;
}) {
  const { t } = useTranslation();
  const Icon = ICONS[control.layer];
  const name = t(LAYER_TEXT[control.layer].labelKey);
  const problem = control.state === 'unavailable';
  // Nothing to draw: dimmed rather than gone, and the tooltip says why.
  const quiet = control.state === 'empty' || control.state === 'idle';
  const showBadge = control.state === 'loading' || problem || (control.state === 'ready' && on);
  return (
    <Tooltip label={hintOf(control, t)} placement="bottom">
      <button
        type="button"
        onClick={onToggle}
        aria-label={name}
        aria-pressed={on}
        data-testid={`journey-map-layer-${control.layer}`}
        data-state={control.state}
        className={`${on ? 'bg-accent text-accent-text' : 'text-content-muted hover:bg-surface-hover'} ${quiet ? 'opacity-55' : ''} transition-colors`}
        style={segmentStyle(on)}
      >
        <Icon size={14} strokeWidth={2} />
        {!compact && <span>{name}</span>}
        {showBadge && (
          <span
            aria-hidden
            data-testid={`journey-map-layer-${control.layer}-badge`}
            data-tone={problem ? 'warning' : 'default'}
            className={`inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-semibold tabular-nums leading-none ${
              problem
                ? 'bg-warning-soft text-warning'
                : on
                  ? 'bg-accent-text text-accent'
                  : 'bg-surface-hover text-content-secondary'
            }`}
            style={fs(10)}
          >
            {control.state === 'loading' ? (
              <Loader2 size={10} strokeWidth={2.5} className="motion-safe:animate-spin" />
            ) : problem ? (
              '!'
            ) : (
              control.count
            )}
          </span>
        )}
      </button>
    </Tooltip>
  );
}

/** A hollow plan pin, as the map draws it. */
function PlanPinSample() {
  return (
    <svg width="16" height="20" viewBox="0 0 22 28" aria-hidden className="flex-none">
      <path
        d="M11 26.5C11 26.5 20.5 17.4 20.5 10.2C20.5 5 16.25 1.5 11 1.5C5.75 1.5 1.5 5 1.5 10.2C1.5 17.4 11 26.5 11 26.5Z"
        fill="#ffffff"
        stroke={PLAN_FALLBACK_COLOR}
        strokeWidth="2"
        strokeDasharray="3 2"
      />
      <circle cx="11" cy="10.5" r="3" fill={PLAN_FALLBACK_COLOR} />
    </svg>
  );
}

/** A journal entry's pin, with the plan's check when the plan had that place too. */
function EntryPinSample({ planned = false }: { planned?: boolean }) {
  return (
    <svg width="16" height="20" viewBox="0 0 28 36" aria-hidden className="flex-none">
      <path
        d="M14 34C14 34 26 22.36 26 13C26 6.37 20.63 1 14 1C7.37 1 2 6.37 2 13C2 22.36 14 34 14 34Z"
        fill={SAMPLE_DAY}
      />
      {planned && (
        <>
          <circle cx="22.5" cy="5.5" r="5" fill="#ffffff" stroke="#16a34a" strokeWidth="1.2" />
          <path
            d="M20.4 5.6l1.5 1.5 2.8-2.9"
            fill="none"
            stroke="#16a34a"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

function StaySample() {
  return (
    <svg width="16" height="16" viewBox="0 0 14 14" aria-hidden className="flex-none">
      <circle cx="7" cy="7" r="5" fill={SAMPLE_DAY} stroke="#ffffff" strokeWidth="2" />
    </svg>
  );
}

function SeveralSample() {
  return (
    <svg width="18" height="18" viewBox="0 0 28 28" aria-hidden className="flex-none">
      <circle cx="16" cy="12" r="10" fill="#ffffff" stroke={SAMPLE_DAY} strokeWidth="2" />
      <circle cx="12" cy="16" r="10" fill="#ffffff" stroke={PLAN_FALLBACK_COLOR} strokeWidth="2.5" />
      <text x="12" y="16" textAnchor="middle" dominantBaseline="central" fontSize="11" fontWeight="700" fill="#111827">
        3
      </text>
    </svg>
  );
}

function LineSample({ dashed }: { dashed: boolean }) {
  return (
    <svg width="24" height="8" viewBox="0 0 24 8" aria-hidden className="flex-none">
      <line x1="1" y1="4" x2="23" y2="4" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
      <line
        x1="1"
        y1="4"
        x2="23"
        y2="4"
        stroke={SAMPLE_ROUTE}
        strokeWidth="2.5"
        strokeLinecap={dashed ? 'butt' : 'round'}
        strokeDasharray={dashed ? '4 3' : undefined}
      />
    </svg>
  );
}

const ROW = 'flex min-w-0 items-center gap-2.5 text-content-secondary';

/**
 * The key of the journey map: what each pin, dot and line stands for, with the
 * one rule that matters most: a planned place is no proof of a visit.
 */
function JourneyMapKey() {
  const { t } = useTranslation();
  const rows: { sample: ReactNode; labelKey: string }[] = [
    { sample: <PlanPinSample />, labelKey: 'journey.map.legend.planned' },
    { sample: <EntryPinSample />, labelKey: 'journey.map.legend.entry' },
    { sample: <EntryPinSample planned />, labelKey: 'journey.map.legend.plannedWritten' },
    { sample: <StaySample />, labelKey: 'journey.map.legend.stay' },
    { sample: <SeveralSample />, labelKey: 'journey.map.legend.several' },
  ];
  return (
    <div className="flex flex-col gap-3 p-1.5" data-testid="journey-map-key">
      <span className="font-semibold text-content" style={fs(12.5, 'body')}>
        {t('journey.map.legend')}
      </span>
      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.labelKey} className={ROW} style={fs(11.5, 'body')}>
            <span className="flex w-6 flex-none justify-center">{row.sample}</span>
            <span className="min-w-0">{t(row.labelKey)}</span>
          </li>
        ))}
      </ul>
      <div className="border-t border-edge-faint pt-3">
        <span className={LABEL}>{t('journey.map.legend.lines')}</span>
        <ul className="flex flex-col gap-1.5">
          <li className={ROW} style={fs(11.5, 'body')}>
            <span className="flex w-6 flex-none justify-center">
              <LineSample dashed />
            </span>
            <span className="min-w-0">{t('journey.map.legend.plannedRoute')}</span>
          </li>
          <li className={ROW} style={fs(11.5, 'body')}>
            <span className="flex w-6 flex-none justify-center">
              <LineSample dashed={false} />
            </span>
            <span className="min-w-0">{t('journey.map.legend.recordedRoute')}</span>
          </li>
        </ul>
      </div>
      <p
        className="flex items-start gap-1.5 rounded-lg bg-surface-hover px-2 py-1.5 text-content-secondary"
        style={fs(11)}
      >
        <Info size={12} strokeWidth={2} aria-hidden className="mt-px flex-none" />
        {t('journey.map.legend.planIsNoVisit')}
      </p>
    </div>
  );
}

function KeyButton() {
  const { t } = useTranslation();
  const list = usePopoverList(-1, { estimatedHeight: 360 });
  const { open, toggle, triggerRef, listId } = list;
  const label = t('journey.map.legend');
  return (
    <>
      <Tooltip label={label} placement="bottom" disabled={open}>
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-label={label}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          data-testid="journey-map-key-button"
          className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-full text-content-muted transition-colors hover:bg-surface-hover ${open ? 'bg-surface-hover' : ''}`}
        >
          <Info size={15} strokeWidth={2} />
        </button>
      </Tooltip>
      <PopoverListPanel list={list} label={label} className="w-[268px]">
        <JourneyMapKey />
      </PopoverListPanel>
    </>
  );
}

/**
 * The layer switches of a journey map (JRN-04), in the frosted pill the
 * planner's map controls wear: one per layer the reader is offered, each with
 * its count, a spinner while it loads and the warning tone when it could not
 * be read, and the key beside them. On a phone the switches drop their words;
 * the tooltip and the accessible name still say what each is.
 */
export default function JourneyMapLayerControl({
  layers,
  compact = false,
}: {
  layers: JourneyMapLayersView;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const live = layers.controls
    .filter((control) => control.state === 'loading' || control.state === 'unavailable')
    .map((control) => hintOf(control, t))
    .join('. ');
  return (
    <div
      style={FROSTED_SHELL}
      role="group"
      aria-label={t('journey.map.layers')}
      className="max-w-full gap-0.5 overflow-x-auto"
    >
      {layers.controls.map((control) => (
        <LayerToggle
          key={control.layer}
          control={control}
          on={layers.visibility[control.layer]}
          onToggle={() => layers.toggle(control.layer)}
          compact={compact}
        />
      ))}
      <span aria-hidden className="mx-0.5 h-5 w-px flex-none bg-edge" />
      <KeyButton />
      <span role="status" aria-live="polite" className="sr-only">
        {live}
      </span>
    </div>
  );
}
