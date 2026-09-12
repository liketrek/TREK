import React, { useState } from 'react'
import { Check, Copy, ExternalLink } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { trivagoSearchHref, campingSearchHref } from './stayPortalLinks'
import { copyText } from '../../utils/clipboard'

const HOTEL_PORTALS = [
  { name: 'trivago', icon: '/images/portals/trivago.png', href: 'https://www.trivago.com/' },
  { name: 'CHECK24', icon: '/images/portals/check24.png', href: 'https://hotel.check24.de/' },
]
const CAMPING_PORTALS = [
  { name: 'PiNCAMP', icon: '/images/portals/pincamp.png', href: 'https://www.pincamp.com/' },
  { name: 'Pitchup', icon: '/images/portals/pitchup.ico', href: 'https://www.pitchup.com/' },
]

export default function StayPortals({ name, camping, lat, lng, arrival, departure }: { name: string; camping: boolean; lat: number; lng: number; arrival?: string | null; departure?: string | null }): React.ReactElement {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const [copyFailed, setCopyFailed] = useState(false)

  const copy = async (): Promise<void> => {
    const didCopy = await copyText(name)
    setCopied(didCopy)
    setCopyFailed(!didCopy)
  }

  return (
    <aside className="flex min-w-0 flex-col gap-3 rounded-xl bg-surface-secondary p-4">
      <p className="text-body font-semibold text-content">{t('roadtrip.stay.portals')}</p>
      <p className="text-caption text-content-muted">{t('roadtrip.stay.portalHint')}</p>
      <div className="flex items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2">
        <span className="min-w-0 flex-1 select-text break-words text-caption text-content-secondary">{name}</span>
        <button type="button" onClick={() => void copy()} aria-label={t(copied ? 'common.copied' : 'common.copy')}
          className="shrink-0 rounded-md p-1 text-content-muted hover:bg-surface-hover hover:text-content">
          {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
        </button>
      </div>
      {copyFailed ? <p role="alert" className="text-caption text-danger">{t('common.error')}</p> : null}
      <div className="flex flex-col gap-2">
        {(camping ? CAMPING_PORTALS : HOTEL_PORTALS).map(portal => (
          <a key={portal.name} href={portal.name === 'trivago' ? trivagoSearchHref(name, arrival, departure) : portal.name === 'PiNCAMP' || portal.name === 'Pitchup' ? campingSearchHref(portal.name, name, lat, lng, arrival, departure) : portal.href} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 rounded-lg border border-edge bg-surface px-3 py-2.5 text-body font-medium text-content transition-colors hover:bg-surface-hover">
            <span className="flex min-w-0 items-center gap-2.5">
              <img src={portal.icon} alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded object-contain" />
              {portal.name}
            </span>
            <ExternalLink size={14} className="text-content-muted" aria-hidden />
          </a>
        ))}
      </div>
    </aside>
  )
}
