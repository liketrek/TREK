import { ShieldOff } from 'lucide-react';
import { useState } from 'react';
import type { TranslationFn } from '../../../types';
import MSheet from '../../components/MSheet';
import { MAdminButton, MAdminSheetFrame } from './MAdminUi';

interface MAdminResetMfaSheetProps {
  open: boolean;
  onClose: () => void;
  user: { id: number; username: string } | null;
  /** Resolves true once the reset worked; the sheet only closes then. */
  onReset: (user: { id: number }) => Promise<boolean>;
  t: TranslationFn;
}

// The confirm before an admin turns off another user's two-factor login. It
// keeps its own busy state so the admin sheet layer does not have to.
export default function MAdminResetMfaSheet({ open, onClose, user, onReset, t }: MAdminResetMfaSheetProps) {
  const [resetting, setResetting] = useState(false);

  // The sheet stays open and busy while the reset runs and closes once it worked.
  const reset = async () => {
    if (!user) return;
    setResetting(true);
    try {
      if (await onReset(user)) onClose();
    } finally {
      setResetting(false);
    }
  };

  return (
    <MSheet open={open} onClose={onClose} ariaLabel={t('admin.mfa.reset')}>
      <MAdminSheetFrame
        title={t('admin.mfa.reset')}
        onClose={onClose}
        footer={
          <>
            <MAdminButton variant="ghost" disabled={resetting} onClick={onClose}>
              {t('common.cancel')}
            </MAdminButton>
            <MAdminButton variant="danger" busy={resetting} onClick={() => void reset()}>
              {t('admin.mfa.reset')}
            </MAdminButton>
          </>
        }
      >
        <div className="flex gap-3">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--m-st-danger)_12%,transparent)] text-[color:var(--m-st-danger)]">
            <ShieldOff size={18} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-body font-bold text-m-ink">
              {t('admin.mfa.resetConfirm', { name: user?.username ?? '' })}
            </p>
            <p className="mt-1 font-geist text-caption leading-relaxed text-m-muted">{t('admin.mfa.resetHint')}</p>
          </div>
        </div>
      </MAdminSheetFrame>
    </MSheet>
  );
}
