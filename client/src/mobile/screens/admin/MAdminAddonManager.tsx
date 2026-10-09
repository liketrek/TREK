import { type ComponentType } from 'react'
import { useTranslation } from '../../../i18n'
import { useIsDark } from '../../../hooks/useIsDark'
import {
  Puzzle, ListChecks, Wallet, FileText, CalendarDays, Globe, Briefcase, Image, Terminal, Link2, Compass, BookOpen,
  Sparkles, Luggage, Plane, Server, Cloud, Bookmark, Users, Check, Loader2,
} from 'lucide-react'
import DawarichIcon from '../../../components/shared/DawarichIcon'
import AirTrailIcon from '../../../components/shared/AirTrailIcon'
import { DOCUMENT_PROVIDER_ICONS } from '../../../components/shared/DocumentProviderIcons'
import MToggle from '../../components/MToggle'
import { LLM_VISION_MODES } from '@trek/shared'
import {
  type Addon,
  type CollabFeatures,
  type ProviderOption,
  COLLAB_SUB_FEATURES,
  getAddonLabel,
  MASKED,
  RECOMMENDED_MODELS,
} from '../../../components/Admin/addons/addonModel'
import { useAddonManager } from '../../../components/Admin/addons/useAddonManager'
import { useLlmParsingConfig } from '../../../components/Admin/addons/useLlmParsingConfig'
import { ImmichIcon, SynologyIcon } from '../../../components/Admin/addons/PhotoProviderIcons'
import { MAdminButton, MAdminCard, MAdminField, MAdminInput, MAdminSecretInput } from './MAdminUi'

// Keys are the `icon` column from the addons table; anything unknown falls back to
// Puzzle. Users/Sparkles cover collab and llm_parsing, as on the desktop.
const ICON_MAP = {
  ListChecks, Wallet, FileText, CalendarDays, Puzzle, Globe, Briefcase, Image, Terminal, Link2, Compass, BookOpen, Plane, Bookmark, Users, Sparkles,
  Dawarich: DawarichIcon,
}

const PROVIDER_ICONS: Record<string, ComponentType<{ size?: number }>> = {
  immich: ImmichIcon,
  synologyphotos: SynologyIcon,
  ...DOCUMENT_PROVIDER_ICONS,
}

interface AddonIconProps {
  name: string
  size?: number
  /** A switched-off addon greys its icon out, brand marks included. */
  enabled?: boolean
}

function AddonIcon({ name, size = 18, enabled = true }: AddonIconProps) {
  if (name === 'Dawarich') return <DawarichIcon fill muted={!enabled} />
  // 'Plane' is the icon string airtrail was seeded with, and INSERT OR IGNORE
  // means every existing install still carries it — so the brand is keyed on
  // that rather than on a new name no row would ever have.
  if (name === 'Plane') return <AirTrailIcon fill muted={!enabled} />
  const Icon = ICON_MAP[name] || Puzzle
  return <Icon size={size} />
}

export default function MAdminAddonManager({ bagTrackingEnabled, onToggleBagTracking, collabFeatures, onToggleCollabFeature }: { bagTrackingEnabled?: boolean; onToggleBagTracking?: () => void; collabFeatures?: CollabFeatures; onToggleCollabFeature?: (key: string) => void }) {
  const { t } = useTranslation()
  const dark = useIsDark()
  const {
    addons, loading, handleToggle, tripAddons, globalAddons, integrationAddons, providerOptions, documentProviderOptions,
  } = useAddonManager()

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={22} className="animate-spin text-m-faint" />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <MAdminCard>
        <div className="text-[0.875rem] font-extrabold text-m-ink">{t('admin.addons.title')}</div>
        <p className="mt-[2px] flex flex-wrap items-center gap-1 font-geist text-[0.625rem] leading-relaxed text-m-muted">
          {t('admin.addons.subtitleBefore')}
          <img src={dark ? '/text-light.svg' : '/text-dark.svg'} alt="TREK" style={{ height: 11, display: 'inline', verticalAlign: 'middle', opacity: 0.7 }} />
          {t('admin.addons.subtitleAfter')}
        </p>
      </MAdminCard>

      {addons.length === 0 ? (
        <MAdminCard>
          <p className="py-6 text-center font-geist text-[0.6875rem] text-m-faint">
            {t('admin.addons.noAddons')}
          </p>
        </MAdminCard>
      ) : (
        <>
          {/* Trip Addons */}
          {tripAddons.length > 0 && (
            <MAdminCard>
              <MGroupHead icon={Briefcase} label={`${t('admin.addons.type.trip')} — ${t('admin.addons.tripHint')}`} />
              {tripAddons.map((addon, i) => (
                <div key={addon.id}>
                  <MAddonRow addon={addon} onToggle={handleToggle} t={t} first={i === 0} />
                  {addon.id === 'packing' && addon.enabled && onToggleBagTracking && (
                    <MSubRow
                      icon={Luggage}
                      title={t('admin.bagTracking.title')}
                      subtitle={t('admin.bagTracking.subtitle')}
                      enabled={!!bagTrackingEnabled}
                      onToggle={onToggleBagTracking}
                    />
                  )}
                  {addon.id === 'documents' && addon.enabled && <MProviderShelf options={documentProviderOptions} />}
                  {addon.id === 'collab' && addon.enabled && collabFeatures && onToggleCollabFeature && (
                    <>
                      {COLLAB_SUB_FEATURES.map(feat => (
                        <MSubRow
                          key={feat.key}
                          icon={feat.icon}
                          title={t(feat.titleKey)}
                          subtitle={t(feat.subtitleKey)}
                          enabled={collabFeatures[feat.key]}
                          onToggle={() => onToggleCollabFeature(feat.key)}
                        />
                      ))}
                    </>
                  )}
                </div>
              ))}
            </MAdminCard>
          )}

          {/* Global Addons */}
          {globalAddons.length > 0 && (
            <MAdminCard>
              <MGroupHead icon={Globe} label={`${t('admin.addons.type.global')} — ${t('admin.addons.globalHint')}`} />
              {globalAddons.map((addon, i) => (
                <div key={addon.id}>
                  <MAddonRow addon={addon} onToggle={handleToggle} t={t} first={i === 0} />
                  {/* Memories providers as sub-items under Journey addon — only while it is on */}
                  {addon.id === 'journey' && addon.enabled && <MProviderShelf options={providerOptions} />}
                </div>
              ))}
            </MAdminCard>
          )}

          {/* Integration Addons */}
          {integrationAddons.length > 0 && (
            <MAdminCard>
              <MGroupHead icon={Link2} label={`${t('admin.addons.type.integration')} — ${t('admin.addons.integrationHint')}`} />
              {integrationAddons.map((addon, i) => (
                <div key={addon.id}>
                  <MAddonRow addon={addon} onToggle={handleToggle} t={t} first={i === 0} />
                  {addon.id === 'llm_parsing' && addon.enabled && (
                    <div className="mt-1 border-t border-[color:var(--m-rowbr)] pt-3">
                      <LlmParsingConfig addon={addon} />
                    </div>
                  )}
                </div>
              ))}
            </MAdminCard>
          )}
        </>
      )}
    </div>
  )
}

/** Group subheader: small icon + uppercase label, matches the desktop section band. */
function MGroupHead({ icon: Icon, label }: { icon: typeof Briefcase; label: string }) {
  return (
    <div className="mb-1 flex items-center gap-2">
      <Icon size={13} className="flex-none text-m-muted" />
      <span className="font-geist text-[0.625rem] font-bold uppercase tracking-[0.06em] text-m-muted">{label}</span>
    </div>
  )
}

interface MAddonRowProps {
  addon: Addon
  onToggle: (addon: Addon) => void
  t: (key: string) => string
  first?: boolean
}

/** Addon row: icon tile, name + type badge, description, MToggle. */
function MAddonRow({ addon, onToggle, t, first }: MAddonRowProps) {
  const label = getAddonLabel(t, addon)
  const typeLabel =
    addon.type === 'global' ? t('admin.addons.type.global') : addon.type === 'integration' ? t('admin.addons.type.integration') : t('admin.addons.type.trip')
  return (
    <div className={`flex items-center gap-3 py-[11px] ${first ? '' : 'border-t border-[color:var(--m-rowbr)]'}`}>
      {/* overflow-hidden so a brand mark that fills the slot keeps its rounded corners. */}
      <span className="flex h-[38px] w-[38px] flex-none items-center justify-center overflow-hidden rounded-[11px] bg-[color:var(--m-ic)] text-m-ink">
        <AddonIcon name={addon.icon} size={18} enabled={addon.enabled} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate text-[0.8125rem] font-bold text-m-ink">{label.name}</span>
          <span className="flex-none rounded-full bg-[color:var(--m-ic)] px-[7px] py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted">
            {typeLabel}
          </span>
        </div>
        <p className="mt-[1px] font-geist text-[0.625rem] leading-relaxed text-m-muted">{label.description}</p>
      </div>
      <MToggle checked={addon.enabled} ariaLabel={label.name} onChange={() => onToggle(addon)} />
    </div>
  )
}

/** A provider shelf under its addon: Journey's photo providers, Documents' document providers. */
function MProviderShelf({ options }: { options: ProviderOption[] }) {
  return (
    <>
      {options.map(provider => (
        <MSubRow
          key={provider.key}
          providerIcon={PROVIDER_ICONS[provider.key]}
          title={provider.label}
          subtitle={provider.description}
          enabled={provider.enabled}
          onToggle={provider.toggle}
        />
      ))}
    </>
  )
}

interface MSubRowProps {
  icon?: typeof Luggage
  providerIcon?: ComponentType<{ size?: number }>
  title: string
  subtitle: string
  enabled: boolean
  onToggle: () => void
}

/** Indented sub-feature row (bag tracking, collab features, memory providers). */
function MSubRow({ icon: Icon, providerIcon: ProviderIcon, title, subtitle, enabled, onToggle }: MSubRowProps) {
  return (
    <div className="flex items-center gap-3 border-t border-[color:var(--m-rowbr)] py-[9px] ps-[50px]">
      <span className="flex-none text-m-faint">
        {Icon ? <Icon size={14} /> : ProviderIcon ? <ProviderIcon size={14} /> : null}
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[0.75rem] font-bold text-m-ink">{title}</div>
        <div className="mt-[1px] font-geist text-[0.59375rem] leading-relaxed text-m-muted">{subtitle}</div>
      </div>
      <MToggle checked={enabled} ariaLabel={title} onChange={onToggle} />
    </div>
  )
}

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

  const sectionCls = 'font-geist text-[0.625rem] font-bold uppercase tracking-[0.06em] text-m-faint'

  const providerOptions = [
    { value: 'local', label: 'Local · OpenAI-compatible', icon: <Server size={14} />, badge: 'Ollama' },
    { value: 'openai', label: 'OpenAI', icon: <Cloud size={14} /> },
    { value: 'anthropic', label: 'Anthropic', icon: <Sparkles size={14} /> },
  ]

  return (
    <div className="space-y-5 ps-[50px]">
      <p className="font-geist text-[0.625rem] leading-relaxed text-m-faint">
        Set instance-wide config (applies to all users). Leave blank to let each user configure their own provider.
      </p>

      {/* Connection */}
      <section className="space-y-3">
        <div className={sectionCls}>Connection</div>
        <MAdminField label="Provider">
          <div className="space-y-[6px]">
            {providerOptions.map((opt) => {
              const active = provider === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setProvider(opt.value)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-[10px] text-start ${
                    active ? 'border-[color:var(--m-act)] bg-[color:var(--m-ic)]' : 'border-[color:var(--m-rowbr)]'
                  }`}
                >
                  <span className="flex-none text-m-muted">{opt.icon}</span>
                  <span className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold text-m-ink">{opt.label}</span>
                  {opt.badge && (
                    <span className="flex-none rounded-full bg-[color:var(--m-ic)] px-2 py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted">
                      {opt.badge}
                    </span>
                  )}
                  {active && <Check size={15} strokeWidth={2.4} className="flex-none text-m-ink" />}
                </button>
              )
            })}
          </div>
        </MAdminField>
        {provider !== 'anthropic' && (
          <MAdminField label="Base URL">
            <MAdminInput
              type="url"
              autoComplete="off"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              onBlur={loadModels}
              placeholder={provider === 'local' ? 'http://localhost:11434/v1' : 'https://api.openai.com/v1'}
            />
          </MAdminField>
        )}
        <MAdminField label="API key">
          <MAdminSecretInput
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder={apiKey === MASKED ? MASKED : provider === 'local' ? '(often not required)' : 'sk-…'}
          />
        </MAdminField>
        {provider === 'anthropic' && (
          <p className="font-geist text-[0.625rem] leading-relaxed text-m-faint">
            Anthropic reads PDFs (including scans) natively. Local/OpenAI models receive extracted text — scanned PDFs need Anthropic.
          </p>
        )}
      </section>

      {/* Model */}
      <section className="space-y-3">
        <div className={sectionCls}>Model</div>
        <MAdminInput
          autoComplete="off"
          value={model}
          onChange={e => setModel(e.target.value)}
          placeholder={provider === 'anthropic' ? 'claude-opus-4-8' : provider === 'openai' ? 'gpt-4o' : 'select or pull below'}
        />

        <MAdminField label={t('settings.aiParsing.multimodal')}>
          <div role="radiogroup" aria-label={t('settings.aiParsing.multimodal')} className="flex gap-[6px]">
            {LLM_VISION_MODES.map((mode) => {
              const active = vision === mode
              return (
                <button
                  key={mode}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setVision(mode)}
                  className={`flex-1 rounded-xl border px-3 py-[10px] text-[0.8125rem] font-semibold text-m-ink ${
                    active ? 'border-[color:var(--m-act)] bg-[color:var(--m-ic)]' : 'border-[color:var(--m-rowbr)]'
                  }`}
                >
                  {t(`admin.addons.llm.vision.${mode}`)}
                </button>
              )
            })}
          </div>
        </MAdminField>
        <p className="font-geist text-[0.625rem] leading-relaxed text-m-faint">
          {t(provider === 'local' ? 'admin.addons.llm.vision.hintLocal' : 'admin.addons.llm.vision.hintCloud')}
        </p>

        {/* Local model management (Ollama) */}
        {provider === 'local' && (
          <div className="space-y-3 rounded-xl border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-3">
            <div className="flex items-center justify-between">
              <span className="text-[0.75rem] font-semibold text-m-ink">Installed on the server</span>
              <button
                type="button"
                onClick={loadModels}
                disabled={loadingModels}
                className="font-geist text-[0.6875rem] text-m-muted underline disabled:opacity-60"
              >
                {loadingModels ? 'Loading…' : 'Refresh'}
              </button>
            </div>
            {modelsErr && <p className="font-geist text-[0.6875rem] text-[color:var(--m-st-danger)]">{modelsErr}</p>}
            {!modelsErr && installed.length === 0 && !loadingModels && (
              <p className="font-geist text-[0.6875rem] text-m-faint">No models installed yet — pull one below.</p>
            )}
            {installed.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {installed.map(name => (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => setModel(name)}
                    className={`max-w-full truncate rounded-full border px-[10px] py-[5px] text-[0.6875rem] ${
                      model === name ? 'border-transparent bg-m-act text-m-actfg' : 'border-[color:var(--m-rowbr)] text-m-ink'
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}

            <div className="border-t border-[color:var(--m-rowbr)] pt-3">
              <div className="mb-2 text-[0.75rem] font-semibold text-m-ink">Pull a recommended model</div>
              <div className="space-y-1">
                {RECOMMENDED_MODELS.map(m => {
                  const installedHere = isInstalled(m.id)
                  const isPulling = pulling === m.id
                  const active = model === m.id
                  return (
                    <div
                      key={m.id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                        active ? 'border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)]' : 'border-transparent'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[0.8125rem] text-m-ink">{m.label}</span>
                          {m.recommended && (
                            <span className="rounded-md bg-[color:color-mix(in_srgb,var(--m-st-confirmed)_15%,transparent)] px-1.5 py-px font-geist text-[0.5625rem] font-bold text-[color:var(--m-st-confirmed)]">
                              Recommended
                            </span>
                          )}
                        </div>
                        <div className="font-geist text-[0.625rem] leading-relaxed text-m-faint">{m.note}</div>
                        {isPulling && (
                          <div className="mt-1.5">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--m-ic)]">
                              <div className="h-full bg-m-act transition-[width] duration-200" style={{ width: `${pullPct}%` }} />
                            </div>
                            <div className="mt-0.5 font-geist text-[0.5625rem] text-m-faint">{pullStatus}{pullPct ? ` · ${pullPct}%` : ''}</div>
                          </div>
                        )}
                      </div>
                      {installedHere ? (
                        <MAdminButton variant="ghost" disabled={active} onClick={() => setModel(m.id)}>
                          {active ? 'Selected' : 'Use'}
                        </MAdminButton>
                      ) : (
                        <MAdminButton busy={isPulling} disabled={!!pulling} onClick={() => pull(m.id)}>
                          {isPulling ? 'Pulling…' : 'Pull'}
                        </MAdminButton>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      <MAdminButton busy={saving} onClick={save}>
        {saving ? 'Saving…' : 'Save'}
      </MAdminButton>
    </div>
  )
}
