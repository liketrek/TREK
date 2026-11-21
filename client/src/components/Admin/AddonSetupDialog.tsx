import React, { useId, type ReactNode } from 'react';
import { useTranslation } from '../../i18n';
import {
  DialogButton,
  DialogFooter,
  DialogHeader,
  DialogShell,
  DialogTile,
  FooterSpacer,
  NEUTRAL_TINT,
} from '../shared/DialogShell';

/**
 * The dialog an addon's setup row opens: the icon tile, the addon it belongs
 * to above the title, what it sets up below, and one Close, since everything
 * inside saves on its own (booking mails, paddle water data).
 */
export default function AddonSetupDialog({
  icon,
  eyebrow,
  title,
  sub,
  onClose,
  blocked = false,
  children,
}: {
  icon: ReactNode;
  eyebrow: string;
  title: string;
  sub: string;
  onClose: () => void;
  /** A confirmation stacked on top holds the dialog while it is open. */
  blocked?: boolean;
  children: ReactNode;
}): React.ReactElement {
  const { t } = useTranslation();
  const labelId = useId();
  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="detail"
      blocked={blocked}
      header={
        <DialogHeader
          tile={<DialogTile>{icon}</DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          eyebrow={eyebrow}
          title={title}
          sub={sub}
          subWraps
          onClose={onClose}
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
      {children}
    </DialogShell>
  );
}
