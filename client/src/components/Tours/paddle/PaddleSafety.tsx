import { ChevronRight, LifeBuoy } from 'lucide-react';
import { useCallback, useEffect, useId, useState } from 'react';
import { useTranslation } from '../../../i18n';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
  fs,
} from '../../shared/DialogShell';

/**
 * Escape closes the note and not the tour detail or panel it was opened from:
 * captured and marked handled before their own listeners on the document see it.
 */
function useOwnEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      event.preventDefault();
      onClose();
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [open, onClose]);
}

/**
 * The safety note for paddle tours in full: what paddling risks and what to
 * check before setting out. It is read and closed; it asks for no
 * confirmation and blocks nothing.
 */
export function PaddleSafetyDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const labelId = useId();
  useOwnEscape(open, onClose);
  return (
    <DialogShell
      open={open}
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <LifeBuoy size={20} strokeWidth={1.9} className="text-content-muted" />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('tours.paddle.safety.title')}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton variant="primary" onClick={onClose}>
            {t('common.close')}
          </DialogButton>
        </DialogFooter>
      }
    >
      <p className="m-0 leading-relaxed text-content-secondary" style={fs(13, 'body')}>
        {t('tours.paddle.safety.text')}
      </p>
    </DialogShell>
  );
}

/**
 * The reminder that paddling has risks, as a quiet row in the look of a
 * panel's notices. It opens the full note and never stands in the way of
 * planning or saving.
 */
export function PaddleSafetyRow() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex w-full items-start gap-2 rounded-[10px] border border-edge-faint bg-surface-card px-3 py-2 text-start leading-snug text-content-muted transition-colors hover:bg-surface-hover hover:text-content focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        style={fs(12, 'body')}
      >
        <LifeBuoy size={13} strokeWidth={2} aria-hidden="true" className="mt-[2px] flex-none" />
        <span className="min-w-0 flex-1">{t('tours.paddle.safety.short')}</span>
        <ChevronRight size={14} strokeWidth={2.2} aria-hidden="true" className="flex-none self-center rtl:rotate-180" />
      </button>
      <PaddleSafetyDialog open={open} onClose={close} />
    </>
  );
}
