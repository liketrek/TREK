import { useId, useMemo, useState } from 'react'
import { FolderPlus, Loader2, Search } from 'lucide-react'
import { DialogHeader, DialogShell, DialogTile, NEUTRAL_TINT } from '../../shared/DialogShell'
import { useTranslation } from '../../../i18n/TranslationContext'
import type { DocSyncConnection, useDocSync } from './useDocSync'
import { NEW_SCOPE, useScopePicker } from './useScopePicker'

/**
 * Picking the container a trip lives in.
 *
 * The list is filtered client-side: these are a person's own folders or tags,
 * so there are tens of them, not thousands, and a round trip per keystroke
 * would be slower than the filter it replaces.
 *
 * "Create" is a first-class action rather than a fallback at the bottom,
 * because for a new trip it is the common case: there is no folder yet.
 */
export default function DocSyncScopeModal({
  connection,
  providerName,
  suggestedName,
  sync,
  onClose,
  onBound,
}: {
  connection: DocSyncConnection
  providerName: string
  /** Pre-filled name for a new container, from the trip's title. */
  suggestedName: string
  sync: ReturnType<typeof useDocSync>
  onClose: () => void
  onBound: () => void
}) {
  const { t } = useTranslation()
  const labelId = useId()
  const [query, setQuery] = useState('')
  const { scopes, error, name: newName, setName: setNewName, working, bind, createAndBind } = useScopePicker({
    connectionId: connection.id,
    suggestedName,
    sync,
    onBound,
  })

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle || !scopes) return scopes ?? []
    return scopes.filter(s => s.label.toLowerCase().includes(needle))
  }, [scopes, query])

  return (
    <DialogShell
      onClose={onClose}
      labelledBy={labelId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><FolderPlus size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={onClose}
          title={t('docsync.scope.title', { provider: providerName })}
        />
      )}
    >
      <div className="space-y-4">
        <p className="text-caption text-content-muted">{t('docsync.scope.intro')}</p>

        <div className="rounded-xl border border-edge bg-surface-secondary p-3">
          <span className="mb-2 block text-body font-medium text-content">{t('docsync.scope.createTitle')}</span>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') void createAndBind() }}
              placeholder={t('docsync.newFolderPlaceholder')}
              className="min-w-0 flex-1 rounded-lg border border-edge bg-surface-input px-3 py-2 text-body text-content ring-accent focus:outline-none focus:ring-2"
            />
            <button
              type="button"
              onClick={() => void createAndBind()}
              disabled={!newName.trim() || working !== null}
              className="flex shrink-0 items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-body font-medium text-accent-text transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {working === NEW_SCOPE ? <Loader2 size={14} className="animate-spin" /> : <FolderPlus size={14} />}
              {t('docsync.scope.createAction')}
            </button>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-body font-medium text-content">{t('docsync.scope.pickTitle')}</span>
            {scopes && scopes.length > 6 && (
              <span className="relative">
                <Search size={13} className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-content-faint" />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('docsync.scope.search')}
                  className="w-44 rounded-lg border border-edge bg-surface-input py-1.5 ps-8 pe-2.5 text-caption text-content ring-accent focus:outline-none focus:ring-2"
                />
              </span>
            )}
          </div>

          {sync.error && (
            <p className="mb-2 rounded-xl border border-edge bg-danger-soft px-3 py-2.5 text-caption text-danger">
              {t(`docsync.error.${sync.error}`)}
            </p>
          )}

          {scopes === null ? (
            <div className="grid place-items-center rounded-xl border border-edge py-8">
              <Loader2 size={18} className="animate-spin text-content-faint" />
            </div>
          ) : error ? (
            <p className="rounded-xl border border-edge bg-danger-soft px-3 py-2.5 text-caption text-danger">
              {t(`docsync.error.${error}`)}
            </p>
          ) : shown.length === 0 ? (
            <p className="rounded-xl border border-dashed border-edge px-3 py-6 text-center text-caption text-content-muted">
              {query ? t('docsync.scope.noMatch') : t('docsync.noFolders')}
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-edge-faint overflow-y-auto rounded-xl border border-edge">
              {shown.map(s => (
                <li key={s.scopeKey}>
                  <button
                    type="button"
                    onClick={() => void bind(s)}
                    disabled={working !== null}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-start transition-colors hover:bg-surface-hover disabled:opacity-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-body text-content">{s.label}</span>
                      {s.remoteRootPath && (
                        <span className="block truncate text-caption text-content-faint">{s.remoteRootPath}</span>
                      )}
                    </span>
                    {working === s.scopeKey && <Loader2 size={14} className="shrink-0 animate-spin text-content-faint" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DialogShell>
  )
}
