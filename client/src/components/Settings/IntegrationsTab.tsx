import Section from './Section'
import React, { useId } from 'react'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { Trash2, Copy, Terminal, Plus, Check, Key, KeyRound, ChevronRight, RefreshCw, AlertTriangle, Link2 } from 'lucide-react'
import PhotoProvidersSection from './PhotoProvidersSection'
import AirTrailConnectionSection from './AirTrailConnectionSection'
import DawarichConnectionSection from './DawarichConnectionSection'
import LlmConnectionSection from './LlmConnectionSection'
import ApiKeysSection from './ApiKeysSection'
import ScopeGroupPicker from '../OAuth/ScopeGroupPicker'
import ConfirmDialog from '../shared/ConfirmDialog'
import { Tooltip } from '../shared/Tooltip'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
import { EditorField, INPUT, Segmented, TEXTAREA } from '../shared/dialogParts'
import { SETTINGS_BUTTON, SETTINGS_BUTTON_PRIMARY, SETTINGS_ICON_BUTTON, SettingRows, SettingsHint, StatusPill } from './settingsKit'
import { OAUTH_PRESETS, useMcpIntegration, type OAuthClient } from './useMcpIntegration'
import { useIntegrationGates } from './useIntegrationGates'

export default function IntegrationsTab(): React.ReactElement {
  const S = useIntegrations()
  const managed = S.managed
  return (
    <>
      {/* Immich, Synology Photos and AirTrail all connect to a server the reader
          runs themselves. On a managed install there is none, and every one of
          these would ask for an address that cannot be reached from here. */}
      {!managed && <PhotoProvidersSection />}
      {S.airtrailEnabled && !managed && <AirTrailConnectionSection />}
      {S.dawarichEnabled && !managed && <DawarichConnectionSection />}
      {/* Which model reads a booking, and what that costs, comes with the instance on
       a managed install. The per-user fallback exists for people who supply their
       own key, and there nobody does. */}
      {S.llmEnabled && !managed && <LlmConnectionSection />}
      {/* Above MCP on purpose: an API key needs no addon, and someone looking for
          one should not have to read past a section about AI assistants. */}
      <ApiKeysSection />
      {S.mcpEnabled && <IntegrationsMcpSection S={S} />}
      <McpTokenModals S={S} />
      <OAuthClientModals S={S} />
    </>
  )
}

function useIntegrations() {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const { mcpEnabled, airtrailEnabled, llmEnabled, dawarichEnabled, managed } = useIntegrationGates({ reloadAddons: true })

  const mcp = useMcpIntegration({ enabled: mcpEnabled, reloadClientsAfterWrite: false })

  return { t, locale, toast, mcpEnabled, airtrailEnabled, llmEnabled, dawarichEnabled, managed, ...mcp }
}

type IntegrationsState = ReturnType<typeof useIntegrations>

/** An icon action of a row, named by its tooltip. */
const ICON_BUTTON_DANGER = SETTINGS_ICON_BUTTON.replace('hover:text-content', 'hover:text-danger')
const SMALL_BUTTON = 'inline-flex flex-none items-center gap-1.5 rounded-[10px] bg-surface-card px-2.5 py-1 font-medium text-content-secondary shadow-sm ring-1 ring-edge-faint'
const CHIP = 'inline-flex items-center rounded-full border border-edge-faint bg-surface-secondary px-2 py-[1px] font-geist text-content-muted'
const ROW = 'flex gap-3 px-3.5 py-3'
const ROW_TILE = 'grid h-8 w-8 flex-none place-items-center rounded-[10px] bg-surface-tertiary text-content-muted'
const EYEBROW = 'mb-2 font-geist font-bold uppercase tracking-[.08em] text-content-faint'
const PRESET_CHIP = 'inline-flex items-center rounded-full border border-edge bg-surface-card px-3 py-[5px] font-medium text-content-muted hover:border-edge-secondary hover:text-content'

function IconAction({ label, onClick, danger = false, children }: { label: string; onClick: () => void; danger?: boolean; children: React.ReactNode }) {
  return (
    <Tooltip label={label}>
      <button type="button" onClick={onClick} aria-label={label} className={danger ? ICON_BUTTON_DANGER : SETTINGS_ICON_BUTTON}>
        {children}
      </button>
    </Tooltip>
  )
}

/** The square copy button beside a value; the tick stays for two seconds after a copy. */
function CopyButton({ copied, label, onClick }: { copied: boolean; label: string; onClick: () => void }) {
  return (
    <IconAction label={label} onClick={onClick}>
      {copied ? <Check size={15} strokeWidth={2.2} className="text-success" /> : <Copy size={15} strokeWidth={2} />}
    </IconAction>
  )
}

/** A value to read and copy: the boxed text and its copy button on one line. */
function CopyValue({ value, copied, label, onCopy, wrap = false }: { value: string; copied: boolean; label: string; onCopy: () => void; wrap?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <code className={`block min-w-0 flex-1 rounded-[10px] border border-edge-faint bg-surface-tertiary px-3 py-2 font-mono text-content ${wrap ? 'break-all' : 'truncate'}`} style={fs(12, 'body')}>
        {value}
      </code>
      <CopyButton copied={copied} label={label} onClick={onCopy} />
    </div>
  )
}

/** The warning box: a secret shown once, or the API tokens on their way out. */
function WarningNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[12px] bg-warning-soft px-3.5 py-3 text-warning">
      <AlertTriangle size={15} strokeWidth={2.2} className="mt-px flex-none" />
      <p className="m-0 leading-snug" style={fs(12.5, 'body')}>{children}</p>
    </div>
  )
}

/** A short line in a dashed box where a list would be. */
function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[12px] border border-dashed border-edge px-3.5 py-4 text-center text-content-faint" style={fs(12, 'body')}>
      {children}
    </div>
  )
}

/** The mcp-remote snippet, folded away until asked for. */
function ConfigBlock({ open, onToggle, json, hint, copied, onCopy, t }: {
  open: boolean
  onToggle: () => void
  json: string
  hint: string
  copied: boolean
  onCopy: () => void
  t: IntegrationsState['t']
}) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-edge-faint bg-surface-card">
      <button type="button" onClick={onToggle} aria-expanded={open}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-start hover:bg-surface-secondary">
        <ChevronRight size={15} strokeWidth={2.2} className={`flex-none text-content-faint transition-transform ${open ? 'rotate-90' : ''}`} />
        <span className="flex-1 font-medium text-content" style={fs(13, 'body')}>{t('settings.mcp.clientConfig')}</span>
      </button>
      {open && (
        <div className="flex flex-col gap-2 border-t border-edge-faint p-3.5">
          <div className="flex justify-end">
            <button type="button" onClick={onCopy} className={`${SMALL_BUTTON} hover:text-content`} style={fs(12, 'body')}>
              {copied ? <Check size={13} strokeWidth={2.2} className="text-success" /> : <Copy size={13} strokeWidth={2} />}
              {copied ? t('settings.mcp.copied') : t('settings.mcp.copy')}
            </button>
          </div>
          <pre className="m-0 max-h-80 overflow-auto rounded-[10px] border border-edge-faint bg-surface-secondary p-3 font-mono leading-relaxed text-content" style={fs(11.5)}>
            {json}
          </pre>
          <SettingsHint>{hint}</SettingsHint>
        </div>
      )}
    </div>
  )
}

/** One registered OAuth client: what it is, the scopes it may use, and its two actions. */
function OAuthClientRow({ client, S }: { client: OAuthClient; S: IntegrationsState }) {
  const { t, locale, oauthScopesExpanded, setOauthScopesExpanded, setOauthRotateId, setOauthDeleteId } = S
  const expanded = !!oauthScopesExpanded[client.id]
  return (
    <div className={`${ROW} items-start`}>
      <span className={ROW_TILE}><KeyRound size={15} strokeWidth={2} /></span>
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate font-semibold text-content" style={fs(13, 'body')}>{client.name}</span>
          {client.allows_client_credentials && (
            <StatusPill tone="neutral">{t('settings.oauth.badge.machine')}</StatusPill>
          )}
        </div>
        <div className="mt-0.5 flex min-w-0 flex-wrap gap-x-3 text-content-faint" style={fs(11.5)}>
          <span className="min-w-0 truncate font-geist">{t('settings.oauth.clientId')}: {client.client_id}</span>
          <span className="tabular-nums">{t('settings.mcp.tokenCreatedAt')} {new Date(client.created_at).toLocaleDateString(locale)}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1" style={fs(10.5)}>
          {(expanded ? client.allowed_scopes : client.allowed_scopes.slice(0, 5)).map(s => (
            <span key={s} className={CHIP}>{s}</span>
          ))}
          {client.allowed_scopes.length > 5 && (
            <button
              type="button"
              onClick={() => setOauthScopesExpanded(prev => ({ ...prev, [client.id]: !prev[client.id] }))}
              className={`${CHIP} tabular-nums hover:text-content`}>
              {expanded ? '−' : `+${client.allowed_scopes.length - 5}`}
            </button>
          )}
        </div>
      </div>
      <div className="flex flex-none items-center gap-1.5">
        <IconAction label={t('settings.oauth.rotateSecret')} onClick={() => setOauthRotateId(client.id)}>
          <RefreshCw size={14} strokeWidth={2} />
        </IconAction>
        <IconAction label={t('settings.oauth.deleteClient')} onClick={() => setOauthDeleteId(client.id)} danger>
          <Trash2 size={14} strokeWidth={2} />
        </IconAction>
      </div>
    </div>
  )
}

/** The OAuth tab: the snippet, the registered clients and the sessions they hold. */
function OAuthTab({ S }: { S: IntegrationsState }) {
  const {
    t, locale, oauthClients, oauthSessions, setOauthCreateOpen, setOauthNewName, setOauthNewUris, setOauthNewScopes, setOauthCreatedClient, setOauthRevokeId, setOauthIsMachine, configOpenOAuth, setConfigOpenOAuth, copiedKey, mcpJsonConfigOAuth, handleCopy,
  } = S
  return (
    <>
      <ConfigBlock
        open={configOpenOAuth}
        onToggle={() => setConfigOpenOAuth(o => !o)}
        json={mcpJsonConfigOAuth}
        hint={t('settings.mcp.clientConfigHintOAuth')}
        copied={copiedKey === 'json-oauth'}
        onCopy={() => handleCopy(mcpJsonConfigOAuth, 'json-oauth')}
        t={t}
      />

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-3">
          <SettingsHint className="min-w-0 flex-1 basis-64">{t('settings.oauth.clientsHint')}</SettingsHint>
          <button type="button" onClick={() => { setOauthCreateOpen(true); setOauthCreatedClient(null); setOauthNewName(''); setOauthNewUris(''); setOauthNewScopes([]); setOauthIsMachine(false) }}
            className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
            <Plus size={14} strokeWidth={2.2} /> {t('settings.oauth.createClient')}
          </button>
        </div>

        {oauthClients.length === 0 ? (
          <EmptyHint>{t('settings.oauth.noClients')}</EmptyHint>
        ) : (
          <SettingRows>
            {oauthClients.map(client => <OAuthClientRow key={client.id} client={client} S={S} />)}
          </SettingRows>
        )}
      </div>

      {/* Active OAuth Sessions */}
      {oauthSessions.length > 0 && (
        <div>
          <div className={EYEBROW} style={fs(10)}>{t('settings.oauth.activeSessions')}</div>
          <SettingRows>
            {oauthSessions.map(session => (
              <div key={session.id} className={`${ROW} items-center`}>
                <span className={ROW_TILE}><Link2 size={15} strokeWidth={2} /></span>
                <div className="min-w-0 flex-1">
                  <p className="m-0 truncate font-semibold text-content" style={fs(13, 'body')}>{session.client_name}</p>
                  <p className="m-0 mt-0.5 flex min-w-0 flex-wrap gap-x-3 text-content-faint" style={fs(11.5)}>
                    <span className="min-w-0 truncate">{t('settings.oauth.sessionScopes')}: {session.scopes.join(', ')}</span>
                    <span className="tabular-nums">{t('settings.oauth.sessionExpires')} {new Date(session.access_token_expires_at).toLocaleDateString(locale)}</span>
                  </p>
                </div>
                <button type="button" onClick={() => setOauthRevokeId(session.id)}
                  className={`${SMALL_BUTTON} hover:text-danger`} style={fs(12, 'body')}>
                  {t('settings.oauth.revoke')}
                </button>
              </div>
            ))}
          </SettingRows>
        </div>
      )}
    </>
  )
}

/** The deprecated API tokens tab: the warning, the snippet and the tokens. */
function ApiTokensTab({ S }: { S: IntegrationsState }) {
  const { t, locale, configOpenToken, setConfigOpenToken, mcpTokens, setMcpModalOpen, setMcpNewName, setMcpCreatedToken, setMcpDeleteId, copiedKey, mcpJsonConfig, handleCopy } = S
  return (
    <>
      <WarningNote>{t('settings.mcp.apiTokensDeprecated')}</WarningNote>

      <ConfigBlock
        open={configOpenToken}
        onToggle={() => setConfigOpenToken(o => !o)}
        json={mcpJsonConfig}
        hint={t('settings.mcp.clientConfigHint')}
        copied={copiedKey === 'json-token'}
        onCopy={() => handleCopy(mcpJsonConfig, 'json-token')}
        t={t}
      />

      <div className="flex justify-end">
        <button type="button" onClick={() => { setMcpModalOpen(true); setMcpCreatedToken(null); setMcpNewName('') }}
          className={SETTINGS_BUTTON} style={fs(13, 'body')}>
          <Plus size={14} strokeWidth={2.2} /> {t('settings.mcp.createToken')}
        </button>
      </div>

      {mcpTokens.length === 0 ? (
        <EmptyHint>{t('settings.mcp.noTokens')}</EmptyHint>
      ) : (
        <SettingRows>
          {mcpTokens.map(token => (
            <div key={token.id} className={`${ROW} items-center`}>
              <span className={ROW_TILE}><Key size={15} strokeWidth={2} /></span>
              <div className="min-w-0 flex-1">
                <p className="m-0 truncate font-semibold text-content" style={fs(13, 'body')}>{token.name}</p>
                <p className="m-0 mt-0.5 flex min-w-0 flex-wrap gap-x-3 text-content-faint" style={fs(11.5)}>
                  <span className="font-geist">{token.token_prefix}...</span>
                  <span className="tabular-nums">{t('settings.mcp.tokenCreatedAt')} {new Date(token.created_at).toLocaleDateString(locale)}</span>
                  {token.last_used_at && (
                    <span className="tabular-nums">· {t('settings.mcp.tokenUsedAt')} {new Date(token.last_used_at).toLocaleDateString(locale)}</span>
                  )}
                </p>
              </div>
              <IconAction label={t('settings.mcp.deleteTokenTitle')} onClick={() => setMcpDeleteId(token.id)} danger>
                <Trash2 size={14} strokeWidth={2} />
              </IconAction>
            </div>
          ))}
        </SettingRows>
      )}
    </>
  )
}

function IntegrationsMcpSection({ S }: { S: IntegrationsState }) {
  const { t, activeMcpTab, setActiveMcpTab, copiedKey, mcpEndpoint, handleCopy } = S
  return (
    <Section title={t('settings.mcp.title')} icon={Terminal}>
      {/* Endpoint URL */}
      <EditorField label={t('settings.mcp.endpoint')}>
        <CopyValue value={mcpEndpoint} copied={copiedKey === 'endpoint'} label={t('settings.mcp.copy')} onCopy={() => handleCopy(mcpEndpoint, 'endpoint')} />
      </EditorField>

      {/* Sub-tab bar */}
      <Segmented<'oauth' | 'apitokens'>
        label={t('settings.mcp.title')}
        value={activeMcpTab}
        onChange={setActiveMcpTab}
        fill
        options={[
          { value: 'oauth', label: t('settings.oauth.clients') },
          {
            value: 'apitokens',
            label: (
              <>
                {t('settings.mcp.apiTokens')}
                <StatusPill tone="warning">Deprecated</StatusPill>
              </>
            ),
          },
        ]}
      />

      {activeMcpTab === 'oauth' && <OAuthTab S={S} />}
      {activeMcpTab === 'apitokens' && <ApiTokensTab S={S} />}
    </Section>
  )
}

/** The raised tile of the integrations' dialogs. */
function Tile({ icon: Icon }: { icon: typeof KeyRound }) {
  return <DialogTile><Icon size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>
}

/** Naming a new API token, then showing it the one time it can be read. */
function CreateTokenDialog({ S }: { S: IntegrationsState }) {
  const { t, mcpNewName, setMcpNewName, mcpCreatedToken, setMcpCreatedToken, setMcpModalOpen, mcpCreating, copiedKey, handleCreateMcpToken, handleCopy } = S
  const labelId = useId()
  const cancel = () => setMcpModalOpen(false)
  const done = () => { setMcpModalOpen(false); setMcpCreatedToken(null) }
  return (
    <DialogShell
      // The backdrop and Escape leave a token on screen alone: it is shown once only.
      onClose={() => { if (!mcpCreatedToken) cancel() }}
      labelledBy={labelId}
      width="narrow"
      header={
        <DialogHeader
          tile={<Tile icon={Key} />}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={mcpCreatedToken ? done : cancel}
          title={mcpCreatedToken ? t('settings.mcp.modal.createdTitle') : t('settings.mcp.modal.createTitle')}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          {mcpCreatedToken ? (
            <DialogButton variant="primary" onClick={done}>{t('settings.mcp.modal.done')}</DialogButton>
          ) : (
            <>
              <DialogButton onClick={cancel}>{t('common.cancel')}</DialogButton>
              <DialogButton variant="primary" onClick={handleCreateMcpToken} disabled={!mcpNewName.trim() || mcpCreating}>
                {mcpCreating ? t('settings.mcp.modal.creating') : t('settings.mcp.modal.create')}
              </DialogButton>
            </>
          )}
        </DialogFooter>
      }
    >
      {mcpCreatedToken ? (
        <>
          <WarningNote>{t('settings.mcp.modal.createdWarning')}</WarningNote>
          <CopyValue value={mcpCreatedToken} copied={copiedKey === 'new-token'} label={t('settings.mcp.copy')} onCopy={() => handleCopy(mcpCreatedToken, 'new-token')} wrap />
        </>
      ) : (
        <EditorField label={t('settings.mcp.modal.tokenName')} htmlFor={`${labelId}-name`}>
          <input id={`${labelId}-name`} type="text" value={mcpNewName} onChange={e => setMcpNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleCreateMcpToken()}
            placeholder={t('settings.mcp.modal.tokenNamePlaceholder')}
            className={INPUT}
            autoFocus />
        </EditorField>
      )}
    </DialogShell>
  )
}

function McpTokenModals({ S }: { S: IntegrationsState }) {
  const { t, mcpModalOpen, mcpDeleteId, setMcpDeleteId, handleDeleteMcpToken } = S
  return (
    <>
      {/* Create MCP Token modal */}
      {mcpModalOpen && <CreateTokenDialog S={S} />}

      {/* Delete MCP Token confirm */}
      <ConfirmDialog
        isOpen={mcpDeleteId !== null}
        onClose={() => setMcpDeleteId(null)}
        onConfirm={() => { if (mcpDeleteId !== null) void handleDeleteMcpToken(mcpDeleteId) }}
        title={t('settings.mcp.deleteTokenTitle')}
        message={t('settings.mcp.deleteTokenMessage')}
        confirmLabel={t('settings.mcp.deleteTokenTitle')}
      />
    </>
  )
}

/**
 * The machine-client switch. A real checkbox under the switch's look: the form
 * reads it by its id, and it stays a checkbox for assistive technology.
 */
function MachineClientSwitch({ checked, onChange, t }: { checked: boolean; onChange: (next: boolean) => void; t: IntegrationsState['t'] }) {
  return (
    <label htmlFor="oauth-machine-client" className="flex cursor-pointer items-center gap-4 rounded-[12px] border border-edge-faint bg-surface-card px-3.5 py-3">
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-content" style={fs(13, 'body')}>{t('settings.oauth.modal.machineClient')}</span>
        <span className="mt-0.5 block leading-snug text-content-faint" style={fs(11.5)}>{t('settings.oauth.modal.machineClientHint')}</span>
      </span>
      <input id="oauth-machine-client" type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="peer sr-only" />
      <span aria-hidden="true"
        className="relative h-6 w-11 flex-none rounded-full bg-[var(--border-primary)] transition-colors peer-checked:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--text-primary)] peer-checked:[&>span]:left-[22px] peer-checked:[&>span]:bg-[var(--accent-text)]">
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface-card shadow-sm transition-[left]" />
      </span>
    </label>
  )
}

/** The register form of the client dialog. */
function ClientForm({ S, labelId }: { S: IntegrationsState; labelId: string }) {
  const { t, oauthNewName, setOauthNewName, oauthNewUris, setOauthNewUris, oauthNewScopes, setOauthNewScopes, oauthIsMachine, setOauthIsMachine } = S
  return (
    <>
      <DialogSection label={t('settings.oauth.modal.presets')}>
        <div className="flex flex-wrap gap-1.5" style={fs(12.5, 'body')}>
          {OAUTH_PRESETS.map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setOauthNewName(preset.name)
                setOauthNewUris(preset.uris)
                setOauthNewScopes(preset.scopes)
              }}
              className={PRESET_CHIP}>
              {preset.label}
            </button>
          ))}
        </div>
      </DialogSection>

      <EditorField label={t('settings.oauth.modal.clientName')} htmlFor={`${labelId}-name`}>
        <input id={`${labelId}-name`} type="text" value={oauthNewName} onChange={e => setOauthNewName(e.target.value)}
          placeholder={t('settings.oauth.modal.clientNamePlaceholder')}
          className={INPUT}
          autoFocus />
      </EditorField>

      <MachineClientSwitch checked={oauthIsMachine} onChange={setOauthIsMachine} t={t} />

      {!oauthIsMachine && (
        <EditorField label={t('settings.oauth.modal.redirectUris')} htmlFor={`${labelId}-uris`} hint={t('settings.oauth.modal.redirectUrisHint')}>
          <textarea id={`${labelId}-uris`} value={oauthNewUris} onChange={e => setOauthNewUris(e.target.value)}
            placeholder={t('settings.oauth.modal.redirectUrisPlaceholder')}
            rows={3}
            className={`${TEXTAREA} font-mono`} />
        </EditorField>
      )}

      <DialogSection label={t('settings.oauth.modal.scopes')}>
        <SettingsHint className="mb-2.5">{t('settings.oauth.modal.scopesHint')}</SettingsHint>
        <ScopeGroupPicker selected={oauthNewScopes} onChange={setOauthNewScopes} />
      </DialogSection>
    </>
  )
}

/** What a freshly registered client hands over: its id, and the secret the one time it can be read. */
function CreatedClient({ S, client }: { S: IntegrationsState; client: OAuthClient }) {
  const { t, copiedKey, handleCopy } = S
  const secret = client.client_secret ?? ''
  return (
    <>
      <WarningNote>{t('settings.oauth.modal.createdWarning')}</WarningNote>

      <EditorField label={t('settings.oauth.clientId')}>
        <CopyValue value={client.client_id} copied={copiedKey === 'new-client-id'} label={t('settings.mcp.copy')}
          onCopy={() => handleCopy(client.client_id, 'new-client-id')} wrap />
      </EditorField>
      <EditorField label={t('settings.oauth.clientSecret')}>
        <CopyValue value={secret} copied={copiedKey === 'new-client-secret'} label={t('settings.mcp.copy')}
          onCopy={() => handleCopy(secret, 'new-client-secret')} wrap />
      </EditorField>

      {client.allows_client_credentials && (
        <div className="rounded-[12px] border border-edge-faint bg-surface-secondary px-3.5 py-3 font-mono leading-relaxed text-content-muted" style={fs(11.5)}>
          {t('settings.oauth.modal.machineClientUsage')}
        </div>
      )}
    </>
  )
}

/** Registering an OAuth client, then showing what it was given. */
function CreateClientDialog({ S }: { S: IntegrationsState }) {
  const { t, oauthNewName, oauthNewUris, oauthCreating, oauthCreatedClient, setOauthCreatedClient, setOauthCreateOpen, oauthIsMachine, handleCreateOAuthClient } = S
  const labelId = useId()
  const cancel = () => setOauthCreateOpen(false)
  const done = () => { setOauthCreateOpen(false); setOauthCreatedClient(null) }
  return (
    <DialogShell
      // The backdrop and Escape leave a secret on screen alone: it is shown once only.
      onClose={() => { if (!oauthCreatedClient) cancel() }}
      labelledBy={labelId}
      width="detail"
      header={
        <DialogHeader
          tile={<Tile icon={KeyRound} />}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={oauthCreatedClient ? done : cancel}
          title={oauthCreatedClient ? t('settings.oauth.modal.createdTitle') : t('settings.oauth.modal.createTitle')}
        />
      }
      footer={
        <DialogFooter>
          <FooterSpacer />
          {oauthCreatedClient ? (
            <DialogButton variant="primary" onClick={done}>{t('settings.mcp.modal.done')}</DialogButton>
          ) : (
            <>
              <DialogButton onClick={cancel}>{t('common.cancel')}</DialogButton>
              <DialogButton variant="primary" onClick={handleCreateOAuthClient}
                disabled={!oauthNewName.trim() || (!oauthIsMachine && !oauthNewUris.trim()) || oauthCreating}>
                {oauthCreating ? t('settings.oauth.modal.creating') : t('settings.oauth.modal.create')}
              </DialogButton>
            </>
          )}
        </DialogFooter>
      }
    >
      {oauthCreatedClient ? <CreatedClient S={S} client={oauthCreatedClient} /> : <ClientForm S={S} labelId={labelId} />}
    </DialogShell>
  )
}

/** The secret a rotation produced, shown the one time it can be read. */
function RotatedSecretDialog({ S, secret }: { S: IntegrationsState; secret: string }) {
  const { t, setOauthRotatedSecret, copiedKey, handleCopy } = S
  const labelId = useId()
  const done = () => setOauthRotatedSecret(null)
  return (
    <DialogShell
      // Only Done or the close button put the secret away, never a stray click or key.
      onClose={() => undefined}
      labelledBy={labelId}
      width="narrow"
      header={<DialogHeader tile={<Tile icon={RefreshCw} />} tint={NEUTRAL_TINT} labelId={labelId} onClose={done} title={t('settings.oauth.rotateSecretDoneTitle')} />}
      footer={
        <DialogFooter>
          <FooterSpacer />
          <DialogButton variant="primary" onClick={done}>{t('settings.mcp.modal.done')}</DialogButton>
        </DialogFooter>
      }
    >
      <WarningNote>{t('settings.oauth.rotateSecretDoneWarning')}</WarningNote>
      <EditorField label={t('settings.oauth.clientSecret')}>
        <CopyValue value={secret} copied={copiedKey === 'rotated-secret'} label={t('settings.mcp.copy')} onCopy={() => handleCopy(secret, 'rotated-secret')} wrap />
      </EditorField>
    </DialogShell>
  )
}

function OAuthClientModals({ S }: { S: IntegrationsState }) {
  const {
    t, oauthCreateOpen, oauthDeleteId, setOauthDeleteId, oauthRevokeId, setOauthRevokeId, oauthRotateId, setOauthRotateId, oauthRotatedSecret, oauthRotating, handleDeleteOAuthClient, handleRotateSecret, handleRevokeSession,
  } = S
  return (
    <>
      {/* Create OAuth Client modal */}
      {oauthCreateOpen && <CreateClientDialog S={S} />}

      {/* Delete OAuth Client confirm */}
      <ConfirmDialog
        isOpen={oauthDeleteId !== null}
        onClose={() => setOauthDeleteId(null)}
        onConfirm={() => { if (oauthDeleteId !== null) void handleDeleteOAuthClient(oauthDeleteId) }}
        title={t('settings.oauth.deleteClient')}
        message={t('settings.oauth.deleteClientMessage')}
        confirmLabel={t('settings.oauth.deleteClient')}
      />

      {/* Rotate OAuth Client Secret confirm */}
      <ConfirmDialog
        isOpen={oauthRotateId !== null}
        onClose={() => setOauthRotateId(null)}
        onConfirm={() => { if (oauthRotateId !== null && !oauthRotating) void handleRotateSecret(oauthRotateId) }}
        title={t('settings.oauth.rotateSecret')}
        message={t('settings.oauth.rotateSecretMessage')}
        confirmLabel={oauthRotating ? t('settings.oauth.rotateSecretConfirming') : t('settings.oauth.rotateSecretConfirm')}
        danger={false}
      />

      {/* Rotated Secret display */}
      {oauthRotatedSecret !== null && <RotatedSecretDialog S={S} secret={oauthRotatedSecret} />}

      {/* Revoke OAuth Session confirm */}
      <ConfirmDialog
        isOpen={oauthRevokeId !== null}
        onClose={() => setOauthRevokeId(null)}
        onConfirm={() => { if (oauthRevokeId !== null) void handleRevokeSession(oauthRevokeId) }}
        title={t('settings.oauth.revokeSession')}
        message={t('settings.oauth.revokeSessionMessage')}
        confirmLabel={t('settings.oauth.revoke')}
      />
    </>
  )
}
