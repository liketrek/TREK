import React, { useId } from 'react'
import { KeyRound, Plus, Trash2, Copy, Check, AlertTriangle, type LucideIcon } from 'lucide-react'
import { PUBLIC_API_SCOPES } from '@trek/shared'
import Section from './Section'
import ConfirmDialog from '../shared/ConfirmDialog'
import { Tooltip } from '../shared/Tooltip'
import { DialogButton, DialogFooter, DialogHeader, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { EditorField, GRID_2, INPUT, LABEL } from '../shared/dialogParts'
import { SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON, SettingsHint, StatusPill } from './settingsKit'
import { useTranslation } from '../../i18n'
import { useDateFormat } from '../../hooks/useDateFormat'
import { API_SCOPE_ICONS, MAX_API_KEYS, formatApiKeyStamp, useApiKeys, type ApiKey } from './useApiKeys'

/**
 * The usage hint with its header names and path set as code.
 *
 * Every locale quotes the two headers the same way, so they can be picked out
 * of the sentence instead of cutting it into fragments a translator would have
 * to reassemble. A translation that drops the quotes simply stays plain text.
 */
function withCode(text: string): React.ReactNode[] {
  return text.split(/("[^"]+"|\/api\/v1)/).map((part, i) => {
    if (i % 2 === 0) return part
    return (
      <code key={i} className="rounded-[5px] bg-surface-tertiary px-1 py-px font-geist text-content-secondary">
        {part.replace(/^"|"$/g, '')}
      </code>
    )
  })
}

/**
 * Keys for the public API — the credential a user hands to other software that
 * should read their trips.
 *
 * Its own section rather than a third tab under MCP: an API key is not an MCP
 * credential, it does not need the MCP addon, and burying it under a heading
 * about AI assistants is how people end up minting the wrong kind. The two look
 * alike deliberately (name, prefix, shown once) because they are the same
 * gesture; what differs is which door they open.
 *
 * The list and every action live in useApiKeys, shared with the phone's
 * MApiKeysSection; this file is the desktop markup.
 */
export default function ApiKeysSection(): React.ReactElement {
  const { t, locale } = useTranslation()
  const dialogLabelId = useId()
  const {
    keys, loadState, modalOpen, newName, setNewName, creating, created, deleteId, setDeleteId, copied,
    newScopes, setNewScopes, endpoint, atLimit, allSelected, canCreate,
    handleCreate, handleDelete, handleCopy, openModal, closeModal, toggleScope,
  } = useApiKeys()

  const header = (
    <DialogHeader
      tile={<DialogTile><KeyRound size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
      tint={NEUTRAL_TINT}
      labelId={dialogLabelId}
      // Once the key is on screen the cross does what Done does: it is a deliberate
      // click, unlike the Escape and backdrop the shell ignores below.
      onClose={closeModal}
      title={created ? t('settings.apiKeys.modal.createdTitle') : t('settings.apiKeys.modal.createTitle')}
    />
  )

  const footer = created ? (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton variant="primary" onClick={closeModal}>{t('settings.apiKeys.modal.done')}</DialogButton>
    </DialogFooter>
  ) : (
    <DialogFooter>
      <FooterSpacer />
      <DialogButton onClick={closeModal}>{t('common.cancel')}</DialogButton>
      <DialogButton variant="primary" onClick={handleCreate} disabled={!canCreate}
        icon={creating ? <span aria-hidden className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : undefined}>
        {creating ? t('settings.apiKeys.modal.creating') : t('settings.apiKeys.modal.create')}
      </DialogButton>
    </DialogFooter>
  )

  return (
    <>
      <Section
        id="api-keys"
        title={t('settings.apiKeys.title')}
        icon={KeyRound}
        badge={keys.length > 0 ? <StatusPill>{keys.length}/{MAX_API_KEYS}</StatusPill> : undefined}
        action={(
          <button type="button" onClick={openModal} disabled={atLimit} className={SETTINGS_BUTTON_PRIMARY}>
            <Plus size={14} /> {t('settings.apiKeys.create')}
          </button>
        )}
      >
        <SettingsHint>{t('settings.apiKeys.description')}</SettingsHint>

        {atLimit && (
          <div className="flex gap-2.5 rounded-[12px] bg-warning-soft px-3.5 py-2.5 text-content" style={fs(12.5, 'body')}>
            <AlertTriangle size={15} className="mt-px flex-none text-warning" />
            <p className="m-0 leading-snug">{t('settings.apiKeys.limitReached', { count: MAX_API_KEYS })}</p>
          </div>
        )}

        {loadState === 'loading' && (
          <div aria-hidden className="flex flex-col gap-2">
            <div className="h-[62px] animate-pulse rounded-[12px] bg-surface-tertiary" />
          </div>
        )}

        {loadState === 'failed' && (
          <p role="alert" className="m-0 rounded-[12px] bg-danger-soft px-3.5 py-2.5 text-danger" style={fs(12.5, 'body')}>
            {t('settings.apiKeys.loadFailed')}
          </p>
        )}

        {loadState === 'ready' && keys.length === 0 && (
          <div className="flex flex-col items-center gap-2.5 rounded-[12px] border border-dashed border-edge bg-surface-card px-4 py-6 text-center">
            <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-surface-tertiary text-content-muted">
              <KeyRound size={18} strokeWidth={1.9} />
            </span>
            <p className="m-0 text-content-muted" style={fs(12.5, 'body')}>{t('settings.apiKeys.empty')}</p>
          </div>
        )}

        {keys.length > 0 && (
          <ul className="m-0 list-none divide-y divide-edge-faint overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card p-0">
            {keys.map(key => (
              <ApiKeyRow key={key.id} apiKey={key} locale={locale} onDelete={() => setDeleteId(key.id)} />
            ))}
          </ul>
        )}

        <div className="flex flex-col gap-2 border-t border-edge-faint pt-4">
          <span className={LABEL + ' !mb-0'}>{t('settings.apiKeys.endpoint')}</span>
          <div className="flex items-center gap-2">
            <code className="block min-w-0 flex-1 truncate rounded-[10px] border border-edge-faint bg-surface-card px-3 py-2 font-geist text-content" style={fs(12.5, 'body')}>
              {endpoint}
            </code>
            <Tooltip label={t('common.copy')}>
              <button type="button" onClick={() => handleCopy(endpoint, 'endpoint')}
                className={`${SETTINGS_ICON_BUTTON} !h-9 !w-9`}
                aria-label={t('common.copy')}>
                {copied === 'endpoint' ? <Check size={15} className="text-success" /> : <Copy size={15} />}
              </button>
            </Tooltip>
          </div>
          <SettingsHint>{withCode(t('settings.apiKeys.docsHint'))}</SettingsHint>
        </div>
      </Section>

      <DialogShell
        open={modalOpen}
        // Once the key is on screen, Done is the only way out: a stray Escape or
        // backdrop click would throw away the one copy there will ever be.
        onClose={created ? () => {} : closeModal}
        blocked={!!created}
        labelledBy={dialogLabelId}
        width="detail"
        header={header}
        footer={footer}
      >
        {created ? (
          <>
            <div className="flex items-start gap-2.5 rounded-[12px] bg-warning-soft px-3.5 py-3">
              <AlertTriangle size={15} className="mt-px flex-none text-warning" />
              <p className="m-0 text-content" style={fs(12.5, 'body')}>{t('settings.apiKeys.modal.createdWarning')}</p>
            </div>
            <div className="flex items-stretch overflow-hidden rounded-[12px] border border-edge-faint bg-surface-secondary">
              <code className="min-w-0 flex-1 select-all break-all px-3.5 py-3 font-geist text-content" style={fs(12.5, 'body')}>{created}</code>
              <button type="button" onClick={() => handleCopy(created, 'key')} title={t('settings.apiKeys.copy')}
                className="flex flex-none items-center gap-1.5 border-s border-edge-faint bg-surface-card px-3.5 font-medium text-content-secondary transition-colors hover:text-content"
                style={fs(12.5, 'body')}>
                {copied === 'key' ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copied === 'key' ? t('common.copied') : t('settings.apiKeys.copy')}
              </button>
            </div>
          </>
        ) : (
          <>
            <EditorField label={t('settings.apiKeys.modal.name')} htmlFor="api-key-name" hint={t('settings.apiKeys.modal.nameHint')}>
              <input id="api-key-name" type="text" value={newName} onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') void handleCreate() }}
                placeholder={t('settings.apiKeys.modal.namePlaceholder')}
                maxLength={100}
                className={INPUT}
                autoFocus />
            </EditorField>

            <section role="group" aria-labelledby="api-key-scopes-title">
              <div className="mb-2 flex items-center gap-2">
                <span id="api-key-scopes-title" className="font-geist font-bold uppercase tracking-[.08em] text-content-faint" style={fs(9.5)}>
                  {t('settings.apiScopes.title')}
                </span>
                <button type="button"
                  onClick={() => setNewScopes(allSelected ? new Set() : new Set(PUBLIC_API_SCOPES))}
                  className="ms-auto flex-none rounded-full px-2 py-0.5 font-semibold text-content-muted transition-colors hover:bg-surface-tertiary hover:text-content"
                  style={fs(11.5, 'body')}>
                  {allSelected ? t('common.deselectAll') : t('common.selectAll')}
                </button>
              </div>
              <SettingsHint className="mb-3">{t('settings.apiScopes.hint')}</SettingsHint>
              <div className={GRID_2}>
                {PUBLIC_API_SCOPES.map(scope => (
                  <ScopeOption key={scope} icon={API_SCOPE_ICONS[scope]} label={t(`settings.apiScopes.${scope}`)}
                    checked={newScopes.has(scope)} onToggle={() => toggleScope(scope)} />
                ))}
              </div>
              {newScopes.size === 0 && (
                <p className="m-0 mt-2 text-danger" style={fs(11.5)}>{t('settings.apiScopes.noneSelected')}</p>
              )}
            </section>
          </>
        )}
      </DialogShell>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={() => { if (deleteId !== null) void handleDelete(deleteId) }}
        title={t('settings.apiKeys.deleteTitle')}
        message={t('settings.apiKeys.deleteMessage')}
        confirmLabel={t('settings.apiKeys.deleteTitle')}
      />
    </>
  )
}

function ApiKeyRow({ apiKey, locale, onDelete }: { apiKey: ApiKey; locale: string; onDelete: () => void }): React.ReactElement {
  const { t } = useTranslation()
  const dateFormat = useDateFormat()
  const scopes = apiKey.scope_mode === 'limited' ? apiKey.scopes : undefined
  return (
    <li className="flex items-start gap-3 px-3.5 py-3">
      <span className="grid h-9 w-9 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-secondary">
        <KeyRound size={16} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="min-w-0 max-w-full truncate font-semibold text-content" style={fs(13, 'body')}>{apiKey.name}</span>
          <code className="rounded-full border border-edge-faint bg-surface-secondary px-2 py-[1px] font-geist text-content-muted" style={fs(11)}>
            {apiKey.token_prefix}…
          </code>
        </div>
        <p className="m-0 mt-0.5 tabular-nums text-content-faint first-letter:uppercase" style={fs(11.5)}>
          {t('settings.apiKeys.createdAt')} {formatApiKeyStamp(apiKey.created_at, locale, dateFormat)}
          {', '}
          {apiKey.last_used_at
            ? `${t('settings.apiKeys.usedAt')} ${formatApiKeyStamp(apiKey.last_used_at, locale, dateFormat)}`
            : t('settings.apiKeys.neverUsed')}
        </p>
        {/* What the key may read. Shown on the row rather than behind a detail
            view: the whole reason to narrow a key is to be able to see later
            that you did. */}
        <div className="mt-2 flex flex-wrap gap-1">
          {scopes ? scopes.map(scope => {
            const Icon = API_SCOPE_ICONS[scope]
            return (
              <StatusPill key={scope} icon={Icon ? <Icon size={11} strokeWidth={2.2} /> : undefined}>
                {t(`settings.apiScopes.${scope}`)}
              </StatusPill>
            )
          }) : (
            <StatusPill tone="success">{t('settings.apiScopes.all')}</StatusPill>
          )}
        </div>
      </div>
      <Tooltip label={t('settings.apiKeys.deleteTitle')}>
        <button type="button" onClick={onDelete}
          className={`${SETTINGS_ICON_BUTTON} hover:!bg-danger-soft hover:!text-danger`}
          aria-label={t('settings.apiKeys.deleteTitle')}>
          <Trash2 size={14} />
        </button>
      </Tooltip>
    </li>
  )
}

/**
 * One area the key may read. The whole tile is the control: a bare browser
 * checkbox is a small target and ignores the user's accent.
 */
function ScopeOption({ icon: Icon, label, checked, onToggle }: {
  icon: LucideIcon
  label: string
  checked: boolean
  onToggle: () => void
}): React.ReactElement {
  return (
    <button type="button" role="checkbox" aria-checked={checked} onClick={onToggle}
      className={`flex w-full min-w-0 items-center gap-2.5 rounded-[10px] border px-3 py-2.5 text-start transition-colors ${
        checked ? 'border-[color:var(--text-primary)] bg-surface-card shadow-sm' : 'border-edge-faint bg-surface-secondary hover:bg-surface-card'
      }`}>
      <span aria-hidden
        className={`grid h-4 w-4 flex-none place-items-center rounded-[5px] transition-colors ${
          checked ? 'bg-accent' : 'border-[1.5px] border-edge'
        }`}>
        {checked && <Check size={10} strokeWidth={3} className="text-accent-text" />}
      </span>
      <Icon aria-hidden size={15} className={`flex-none ${checked ? 'text-content-secondary' : 'text-content-faint'}`} />
      <span className={`min-w-0 truncate font-medium ${checked ? 'text-content' : 'text-content-muted'}`} style={fs(12.5, 'body')}>{label}</span>
    </button>
  )
}
