import type { TourPoi } from '@trek/shared';
import { insertionPreview, isClosedLoop, straightDetourM, type InsertionSlot } from '@trek/shared';
import { ChevronDown, CornerDownRight, Flag, Info, Plus } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { formatDistance } from '../../../utils/units';
import { PopoverItem } from '../../Packing/PackingPopover';
import { SoftPill, WhiteBadge } from '../../Planner/planParts';
import { PopoverListPanel } from '../../shared/dialogParts';
import { fs } from '../../shared/DialogShell';
import { Tooltip } from '../../shared/Tooltip';
import { usePopoverList } from '../../shared/usePopoverList';
import type { TourPlannerWaypoint } from '../planner/tourPlannerWaypoints';
import type { TourPlannerController } from '../planner/useTourPlanner';
import { useWaypointPlaceNames } from '../planner/useWaypointPlaceNames';
import type { usePoiInsertion } from './usePoiInsertion';

type Unit = Parameters<typeof formatDistance>[1];

/**
 * What each point is called in a slot: the name it carries or its place's,
 * else its number among the stops as the map has it. A shaping point only
 * steers; the way back of a loop is called as its start.
 */
function usePointLabels(points: TourPlannerWaypoint[]): Map<string, string> {
  const { t } = useTranslation();
  const names = useWaypointPlaceNames(points);
  const labels = new Map<string, string>();
  let stop = 0;
  for (const point of points) {
    if (point.shaping) {
      labels.set(point.id, t('tours.planner.shapingPoint'));
      continue;
    }
    stop += 1;
    labels.set(point.id, point.name || names[point.id] || t('tours.planner.waypointLabel', { n: stop }));
  }
  const first = points[0];
  const last = points[points.length - 1];
  if (first && last && isClosedLoop(points)) labels.set(last.id, labels.get(first.id) ?? '');
  return labels;
}

/**
 * PLN-04: where a found place goes in, picked from the tour's slots: between
 * two points, or after the last as the new end, which the list marks as
 * making the tour longer. A slot that cannot take the place stays in the list,
 * dimmed, with why. Each says roughly how much it adds; the add button takes
 * the place in, and nothing changes before.
 */
export function TourPoiSlotPicker({
  planner,
  poi,
  insertion,
  unit,
}: {
  planner: TourPlannerController;
  poi: TourPoi;
  insertion: ReturnType<typeof usePoiInsertion>;
  unit: Unit;
}) {
  const { t } = useTranslation();
  const labels = usePointLabels(planner.waypoints);
  const { slots } = insertion;
  const afterId = insertion.afterIdFor(poi);
  const chosen = slots.find((slot) => slot.afterId === afterId) ?? null;
  const list = usePopoverList(chosen ? slots.indexOf(chosen) : 0);
  const { open, toggle, triggerRef, listId } = list;
  const labelOf = (slot: InsertionSlot) =>
    slot.beforeId
      ? t('tours.poi.slot.between', {
          from: labels.get(slot.afterId) ?? '',
          to: labels.get(slot.beforeId) ?? '',
        })
      : t('tours.poi.slot.newEnd');
  const detourOf = (slot: InsertionSlot) => {
    const line = insertionPreview(planner.waypoints, slot.afterId, poi);
    return line ? `≈ +${formatDistance(straightDetourM(line) / 1000, unit)}` : null;
  };
  const block = chosen?.block ?? (afterId ? null : 'none');
  const detour = chosen ? detourOf(chosen) : null;
  const locked = !planner.canEdit || planner.isSaving;
  return (
    <div className="mt-3 flex flex-col gap-2 border-t border-edge-faint pt-3" data-testid="tour-poi-insert">
      <span className="text-content-muted" style={fs(11.5, 'body')}>
        {t('tours.poi.slot.label')}
      </span>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        data-testid="tour-poi-slot"
        className="flex w-full min-w-0 items-center gap-2 rounded-[10px] border border-edge bg-surface-input px-2.5 py-1.5 text-start hover:border-content-faint"
      >
        <span className="sr-only">{t('tours.poi.slot.label')}: </span>
        {chosen && !chosen.beforeId ? (
          <Flag size={13} strokeWidth={2.2} aria-hidden="true" className="flex-none text-content-faint" />
        ) : (
          <CornerDownRight size={13} strokeWidth={2.2} aria-hidden="true" className="flex-none text-content-faint" />
        )}
        <span className="min-w-0 flex-1 truncate font-medium text-content" style={fs(12, 'body')}>
          {chosen ? labelOf(chosen) : t('tours.poi.slot.label')}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          aria-hidden="true"
          className={`flex-none text-content-faint transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <PopoverListPanel list={list} label={t('tours.poi.slot.label')} className="min-w-[260px] max-w-[340px]">
        {slots.map((slot) => {
          const hint = slot.block ? null : detourOf(slot);
          return (
            <PopoverItem
              key={slot.afterId}
              icon={
                slot.beforeId ? <CornerDownRight size={13} strokeWidth={2.2} /> : <Flag size={13} strokeWidth={2.2} />
              }
              label={labelOf(slot)}
              active={slot === chosen}
              muted={!!slot.block}
              onClick={() => {
                list.close();
                insertion.chooseAfter(poi, slot.afterId);
              }}
              trailing={
                slot.block ? (
                  <Tooltip label={t(`tours.poi.blocked.${slot.block}`)} placement="left">
                    <span className="flex-none text-content-faint" data-testid="tour-poi-slot-blocked">
                      <Info size={13} strokeWidth={2.2} aria-label={t(`tours.poi.blocked.${slot.block}`)} />
                    </span>
                  </Tooltip>
                ) : !slot.beforeId ? (
                  <SoftPill tone="warning">{t('tours.poi.slot.extends')}</SoftPill>
                ) : hint ? (
                  <span className="flex-none font-geist tabular-nums text-content-faint" style={fs(11)}>
                    {hint}
                  </span>
                ) : undefined
              }
            />
          );
        })}
      </PopoverListPanel>
      {block ? (
        <p className="m-0 text-warning" style={fs(11, 'body')}>
          {t(`tours.poi.blocked.${block}`)}
        </p>
      ) : (
        chosen &&
        !chosen.beforeId && (
          <p className="m-0 text-content-muted" style={fs(11, 'body')} data-testid="tour-poi-slot-extends">
            {t('tours.poi.slot.extendsHint', { name: labels.get(chosen.afterId) ?? '' })}
          </p>
        )
      )}
      <div className="flex items-center gap-2">
        <Tooltip label={t('tours.poi.notAPlace')} placement="top">
          <span className="flex min-w-0 flex-1">
            <button
              type="button"
              disabled={!!block || locked}
              onClick={() => insertion.insert(poi)}
              data-testid="tour-poi-add"
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-accent px-3 font-semibold text-accent-text shadow-sm transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              style={fs(12, 'body')}
            >
              <Plus size={14} strokeWidth={2.2} />
              {t('tours.poi.add')}
            </button>
          </span>
        </Tooltip>
        {detour && !block && (
          <Tooltip label={t('tours.poi.detourHint')} placement="top">
            <span data-testid="tour-poi-detour">
              <WhiteBadge>{detour}</WhiteBadge>
            </span>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
