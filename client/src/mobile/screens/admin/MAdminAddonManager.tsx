import { type ComponentType } from 'react'
import { useTranslation } from '../../../i18n'
import { useIsDark } from '../../../hooks/useIsDark'
import {
  Puzzle, ListChecks, Wallet, FileText, CalendarDays, Globe, Briefcase, Image, Terminal, Link2, Compass, BookOpen,
  Sparkles, Luggage, Plane, Bookmark, Users, Loader2, Mountain, CarFront, Settings2, ChevronRight,
} from 'lucide-react'
import DawarichIcon from '../../../components/shared/DawarichIcon'
import AirTrailIcon from '../../../components/shared/AirTrailIcon'
import { DOCUMENT_PROVIDER_ICONS } from '../../../components/shared/DocumentProviderIcons'
import MToggle from '../../components/MToggle'
import {
  type Addon,
  type CollabFeatures,
  type ProviderOption,
  COLLAB_SUB_FEATURES,
  getAddonLabel,
} from '../../../components/Admin/addons/addonModel'
import { useAddonManager } from '../../../components/Admin/addons/useAddonManager'
import AiSettingsDialog from '../../../components/Admin/addons/AiAdminConfig'
import { AI_ADDON_ICONS, type AiAddonId } from '../../../components/Admin/addons/aiAddons'
import { useAiAddonTile } from '../../../components/Admin/addons/useAiAddonTile'
import { ImmichIcon, SynologyIcon } from '../../../components/Admin/addons/PhotoProviderIcons'
import { MAdminCard, MAdminClampedText } from './MAdminUi'
import WandererMark from '../../../components/Tours/wanderer/WandererMark'

// Keys are the `icon` column from the addons table; anything unknown falls back to
// Puzzle. Users/Sparkles cover collab and llm_parsing, as on the desktop.
const ICON_MAP = {
  ListChecks, Wallet, FileText, CalendarDays, Puzzle, Globe, Briefcase, Image, Terminal, Link2, Compass, BookOpen, Plane, Bookmark, Users, Sparkles,
  Mountain,
  // Road trip was seeded as 'Route'; the car says what it is better than a line does.
  Route: CarFront,
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
    addons, loading, handleToggle, tripAddons, globalAddons, integrationAddons, aiAddons, providerOptions, documentProviderOptions,
    toursWanderer,
    toggleToursWanderer,
    mapSwitches,
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
        {/* One run of text with the wordmark inside it, so a line break falls between words and never around the logo. */}
        <p className="mt-[2px] font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] leading-relaxed text-m-muted">
          {t('admin.addons.subtitleBefore')}{' '}
          <img src={dark ? '/text-light.svg' : '/text-dark.svg'} alt="TREK" className="inline h-[9px] w-auto align-baseline opacity-70" />{' '}
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
              <MGroupHead icon={Briefcase} label={t('admin.addons.type.trip')} hint={t('admin.addons.tripHint')} />
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
                  {addon.id === 'tours' && addon.enabled && (
                    <>
                      <MSubRow
                        providerIcon={WandererMark}
                        title={t('admin.toursWanderer.title')}
                        subtitle={t('admin.toursWanderer.subtitle')}
                        enabled={toursWanderer}
                        onToggle={() => void toggleToursWanderer()}
                      />
                      {mapSwitches.map(({ key, Icon, titleKey, subtitleKey, enabled, toggle }) => (
                        <MSubRow
                          key={key}
                          icon={Icon}
                          title={t(titleKey)}
                          subtitle={t(subtitleKey)}
                          enabled={enabled}
                          onToggle={() => void toggle()}
                        />
                      ))}
                    </>
                  )}
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
              <MGroupHead icon={Globe} label={t('admin.addons.type.global')} hint={t('admin.addons.globalHint')} />
              {globalAddons.map((addon, i) => (
                <div key={addon.id}>
                  <MAddonRow addon={addon} onToggle={handleToggle} t={t} first={i === 0} />
                  {/* Memories providers as sub-items under Journey addon — only while it is on */}
                  {addon.id === 'journey' && addon.enabled && <MProviderShelf options={providerOptions} />}
                </div>
              ))}
            </MAdminCard>
          )}

          {/* Integration Addons, headed by the AI ones as one group, as on the desktop */}
          {(integrationAddons.length > 0 || aiAddons.length > 0) && (
            <MAdminCard>
              <MGroupHead icon={Link2} label={t('admin.addons.type.integration')} hint={t('admin.addons.integrationHint')} />
              {aiAddons.length > 0 && <MAiAddons addons={aiAddons} onToggle={handleToggle} />}
              {integrationAddons.map((addon, i) => (
                <MAddonRow key={addon.id} addon={addon} onToggle={handleToggle} t={t} first={i === 0 && aiAddons.length === 0} />
              ))}
            </MAdminCard>
          )}
        </>
      )}
    </div>
  )
}

/** Group subheader: small icon + uppercase label, matches the desktop section band. */
function MGroupHead({ icon: Icon, label, hint }: { icon: typeof Briefcase; label: string; hint: string }) {
  return (
    <div className="mb-1">
      <div className="flex items-center gap-2">
        <Icon size={13} className="flex-none text-m-muted" />
        <span className="font-geist text-[length:calc(10px*var(--fs-scale-caption,1))] font-bold uppercase tracking-[0.06em] text-m-muted">{label}</span>
      </div>
      <p className="mt-[2px] ps-[21px] font-geist text-[length:calc(9.5px*var(--fs-scale-caption,1))] leading-snug text-m-faint">{hint}</p>
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
        <MAdminClampedText className="mt-[1px] text-[length:calc(10px*var(--fs-scale-caption,1))]">{label.description}</MAdminClampedText>
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
        <MAdminClampedText className="mt-[1px] text-[length:calc(9.5px*var(--fs-scale-caption,1))]">{subtitle}</MAdminClampedText>
      </div>
      <MToggle checked={enabled} ariaLabel={title} onChange={onToggle} />
    </div>
  )
}

/** The AI addons as one group: a head row, their switches, and the button to the settings dialog. */
function MAiAddons({ addons, onToggle }: { addons: Addon[]; onToggle: (addon: Addon) => void }) {
  const { t } = useTranslation()
  const tile = useAiAddonTile(addons)
  return (
    <div>
      <div className="flex items-center gap-3 py-[11px]">
        <span className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-[11px] bg-[color:var(--m-ic)] text-m-ink">
          <Sparkles size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[0.8125rem] font-bold text-m-ink">{t('admin.addons.ai.name')}</span>
          <p className="mt-[1px] font-geist text-[0.625rem] leading-relaxed text-m-muted">{t('admin.addons.ai.description')}</p>
        </div>
        <span className="flex-none rounded-full bg-[color:var(--m-ic)] px-[7px] py-[2px] font-geist text-[0.5625rem] font-bold text-m-muted">
          {tile.enabledCount}/{addons.length}
        </span>
      </div>
      {addons.map(addon => {
        const label = getAddonLabel(t, addon)
        return (
          <MSubRow
            key={addon.id}
            icon={AI_ADDON_ICONS[addon.id as AiAddonId]}
            title={label.name}
            subtitle={label.description}
            enabled={addon.enabled}
            onToggle={() => onToggle(addon)}
          />
        )
      })}
      {tile.canSetUp && (
        <button
          type="button"
          onClick={tile.openDialog}
          className="flex w-full items-center gap-3 border-t border-[color:var(--m-rowbr)] py-[11px] ps-[50px] text-start"
        >
          <Settings2 size={14} className="flex-none text-m-faint" />
          <span className="min-w-0 flex-1 truncate text-[0.75rem] font-bold text-m-ink">{t('admin.addons.ai.setup')}</span>
          <ChevronRight size={15} className="flex-none text-m-faint rtl:rotate-180" />
        </button>
      )}
      {tile.dialogOpen && <AiSettingsDialog addons={addons} onClose={tile.closeDialog} />}
    </div>
  )
}

