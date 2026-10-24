import { CableCar, ExternalLink, Info, ZoomIn } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from '../../../i18n';
import { SoftPill } from '../../Planner/planParts';
import { LABEL, PopoverListPanel } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { usePopoverList } from '../../shared/usePopoverList';
import { TourNotice } from '../tourParts';

/**
 * SKI-01: OpenSnowMap's own paint, read off its map key (opensnowmap.org,
 * pics/mapkey_wide.png) on 20.10.2026. The key repeats what the tiles draw, so
 * these keep their colours in every theme, as the map under them does.
 */
const PAINT = {
  novice: '#41d83e',
  easy: '#2949ca',
  intermediate: '#d51e1e',
  advanced: '#313131',
  expert: '#f37300',
  freeride: '#f3ce00',
  nordic: '#3960ff',
  winterHike: '#f07bbd',
  sled: '#8bff44',
} as const;

type Paint = keyof typeof PAINT;

/** The grades a downhill run is coloured by, as OpenStreetMap's piste:difficulty names them. */
const DOWNHILL: readonly { paint: Paint; labelKey: string }[] = [
  { paint: 'novice', labelKey: 'tours.map.pisteGrade.novice' },
  { paint: 'easy', labelKey: 'tours.map.pisteGrade.easy' },
  { paint: 'intermediate', labelKey: 'tours.map.pisteGrade.intermediate' },
  { paint: 'advanced', labelKey: 'tours.map.pisteGrade.advanced' },
  { paint: 'expert', labelKey: 'tours.map.pisteGrade.expert' },
  { paint: 'freeride', labelKey: 'tours.map.pisteGrade.freeride' },
];

/** The other winter ways the layer draws, each in its one colour; winter walking trails dotted, as on the map. */
const WAYS: readonly { paint: Paint; labelKey: string; dotted?: boolean }[] = [
  { paint: 'nordic', labelKey: 'tours.map.pisteNordic' },
  { paint: 'winterHike', labelKey: 'tours.map.pisteWinterHike', dotted: true },
  { paint: 'sled', labelKey: 'tours.map.pisteSled' },
];

/** The four grades the key's button shows as its badge, the colours a skier knows first. */
const BADGE_GRADES: readonly Paint[] = ['novice', 'easy', 'intermediate', 'advanced'];

/** Where the full key lives: OpenSnowMap's own map, whose menu holds it with the rarer ways and marks. */
const FULL_KEY_URL = 'https://www.opensnowmap.org/';

/** A downhill run as the tiles draw it: a pale band edged in its grade's colour, readable on light and dark alike. */
function RunBand({ colour }: { colour: string }) {
  return (
    <span
      aria-hidden
      className="h-2.5 w-6 flex-none rounded-[3px] border-[1.5px]"
      style={{ borderColor: colour, background: `color-mix(in srgb, ${colour} 22%, white)` }}
    />
  );
}

/** A trail as a line in its colour, or as a row of dots where the map dots it. */
function WayLine({ colour, dotted = false }: { colour: string; dotted?: boolean }) {
  if (!dotted)
    return <span aria-hidden className="h-[3px] w-6 flex-none rounded-full" style={{ background: colour }} />;
  return (
    <span aria-hidden className="flex w-6 flex-none items-center justify-between px-px">
      {[0, 1, 2].map((dot) => (
        <span key={dot} className="h-[5px] w-[5px] rounded-full" style={{ background: colour }} />
      ))}
    </span>
  );
}

const ROW = 'flex min-w-0 items-center gap-2 text-content-secondary';

/**
 * The key's content: the downhill grades, the other ways, what the colours do
 * not say, and where the full key is. Opened further out than the layer's first
 * tiles, it says first that the map has to come closer before anything shows.
 */
function PisteKeyBody({ belowMinZoom }: { belowMinZoom: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-3 p-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-content" style={fs(12.5, 'body')}>
          {t('tours.map.pisteKey')}
        </span>
        <SoftPill>OpenSnowMap</SoftPill>
      </div>
      {belowMinZoom && (
        <p
          className="bg-accent-soft flex items-center gap-1.5 rounded-lg px-2 py-1.5 font-medium text-accent"
          style={fs(11)}
          data-testid="piste-key-zoom-in"
        >
          <ZoomIn size={12} strokeWidth={2.2} aria-hidden className="flex-none" />
          {t('tours.map.pistesZoomIn')}
        </p>
      )}
      <div>
        <span className={LABEL}>{t('tours.map.pisteDownhill')}</span>
        <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5" data-testid="piste-key-grades">
          {DOWNHILL.map(({ paint, labelKey }) => (
            <li key={paint} className={ROW} style={fs(11.5, 'body')}>
              <RunBand colour={PAINT[paint]} />
              <span className="truncate">{t(labelKey)}</span>
            </li>
          ))}
        </ul>
      </div>
      <ul className="flex flex-col gap-1.5 border-t border-edge-faint pt-3" data-testid="piste-key-ways">
        {WAYS.map(({ paint, labelKey, dotted }) => (
          <li key={paint} className={ROW} style={fs(11.5, 'body')}>
            <WayLine colour={PAINT[paint]} dotted={dotted} />
            <span className="truncate">{t(labelKey)}</span>
          </li>
        ))}
        <li className={ROW} style={fs(11.5, 'body')}>
          <span aria-hidden className="flex w-6 flex-none justify-center text-content">
            <CableCar size={14} strokeWidth={2} />
          </span>
          <span className="truncate">{t('tours.map.pisteLift')}</span>
        </li>
      </ul>
      <TourNotice icon={<Info size={12} strokeWidth={2} />}>{t('tours.map.pisteStatic')}</TourNotice>
      <a
        href={FULL_KEY_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 self-start font-semibold text-accent-on hover:underline"
        style={fs(11.5, 'body')}
      >
        {t('tours.map.pisteFullKey')}
        <ExternalLink size={11} strokeWidth={2.2} aria-hidden />
      </a>
    </div>
  );
}

/**
 * SKI-01: the piste layer's key, opened from a button beside its switch while
 * the layer shows. The button carries the grade colours as a small badge, so
 * it reads as the key at a glance; the key itself opens above the map in the
 * popover look and closes on Escape or a click beside it, the map untouched.
 */
export function PisteKeyButton({ belowMinZoom = false }: { belowMinZoom?: boolean }) {
  const { t } = useTranslation();
  const list = usePopoverList(-1, { estimatedHeight: 380 });
  const { open, box, toggle, triggerRef, menuRef, listId } = list;
  const label = t('tours.map.pisteKey');
  const shown = open && !!box;
  // No list to walk here, only the link: opening moves the focus onto it, so Tab and Escape act as in any popover.
  useEffect(() => {
    if (shown) menuRef.current?.querySelector('a')?.focus({ preventScroll: true });
  }, [shown, menuRef]);
  return (
    <>
      <Tooltip label={label} placement="top" disabled={open}>
        <button
          ref={triggerRef}
          type="button"
          onClick={toggle}
          aria-label={label}
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          data-testid="piste-key-button"
          className={`grid h-[34px] w-[34px] flex-none place-items-center rounded-full transition-colors hover:bg-surface-hover ${open ? 'bg-surface-hover' : ''}`}
        >
          <span
            aria-hidden
            className="grid grid-cols-2 gap-[2px] rounded-[5px] bg-surface-card p-[3px] shadow-sm ring-1 ring-edge"
          >
            {BADGE_GRADES.map((paint) => (
              <span key={paint} className="h-[5px] w-[5px] rounded-full" style={{ background: PAINT[paint] }} />
            ))}
          </span>
        </button>
      </Tooltip>
      <PopoverListPanel list={list} label={label} className="w-[272px]">
        <PisteKeyBody belowMinZoom={belowMinZoom} />
      </PopoverListPanel>
    </>
  );
}
