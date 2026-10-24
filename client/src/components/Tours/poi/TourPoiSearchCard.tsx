import type { TourPoi, WalkTheme } from '@trek/shared';
import { placesInTour, TOUR_POI_CORRIDORS_M } from '@trek/shared';
import {
  Check,
  ChevronDown,
  Coffee,
  Landmark,
  Loader2,
  RefreshCw,
  Route,
  Search,
  Shuffle,
  Star,
  Trees,
  Undo2,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from '../../../i18n';
import { useSettingsStore } from '../../../store/settingsStore';
import { useTourPoiStore } from '../../../store/tourPoiStore';
import { formatDistance } from '../../../utils/units';
import { TOUR_POI_LOOKS } from '../../Map/poiCategories';
import { PopoverItem } from '../../Packing/PackingPopover';
import { SoftPill, WhiteBadge } from '../../Planner/planParts';
import { PopoverListPanel, Segmented } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { usePopoverList } from '../../shared/usePopoverList';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { RailCard, TourNotice } from '../tourParts';
import { formatPlannedTourDuration } from '../tourPresentation';
import { SearchNotices } from './TourPoiSearchNotices';
import { usePoiInsertion, type InsertionOutcome } from './usePoiInsertion';
import { useSelectedPoi, useTourPoiSearch, type TourPoiSearch } from './useTourPoiSearch';

type Unit = Parameters<typeof formatDistance>[1];

const km = (metres: number) => metres / 1000;

/** A category to search for, as a chip: its icon in its map colour, ticked or not. */
/**
 * What is searched for, in one line: the chosen categories' icons and names,
 * with every category the tour type offers in a list that stays open while
 * they are ticked. A theme of a city walk sets them all at once above it.
 */
function CategoryPicker({ search }: { search: TourPoiSearch }) {
  const { t } = useTranslation();
  const list = usePopoverList(0, { estimatedHeight: 320 });
  const { open, toggle, triggerRef, listId } = list;
  const chosen = search.offered.filter((category) => search.categories.includes(category));
  const names = chosen.map((category) => t(TOUR_POI_LOOKS[category].labelKey));
  const summary =
    names.length === 0
      ? t('tours.poi.categoriesNone')
      : names.length <= 2
        ? names.join(', ')
        : t('tours.poi.categoriesMore', { first: names.slice(0, 2).join(', '), more: names.length - 2 });
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-testid="tour-poi-categories"
        className="flex w-full min-w-0 items-center gap-2 rounded-[10px] border border-edge bg-surface-input px-2.5 py-1.5 text-start hover:border-content-faint"
      >
        <span className="sr-only">{t('tours.poi.categories')}: </span>
        <span className="flex flex-none" aria-hidden="true">
          {chosen.slice(0, 3).map((category, index) => {
            const look = TOUR_POI_LOOKS[category];
            return (
              <span
                key={category}
                className={`grid h-5 w-5 place-items-center rounded-full bg-surface-card ring-2 ring-[color:var(--bg-card)] ${index > 0 ? '-ms-1' : ''}`}
                style={{ color: look.color }}
              >
                <look.Icon size={11} strokeWidth={2.2} />
              </span>
            );
          })}
        </span>
        <span className="min-w-0 flex-1 truncate font-medium text-content" style={fs(12, 'body')}>
          {summary}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
          className={`flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <PopoverListPanel list={list} label={t('tours.poi.categories')} className="min-w-[240px]">
        {search.offered.map((category) => {
          const look = TOUR_POI_LOOKS[category];
          return (
            <PopoverItem
              key={category}
              icon={<look.Icon size={13} strokeWidth={2.2} style={{ color: look.color }} />}
              label={t(look.labelKey)}
              active={search.categories.includes(category)}
              onClick={() => search.toggleCategory(category)}
            />
          );
        })}
        {search.categoryLimitReached && (
          <p className="m-0 px-2.5 py-1.5 text-content-muted" style={fs(11, 'body')} role="status">
            {t('tours.poi.categoriesLimit', { count: search.categoryLimit })}
          </p>
        )}
      </PopoverListPanel>
    </>
  );
}

const THEME_ICONS: Record<WalkTheme, LucideIcon> = { culture: Landmark, parks: Trees, food: Coffee, mixed: Shuffle };

/**
 * CW-05: a city walk's four themes as a grid of two by two, each naming
 * itself in full; the one the categories below match is on.
 */
function ThemeGrid({
  themes,
  active,
  onChoose,
}: {
  themes: readonly WalkTheme[];
  active: WalkTheme | null;
  onChoose: (theme: WalkTheme) => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-2 gap-1.5" role="group" aria-label={t('tours.walk.themes')}>
      {themes.map((theme) => {
        const Icon = THEME_ICONS[theme];
        const on = theme === active;
        return (
          <button
            key={theme}
            type="button"
            onClick={() => onChoose(theme)}
            aria-pressed={on}
            title={t(`tours.walk.themeHint.${theme}`)}
            data-testid={`tour-poi-theme-${theme}`}
            className={`flex min-w-0 items-center gap-2 rounded-[10px] px-2.5 py-2 text-start font-medium leading-tight transition-colors ${on ? 'bg-surface-card text-content shadow-sm ring-1 ring-inset ring-edge-faint' : 'bg-surface-tertiary text-content-muted hover:text-content'}`}
            style={fs(11.5, 'body')}
          >
            <Icon size={13} strokeWidth={2.2} className="flex-none" aria-hidden="true" />
            <span className="min-w-0">{t(`tours.walk.theme.${theme}`)}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * One place found, in one line: its kind's icon in its map colour, its name,
 * and how far it lies from the route. A click opens its card over the map,
 * where the rest is said and the place is taken in as a stop.
 */
function PoiRow({ poi, selected, inTour, unit }: { poi: TourPoi; selected: boolean; inTour: boolean; unit: Unit }) {
  const { t } = useTranslation();
  const select = useTourPoiStore((state) => state.select);
  const look = TOUR_POI_LOOKS[poi.category];
  const rowRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (selected) rowRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [selected]);
  const distance = formatDistance(km(poi.distance_m), unit);
  return (
    <li ref={rowRef} data-testid={`tour-poi-${poi.id}`}>
      <button
        type="button"
        onClick={() => select(poi.id)}
        aria-pressed={selected}
        className={`flex w-full min-w-0 items-center gap-2 rounded-[8px] px-1.5 py-1 text-start transition-colors hover:bg-surface-hover ${selected ? 'bg-surface-selected' : ''}`}
      >
        {/* The category's own map colour, as its pin on the map has it: a light wash, the icon in full. */}
        <span
          className="grid h-6 w-6 flex-none place-items-center rounded-full"
          style={{ background: `color-mix(in srgb, ${look.color} 16%, transparent)`, color: look.color }}
        >
          <look.Icon size={12} strokeWidth={2.2} />
        </span>
        {/* One of the best known places along the route: a star before its name. */}
        {poi.highlight && (
          <span
            role="img"
            aria-label={t('tours.poi.highlight')}
            title={t('tours.poi.highlightHint')}
            className="flex-none text-warning"
            data-testid="tour-poi-highlight"
          >
            <Star size={12} strokeWidth={2.2} fill="currentColor" aria-hidden="true" />
          </span>
        )}
        <span
          className={`min-w-0 flex-1 truncate font-medium ${inTour ? 'text-content-muted' : 'text-content'}`}
          style={fs(12, 'body')}
        >
          {poi.name || t(look.labelKey)}
        </span>
        {inTour ? (
          <SoftPill icon={<Check size={10} strokeWidth={2.4} className="flex-none" />}>
            {t('tours.placePicker.inTour')}
          </SoftPill>
        ) : (
          <span
            className="flex-none tabular-nums text-content-faint"
            style={fs(11, 'body')}
            title={t('tours.poi.fromRoute', { distance })}
          >
            {distance}
          </span>
        )}
      </button>
    </li>
  );
}

/**
 * What taking a place in did: being planned, the route's change, or that it
 * could not be told; with the way back while that step is the last one made.
 */
function OutcomeNotice({
  outcome,
  onDismiss,
  onUndo,
  unit,
}: {
  outcome: InsertionOutcome;
  onDismiss: () => void;
  onUndo: (() => void) | null;
  unit: Unit;
}) {
  const { t } = useTranslation();
  const signed = (value: string, negative: boolean) => `${negative ? '−' : '+'}${value}`;
  return (
    <div role="status" data-testid="tour-poi-outcome">
      <TourNotice
        icon={
          outcome.kind === 'measuring' ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Route size={13} strokeWidth={2} />
          )
        }
      >
        <span className="flex items-start gap-2">
          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            <span>{t(`tours.poi.outcome.${outcome.kind}`, { name: outcome.name })}</span>
            {outcome.kind === 'measured' && (
              <>
                <WhiteBadge>
                  {signed(formatDistance(km(Math.abs(outcome.extraM)), unit), outcome.extraM < 0)}
                </WhiteBadge>
                {outcome.extraMinutes != null && (
                  <WhiteBadge>
                    {signed(formatPlannedTourDuration(Math.abs(outcome.extraMinutes)), outcome.extraMinutes < 0)}
                  </WhiteBadge>
                )}
              </>
            )}
            {onUndo && (
              <button
                type="button"
                onClick={onUndo}
                data-testid="tour-poi-undo"
                className="inline-flex flex-none items-center gap-1 rounded-full px-1.5 font-semibold text-content hover:bg-surface-hover"
                style={fs(11.5, 'body')}
              >
                <Undo2 size={12} strokeWidth={2.2} aria-hidden="true" />
                {t('undo.button')}
              </button>
            )}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            aria-label={t('common.close')}
            className="flex-none rounded p-0.5 text-content-faint hover:text-content"
          >
            <X size={12} strokeWidth={2.4} aria-hidden="true" />
          </button>
        </span>
      </TourNotice>
    </div>
  );
}

/**
 * PLN-02/PLN-03: the card of the editor that looks for places along the tour
 * and takes one in as a stop. Searching changes nothing; only the add button
 * of a place does, as one step that undo takes back.
 */
export function TourPoiSearchCard({ planner }: { planner: TourPlannerController }) {
  const { t } = useTranslation();
  const unit = useSettingsStore((state) => state.settings.distance_unit) ?? 'metric';
  const search = useTourPoiSearch(planner);
  const insertion = usePoiInsertion(planner);
  const selected = useSelectedPoi();
  const pois = search.answer?.pois ?? [];
  const inTour = placesInTour(pois, planner.waypoints);
  if (!planner.route || planner.route.length < 2) return null;
  return (
    <RailCard
      icon={<Search size={14} strokeWidth={2} />}
      title={t('tours.poi.title')}
      foldId="along-tour"
      aside={
        search.answer ? (
          <span className="flex-none tabular-nums text-content-faint" style={fs(11.5, 'body')}>
            {pois.length}
          </span>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-3" data-testid="tour-poi-card">
        {search.themes.length > 0 && (
          <div data-testid="tour-poi-themes">
            <ThemeGrid themes={search.themes} active={search.theme} onChoose={search.chooseTheme} />
          </div>
        )}
        <CategoryPicker search={search} />
        <div className="flex flex-col gap-1.5">
          <span className="text-content-muted" style={fs(11, 'body')}>
            {t('tours.poi.within')}
          </span>
          <Segmented<string>
            fill
            label={t('tours.poi.within')}
            value={String(search.corridorM)}
            onChange={(value) => search.setCorridorM(Number(value))}
            options={TOUR_POI_CORRIDORS_M.map((metres) => ({
              value: String(metres),
              label: formatDistance(km(metres), unit),
            }))}
          />
        </div>
        <button
          type="button"
          onClick={() => void search.search()}
          disabled={!search.canSearch}
          title={search.outdated ? t('tours.poi.outdated') : undefined}
          data-testid="tour-poi-search"
          data-outdated={search.outdated || undefined}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-[10px] font-semibold transition-colors disabled:cursor-default disabled:opacity-50 ${search.outdated ? 'bg-accent text-accent-text hover:opacity-90' : 'bg-surface-tertiary text-content hover:bg-surface-hover'}`}
          style={fs(12.5, 'body')}
        >
          {search.status === 'loading' ? (
            <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
          ) : search.answer ? (
            <RefreshCw size={14} strokeWidth={2.2} />
          ) : (
            <Search size={14} strokeWidth={2.2} />
          )}
          {t(
            search.status === 'loading' ? 'tours.poi.searching' : search.answer ? 'tours.poi.again' : 'tours.poi.search'
          )}
        </button>
        {/* The size is set either way: the line stays hidden while the answer is current, so it only shows once it speaks. */}
        <p role="status" className={search.outdated ? 'm-0 text-content-muted' : 'sr-only'} style={fs(11, 'body')}>
          {search.outdated ? t('tours.poi.outdated') : ''}
        </p>
        {insertion.outcome && (
          <OutcomeNotice
            outcome={insertion.outcome}
            onDismiss={insertion.dismiss}
            onUndo={insertion.undo}
            unit={unit}
          />
        )}
        <SearchNotices search={search} unit={unit} />
        {pois.length > 0 && (
          <ul
            className={`m-0 flex max-h-[320px] list-none flex-col gap-px overflow-y-auto overscroll-contain p-0 ${search.status === 'loading' ? 'opacity-60' : ''}`}
            data-testid="tour-poi-list"
          >
            {pois.map((poi) => (
              <PoiRow
                key={poi.id}
                poi={poi}
                selected={selected?.id === poi.id}
                inTour={inTour.has(poi.id)}
                unit={unit}
              />
            ))}
          </ul>
        )}
      </div>
    </RailCard>
  );
}
