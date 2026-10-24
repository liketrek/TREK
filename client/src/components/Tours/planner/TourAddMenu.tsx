import type { TourListItem } from '@trek/shared';
import { FileDown, Footprints, Library, Loader2, PenLine, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from '../../../i18n';
import { PopoverItem } from '../../Packing/PackingPopover';
import { BarButton } from '../../Planner/planParts';
import { PopoverListPanel } from '../../shared/dialogParts';
import { usePopoverList } from '../../shared/usePopoverList';
import { TourLibraryDialog } from '../library/TourLibraryDialog';
import { useTourLibrary } from '../library/useTourLibrary';
import type { TourGpxImport } from '../useTourGpxImport';
import { WalkImportDialog } from '../walk/WalkImportDialog';
import { useWalkImport } from '../walk/useWalkImport';
import type { TourPlannerController } from './useTourPlanner';

interface AddEntry {
  key: string;
  icon: ReactNode;
  label: string;
  run: () => void;
}

/**
 * LIB-02: the tours rail's one way to add a tour, as a menu: plan a new one
 * (while another is open; with none open the map is already planning one),
 * import GPX, KML or KMZ files, read a city walk from a Google Maps walking route (CW-07),
 * or take one over from another trip. The walk and the take-over open their
 * dialogs from here. A tour taken over comes into the trip and opens in the
 * editor, unless the editor holds unsaved work; a walk read from Google Maps
 * opens in the planner as a new draft, after a warning when that replaces
 * unsaved work.
 */
export function TourAddMenu({
  planner,
  gpxImport,
  onTakenOver,
  disabled,
}: {
  planner: Pick<
    TourPlannerController,
    'tripId' | 'mode' | 'hasUnsavedChanges' | 'openTour' | 'startNewTour' | 'startDerivedTour'
  >;
  gpxImport?: TourGpxImport;
  /** Where a tour of another trip goes into this one; without it that entry is left out. */
  onTakenOver?: (tour: TourListItem) => Promise<void>;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const list = usePopoverList(0, { estimatedHeight: 176 });
  const { open, toggle, close, triggerRef } = list;
  const library = useTourLibrary({
    tripId: Number(planner.tripId),
    onTakenOver: async (tour) => {
      await onTakenOver?.(tour);
      if (!planner.hasUnsavedChanges) void planner.openTour(tour);
    },
  });
  const walkImport = useWalkImport({ planner });
  const importing = gpxImport?.importing ?? false;

  const entries: AddEntry[] = [];
  if (planner.mode.type !== 'neutral') {
    entries.push({
      key: 'new',
      icon: <PenLine size={14} strokeWidth={2} />,
      label: t('tours.planner.newTour'),
      run: () => planner.startNewTour(),
    });
  }
  if (gpxImport) {
    entries.push({
      key: 'gpx',
      icon: <FileDown size={14} strokeWidth={2} />,
      label: t('tours.import.button'),
      run: gpxImport.pick,
    });
  }
  entries.push({
    key: 'walk',
    icon: <Footprints size={14} strokeWidth={2} />,
    label: t('tours.walkImport.menu'),
    run: walkImport.show,
  });
  if (onTakenOver) {
    entries.push({
      key: 'library',
      icon: <Library size={14} strokeWidth={2} />,
      label: t('tours.library.open'),
      run: library.show,
    });
  }

  // Run inside the click that picked it: the file picker opens only from a user's own tap.
  const pick = (entry: AddEntry) => {
    close();
    entry.run();
  };

  return (
    <>
      <BarButton
        ref={triggerRef}
        label={t('tours.planner.addTour')}
        tooltip={t('tours.planner.addTourHint')}
        testId="tour-rail-add"
        disabled={disabled || importing}
        onClick={toggle}
        ariaExpanded={open}
        active={open}
        className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        {importing ? (
          <Loader2 size={15} strokeWidth={2} className="animate-spin" />
        ) : (
          <Plus size={16} strokeWidth={2} />
        )}
      </BarButton>
      <PopoverListPanel list={list} label={t('tours.planner.addTour')} className="min-w-[240px]">
        {entries.map((entry) => (
          <PopoverItem key={entry.key} icon={entry.icon} label={entry.label} onClick={() => pick(entry)} />
        ))}
      </PopoverListPanel>
      <WalkImportDialog walkImport={walkImport} hasUnsavedChanges={planner.hasUnsavedChanges} />
      {onTakenOver && <TourLibraryDialog library={library} />}
    </>
  );
}
