import {
  MASKED_SETTING_VALUE,
  type AiAdminConnectionResponse,
  type AiAdminSettings,
  type AiInstanceConnectionRequest,
  type AiPolicy,
  type AiRetention,
} from '@trek/shared';
import { useEffect, useEffectEvent, useState } from 'react';
import { useTranslation } from '../../../i18n';
import { aiConnectionsRepo } from '../../../repo/aiConnectionsRepo';
import { useAssistantStore } from '../../../store/assistantStore';
import { providerLabel } from '../../Assistant/providerCatalog';
import { connectErrorKey } from '../../Settings/ai/aiConnectModel';
import { useOpenrouterReturn } from '../../Settings/ai/useAiConnect';
import { modelOptions, useAiModels } from '../../Settings/ai/useAiConnections';
import { useToast } from '../../shared/Toast';

/** Who pays, as the admin reads it ("I pay" rather than "the instance"); the first is the default. */
export const POLICY_CHOICES: readonly { value: AiPolicy; labelKey: string; hintKey: string }[] = [
  {
    value: 'instance_or_user',
    labelKey: 'assistant.admin.policy.instanceOrUser',
    hintKey: 'assistant.admin.policy.instanceOrUserHint',
  },
  { value: 'instance', labelKey: 'assistant.admin.policy.instance', hintKey: 'assistant.admin.policy.instanceHint' },
  { value: 'user', labelKey: 'assistant.admin.policy.user', hintKey: 'assistant.admin.policy.userHint' },
];

const RETENTION_DAYS = [30, 90, 365];
const FOREVER = 'forever';
const MAX_DAILY_TURNS = 10_000;

/** A retention as the select's value: its days, or `forever`. */
function retentionValue(retention: AiRetention): string {
  return retention.mode === 'forever' ? FOREVER : String(retention.days);
}

function retentionOf(value: string): AiRetention {
  return value === FOREVER ? { mode: 'forever' } : { mode: 'days', days: Number(value) };
}

/** Policy, daily limit, retention and web search: each change is saved at once and taken back when the server refuses it. */
function useAdminSettings(onSaved: () => void) {
  const { t } = useTranslation();
  const toast = useToast();
  const [settings, setSettings] = useState<AiAdminSettings | null>(null);
  const [dailyDraft, setDailyDraft] = useState('');

  const adopt = (next: AiAdminSettings) => {
    setSettings(next);
    setDailyDraft(String(next.dailyTurns));
  };

  const save = async (patch: Partial<AiAdminSettings>) => {
    if (!settings) return;
    const before = settings;
    setSettings({ ...settings, ...patch });
    try {
      adopt(await aiConnectionsRepo.saveAdminSettings({ ...settings, ...patch }));
      onSaved();
    } catch {
      adopt(before);
      toast.error(t('assistant.error.generic'));
    }
  };

  /** The typed limit, kept within what the server takes, saved when the field is left. */
  const commitDailyLimit = () => {
    if (!settings) return;
    const typed = Number.parseInt(dailyDraft, 10);
    const next = Number.isFinite(typed) ? Math.min(MAX_DAILY_TURNS, Math.max(1, typed)) : settings.dailyTurns;
    setDailyDraft(String(next));
    if (next !== settings.dailyTurns) void save({ dailyTurns: next });
  };

  const current = settings ? retentionValue(settings.retention) : '';
  // A period set some other way stays selectable instead of reading as blank.
  const unlisted = current !== '' && current !== FOREVER && !RETENTION_DAYS.includes(Number(current));
  const days = unlisted ? [...RETENTION_DAYS, Number(current)].sort((a, b) => a - b) : RETENTION_DAYS;

  return {
    settings,
    adopt,
    setPolicy: (policy: AiPolicy) => void save({ policy }),
    dailyDraft,
    setDailyDraft,
    commitDailyLimit,
    retention: current,
    retentionOptions: [
      ...days.map((d) => ({ value: String(d), label: t('assistant.admin.retentionDays', { count: d }) })),
      { value: FOREVER, label: t('assistant.admin.retentionForever') },
    ],
    setRetention: (value: string) => void save({ retention: retentionOf(value) }),
    setWebSearch: (webSearch: boolean) => void save({ webSearch }),
  };
}

/** The connection for everyone: shown, its model switched, replaced or removed. */
function useInstanceConnection(onChanged: () => void) {
  const { t } = useTranslation();
  const toast = useToast();
  const [connection, setConnection] = useState<AiAdminConnectionResponse | null>(null);
  const [replacing, setReplacing] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const [busy, setBusy] = useState(false);
  const live = connection?.connection ?? null;
  const provider = live ? providerLabel(live.kind, live.host) : '';
  const models = useAiModels(
    live?.status === 'ok' ? () => aiConnectionsRepo.adminModels() : null,
    live ? `${live.kind}@${live.host}` : ''
  );

  const act = async (action: () => Promise<AiAdminConnectionResponse>, doneKey: string | null) => {
    setBusy(true);
    try {
      setConnection(await action());
      onChanged();
      if (doneKey) toast.success(t(doneKey));
    } catch (err) {
      toast.error(t(connectErrorKey(err), { provider }));
    } finally {
      setBusy(false);
    }
  };

  /** Another model on the same connection: the stored key is kept by sending the mask in its place. */
  const setModel = (model: string) => {
    if (!live || live.kind === 'chatgpt') return;
    const request: AiInstanceConnectionRequest =
      live.kind === 'custom'
        ? { kind: 'custom', baseUrl: live.baseUrl ?? '', model, ...(live.hint ? { apiKey: MASKED_SETTING_VALUE } : {}) }
        : { kind: live.kind, apiKey: MASKED_SETTING_VALUE, model };
    void act(() => aiConnectionsRepo.saveAdminConnection(request), 'common.saved');
  };

  const remove = () => {
    setConfirmingRemove(false);
    void act(async () => {
      await aiConnectionsRepo.removeAdminConnection();
      return aiConnectionsRepo.adminConnection();
    }, null);
  };

  const onConnected = () => {
    setReplacing(false);
    void act(() => aiConnectionsRepo.adminConnection(), null);
  };

  return {
    connection,
    setConnection,
    live,
    provider,
    models: live
      ? modelOptions(models, live.model, {
          free: t('assistant.model.free'),
          recommended: t('assistant.model.recommended'),
        })
      : [],
    busy,
    setModel,
    replacing,
    replace: () => setReplacing(true),
    cancelReplace: () => setReplacing(false),
    onConnected,
    confirmingRemove,
    askRemove: () => setConfirmingRemove(true),
    cancelRemove: () => setConfirmingRemove(false),
    remove,
  };
}

/**
 * The AI assistant's admin settings behind both admin shells, on the addon's
 * own tile: who pays, the connection everyone runs on, the daily limit while
 * the instance pays, and how long chats are kept. The assistant's status is
 * reloaded after every change, so the launcher appears or goes at once.
 */
export function useAiAdminConfig() {
  const { t } = useTranslation();
  const toast = useToast();
  const loadStatus = useAssistantStore((s) => s.loadStatus);
  const refreshStatus = () => void loadStatus();
  const form = useAdminSettings(refreshStatus);
  const instance = useInstanceConnection(refreshStatus);
  useOpenrouterReturn(instance.onConnected);

  const loadOnMount = useEffectEvent((isCancelled: () => boolean) => {
    Promise.all([aiConnectionsRepo.adminSettings(), aiConnectionsRepo.adminConnection()]).then(
      ([settings, connection]) => {
        if (isCancelled()) return;
        form.adopt(settings);
        instance.setConnection(connection);
      },
      () => {
        if (!isCancelled()) toast.error(t('assistant.error.generic'));
      }
    );
    // The connect panel reads whether OpenRouter can return here from the status.
    refreshStatus();
  });
  useEffect(() => {
    let cancelled = false;
    loadOnMount(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, []);

  const policy = form.settings?.policy ?? null;
  return {
    ...form,
    instance,
    loaded: form.settings !== null && instance.connection !== null,
    policy,
    policyHintKey: POLICY_CHOICES.find((c) => c.value === policy)?.hintKey ?? null,
    /** Policy `user` charges nothing to the instance: no connection and no limit to set. */
    instancePays: policy !== null && policy !== 'user',
    showPanel: instance.live === null || instance.replacing,
  };
}
