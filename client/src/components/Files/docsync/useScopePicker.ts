import { useEffect, useState } from 'react';

import type { DocSyncScope, useDocSync } from './useDocSync';

/** The `working` marker while a new container is being made. */
export const NEW_SCOPE = '__new__';

export interface ScopePickerOptions {
  connectionId: number;
  /** Pre-filled name for a new container, from the trip's title. */
  suggestedName: string;
  sync: ReturnType<typeof useDocSync>;
  onBound: () => void;
}

/**
 * Picking the folder, tag or space a trip syncs with, behind the desktop scope dialog and
 * the phone sheet's scope step: the provider's containers, binding one of them, or making
 * a new one under the suggested name and binding that. `working` holds the scope key being
 * bound, or NEW_SCOPE while a new container is made.
 */
export function useScopePicker({ connectionId, suggestedName, sync, onBound }: ScopePickerOptions) {
  const [scopes, setScopes] = useState<DocSyncScope[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState(suggestedName);
  const [working, setWorking] = useState<string | null>(null);

  // `loadScopes`, not `sync`: the hook hands back a fresh object on every
  // render of the panel above, so depending on it re-listed the provider's
  // folders each time anything up there changed. The callback itself is
  // stable. Taken out of `sync` first, because calling it as `sync.loadScopes`
  // inside the effect makes the whole object a dependency again.
  const { loadScopes } = sync;
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await loadScopes(connectionId);
      if (cancelled) return;
      setScopes(res.scopes);
      setError(res.error ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [connectionId, loadScopes]);

  const bind = async (scope: Pick<DocSyncScope, 'scopeKey' | 'label' | 'remoteRootId' | 'remoteRootPath'>) => {
    setWorking(scope.scopeKey);
    const ok = await sync.createLink({
      connectionId,
      scopeKey: scope.scopeKey,
      remoteRootId: scope.remoteRootId,
      remoteRootPath: scope.remoteRootPath,
      remoteLabel: scope.label,
      direction: 'both',
      deletePolicy: 'unlink',
      conflictPolicy: 'manual',
      syncEnabled: true,
    });
    setWorking(null);
    if (ok) onBound();
  };

  const createAndBind = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setWorking(NEW_SCOPE);
    try {
      // A refused create leaves nothing to bind; the hook has already put the
      // reason where the picker shows it.
      const scope = await sync.createScope(connectionId, trimmed);
      if (scope) await bind(scope);
    } finally {
      setWorking(null);
    }
  };

  return { scopes, error, name, setName, working, bind, createAndBind };
}
