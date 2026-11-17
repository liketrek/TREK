import { MoreHorizontal } from 'lucide-react';
import type { ComponentType } from 'react';
import { useTranslation } from '../../../i18n';
import { MRail, MRailButton, MRailSpacer } from '../../components/MRail';
import { DOCK_PRIORITY } from './dockTabs';

interface RailTab {
  id: string;
  icon?: ComponentType<{ size?: number; strokeWidth?: number; className?: string }> | null;
}

interface MTripRailProps {
  /** The trip's sections the phone shows (dock and More grid together). */
  tabs: RailTab[];
  active: string;
  onSelect: (id: string) => void;
  /** Opens the More sheet: trip settings, export, the assistant. */
  onMore: () => void;
  /** Whether the More sheet is open, which the More button shows with a ring. */
  moreOpen?: boolean;
  labelOf: (id: string) => string;
}

const DOCK_ICONS = new Map(DOCK_PRIORITY.map((tab) => [tab.id, tab.icon]));

/**
 * The trip's sections on a wide window, in place of the phone's dock. The dock
 * has seats for five; the rail has room for every section, so files,
 * collaboration and plugin pages sit in it too, each with its name, and More
 * keeps only the trip's actions.
 */
export default function MTripRail({ tabs, active, onSelect, onMore, moreOpen = false, labelOf }: MTripRailProps) {
  const { t } = useTranslation();
  return (
    <MRail label={t('mobileTrip.sections')}>
      {tabs.map((tab) => {
        const Icon = DOCK_ICONS.get(tab.id) ?? tab.icon;
        const on = tab.id === active;
        return (
          <MRailButton key={tab.id} label={labelOf(tab.id)} active={on} onClick={() => onSelect(tab.id)}>
            {Icon && <Icon size={20} strokeWidth={on ? 2.1 : 1.9} />}
          </MRailButton>
        );
      })}
      <MRailSpacer />
      <MRailButton label={t('mobileTrip.more')} active={false} expanded={moreOpen} onClick={onMore}>
        <MoreHorizontal size={20} strokeWidth={2.2} />
      </MRailButton>
    </MRail>
  );
}
