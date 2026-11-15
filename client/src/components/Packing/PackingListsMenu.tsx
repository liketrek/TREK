import { ArrowDownAZ, Check, Download, EyeOff, FolderPlus, Luggage, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { useTranslation } from '../../i18n';
import { useAddonStore } from '../../store/addonStore';
import ApplyTemplateButton from './ApplyTemplateButton';
import PackingExportMenu from './PackingExportMenu';
import { PopoverItem } from './PackingPopover';
import { POPOVER, POPOVER_DIVIDER } from './packingPopoverStyles';
import type { PackingSort } from './usePackingListPanel';

interface PackingListsMenuProps {
  tripId: number;
  view: 'common' | 'personal';
  canEdit: boolean;
  isAdmin: boolean;
  hasItems: boolean;
  /** Packed items in the view on screen, for the clean-up line. */
  packedCount: number;
  sort: PackingSort;
  onSortChange: (next: PackingSort) => void;
  hideDone: boolean;
  onHideDoneChange: (next: boolean) => void;
  onImport: () => void;
  onSaveTemplate: () => void;
  onClearChecked: () => void;
  onOpenBags: () => void;
  buttonClassName: string;
  buttonStyle: CSSProperties;
}

/**
 * Everything the packing list needs now and then, behind one "..." beside Add
 * list: templates, import and export, the order, hiding what is packed, the bag
 * overview on a screen too narrow for its sidebar, and clearing the packed items.
 * The panel stays mounted while closed, so a print preview opened from it lives on.
 */
export default function PackingListsMenu(props: Readonly<PackingListsMenuProps>) {
  const {
    tripId,
    view,
    canEdit,
    isAdmin,
    hasItems,
    packedCount,
    sort,
    onSortChange,
    hideDone,
    onHideDoneChange,
    onImport,
    onSaveTemplate,
    onClearChecked,
    onOpenBags,
    buttonClassName,
    buttonStyle,
  } = props;
  const { t } = useTranslation();
  const bagTracking = useAddonStore((s) => s.bagTracking);
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const run = (action: () => void) => () => {
    close();
    action();
  };
  const tick = (on: boolean) => (on ? <Check size={13} className="shrink-0 text-content-muted" /> : null);

  return (
    <div className="relative flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('common.showMore')}
        title={t('common.showMore')}
        className={buttonClassName}
        style={buttonStyle}
      >
        <MoreHorizontal size={14} strokeWidth={2.5} />
      </button>
      {open && <div role="presentation" className="fixed inset-0 z-50" onClick={close} />}
      <div
        role="menu"
        hidden={!open}
        className="trek-menu-enter absolute end-0 top-full z-[var(--z-bar)] mt-1.5 w-[260px] origin-top-right"
        style={POPOVER}
      >
        {canEdit && <ApplyTemplateButton tripId={tripId} visibility={view} variant="menu" onApplied={close} />}
        {canEdit && isAdmin && hasItems && (
          <PopoverItem
            icon={<FolderPlus size={13} />}
            label={t('packing.saveAsTemplate')}
            onClick={run(onSaveTemplate)}
          />
        )}
        {canEdit && <PopoverItem icon={<Download size={13} />} label={t('packing.import')} onClick={run(onImport)} />}
        <PackingExportMenu tripId={tripId} view={view} variant="menu" onChosen={close} />
        {hasItems && (
          <>
            <div style={POPOVER_DIVIDER} />
            <PopoverItem
              icon={<ArrowDownAZ size={13} />}
              label={t('packing.sortByName')}
              trailing={tick(sort === 'name')}
              onClick={() => onSortChange(sort === 'name' ? 'manual' : 'name')}
            />
            <PopoverItem
              icon={<EyeOff size={13} />}
              label={t('packing.hideDone')}
              trailing={tick(hideDone)}
              onClick={() => onHideDoneChange(!hideDone)}
            />
          </>
        )}
        {bagTracking && (
          <div className="xl:hidden">
            <PopoverItem icon={<Luggage size={13} />} label={t('packing.bags')} onClick={run(onOpenBags)} />
          </div>
        )}
        {canEdit && packedCount > 0 && (
          <>
            <div style={POPOVER_DIVIDER} />
            <PopoverItem
              icon={<Trash2 size={13} />}
              label={t('packing.clearChecked', { count: packedCount })}
              danger
              onClick={run(onClearChecked)}
            />
          </>
        )}
      </div>
    </div>
  );
}
