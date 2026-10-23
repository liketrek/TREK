import type { ComponentType } from 'react'
import { useTranslation } from '../../i18n'
import { useIsDark } from '../../hooks/useIsDark'
import { Puzzle, ListChecks, Wallet, FileText, CalendarDays, Globe, Briefcase, Image, Terminal, Link2, Compass, BookOpen, Sparkles, Luggage, Plane, Bookmark, Users, Loader2, Mountain, CarFront } from 'lucide-react'
import EmptyState from '../shared/EmptyState'
import DawarichIcon from '../shared/DawarichIcon'
import AirTrailIcon from '../shared/AirTrailIcon'
import { DOCUMENT_PROVIDER_ICONS } from '../shared/DocumentProviderIcons'
import AddonTile from './AddonTile'
import AddonSubRow from './AddonSubRow'
import { Tooltip } from '../shared/Tooltip'
import { fs } from '../shared/DialogShell'
import { SettingsCard, StatusPill } from '../Settings/settingsKit'
import { type Addon, type CollabFeatures, COLLAB_SUB_FEATURES, getAddonLabel } from './addons/addonModel'
import { useAddonManager } from './addons/useAddonManager'
import AiAddonTile from './addons/AiAddonTile'
import { ImmichIcon, SynologyIcon } from './addons/PhotoProviderIcons'
import WandererMark from '../Tours/wanderer/WandererMark'

// Keys are the `icon` column from the addons table (see server seeds.ts); anything
// unknown falls back to Puzzle. Users/Sparkles cover collab and llm_parsing, which
// used to land on the fallback.
const ICON_MAP = {
  ListChecks, Wallet, FileText, CalendarDays, Puzzle, Globe, Briefcase, Image, Terminal, Link2, Compass, BookOpen, Plane, Bookmark, Users, Sparkles,
  Mountain,
  // Road trip was seeded as 'Route'; the car says what it is better than a line does.
  Route: CarFront,
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
    addons, loading, handleToggle, tripAddons, globalAddons, integrationAddons, aiAddons, providerOptions, documentProviderOptions,
    toursWanderer,
    toggleToursWanderer,
    mapSwitches,
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
    // An array, not a fragment: the tile counts its rows to fold them behind the
    // "N options" bar the way Collab's and Documents' are.
    if (addon.id === 'tours' && addon.enabled) {
      return [
        <AddonSubRow
          key="wanderer"
          icon={<WandererMark size={14} />}
          title={t('admin.toursWanderer.title')}
          description={t('admin.toursWanderer.subtitle')}
          enabled={toursWanderer}
          onToggle={() => void toggleToursWanderer()}
        />,
        ...mapSwitches.map(({ key, Icon, titleKey, subtitleKey, enabled, toggle }) => (
          <AddonSubRow
            key={key}
            icon={<Icon size={14} />}
            title={t(titleKey)}
            description={t(subtitleKey)}
            enabled={enabled}
            onToggle={() => void toggle()}
          />
        )),
      ]
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
  ].filter(g => g.addons.length > 0 || (g.key === 'integration' && aiAddons.length > 0))
  const enabledCount = addons.filter(a => a.type !== 'photo_provider' && a.type !== 'document_provider' && a.enabled).length
  const totalCount = tripAddons.length + globalAddons.length + integrationAddons.length + aiAddons.length

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
                <GroupHead icon={meta.icon} label={t(meta.labelKey)} hint={t(meta.hintKey)} addons={g.key === 'integration' ? [...aiAddons, ...g.addons] : g.addons} t={t} />
                <div className="divide-y divide-edge-faint">
                  {/* The AI addons share a connection and a settings dialog, so they head the column as one tile. */}
                  {g.key === 'integration' && aiAddons.length > 0 && <AiAddonTile addons={aiAddons} onToggle={handleToggle} />}
                  {g.addons.map(tile)}
                </div>
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
