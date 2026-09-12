import { useEffect, useState } from 'react'
import { PlugZap, Coins, ChevronDown } from 'lucide-react'
import type { ChargingInfo as Info } from '@trek/shared'
import { useTranslation } from '../../i18n/TranslationContext'
import { useTripStore } from '../../store/tripStore'
import { chargingRepo } from '../../repo/chargingRepo'
import { isEffectivelyOffline } from '../../sync/networkMode'
import { Tooltip } from '../shared/Tooltip'

export default function ChargingInfo({ placeId, compact = false }: { placeId: number; compact?: boolean }) {
  const tripId = useTripStore(s => s.trip?.id)
  const { t } = useTranslation()
  const [info, setInfo] = useState<Info | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let active = true
    setInfo(null); setLoading(true)
    const refresh = async () => {
      if (!tripId || document.hidden) return
      try { const value = await chargingRepo.read(tripId, placeId); if (active) setInfo(value) }
      catch { if (active) setInfo(null) }
      finally { if (active) setLoading(false) }
    }
    const offline = () => { setInfo(null); setLoading(false) }
    void refresh()
    const timer = window.setInterval(() => void refresh(), 60000)
    window.addEventListener('offline', offline)
    window.addEventListener('online', refresh)
    document.addEventListener('visibilitychange', refresh)
    return () => { active = false; clearInterval(timer); window.removeEventListener('offline', offline); window.removeEventListener('online', refresh); document.removeEventListener('visibilitychange', refresh) }
  }, [tripId, placeId])
  const known = !isEffectivelyOffline() && info?.available != null && !info.stale && Date.now() - Date.parse(info.checkedAt) < 120000
  const status = loading ? t('common.loading') : known ? `${info.available}/${info.total} ${t('roadtrip.charging.available')}` : t(info?.stale ? 'roadtrip.charging.stale' : 'roadtrip.charging.unknown')
  const components = info?.tariffs.flatMap(tariff => tariff.components.map(component => ({ ...component, currency: tariff.currency }))) ?? []
  const energy = components.filter(component => component.kind === 'ENERGY' && component.taxIncluded && !component.conditional)
  const sameCurrency = new Set(energy.map(component => component.currency)).size === 1
  const cheapest = sameCurrency ? energy.reduce<typeof energy[number] | null>((best, component) => !best || component.price < best.price ? component : best, null) : null
  const price = (value: number, currency: string) => new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value)
  const badges = <span className="inline-flex shrink-0 items-center gap-1 align-middle whitespace-nowrap font-medium text-[length:calc(10px*var(--fs-scale-caption,1))] leading-none">
    <Tooltip label={`${status}${info?.updatedAt ? ` (${new Date(info.updatedAt).toLocaleString()})` : ''}`}><span tabIndex={0} className={`inline-flex items-center gap-1 rounded px-1 py-0.5 ${known && info.available! > 0 ? 'bg-success-soft text-success' : 'bg-surface-secondary text-content-muted'}`}><PlugZap size={10} />{known ? `${info.available}/${info.total}` : '?'}</span></Tooltip>
    {cheapest && <Tooltip label={t('roadtrip.charging.note')}><span tabIndex={0} className="inline-flex items-center gap-1 rounded bg-surface-secondary px-1 py-0.5 text-content-muted"><Coins size={10} />{price(cheapest.price, cheapest.currency)}/kWh*</span></Tooltip>}
  </span>
  if (compact) return badges
  return <details className="group rounded-[10px] bg-surface-hover text-[length:calc(12px*var(--fs-scale-body,1))] text-content-secondary">
    <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 [&::-webkit-details-marker]:hidden">
      <PlugZap size={13} className="shrink-0 text-content-faint" />
      <span className="font-medium">{t('roadtrip.poi.charging')}</span>
      <span className="ml-2 text-content-muted">{status}</span>
      {cheapest && <span className="ml-auto whitespace-nowrap font-medium">{price(cheapest.price, cheapest.currency)}/kWh*</span>}
      <ChevronDown size={13} className={'shrink-0 text-content-faint group-open:rotate-180 ' + (cheapest ? '' : 'ml-auto')} />
    </summary>
    <div className="space-y-2 px-3 pb-3 text-content-muted">
    {info?.station && <p>{info.station}</p>}
    <div className="space-y-1"><p className="font-medium">{t('roadtrip.charging.prices')}</p>
      {!components.length && <p className="text-content-muted">{info?.pricesUnavailable ? `${t('common.error')}: ` : ''}{t('roadtrip.charging.unknown')}</p>}
      {components.map((component, index) => <p key={index}>{price(component.price, component.currency)}{component.kind === 'ENERGY' ? '/kWh' : ['TIME', 'PARKING_TIME'].includes(component.kind) ? '/h' : ''} {component.kind === 'FLAT' ? 'Σ' : ''}{component.conditional || !component.taxIncluded ? '*' : ''}{component.afterSeconds != null && component.afterSeconds > 0 ? ` (> ${Math.round(component.afterSeconds / 60)} min)` : ''}</p>)}
      {!!components.length && <p className="text-content-muted">* {t('roadtrip.charging.note')}</p>}
    </div>
    <p className="text-content-muted">{t('roadtrip.charging.coverage')}</p>
    {info?.source && <p className="text-content-muted"><a className="underline" href={info.sourceUrl?.startsWith('https://') ? info.sourceUrl : 'https://mobidata-bw.de/de/dataset/e-ladesaulen'} target="_blank" rel="noreferrer">{info.source}</a> · <a className="underline" href="https://mobidata-bw.de/de/dataset/e-ladesaulen" target="_blank" rel="noreferrer">MobiData BW</a><br />{info.license}{info.updatedAt && ` · ${new Date(info.updatedAt).toLocaleString()}`}</p>}
    </div>
  </details>
}
