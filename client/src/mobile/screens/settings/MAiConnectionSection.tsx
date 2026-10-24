import type { AiConnectionView } from '@trek/shared';
import { ChevronDown, Loader2, LogOut, MessageCircle, Sparkles, Unplug } from 'lucide-react';
import React, { useState } from 'react';
import { useAssistantCostEstimates, useAssistantMapFollow } from '../../../components/Assistant/useAssistantMapFollow';
import AiConnectPanel from '../../../components/Settings/ai/AiConnectPanel';
import { aiSectionText, CONNECTION_STATUS } from '../../../components/Settings/ai/aiConnectModel';
import { useAiConnections } from '../../../components/Settings/ai/useAiConnections';
import { StatusPill } from '../../../components/Settings/settingsKit';
import { useTranslation } from '../../../i18n';
import MToggle from '../../components/MToggle';
import MConfirmSheet from './MConfirmSheet';
import MSetPickerSheet from './MSetPickerSheet';
import { MSetButton, MSetCard, MSetEyebrow, MSetHint, MSetRow, MSetSelectRow } from './MSettingsUi';

type AiConnections = ReturnType<typeof useAiConnections>;

/** The phone's own connection: who answers, which model, and the way out or back in. */
function MOwnConnection({ S, own }: { S: AiConnections; own: AiConnectionView }) {
  const { t } = useTranslation();
  const [modelOpen, setModelOpen] = useState(false);
  const { provider, models, busy, setModel, signOut, askDisconnect } = S.ownActions;
  const repairMode = S.repairMode;
  const status = CONNECTION_STATUS[own.status];

  return (
    <>
      <MSetRow
        first
        label={t('assistant.connect.connected', { provider })}
        sub={own.hint ?? undefined}
        trailing={<StatusPill tone={status.tone}>{t(status.labelKey)}</StatusPill>}
      />
      {own.status === 'needs_reauth' && (
        <MSetHint className="text-[color:var(--m-st-danger)]">
          {t('assistant.error.needsReauth', { provider })}
        </MSetHint>
      )}
      {own.status === 'error' && (
        <MSetHint className="text-[color:var(--m-st-danger)]">{t('assistant.error.invalidKey', { provider })}</MSetHint>
      )}

      {own.status === 'ok' && (
        <>
          <MSetEyebrow className="mb-[5px] mt-3">{t('assistant.connect.model')}</MSetEyebrow>
          <MSetSelectRow
            label={own.model}
            trailing={
              busy ? (
                <Loader2 size={13} className="flex-none animate-spin text-m-faint" />
              ) : (
                <ChevronDown size={13} strokeWidth={2} className="flex-none text-m-faint" />
              )
            }
            onClick={() => setModelOpen(true)}
          />
          <MSetHint>{t('assistant.connect.modelHint')}</MSetHint>
        </>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {repairMode ? (
          <MSetButton onClick={() => S.repair(repairMode)}>
            {t(repairMode === 'chatgpt' ? 'assistant.errorAction.signIn' : 'assistant.errorAction.replaceKey')}
          </MSetButton>
        ) : (
          S.canOpen && (
            <MSetButton onClick={S.openAssistant}>
              <MessageCircle size={14} /> {t('assistant.connect.openAssistant')}
            </MSetButton>
          )
        )}
        {own.kind === 'chatgpt' && own.status === 'ok' ? (
          <MSetButton variant="ghost" disabled={busy} onClick={() => void signOut()}>
            <LogOut size={14} /> {t('assistant.connect.signOut')}
          </MSetButton>
        ) : (
          <MSetButton variant="danger" disabled={busy} onClick={askDisconnect}>
            <Unplug size={14} /> {t('assistant.connect.disconnect')}
          </MSetButton>
        )}
      </div>

      <MSetPickerSheet
        open={modelOpen}
        onClose={() => setModelOpen(false)}
        title={t('assistant.connect.model')}
        value={own.model}
        onSelect={(v) => void setModel(v)}
        options={models.map((m) => ({ value: m.value, label: m.label }))}
      />
    </>
  );
}

/** The admin's connection the phone runs on, with today's share while the instance pays. */
function MInstanceConnection({ S }: { S: AiConnections }) {
  const { t } = useTranslation();
  const instance = S.status?.instance;
  if (!instance) return null;
  return (
    <>
      <MSetRow first label={t('assistant.connect.providedByAdmin')} sub={`${S.instanceProvider}, ${instance.model}`} />
      {S.quota && <MSetHint>{t('assistant.connect.quota', { used: S.quota.used, count: S.quota.limit })}</MSetHint>}
      <div className="mt-3 flex flex-wrap gap-2">
        {S.canOpen && (
          <MSetButton onClick={S.openAssistant}>
            <MessageCircle size={14} /> {t('assistant.connect.openAssistant')}
          </MSetButton>
        )}
        {S.status?.canConnectOwn && !S.panel && (
          <MSetButton variant="ghost" onClick={S.connectOwn}>
            {t('assistant.errorAction.connectOwn')}
          </MSetButton>
        )}
      </div>
    </>
  );
}

/** Whether the trip map follows the assistant, the phone's row for the shared switch. */
function MAssistantBehaviour() {
  const { t } = useTranslation();
  const follow = useAssistantMapFollow();
  const costs = useAssistantCostEstimates();
  return (
    <div className="mt-3 border-t border-[color:var(--m-rowbr)]">
      <MSetRow
        label={t('assistant.settings.followMap')}
        sub={t('assistant.settings.followMapHint')}
        trailing={
          <MToggle
            checked={follow.on}
            onChange={(on) => void follow.set(on)}
            ariaLabel={t('assistant.settings.followMap')}
          />
        }
      />
      <MSetRow
        label={t('assistant.settings.costEstimates')}
        sub={t('assistant.settings.costEstimatesHint')}
        trailing={
          <MToggle
            checked={costs.on}
            onChange={(on) => void costs.set(on)}
            ariaLabel={t('assistant.settings.costEstimates')}
          />
        }
      />
    </div>
  );
}

/**
 * Phone twin of components/Settings/ai/AiConnectionSection, on the same
 * useAiConnections hook. The connect panel itself is the shared one: it is
 * already a single column at phone width, and a second copy of the key and
 * sign-in steps would only drift.
 */
export default function MAiConnectionSection({
  assistant = true,
  parsing = false,
}: {
  assistant?: boolean;
  parsing?: boolean;
}): React.ReactElement | null {
  const { t } = useTranslation();
  const S = useAiConnections({ phone: true });
  const text = aiSectionText(assistant, parsing);
  if (S.view === 'hidden') return null;

  return (
    <MSetCard title={t(text.titleKey)} icon={Sparkles} className="mt-3">
      <MSetHint className="mb-3">{t(text.hintKey)}</MSetHint>

      {S.view === 'loading' && (
        <div className="grid place-items-center py-4">
          <Loader2 size={18} className="animate-spin text-m-faint" />
        </div>
      )}
      {S.view === 'own' && S.own && <MOwnConnection S={S} own={S.own} />}
      {S.view === 'instance' && <MInstanceConnection S={S} />}
      {assistant && (S.view === 'own' || S.view === 'instance') && <MAssistantBehaviour />}
      {S.view === 'adminOnly' && <MSetHint>{t('assistant.setup.adminOnly')}</MSetHint>}

      {S.panel && (
        <div
          className={`flex flex-col gap-3 ${S.view === 'setup' ? '' : 'mt-3 border-t border-[color:var(--m-rowbr)] pt-3'}`}
        >
          <AiConnectPanel
            key={S.panelMode ?? 'any'}
            scope="user"
            onConnected={S.onConnected}
            initialMode={S.panelMode}
          />
          {S.view !== 'setup' && (
            <MSetButton variant="ghost" className="self-start" onClick={S.closePanel}>
              {t('common.cancel')}
            </MSetButton>
          )}
        </div>
      )}

      {S.view !== 'setup' && S.retentionText && <MSetHint className="mt-3">{S.retentionText}</MSetHint>}
      {S.isAdmin && (
        <MSetButton variant="ghost" className="mt-3" onClick={S.openAdmin}>
          {t('assistant.setup.forEveryone')}
        </MSetButton>
      )}

      <MConfirmSheet
        open={S.ownActions.confirmingDisconnect}
        onClose={S.ownActions.cancelDisconnect}
        title={t('assistant.connect.disconnect')}
        message={t('assistant.connect.disconnectConfirm', { provider: S.ownActions.provider })}
        confirmLabel={t('assistant.connect.disconnect')}
        cancelLabel={t('common.cancel')}
        danger
        busy={S.ownActions.busy}
        onConfirm={() => void S.ownActions.disconnect()}
      />
    </MSetCard>
  );
}
