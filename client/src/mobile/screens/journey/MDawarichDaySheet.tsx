import type { ReactNode } from 'react';
import DawarichIcon from '../../../components/shared/DawarichIcon';
import { useTranslation } from '../../../i18n';
import MSheet from '../../components/MSheet';
import { FormSheetHeader } from '../trip/sheets/PlSheetChrome';

/**
 * The phone frame of a journey day read from Dawarich (JRN-01, JRN-02): a
 * bottom sheet with the Dawarich mark, the day and the journey on top, what
 * it does, the body to scroll and the buttons under it.
 */
export default function MDawarichDaySheet({
  journeyTitle,
  date,
  sub,
  ariaLabel,
  onClose,
  footer,
  children,
}: {
  journeyTitle: string;
  date: string;
  sub: string;
  ariaLabel: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  const { t, locale } = useTranslation();
  const title = new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <MSheet open onClose={onClose} variant="bottom" material="glass" ariaLabel={ariaLabel}>
      <div className="flex max-h-[90dvh] min-h-0 flex-col">
        <FormSheetHeader
          leading={
            <span className="flex h-10 w-10 flex-none overflow-hidden rounded-[13px]">
              <DawarichIcon size={40} />
            </span>
          }
          title={title}
          subtitle={journeyTitle}
          onClose={onClose}
          closeLabel={t('common.close')}
        />
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-[18px] pb-4 pt-2">
          <p className="m-0 font-geist text-caption text-m-muted">{sub}</p>
          {children}
        </div>
        <div className="flex flex-none flex-wrap items-center gap-2 border-t border-edge-faint px-[18px] py-3">
          {footer}
        </div>
      </div>
    </MSheet>
  );
}
