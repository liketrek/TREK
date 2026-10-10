import { useId, type ComponentType } from 'react'
import { useTranslation } from '../../i18n'
import { useIsDark } from '../../hooks/useIsDark'
import { Puzzle, ListChecks, Wallet, FileText, CalendarDays, Globe, Briefcase, Image, Terminal, Link2, Compass, BookOpen, Sparkles, Luggage, Plane, Server, Cloud, Bookmark, Users, Loader2, RefreshCw } from 'lucide-react'
import CustomSelect from '../shared/CustomSelect'
import { asLlmVision, LLM_VISION_MODES, type LlmVision } from '@trek/shared'
import EmptyState from '../shared/EmptyState'
import DawarichIcon from '../shared/DawarichIcon'
import AirTrailIcon from '../shared/AirTrailIcon'
import { DOCUMENT_PROVIDER_ICONS } from '../shared/DocumentProviderIcons'
import AddonTile from './AddonTile'
import AddonSubRow from './AddonSubRow'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'
import { EditorField, INPUT, Segmented } from '../shared/dialogParts'
import { SettingsCard, SettingsHint, StatusPill, SETTINGS_BUTTON_PRIMARY } from '../Settings/settingsKit'
import { type Addon, type CollabFeatures, COLLAB_SUB_FEATURES, getAddonLabel, MASKED, RECOMMENDED_MODELS } from './addons/addonModel'
import { useAddonManager } from './addons/useAddonManager'
import { useLlmParsingConfig } from './addons/useLlmParsingConfig'
import { ImmichIcon, SynologyIcon } from './addons/PhotoProviderIcons'

// Keys are the `icon` column from the addons table (see server seeds.ts); anything
// unknown falls back to Puzzle. Users/Sparkles cover collab and llm_parsing, which
// used to land on the fallback.
const ICON_MAP = {
  ListChecks, Wallet, FileText, CalendarDays, Puzzle, Globe, Briefcase, Image, Terminal, Link2, Compass, BookOpen, Plane, Bookmark, Users, Sparkles,
  // Dawarich ships a brand mark rather than a lucide name, the same way the photo
  // providers below do. Keyed by the string in the addons table.
  Dawarich: DawarichIcon,
}

const PROVIDER_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  immich: ImmichIcon,
  synologyphotos: SynologyIcon,
  // The document providers' own marks, single-colour so they read as glyphs in
  // a row of lucide icons and invert with the theme.
  ...DOCUMENT_PROVIDER_ICONS,
}

interface AddonIconProps {
  name: string
  size?: number
  /** A switched-off addon greys its icon out, brand marks included. */
  enabled?: boolean
}

function AddonIcon({ name, size = 20, enabled = true }: AddonIconProps) {
  // The brand marks are badges, not glyphs: they fill the framed slot instead of
  // sitting in the middle of it at glyph size, and they grey out when the addon
  // is off — the lucide glyphs get that from the slot's text colour, an <img>
  // has to be told.
  if (name === 'Dawarich') return <DawarichIcon fill muted={!enabled} />
  // 'Plane' is the icon string airtrail was seeded with, and INSERT OR IGNORE
  // means every existing install still carries it — so the brand is keyed on
  // that rather than on a new name no row would ever have.
  if (name === 'Plane') return <AirTrailIcon fill muted={!enabled} />
  const Icon = ICON_MAP[name] || Puzzle
  return <Icon size={size} />
}

/** What each type means, shown on the tile itself now that the sections are gone. The
 *  hint rides along as the tooltip, so "Global" still explains itself. */
const TYPE_META: Record<string, { icon: ComponentType<{ size?: number }>; labelKey: string; hintKey: string }> = {
  trip: { icon: Briefcase, labelKey: 'admin.addons.type.trip', hintKey: 'admin.addons.tripHint' },
  global: { icon: Globe, labelKey: 'admin.addons.type.global', hintKey: 'admin.addons.globalHint' },
  integration: { icon: Link2, labelKey: 'admin.addons.type.integration', hintKey: 'admin.addons.integrationHint' },
}

export default function AddonManager({ bagTrackingEnabled, onToggleBagTracking, collabFeatures, onToggleCollabFeature }: { bagTrackingEnabled?: boolean; onToggleBagTracking?: () => void; collabFeatures?: CollabFeatures; onToggleCollabFeature?: (key: string) => void }) {
  const { t } = useTranslation()
  const dark = useIsDark()
  const {
    addons, loading, handleToggle, tripAddons, globalAddons, integrationAddons, providerOptions, documentProviderOptions,
  } = useAddonManager()

  if (loading) {
    return (
      <SettingsCard icon={Puzzle} title={t('admin.addons.title')}>
        <div className="grid place-items-center py-14">
          <Loader2 size={22} className="animate-spin text-content-faint" />
        </div>
      </SettingsCard>
    )
  }

  /** Bag tracking, the collab features and the photo providers all hang off their
   *  parent as shelf rows, and each shelf only shows while its parent is on —
   *  a provider toggled under a disabled Journey would hit the server's 409. */
  const shelfFor = (addon: Addon) => {
    if (addon.id === 'packing' && addon.enabled && onToggleBagTracking) {
      return (
        <AddonSubRow
          icon={<Luggage size={14} />}
          title={t('admin.bagTracking.title')}
          description={t('admin.bagTracking.subtitle')}
          enabled={!!bagTrackingEnabled}
          onToggle={onToggleBagTracking}
        />
      )
    }
    if (addon.id === 'collab' && addon.enabled && collabFeatures && onToggleCollabFeature) {
      return COLLAB_SUB_FEATURES.map(feat => {
        const Icon = feat.icon
        return (
          <AddonSubRow
            key={feat.key}
            icon={<Icon size={14} />}
            title={t(feat.titleKey)}
            description={t(feat.subtitleKey)}
            enabled={collabFeatures[feat.key]}
            onToggle={() => onToggleCollabFeature(feat.key)}
          />
        )
      })
    }
    // Document providers are the Documents tile's shelf, the way photo providers
    // are Journey's. Unlike those they carry no credential form here: a document
    // connection belongs to a trip, not to a user, so it is entered in the trip's
    // file manager. The admin decides only whether a provider may be offered.
    if (addon.id === 'documents' && addon.enabled && documentProviderOptions.length > 0) {
      return documentProviderOptions.map(provider => {
        const ProviderIcon = PROVIDER_ICONS[provider.key]
        return (
          <AddonSubRow
            key={provider.key}
            icon={ProviderIcon ? <ProviderIcon size={14} /> : undefined}
            title={provider.label}
            description={provider.description}
            enabled={provider.enabled}
            onToggle={provider.toggle}
          />
        )
      })
    }
    if (addon.id === 'journey' && addon.enabled && providerOptions.length > 0) {
      return providerOptions.map(provider => {
        const ProviderIcon = PROVIDER_ICONS[provider.key]
        return (
          <AddonSubRow
            key={provider.key}
            icon={ProviderIcon ? <ProviderIcon size={14} /> : undefined}
            title={provider.label}
            description={provider.description}
            enabled={provider.enabled}
            onToggle={provider.toggle}
          />
        )
      })
    }
    // The AI-parsing settings hang off their tile like every other sub-feature,
    // just as a form instead of toggle rows.
    if (addon.id === 'llm_parsing' && addon.enabled) {
      return <LlmParsingConfig addon={addon} />
    }
    return null
  }

  const tile = (addon: Addon) => {
    const label = getAddonLabel(t, addon)
    return (
      <AddonTile
        key={addon.id}
        icon={<AddonIcon name={addon.icon} size={18} enabled={addon.enabled} />}
        name={label.name}
        description={label.description}
        enabled={addon.enabled}
        onToggle={() => handleToggle(addon)}
      >
        {shelfFor(addon)}
      </AddonTile>
    )
  }

  /* One column per type, side by side, instead of three stacked sections. Stacked, each
     section opened its own set of columns and the tall tiles (Collab, Journey) set a
     section's height while its neighbours ran out early. Side by side the column's
     head carries the type, so the tiles need no badge of their own. */
  const groups = [
    { key: 'trip', addons: tripAddons },
    { key: 'global', addons: globalAddons },
    { key: 'integration', addons: integrationAddons },
  ].filter(g => g.addons.length > 0)
  const enabledCount = addons.filter(a => a.type !== 'photo_provider' && a.type !== 'document_provider' && a.enabled).length
  const totalCount = tripAddons.length + globalAddons.length + integrationAddons.length

  const subtitle = (
    <span className="inline-flex flex-wrap items-center gap-1">
      {t('admin.addons.subtitleBefore')}
      <img src={dark ? '/text-light.svg' : '/text-dark.svg'} alt="TREK" style={{ height: 10, verticalAlign: 'middle', opacity: 0.7 }} />
      {t('admin.addons.subtitleAfter')}
    </span>
  )

  return (
    <SettingsCard
      icon={Puzzle}
      title={t('admin.addons.title')}
      hint={subtitle}
      badge={totalCount > 0 ? (
        <Tooltip label={t('admin.addons.group.count', { enabled: enabledCount, total: totalCount })}>
          <span className="inline-flex">
            <StatusPill tone={enabledCount > 0 ? 'success' : 'neutral'}>{enabledCount}/{totalCount}</StatusPill>
          </span>
        </Tooltip>
      ) : undefined}
    >
      {addons.length === 0 ? (
        <EmptyState scene="idle" title={t('admin.addons.noAddons')} surface="var(--bg-secondary)" />
      ) : (
        <div className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
          {groups.map(g => {
            const meta = TYPE_META[g.key]
            return (
              <section key={g.key} className="min-w-0 overflow-hidden rounded-[14px] border border-edge-faint bg-surface-card">
                <GroupHead icon={meta.icon} label={t(meta.labelKey)} hint={t(meta.hintKey)} addons={g.addons} t={t} />
                <div className="divide-y divide-edge-faint">{g.addons.map(tile)}</div>
              </section>
            )
          })}
        </div>
      )}
    </SettingsCard>
  )
}

/** The head band of one type's column: icon tile, the type, its count and what it means. */
function GroupHead({ icon: Icon, label, hint, addons, t }: {
  icon: ComponentType<{ size?: number; className?: string; strokeWidth?: number }>
  label: string
  hint: string
  addons: Addon[]
  t: (key: string, params?: Record<string, unknown>) => string
}) {
  const enabled = addons.filter(a => a.enabled).length
  return (
    <div className="flex items-start gap-2.5 border-b border-edge-faint bg-surface-tertiary px-3.5 py-2.5">
      <span className="mt-px grid h-7 w-7 flex-none place-items-center rounded-[9px] bg-surface-card text-content-secondary shadow-sm">
        <Icon size={13} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="m-0 min-w-0 flex-1 truncate font-bold text-content" style={fs(13, 'body')}>{label}</h3>
          <Tooltip label={t('admin.addons.group.count', { enabled, total: addons.length })}>
            <span className="inline-flex">
              <StatusPill>{enabled}/{addons.length}</StatusPill>
            </span>
          </Tooltip>
        </div>
        {/* Says what the type means: the only place that still explains it. */}
        <p className="m-0 mt-0.5 leading-snug text-content-faint" style={fs(11)}>{hint}</p>
      </div>
    </div>
  )
}

const EYEBROW = 'font-geist font-bold uppercase tracking-[.08em] text-content-faint'
const SMALL_BUTTON = 'inline-flex flex-none items-center rounded-[9px] px-2.5 py-1 font-medium transition-colors disabled:cursor-default disabled:opacity-60'

/**
 * Instance-wide AI-parsing config. When set, applies to the whole instance and
 * overrides per-user config (see server llmConfig.ts). The API key is masked on
 * read; an unchanged mask is treated as a no-op by the server. For the local
 * provider, it also lists installed Ollama models and can pull NuExtract models.
 */
function LlmParsingConfig({ addon }: { addon: Addon }) {
  const { t } = useTranslation()
  const {
    provider, setProvider, model, setModel, baseUrl, setBaseUrl, apiKey, setApiKey, vision, setVision, saving,
    installed, modelsErr, loadingModels, pulling, pullPct, pullStatus, isInstalled, loadModels, pull, save,
  } = useLlmParsingConfig(addon)
  const fieldId = useId()

  const providerOptions = [
    { value: 'local', label: 'Local · OpenAI-compatible', icon: <Server size={14} />, badge: 'Ollama' },
    { value: 'openai', label: 'OpenAI', icon: <Cloud size={14} /> },
    { value: 'anthropic', label: 'Anthropic', icon: <Sparkles size={14} /> },
  ]
  const visionOptions = LLM_VISION_MODES.map(value => ({ value, label: t(`admin.addons.llm.vision.${value}`) }))

  /* Lives in the tile's shelf like the collab toggles, so it is one column of
     eyebrow fields: the band this used to be had a whole page width. */
  return (
    <li className={`flex flex-col gap-3 p-3 ${saving ? 'opacity-60' : ''}`}>
      <SettingsHint>
        Instance-wide — applies to all users. Leave blank to let each user configure their own provider.
      </SettingsHint>

      <EditorField label="Provider">
        <CustomSelect value={provider} onChange={v => setProvider(String(v))} options={providerOptions} />
      </EditorField>
      {provider !== 'anthropic' && (
        <EditorField label="Base URL" htmlFor={`${fieldId}-url`}>
          <input id={`${fieldId}-url`} type="url" autoComplete="off" className={INPUT} value={baseUrl} onChange={e => setBaseUrl(e.target.value)} onBlur={loadModels} placeholder={provider === 'local' ? 'http://localhost:11434/v1' : 'https://api.openai.com/v1'} />
        </EditorField>
      )}
      <EditorField
        label="API key"
        htmlFor={`${fieldId}-key`}
        hint={provider === 'anthropic' ? 'Anthropic reads PDFs (including scans) natively. Local/OpenAI models receive extracted text — scanned PDFs need Anthropic.' : undefined}
      >
        <input id={`${fieldId}-key`} type="password" className={INPUT} value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder={apiKey === MASKED ? MASKED : provider === 'local' ? '(often not required)' : 'sk-…'} />
      </EditorField>
      <EditorField label="Model" htmlFor={`${fieldId}-model`}>
        <input id={`${fieldId}-model`} autoComplete="off" className={`${INPUT} font-geist`} value={model} onChange={e => setModel(e.target.value)} placeholder={provider === 'anthropic' ? 'claude-opus-4-8' : provider === 'openai' ? 'gpt-4o' : 'select or pull below'} />
      </EditorField>

      <EditorField label={t('settings.aiParsing.multimodal')} hint={t(provider === 'local' ? 'admin.addons.llm.vision.hintLocal' : 'admin.addons.llm.vision.hintCloud')}>
        <Segmented<LlmVision>
          label={t('settings.aiParsing.multimodal')}
          value={vision}
          onChange={v => setVision(asLlmVision(v))}
          options={visionOptions}
          fill
        />
      </EditorField>

      {/* Local model management (Ollama) */}
      {provider === 'local' && (
        <div className="flex flex-col gap-2.5 rounded-[12px] border border-edge-faint bg-surface-card p-3">
          <div className="flex items-center gap-2">
            <span className={`${EYEBROW} min-w-0 flex-1 truncate`} style={fs(9.5)}>Installed on the server</span>
            <button type="button" onClick={loadModels} disabled={loadingModels}
              className="inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 font-medium text-content-muted hover:bg-surface-secondary hover:text-content disabled:cursor-default disabled:opacity-60"
              style={fs(11.5, 'body')}>
              <RefreshCw size={11} strokeWidth={2.2} className={loadingModels ? 'animate-spin' : undefined} />
              {loadingModels ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {modelsErr && <p className="m-0 break-words text-danger" style={fs(11.5)}>{modelsErr}</p>}
          {!modelsErr && installed.length === 0 && !loadingModels && (
            <SettingsHint>No models installed yet — pull one below.</SettingsHint>
          )}
          {installed.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {installed.map(name => (
                <button type="button"
                  key={name}
                  title={name}
                  onClick={() => setModel(name)}
                  aria-pressed={model === name}
                  className={`max-w-full truncate rounded-full px-2.5 py-[3px] font-geist font-medium transition-colors ${model === name ? 'bg-accent text-accent-text' : 'border border-edge bg-surface-card text-content-muted hover:text-content'}`}
                  style={fs(11.5)}
                >
                  {name}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-edge-faint pt-2.5">
            <span className={EYEBROW} style={fs(9.5)}>Pull a recommended model</span>
            {RECOMMENDED_MODELS.map(m => {
              const installedHere = isInstalled(m.id)
              const isPulling = pulling === m.id
              const active = model === m.id
              return (
                <div key={m.id} className="min-w-0" title={m.note}>
                  <div className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate font-medium text-content" style={fs(12.5, 'body')}>{m.label}</span>
                    {m.recommended && <StatusPill tone="success">Recommended</StatusPill>}
                    {installedHere ? (
                      <button type="button" onClick={() => setModel(m.id)} disabled={active} className={`${SMALL_BUTTON} ${active ? 'bg-surface-tertiary text-content-muted' : 'bg-surface-card text-content shadow-sm ring-1 ring-edge-faint hover:bg-surface-secondary'}`} style={fs(12, 'body')}>
                        {active ? 'Selected' : 'Use'}
                      </button>
                    ) : (
                      <button type="button" onClick={() => pull(m.id)} disabled={!!pulling} className={`${SMALL_BUTTON} bg-accent text-accent-text hover:opacity-90`} style={fs(12, 'body')}>
                        {isPulling ? 'Pulling…' : 'Pull'}
                      </button>
                    )}
                  </div>
                  {isPulling && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-tertiary">
                        <div className="h-full rounded-full bg-accent transition-[width] duration-200" style={{ width: `${pullPct}%` }} />
                      </div>
                      <div className="mt-1 truncate font-geist tabular-nums text-content-faint" style={fs(11)}>{pullStatus}{pullPct ? ` · ${pullPct}%` : ''}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button type="button" onClick={save} disabled={saving} className={SETTINGS_BUTTON_PRIMARY} style={fs(13, 'body')}>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </li>
  )
}
