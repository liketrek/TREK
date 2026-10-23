import type { AiConnectionKind, AiConnectionView } from '@trek/shared';
import { Loader2, LogOut, MessageCircle, Sparkles, Unplug } from 'lucide-react';
import React from 'react';
import { useTranslation } from '../../../i18n';
import { useAssistantCostEstimates, useAssistantMapFollow } from '../../Assistant/useAssistantMapFollow';
import ConfirmDialog from '../../shared/ConfirmDialog';
import CustomSelect from '../../shared/CustomSelect';
import { fs } from '../../shared/DialogShell';
import Section from '../Section';
import {
  SettingRow,
  SettingRows,
  SETTINGS_BUTTON,
  SETTINGS_BUTTON_DANGER,
  SETTINGS_BUTTON_PRIMARY,
  SettingsHint,
  StatusPill,
} from '../settingsKit';
import ToggleSwitch from '../ToggleSwitch';
import { aiSectionText, CONNECTION_STATUS } from './aiConnectModel';
import AiConnectPanel, { ProviderMark } from './AiConnectPanel';
import { useAiConnections } from './useAiConnections';

type AiConnections = ReturnType<typeof useAiConnections>;

/** What a connection that stopped working says before its one way back. */
const BROKEN: Partial<Record<AiConnectionView['status'], { messageKey: string }>> = {
  needs_reauth: { messageKey: 'assistant.error.needsReauth' },
  error: { messageKey: 'assistant.error.invalidKey' },
};

/** A connection as one row: the provider's tile, who it is and the detail under it, the actions on the right. */
function ConnectionRow({
  kind,
  title,
  detail,
  children,
}: {
  kind: AiConnectionKind;
  title: string;
  detail?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5 px-3.5 py-3">
      <ProviderMark kind={kind} />
      <div className="min-w-0 flex-1 basis-40">
        <p className="m-0 truncate font-medium text-content" style={fs(13, 'body')}>
          {title}
        </p>
        {detail && (
          <p className="m-0 mt-0.5 truncate font-geist text-content-faint" style={fs(11.5)}>
            {detail}
          </p>
        )}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

function OpenAssistantButton({ S }: { S: AiConnections }) {
  const { t } = useTranslation();
  if (!S.canOpen) return null;
  return (
    <button type="button" onClick={S.openAssistant} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
      <MessageCircle size={14} strokeWidth={2.2} /> {t('assistant.connect.openAssistant')}
    </button>
  );
}

/** The user's own connection: who answers, which model, and the way out (or back in, once it broke). */
function OwnConnection({ S, own }: { S: AiConnections; own: AiConnectionView }) {
  const { t } = useTranslation();
  const { provider, models, busy, setModel, signOut, askDisconnect } = S.ownActions;
  const broken = BROKEN[own.status];
  const repairMode = S.repairMode;
  return (
    <SettingRows>
      <ConnectionRow kind={own.kind} title={t('assistant.connect.connected', { provider })} detail={own.hint}>
        {repairMode ? (
          <button
            type="button"
            onClick={() => S.repair(repairMode)}
            className={SETTINGS_BUTTON_PRIMARY}
            style={fs(13, 'body')}
          >
            {t(repairMode === 'chatgpt' ? 'assistant.errorAction.signIn' : 'assistant.errorAction.replaceKey')}
          </button>
        ) : (
          <OpenAssistantButton S={S} />
        )}
        {own.kind === 'chatgpt' && own.status === 'ok' ? (
          <button
            type="button"
            onClick={() => void signOut()}
            disabled={busy}
            className={SETTINGS_BUTTON}
            style={fs(13, 'body')}
          >
            <LogOut size={14} strokeWidth={2} /> {t('assistant.connect.signOut')}
          </button>
        ) : (
          <button
            type="button"
            onClick={askDisconnect}
            disabled={busy}
            className={SETTINGS_BUTTON_DANGER}
            style={fs(13, 'body')}
          >
            <Unplug size={14} strokeWidth={2} /> {t('assistant.connect.disconnect')}
          </button>
        )}
      </ConnectionRow>
      {broken && (
        <p role="alert" className="m-0 px-3.5 py-2.5 text-danger" style={fs(12, 'body')}>
          {t(broken.messageKey, { provider })}
        </p>
      )}
      {own.status === 'ok' && (
        <SettingRow
          label={t('assistant.connect.model')}
          hint={t('assistant.connect.modelHint')}
          dimmed={busy}
          control={
            <div className="w-56 max-w-full">
              <CustomSelect
                ariaLabel={t('assistant.connect.model')}
                value={own.model}
                onChange={(v) => void setModel(String(v))}
                options={models}
                size="sm"
                disabled={busy}
                searchable={models.length > 8}
              />
            </div>
          }
        />
      )}
    </SettingRows>
  );
}

/** The admin's connection this user runs on, with today's share of the limit while the instance pays. */
function InstanceConnection({ S }: { S: AiConnections }) {
  const { t } = useTranslation();
  const instance = S.status?.instance;
  if (!instance) return null;
  return (
    <SettingRows>
      <ConnectionRow
        kind={instance.kind}
        title={t('assistant.connect.providedByAdmin')}
        detail={`${S.instanceProvider}, ${instance.model}`}
      >
        <OpenAssistantButton S={S} />
        {S.status?.canConnectOwn && !S.panel && (
          <button type="button" onClick={S.connectOwn} className={SETTINGS_BUTTON} style={fs(13, 'body')}>
            {t('assistant.errorAction.connectOwn')}
          </button>
        )}
      </ConnectionRow>
      {S.quota && (
        <p className="m-0 px-3.5 py-2.5 tabular-nums text-content-muted" style={fs(12, 'body')}>
          {t('assistant.connect.quota', { used: S.quota.used, count: S.quota.limit })}
        </p>
      )}
    </SettingRows>
  );
}

/** How the assistant behaves once it runs: whether the trip map follows it. */
function AssistantBehaviour() {
  const { t } = useTranslation();
  const follow = useAssistantMapFollow();
  const costs = useAssistantCostEstimates();
  return (
    <SettingRows>
      <SettingRow
        label={t('assistant.settings.followMap')}
        hint={t('assistant.settings.followMapHint')}
        control={
          <ToggleSwitch
            on={follow.on}
            onToggle={() => void follow.set(!follow.on)}
            label={t('assistant.settings.followMap')}
          />
        }
      />
      <SettingRow
        label={t('assistant.settings.costEstimates')}
        hint={t('assistant.settings.costEstimatesHint')}
        control={
          <ToggleSwitch
            on={costs.on}
            onToggle={() => void costs.set(!costs.on)}
            label={t('assistant.settings.costEstimates')}
          />
        }
      />
    </SettingRows>
  );
}

/** The connect panel, opened on purpose or because nothing is connected yet. */
function ConnectPanel({ S }: { S: AiConnections }) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col gap-3 ${S.view === 'setup' ? '' : 'border-t border-edge-faint pt-4'}`}>
      <AiConnectPanel key={S.panelMode ?? 'any'} scope="user" onConnected={S.onConnected} initialMode={S.panelMode} />
      {S.view !== 'setup' && (
        <button type="button" onClick={S.closePanel} className={`${SETTINGS_BUTTON} self-start`} style={fs(13, 'body')}>
          {t('common.cancel')}
        </button>
      )}
    </div>
  );
}

/** How long chats are kept, and for an admin the way to the setting for everyone. */
function SectionFooter({ S }: { S: AiConnections }) {
  const { t } = useTranslation();
  const retention = S.view !== 'setup' && !!S.retentionText;
  if (!S.isAdmin && !retention) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      {S.view !== 'setup' && <SettingsHint>{S.retentionText}</SettingsHint>}
      {S.isAdmin && (
        <button
          type="button"
          onClick={S.openAdmin}
          className="font-medium text-content-muted underline underline-offset-2 hover:text-content"
          style={fs(12, 'body')}
        >
          {t('assistant.setup.forEveryone')}
        </button>
      )}
    </div>
  );
}

/**
 * Settings → Integrations → the user's AI connection: connect a provider, see
 * which one answers, pick its model, leave again. The assistant runs on it and
 * AI parsing reads bookings with it, so it shows while either addon is on and
 * says which it serves.
 */
export default function AiConnectionSection({
  assistant = true,
  parsing = false,
}: {
  assistant?: boolean;
  parsing?: boolean;
}): React.ReactElement | null {
  const { t } = useTranslation();
  const S = useAiConnections();
  const text = aiSectionText(assistant, parsing);
  if (S.view === 'hidden') return null;
  const own = S.own;

  return (
    <Section
      title={t(text.titleKey)}
      icon={Sparkles}
      hint={t(text.hintKey)}
      badge={
        own ? (
          <StatusPill tone={CONNECTION_STATUS[own.status].tone}>{t(CONNECTION_STATUS[own.status].labelKey)}</StatusPill>
        ) : undefined
      }
    >
      {S.view === 'loading' && (
        <div className="grid place-items-center py-6">
          <Loader2 size={18} className="animate-spin text-content-faint" />
        </div>
      )}
      {S.view === 'own' && own && <OwnConnection S={S} own={own} />}
      {S.view === 'instance' && <InstanceConnection S={S} />}
      {assistant && (S.view === 'own' || S.view === 'instance') && <AssistantBehaviour />}
      {S.view === 'adminOnly' && <SettingsHint>{t('assistant.setup.adminOnly')}</SettingsHint>}

      {S.panel && <ConnectPanel S={S} />}
      <SectionFooter S={S} />

      <ConfirmDialog
        isOpen={S.ownActions.confirmingDisconnect}
        onClose={S.ownActions.cancelDisconnect}
        onConfirm={() => void S.ownActions.disconnect()}
        title={t('assistant.connect.disconnect')}
        message={t('assistant.connect.disconnectConfirm', { provider: S.ownActions.provider })}
        confirmLabel={t('assistant.connect.disconnect')}
        danger
      />
    </Section>
  );
}
