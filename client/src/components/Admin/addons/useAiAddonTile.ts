import { useEffect, useEffectEvent, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from '../../../i18n';
import { mcpAppsAdminRepo } from '../../../repo/mcpAppsAdminRepo';
import { openrouterReturnCode } from '../../Settings/ai/aiConnectModel';
import { useToast } from '../../shared/Toast';
import type { Addon } from './addonModel';
import { usesConnection } from './aiAddons';

/**
 * The switch under MCP for its interactive views (MCP Apps): read once on mount,
 * flipped at once and put back with a toast when the save fails.
 */
function useMcpAppsSwitch() {
  const { t } = useTranslation();
  const toast = useToast();
  const [enabled, setEnabled] = useState(false);
  const unreadable = useEffectEvent(() => toast.error(t('admin.addons.toast.error')));
  useEffect(() => {
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
  }, []);
  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    try {
      await mcpAppsAdminRepo.update(next);
      toast.success(t('admin.addons.toast.updated'));
    } catch {
      setEnabled(!next);
      toast.error(t('admin.addons.toast.error'));
    }
  };
  return { enabled, toggle };
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
  const mcpApps = useMcpAppsSwitch();
  return {
    enabledCount: aiAddons.filter((a) => a.enabled).length,
    canSetUp,
    dialogOpen: open && canSetUp,
    openDialog: () => setOpen(true),
    closeDialog: () => setOpen(false),
    /** Shown under MCP while it is on; null otherwise. */
    mcpApps: aiAddons.some((a) => a.id === 'mcp' && a.enabled) ? mcpApps : null,
  };
}
