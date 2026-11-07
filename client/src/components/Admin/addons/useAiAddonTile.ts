import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '../../../i18n';
import { mcpAppsAdminRepo } from '../../../repo/mcpAppsAdminRepo';
import { openrouterReturnCode } from '../../Settings/ai/aiConnectModel';
import { useToast } from '../../shared/Toast';
import type { Addon } from './addonModel';
import { usesConnection } from './aiAddons';

/**
 * The switch under MCP for its interactive views (MCP Apps): read while MCP is
 * on, flipped at once and put back with a toast when the save fails. Until the
 * read answers the state is unknown (null), so the row stays hidden rather than
 * showing "off" and letting a click write over a value it never saw; a second
 * click while a save is out is ignored, so the rollbacks cannot cross.
 */
function useMcpAppsSwitch(active: boolean) {
  const { t } = useTranslation();
  const toast = useToast();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const saving = useRef(false);
  const unreadable = useEffectEvent(() => toast.error(t('admin.mcpApps.loadError')));
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    mcpAppsAdminRepo
      .get()
      .then((flag) => {
        if (!cancelled) setEnabled(flag.enabled);
      })
      .catch(() => {
        if (!cancelled) unreadable();
      });
    return () => {
      cancelled = true;
    };
  }, [active]);
  const toggle = async () => {
    if (enabled === null || saving.current) return;
    const next = !enabled;
    saving.current = true;
    setEnabled(next);
    try {
      await mcpAppsAdminRepo.update(next);
      toast.success(t('admin.addons.toast.updated'));
    } catch {
      setEnabled(!next);
      toast.error(t('admin.addons.toast.error'));
    } finally {
      saving.current = false;
    }
  };
  return enabled === null ? null : { enabled, toggle };
}

/**
 * The AI tile behind both admin shells: its three switches, how many are on,
 * the switch under MCP for its interactive views, and the settings dialog. The
 * dialog opens by itself when OpenRouter's sign-in returns here
 * (`?ai=openrouter`), since the connection form that finishes it lives inside.
 */
export function useAiAddonTile(aiAddons: Addon[]) {
  const [params] = useSearchParams();
  const [open, setOpen] = useState(() => openrouterReturnCode(params) !== undefined);
  const canSetUp = usesConnection(aiAddons);
  const mcpOn = aiAddons.some((a) => a.id === 'mcp' && a.enabled);
  const mcpApps = useMcpAppsSwitch(mcpOn);
  return {
    enabledCount: aiAddons.filter((a) => a.enabled).length,
    canSetUp,
    dialogOpen: open && canSetUp,
    openDialog: () => setOpen(true),
    closeDialog: () => setOpen(false),
    /** Shown under MCP while it is on and its state is known; null otherwise. */
    mcpApps: mcpOn ? mcpApps : null,
  };
}
