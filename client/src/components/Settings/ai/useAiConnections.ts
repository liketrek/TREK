import type { AiConnectionView, AiModelInfo, AiRetention, AiStatusResponse } from '@trek/shared';
import { useEffect, useEffectEvent, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from '../../../i18n';
import { aiConnectionsRepo } from '../../../repo/aiConnectionsRepo';
import { tripRepo } from '../../../repo/tripRepo';
import { useAssistantStore } from '../../../store/assistantStore';
import { useAuthStore } from '../../../store/authStore';
import { providerLabel } from '../../Assistant/providerCatalog';
import { useToast } from '../../shared/Toast';
import { type AiConnectMode, connectErrorKey, repairModeOf } from './aiConnectModel';
import { useOpenrouterReturn } from './useAiConnect';

/**
 * What the AI connection card shows:
 * - `own`: the user's own connection, with its model and its way out
 * - `instance`: the admin's connection, which this user runs on
 * - `adminOnly`: only the admin connects one, and has not yet
 * - `setup`: nothing yet, connect one here
 * - `hidden`: the assistant is not offered here (addon off, managed, refused)
 */
type AiConnectionsView = 'loading' | 'own' | 'instance' | 'adminOnly' | 'setup' | 'hidden';

function viewOf(status: AiStatusResponse | null, loaded: boolean): AiConnectionsView {
  if (!status) return loaded ? 'hidden' : 'loading';
  if (status.own) return 'own';
  if (status.instance && status.policy !== 'user') return 'instance';
  return status.canConnectOwn ? 'setup' : 'adminOnly';
}

/** How long chats are kept, as the card's last line says it. */
function retentionLine(
  t: (key: string, params?: Record<string, number>) => string,
  retention: AiRetention | null
): string {
  if (!retention) return '';
  if (retention.mode === 'forever') return t('assistant.history.forever');
  return t('assistant.history.retention', { count: retention.days });
}

/**
 * The models a connection offers, for its model picker. Loaded again only when
 * the connection (not its model) changes; a provider that does not answer
 * leaves the list empty and the picker shows the current model alone.
 */
export function useAiModels(load: (() => Promise<AiModelInfo[]>) | null, connectionKey: string) {
  const [models, setModels] = useState<AiModelInfo[]>([]);
  const fetchModels = useEffectEvent((isCancelled: () => boolean) => {
    if (!load) return;
    load().then(
      (list) => {
        if (!isCancelled()) setModels(list);
      },
      () => {
        if (!isCancelled()) setModels([]);
      }
    );
  });
  useEffect(() => {
    let cancelled = false;
    fetchModels(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [connectionKey]);
  return models;
}

/**
 * The choices of a model picker: what the provider offers, the recommended
 * one first with its badge, and the current model kept when it is not listed.
 */
export function modelOptions(models: AiModelInfo[], current: string, labels: { free: string; recommended: string }) {
  const options = models.map((m) => ({
    value: m.id,
    label: m.label,
    badge: m.recommended ? labels.recommended : m.free ? labels.free : undefined,
  }));
  return options.some((o) => o.value === current)
    ? options
    : [{ value: current, label: current, badge: undefined }, ...options];
}

/** The actions on the user's own connection: its model, signing out of ChatGPT, removing it. */
function useOwnConnection(own: AiConnectionView | null, reload: () => Promise<void>) {
  const { t } = useTranslation();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const provider = own ? providerLabel(own.kind, own.host) : '';
  const models = useAiModels(
    own?.status === 'ok' ? () => aiConnectionsRepo.models() : null,
    own ? `${own.kind}@${own.host}` : ''
  );

  const run = async (action: () => Promise<unknown>, doneKey: string | null) => {
    setBusy(true);
    try {
      await action();
      await reload();
      if (doneKey) toast.success(t(doneKey));
    } catch (err) {
      toast.error(t(connectErrorKey(err), { provider }));
    } finally {
      setBusy(false);
    }
  };

  return {
    provider,
    models: own
      ? modelOptions(models, own.model, {
          free: t('assistant.model.free'),
          recommended: t('assistant.model.recommended'),
        })
      : [],
    busy,
    setModel: (model: string) => run(() => aiConnectionsRepo.setModel(model), 'common.saved'),
    signOut: () => run(() => aiConnectionsRepo.chatgptSignOut(), 'assistant.connect.statusSignedOut'),
    confirmingDisconnect,
    askDisconnect: () => setConfirmingDisconnect(true),
    cancelDisconnect: () => setConfirmingDisconnect(false),
    disconnect: () => {
      setConfirmingDisconnect(false);
      return run(() => aiConnectionsRepo.disconnect(), null);
    },
  };
}

/**
 * Settings → Integrations → AI assistant, behind the desktop card and its
 * phone twin. The status comes from the assistant store, so connecting here
 * shows the launcher everywhere at once. Connecting happens only here (and
 * for everyone in the admin addons); the chat window holds no setup.
 *
 * `phone` is the phone twin, whose chat lives inside a trip.
 */
export function useAiConnections({ phone = false }: { phone?: boolean } = {}) {
  const { t } = useTranslation();
  const toast = useToast();
  const navigate = useNavigate();
  const status = useAssistantStore((s) => s.status);
  const loadStatus = useAssistantStore((s) => s.loadStatus);
  const openWindow = useAssistantStore((s) => s.open);
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin');
  const [loaded, setLoaded] = useState(false);
  /** The panel opened on purpose: to renew a sign-in, replace a key, or connect one's own beside the admin's. */
  const [connecting, setConnecting] = useState<AiConnectMode | 'any' | null>(null);

  const reload = () => loadStatus().then(() => setLoaded(true));
  useEffect(() => {
    void loadStatus().then(() => setLoaded(true));
  }, [loadStatus]);

  const onConnected = () => {
    setConnecting(null);
    void reload();
  };
  useOpenrouterReturn(onConnected);

  const own = status?.own ?? null;
  const view = viewOf(status, loaded);
  const ownActions = useOwnConnection(own, reload);

  /**
   * Opens the chat on the trip under way or the next one (the planner opens it
   * for `?assistant=1`). Without one the desktop window asks for a trip on the
   * dashboard; the phone has no chat outside a trip, so it says to make one.
   */
  const openAssistant = () => {
    const withoutTrip = () => {
      if (phone) {
        toast.info(t('assistant.picker.empty'));
        return;
      }
      openWindow();
      void navigate('/dashboard');
    };
    tripRepo
      .active()
      .then(({ trip }) => (trip ? void navigate(`/trips/${trip.id}?assistant=1`) : withoutTrip()), withoutTrip);
  };

  return {
    status,
    view,
    own,
    ownActions,
    instanceProvider: status?.instance ? providerLabel(status.instance.kind, status.instance.host) : '',
    quota: status?.quota ?? null,
    retentionText: retentionLine(t, status?.retention ?? null),
    /** The panel shows, and on which way it opens. */
    panel: view === 'setup' || connecting !== null,
    panelMode: connecting === 'any' || connecting === null ? undefined : connecting,
    repairMode: own ? repairModeOf(own) : null,
    connectOwn: () => setConnecting('any'),
    repair: (mode: AiConnectMode) => setConnecting(mode),
    closePanel: () => setConnecting(null),
    onConnected,
    canOpen: status?.available === true,
    openAssistant,
    isAdmin,
    openAdmin: () => void navigate('/admin?tab=addons'),
  };
}
