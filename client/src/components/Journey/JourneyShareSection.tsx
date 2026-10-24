import { Link, List, Grid, MapPin, Check, CalendarRange, Route } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { fs } from '../shared/DialogShell'
import { Tooltip } from '../shared/Tooltip'
import { SHARE_MAP_EXTRAS, useJourneyShareLink, type JourneyShareLink, type JourneyShareMapExtra } from './useJourneyShareLink'

const EXTRA_ICONS = { share_plan: CalendarRange, share_recordings: Route } as const

/**
 * What the shared map shows besides the entries (JRN-04): the trips' plan and
 * the recorded days, each off until the owner switches it on, nested under the
 * map and dimmed with the reason while the map is not shared.
 */
function ShareMapExtras({ link, onToggle }: { link: JourneyShareLink; onToggle: (key: JourneyShareMapExtra) => void }) {
  const { t } = useTranslation()
  const mapShared = !!link.share_map
  return (
    <div className="ms-5 flex flex-col gap-1.5 border-s border-edge ps-3">
      {SHARE_MAP_EXTRAS.map(({ key, labelKey, hintKey }) => {
        const Icon = EXTRA_ICONS[key]
        const on = mapShared && !!link[key]
        return (
          <Tooltip key={key} label={mapShared ? '' : t('journey.share.needsMap')} placement="top">
            <button
              type="button"
              aria-pressed={on}
              disabled={!mapShared}
              onClick={() => onToggle(key)}
              className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2 text-start transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                on ? 'border-accent bg-accent text-accent-text' : 'border-edge text-content-muted hover:border-content-faint'
              }`}
            >
              <Icon size={13} className="mt-0.5 flex-none" />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-medium" style={fs(12, 'body')}>{t(labelKey)}</span>
                <span className={on ? 'text-accent-text opacity-80' : 'text-content-faint'} style={fs(11)}>{t(hintKey)}</span>
              </span>
              {on && <Check size={12} className="mt-0.5 flex-none" />}
            </button>
          </Tooltip>
        )
      })}
    </div>
  )
}

export default function JourneyShareSection({ journeyId }: { journeyId: number }) {
  const { t } = useTranslation()
  const { link, loading, manageable, copied, shareUrl, createLink, togglePerm, deleteLink, copyLink } = useJourneyShareLink(journeyId)

  if (loading || !manageable) return null

  return (
    <div>
      <label className="text-caption font-semibold tracking-[0.12em] uppercase text-content-faint block mb-2">{t('journey.share.publicShare')}</label>

      {!link ? (
        <button type="button"
          onClick={createLink}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-dashed border-edge text-body font-medium text-content-muted hover:border-content-faint hover:text-content transition-colors"
        >
          <Link size={14} /> {t('journey.share.createLink')}
        </button>
      ) : (
        <div className="flex flex-col gap-3">
          {/* URL + Copy */}
          <div className="flex items-center gap-2 p-2 rounded-2xl bg-surface-secondary border border-edge-faint">
            <Link size={13} className="text-content-faint flex-shrink-0 ms-1.5" />
            <span className="flex-1 text-caption text-content-muted truncate">{shareUrl}</span>
            <button type="button"
              onClick={copyLink}
              className="flex-shrink-0 px-3 py-1.5 rounded-full bg-accent text-accent-text text-caption font-semibold hover:bg-accent-hover transition-colors"
            >
              {copied ? t('journey.share.copied') : t('journey.share.copy')}
            </button>
            <button type="button"
              onClick={deleteLink}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-caption font-semibold text-danger hover:bg-danger-soft transition-colors"
            >
              {t('share.deleteLink')}
            </button>
          </div>

          {/* Permission toggles */}
          <div className="flex flex-col gap-1.5">
            {[
              { key: 'share_timeline' as const, label: t('journey.share.timeline'), icon: List },
              { key: 'share_gallery' as const, label: t('journey.share.gallery'), icon: Grid },
              { key: 'share_map' as const, label: t('journey.share.map'), icon: MapPin },
            ].map(({ key, label, icon: Icon }) => (
              <button type="button"
                key={key}
                aria-pressed={!!link[key]}
                onClick={() => togglePerm(key)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border text-body font-medium transition-all ${
                  link[key]
                    ? 'border-accent bg-accent text-accent-text'
                    : 'border-edge text-content-muted hover:border-content-faint'
                }`}
              >
                <Icon size={13} />
                {label}
                {link[key] && <Check size={12} className="ms-auto" />}
              </button>
            ))}
            <ShareMapExtras link={link} onToggle={key => void togglePerm(key)} />
          </div>
        </div>
      )}
    </div>
  )
}
