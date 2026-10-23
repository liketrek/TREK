import { useState } from 'react';
import { useSearchParams } from 'react-router';
import type { Addon } from './addonModel';
import { usesConnection } from './aiAddons';

/**
 * The AI tile behind both admin shells: its three switches, how many are on,
 * and the settings dialog. The dialog opens by itself when OpenRouter's
 * sign-in returns here (`?ai=openrouter`), since the connection form that
 * finishes it lives inside.
 */
export function useAiAddonTile(aiAddons: Addon[]) {
  const [params] = useSearchParams();
  const [open, setOpen] = useState(() => params.get('ai') === 'openrouter');
  const canSetUp = usesConnection(aiAddons);
  return {
    enabledCount: aiAddons.filter((a) => a.enabled).length,
    canSetUp,
    dialogOpen: open && canSetUp,
    openDialog: () => setOpen(true),
    closeDialog: () => setOpen(false),
  };
}
