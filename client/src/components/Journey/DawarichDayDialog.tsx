import { useId, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import DawarichIcon from '../shared/DawarichIcon';
import { DialogFooter, DialogHeader, DialogShell, DialogTile, NEUTRAL_TINT } from '../shared/DialogShell';

/**
 * The desktop frame of a journey day read from Dawarich (JRN-01, JRN-02): the
 * Dawarich mark, the journey and the day in the head band, what the dialog
 * does under them, the body and the buttons.
 */
export default function DawarichDayDialog({
  journeyTitle,
  date,
  sub,
  onClose,
  footer,
  children,
}: {
  journeyTitle: string;
  date: string;
  sub: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  const { locale } = useTranslation();
  const labelId = useId();
  const title = new Date(`${date}T00:00:00`).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="detail"
      align="top"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <DawarichIcon size={26} />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          eyebrow={journeyTitle}
          title={title}
          sub={sub}
          subWraps
        />
      }
      footer={<DialogFooter>{footer}</DialogFooter>}
    >
      {children}
    </DialogShell>
  );
}
