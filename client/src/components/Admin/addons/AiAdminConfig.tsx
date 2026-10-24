import { Check, Loader2, Sparkles } from 'lucide-react';
import React, { useId, useState } from 'react';
import { useTranslation } from '../../../i18n';
import ToggleSwitch from '../../Settings/ToggleSwitch';
import AiConnectPanel, { ProviderMark } from '../../Settings/ai/AiConnectPanel';
import { CONNECTION_STATUS } from '../../Settings/ai/aiConnectModel';
import { SETTINGS_BUTTON, SETTINGS_BUTTON_DANGER, SettingsHint, StatusPill } from '../../Settings/settingsKit';
import ConfirmDialog from '../../shared/ConfirmDialog';
import CustomSelect from '../../shared/CustomSelect';
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
import { NumericInput } from '../../shared/NumericInput';
import { EditorField, INPUT, Segmented } from '../../shared/dialogParts';
import ParsingSettings from './ParsingSettings';
import type { Addon } from './addonModel';
import { POLICY_CHOICES, useAiAdminConfig } from './useAiAdminConfig';

type AiAdmin = ReturnType<typeof useAiAdminConfig>;

const EYEBROW = 'font-geist font-bold uppercase tracking-[.08em] text-content-faint';

/** Who pays, as three rows to pick one from: the labels are too long for a segmented track in a shelf. */
function PolicyChoice({ A }: { A: AiAdmin }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <span className={EYEBROW} style={fs(9.5)}>
        {t('assistant.admin.policy')}
      </span>
      <div role="radiogroup" aria-label={t('assistant.admin.policy')} className="flex flex-col gap-1.5">
        {POLICY_CHOICES.map((choice) => {
          const on = A.policy === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => A.setPolicy(choice.value)}
              className={`flex items-center gap-2 rounded-[10px] border px-3 py-2 text-start transition-colors ${on ? 'border-[color:var(--text-primary)] bg-surface-card shadow-sm' : 'border-edge bg-surface-card hover:border-edge-secondary'}`}
            >
              <span
                className={`min-w-0 flex-1 font-medium ${on ? 'text-content' : 'text-content-muted'}`}
                style={fs(12.5, 'body')}
              >
                {t(choice.labelKey)}
              </span>
              {on && <Check size={14} strokeWidth={2.4} className="flex-none text-content" />}
            </button>
          );
        })}
      </div>
      {A.policyHintKey && <SettingsHint>{t(A.policyHintKey)}</SettingsHint>}
    </div>
  );
}

/** The connection everyone runs on, once set up: who answers, its model, and replacing or removing it. */
function LiveConnection({ A }: { A: AiAdmin }) {
  const { t } = useTranslation();
  const { live, provider, models, busy, setModel, replace, askRemove } = A.instance;
  if (!live) return null;
  const status = CONNECTION_STATUS[live.status];
  return (
    <div
      className={`flex flex-col gap-3 rounded-[12px] border border-edge-faint bg-surface-card p-3 ${busy ? 'opacity-60' : ''}`}
    >
      <div className="flex items-center gap-2.5">
        <ProviderMark kind={live.kind} />
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate font-medium text-content" style={fs(13, 'body')}>
            {provider}
          </p>
          <p className="m-0 truncate font-geist text-content-faint" style={fs(11)}>
            {live.hint ?? live.host}
          </p>
        </div>
        <StatusPill tone={status.tone}>{t(status.labelKey)}</StatusPill>
      </div>
      {live.status === 'ok' && (
        <EditorField label={t('assistant.connect.model')} hint={t('assistant.connect.modelHint')}>
          <CustomSelect
            ariaLabel={t('assistant.connect.model')}
            value={live.model}
            onChange={(v) => setModel(String(v))}
            options={models}
            size="sm"
            disabled={busy}
            searchable={models.length > 8}
          />
        </EditorField>
      )}
      <div className="flex flex-wrap gap-2" style={fs(12.5, 'body')}>
        <button type="button" onClick={replace} disabled={busy} className={SETTINGS_BUTTON}>
          {t('common.change')}
        </button>
        <button type="button" onClick={askRemove} disabled={busy} className={SETTINGS_BUTTON_DANGER}>
          {t('assistant.admin.connectionRemove')}
        </button>
      </div>
    </div>
  );
}

function InstanceConnection({ A }: { A: AiAdmin }) {
  const { t } = useTranslation();
  const { live, connection, replacing, cancelReplace, onConnected } = A.instance;
  return (
    <div className="flex flex-col gap-2.5">
      <span className={EYEBROW} style={fs(9.5)}>
        {t('assistant.admin.connection')}
      </span>
      {!replacing && <LiveConnection A={A} />}
      {!live && <SettingsHint>{t('assistant.admin.connectionNone')}</SettingsHint>}
      {A.showPanel && (
        <AiConnectPanel scope="instance" onConnected={onConnected} prefill={connection?.prefill ?? null} />
      )}
      {replacing && (
        <button
          type="button"
          onClick={cancelReplace}
          className={`${SETTINGS_BUTTON} self-start`}
          style={fs(12.5, 'body')}
        >
          {t('common.cancel')}
        </button>
      )}
    </div>
  );
}

/** The assistant's own limits: turns a day while the instance pays, how long chats are kept, whether it searches the web. */
function AssistantLimits({ A }: { A: AiAdmin }) {
  const { t } = useTranslation();
  const fieldId = useId();
  return (
    <div className="flex flex-col gap-4">
      {A.instancePays && (
        <EditorField
          label={t('assistant.admin.dailyLimit')}
          htmlFor={`${fieldId}-daily`}
          hint={t('assistant.admin.dailyLimitHint')}
        >
          <NumericInput
            id={`${fieldId}-daily`}
            mode="integer"
            className={`${INPUT} tabular-nums`}
            value={A.dailyDraft}
            onValueChange={A.setDailyDraft}
            onBlur={A.commitDailyLimit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
          />
        </EditorField>
      )}
      <EditorField label={t('assistant.admin.retention')}>
        <CustomSelect
          ariaLabel={t('assistant.admin.retention')}
          value={A.retention}
          onChange={(v) => A.setRetention(String(v))}
          options={A.retentionOptions}
          size="sm"
        />
      </EditorField>
      {A.settings && (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-3">
            <span className="text-body font-medium text-content">{t('assistant.admin.webSearch')}</span>
            <ToggleSwitch
              on={A.settings.webSearch}
              onToggle={() => A.setWebSearch(!A.settings?.webSearch)}
              label={t('assistant.admin.webSearch')}
            />
          </div>
          <SettingsHint>{t('assistant.admin.webSearchHint')}</SettingsHint>
        </div>
      )}
    </div>
  );
}

type AiTab = 'connection' | 'assistant' | 'parsing';

/**
 * The AI settings behind the AI tile's button, in one dialog so the addon page
 * stays short: the connection the assistant and AI parsing share (and who pays
 * for it), the assistant's limits, and how bookings are read. A tab shows only
 * while its addon is on. Each change saves at once.
 */
export default function AiSettingsDialog({
  addons,
  onClose,
}: {
  addons: Addon[];
  onClose: () => void;
}): React.ReactElement {
  const { t } = useTranslation();
  const labelId = useId();
  const A = useAiAdminConfig();
  const assistantOn = addons.some((a) => a.id === 'ai_assistant' && a.enabled);
  const parsing = addons.find((a) => a.id === 'llm_parsing' && a.enabled) ?? null;
  const tabs: { value: AiTab; label: string }[] = [
    { value: 'connection', label: t('admin.addons.ai.tab.connection') },
    ...(assistantOn ? [{ value: 'assistant' as const, label: t('admin.addons.catalog.ai_assistant.name') }] : []),
    ...(parsing ? [{ value: 'parsing' as const, label: t('admin.addons.catalog.llm_parsing.name') }] : []),
  ];
  const [tab, setTab] = useState<AiTab>('connection');
  const shown = tabs.some((x) => x.value === tab) ? tab : 'connection';

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="detail"
      align="top"
      blocked={A.instance.confirmingRemove}
      header={
        <DialogHeader
          tile={
            <DialogTile>
              <Sparkles size={20} strokeWidth={2} />
            </DialogTile>
          }
          tint={NEUTRAL_TINT}
          labelId={labelId}
          eyebrow={t('admin.addons.ai.name')}
          title={t('admin.addons.ai.setup')}
          sub={t('admin.addons.ai.dialogSub')}
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
      {tabs.length > 1 && (
        <Segmented<AiTab> label={t('admin.addons.ai.setup')} value={shown} onChange={setTab} options={tabs} fill />
      )}
      {!A.loaded ? (
        <div className="grid place-items-center py-10">
          <Loader2 size={20} className="animate-spin text-content-faint" />
        </div>
      ) : (
        <>
          {shown === 'connection' && (
            <div className="flex flex-col gap-4">
              <PolicyChoice A={A} />
              {A.instancePays && <InstanceConnection A={A} />}
            </div>
          )}
          {shown === 'assistant' && <AssistantLimits A={A} />}
          {shown === 'parsing' && parsing && (
            <ParsingSettings addon={parsing} A={A} onOpenConnection={() => setTab('connection')} />
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={A.instance.confirmingRemove}
        onClose={A.instance.cancelRemove}
        onConfirm={A.instance.remove}
        title={t('assistant.admin.connectionRemove')}
        message={t('assistant.connect.disconnectConfirm', { provider: A.instance.provider })}
        confirmLabel={t('assistant.admin.connectionRemove')}
        danger
      />
    </DialogShell>
  );
}
