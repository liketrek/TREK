import { useRef, type ReactElement } from 'react';
import { Copy, FileUp, Inbox, Mail, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { useMailImportSettings } from '../../../components/MailIngest/useMailImportSettings';
import { openMailInbox } from '../../../components/MailIngest/mailInboxOpener';
import MToggle from '../../components/MToggle';
import { MSetButton, MSetCard, MSetEyebrow, MSetHint, MSetRow } from './MSettingsUi';

/**
 * Phone twin of components/Settings/MailImportSection: the forwarding address
 * with copy and renew as icons, the three switches as rows, the inbox and the
 * .eml upload as buttons. Same logic (useMailImportSettings), the MSet* card
 * system for the look. Nothing where the import is not available.
 */
export default function MMailImportSection(): ReactElement | null {
  const { t } = useTranslation();
  const s = useMailImportSettings();
  const file = useRef<HTMLInputElement>(null);
  if (!s.settings) return null;
  const { address, prefs, ai_available: aiAvailable, pending } = s.settings;
  const round =
    'grid h-9 w-9 flex-none place-items-center rounded-full bg-[color:var(--m-ic)] text-m-ink disabled:opacity-50';

  return (
    <MSetCard title={t('mailInbox.settings.title')} icon={Mail} className="mt-3">
      {address && prefs.enabled && (
        <>
          <MSetEyebrow className="mb-[6px]">{t('mailInbox.settings.yourAddress')}</MSetEyebrow>
          <div className="flex min-w-0 items-center gap-2">
            <code dir="ltr" className="min-w-0 flex-1 truncate rounded-[12px] bg-[color:var(--m-ic)] px-3 py-[9px] font-geist text-caption text-m-ink">
              {address.address}
            </code>
            <button type="button" onClick={() => void s.copyAddress()} aria-label={t('mailInbox.settings.copy')} className={round}>
              <Copy size={15} strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => void s.renew()}
              disabled={s.renewing}
              aria-label={s.renewArmed ? t('mailInbox.settings.renewConfirm') : t('mailInbox.settings.renew')}
              className={round}
              style={s.renewArmed ? { color: 'var(--m-st-pending)' } : undefined}
            >
              <RefreshCw size={15} strokeWidth={2} className={s.renewing ? 'animate-spin' : ''} />
            </button>
          </div>
          {s.renewArmed && <MSetHint>{t('mailInbox.settings.renewConfirm')}</MSetHint>}
          <MSetHint>{t('mailInbox.settings.addressHint')}</MSetHint>
        </>
      )}

      <div className="mt-3">
        <MSetRow
          first
          label={t('mailInbox.settings.enabled')}
          sub={t('mailInbox.settings.enabledHint')}
          trailing={<MToggle checked={prefs.enabled} disabled={s.saving !== null} onChange={() => void s.toggle('enabled')} ariaLabel={t('mailInbox.settings.enabled')} />}
        />
        <MSetRow
          label={t('mailInbox.settings.ai')}
          sub={aiAvailable ? t('mailInbox.settings.aiHint') : t('mailInbox.settings.aiUnavailable')}
          trailing={
            <MToggle
              checked={prefs.ai_enabled && aiAvailable}
              disabled={!prefs.enabled || !aiAvailable || s.saving !== null}
              onChange={() => void s.toggle('ai_enabled')}
              ariaLabel={t('mailInbox.settings.ai')}
            />
          }
        />
        <MSetRow
          label={t('mailInbox.settings.autoAdd')}
          sub={t('mailInbox.settings.autoAddHint')}
          trailing={
            <MToggle
              checked={prefs.auto_add}
              disabled={!prefs.enabled || s.saving !== null}
              onChange={() => void s.toggle('auto_add')}
              ariaLabel={t('mailInbox.settings.autoAdd')}
            />
          }
        />
      </div>

      {prefs.enabled && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <MSetButton variant="ghost" onClick={openMailInbox}>
            <Inbox size={14} /> {t('mailInbox.title')}
            {pending > 0 && <span className="rounded-full bg-[color:var(--m-act)] px-[6px] font-geist text-caption font-bold text-[color:var(--m-actfg)]">{pending}</span>}
          </MSetButton>
          <MSetButton variant="ghost" onClick={() => file.current?.click()} disabled={s.uploading}>
            <FileUp size={14} /> {t('mailInbox.settings.upload')}
          </MSetButton>
          <input
            ref={file}
            type="file"
            accept=".eml,message/rfc822"
            className="hidden"
            onChange={(e) => {
              const picked = e.target.files?.[0];
              e.target.value = '';
              if (picked) void s.upload(picked);
            }}
          />
        </div>
      )}

      <MSetHint>{t('mailInbox.settings.privacy')}</MSetHint>
    </MSetCard>
  );
}
