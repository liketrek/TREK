import { X } from 'lucide-react';
import { useContext } from 'react';
import type { DetailShellProps } from '../../../../components/shared/DetailShell';
import MIconBtn from '../../../components/MIconBtn';
import MSheet from '../../../components/MSheet';
import { TourSheetOpen } from './tourSheetOpen';

/**
 * The phone's frame for the tour detail: the desktop dialog's head, sections
 * and actions in a sheet like every other one (TourDetailDialog renders into
 * the frame it is given). It slides in and out, drags closed, closes on the
 * back gesture and keeps the tour's whole content and every action.
 */
export default function MTourDetailShell({ header, children, footer, onClose, closeLabel, testId }: DetailShellProps) {
  const { open, label } = useContext(TourSheetOpen);
  return (
    <MSheet open={open} onClose={onClose} variant="card" material="glass" ariaLabel={label || closeLabel}>
      <div className="flex flex-none items-start gap-3 px-[18px] pt-4">
        {header}
        <MIconBtn variant="neutral" size={34} onClick={onClose} ariaLabel={closeLabel}>
          <X size={15} strokeWidth={2.2} />
        </MIconBtn>
      </div>
      <div
        data-testid={testId}
        className="m-scroll-fade mt-2 flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-[18px] pb-[18px] pt-[14px]"
      >
        {children}
      </div>
      {footer && (
        <div className="flex flex-none flex-wrap items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
          {footer}
        </div>
      )}
    </MSheet>
  );
}
