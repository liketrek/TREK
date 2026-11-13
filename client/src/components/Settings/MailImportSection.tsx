import { ChevronRight, Copy, FileUp, Inbox, Loader2, Mail, RefreshCw } from 'lucide-react';
import { useRef, type ReactElement } from 'react';
import { useTranslation } from '../../i18n';
import { openMailInbox } from '../MailIngest/mailInboxOpener';
import { useMailImportSettings } from '../MailIngest/useMailImportSettings';
import { Tooltip } from '../shared/Tooltip';
import Section from './Section';
import ToggleSwitch from './ToggleSwitch';
import {
  SETTINGS_BUTTON,
  SETTINGS_ICON_BUTTON,
  SettingRow,
  SettingRows,
  SettingsHint,
  StatusPill,
} from './settingsKit';

/**
 * Settings → Integrations → Booking mail import: the person's forwarding
 * address to copy, how to forward automatically, the switches (import on,
 * AI reading, add on its own) and an .eml upload for a mail already on disk.
 * Nothing where the import is not available on this server or plan.
 */
export default function MailImportSection(): ReactElement | null {
  const { t } = useTranslation();
  const s = useMailImportSettings();
  const file = useRef<HTMLInputElement>(null);
  if (!s.settings) return null;
  const { address, prefs, ai_available: aiAvailable, pending } = s.settings;

  return (
    <Section
      id="mail-import"
      collapsible
      title={t('mailInbox.settings.title')}
      icon={Mail}
      badge={
        <StatusPill
          tone={prefs.enabled ? 'success' : 'neutral'}
          icon={<span className="h-1.5 w-1.5 rounded-full bg-current" />}
        >
          {prefs.enabled ? t('mailInbox.settings.on') : t('mailInbox.settings.off')}
        </StatusPill>
      }
    >
      {address && prefs.enabled && (
        <div className="flex flex-col gap-2">
          <div className="text-caption font-semibold uppercase tracking-[0.06em] text-content-faint">
            {t('mailInbox.settings.yourAddress')}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <code
              dir="ltr"
              className="min-w-0 flex-1 truncate rounded-lg bg-surface-tertiary px-3 py-2 font-geist text-body text-content"
            >
              {address.address}
            </code>
            <Tooltip label={t('mailInbox.settings.copy')}>
              <button
                type="button"
                onClick={() => void s.copyAddress()}
                aria-label={t('mailInbox.settings.copy')}
                className={SETTINGS_ICON_BUTTON}
              >
                <Copy size={14} strokeWidth={2} />
              </button>
            </Tooltip>
            <Tooltip label={s.renewArmed ? t('mailInbox.settings.renewConfirm') : t('mailInbox.settings.renew')}>
              <button
                type="button"
                onClick={() => void s.renew()}
                disabled={s.renewing}
                aria-label={s.renewArmed ? t('mailInbox.settings.renewConfirm') : t('mailInbox.settings.renew')}
                className={`${SETTINGS_ICON_BUTTON} ${s.renewArmed ? 'text-warning ring-warning' : ''}`}
              >
                <RefreshCw size={14} strokeWidth={2} className={s.renewing ? 'animate-spin' : ''} />
              </button>
            </Tooltip>
          </div>
          <SettingsHint>{t('mailInbox.settings.addressHint')}</SettingsHint>
          <details className="group rounded-lg bg-surface-tertiary px-3 py-2 text-body text-content-secondary">
            <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-content">
              <ChevronRight
                size={14}
                strokeWidth={2}
                className="transition-transform group-open:rotate-90 rtl:-scale-x-100"
              />
              {t('mailInbox.settings.howTo')}
            </summary>
            <ul className="mt-2 flex list-disc flex-col gap-1.5 ps-5 text-caption">
              <li>{t('mailInbox.settings.howToGmail')}</li>
              <li>{t('mailInbox.settings.howToOutlook')}</li>
              <li>{t('mailInbox.settings.howToManual')}</li>
            </ul>
          </details>
        </div>
      )}

      <SettingRows>
        <SettingRow
          label={t('mailInbox.settings.enabled')}
          hint={t('mailInbox.settings.enabledHint')}
          control={
            <ToggleSwitch
              on={prefs.enabled}
              disabled={s.saving !== null}
              onToggle={() => void s.toggle('enabled')}
              label={t('mailInbox.settings.enabled')}
            />
          }
        />
        <SettingRow
          label={t('mailInbox.settings.ai')}
          // Off without the AI Parsing addon and a connection: the hint names the addon, so the person knows what to ask for.
          hint={
            aiAvailable
              ? t('mailInbox.settings.aiHint')
              : t('mailInbox.settings.aiUnavailable', { addon: t('admin.addons.catalog.llm_parsing.name') })
          }
          dimmed={!prefs.enabled}
          control={
            <ToggleSwitch
              on={prefs.ai_enabled && aiAvailable}
              disabled={!prefs.enabled || !aiAvailable || s.saving !== null}
              onToggle={() => void s.toggle('ai_enabled')}
              label={t('mailInbox.settings.ai')}
            />
          }
        />
        <SettingRow
          label={t('mailInbox.settings.autoAdd')}
          hint={t('mailInbox.settings.autoAddHint')}
          dimmed={!prefs.enabled}
          control={
            <ToggleSwitch
              on={prefs.auto_add}
              disabled={!prefs.enabled || s.saving !== null}
              onToggle={() => void s.toggle('auto_add')}
              label={t('mailInbox.settings.autoAdd')}
            />
          }
        />
      </SettingRows>

      {prefs.enabled && (
        <div className="flex flex-wrap items-center gap-2 text-body">
          <button type="button" onClick={openMailInbox} className={SETTINGS_BUTTON}>
            <Inbox size={14} strokeWidth={2.2} />
            {t('mailInbox.title')}
            {pending > 0 && (
              <span className="rounded-full bg-accent px-1.5 text-caption font-semibold text-accent-text">
                {pending}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => file.current?.click()}
            disabled={s.uploading}
            className={SETTINGS_BUTTON}
          >
            {s.uploading ? (
              <Loader2 size={14} strokeWidth={2.2} className="animate-spin" />
            ) : (
              <FileUp size={14} strokeWidth={2.2} />
            )}
            {t('mailInbox.settings.upload')}
          </button>
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

      <SettingsHint>{t('mailInbox.settings.privacy')}</SettingsHint>
    </Section>
  );
}
