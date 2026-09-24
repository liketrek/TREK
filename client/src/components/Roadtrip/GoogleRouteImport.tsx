import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal, Link2 } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { useTripStore } from '../../store/tripStore'
import { googleRouteRepo } from '../../repo/googleRouteRepo'
import { generateUUID } from '../../sync/mutationQueue'
import { getApiErrorMessage } from '../../types'
import type { GoogleRoutePreview } from '@trek/shared'
import Modal from '../shared/Modal'
import CustomSelect from '../shared/CustomSelect'
import { ContextMenu, useContextMenu } from '../shared/ContextMenu'
import { Tooltip } from '../shared/Tooltip'

export default function GoogleRouteImport({ tripId, dayId }: { tripId: number; dayId?: number }) {
  const { t } = useTranslation()
  const days = useTripStore(s => s.days)
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [preview, setPreview] = useState<GoogleRoutePreview | null>(null)
  const [target, setTarget] = useState('')
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [saved, setSaved] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const requestId = useRef('')
  const menu = useContextMenu()
  useEffect(() => () => controller.current?.abort(), [])
  const inspect = async () => {
    controller.current?.abort()
    const abort = new AbortController()
    controller.current = abort
    setBusy(true); setFailure(''); setPreview(null)
    try { const parsed = await googleRouteRepo.preview(url, abort.signal); if (!abort.signal.aborted) setPreview(parsed) }
    catch (error) { if (!abort.signal.aborted) setFailure(getApiErrorMessage(error, t('common.error'))) }
    finally { if (!abort.signal.aborted) setBusy(false) }
  }
  const save = async () => {
    if (!preview || !target) return
    setBusy(true); setFailure('')
    try {
      const stops = preview.stops.filter(s => s.lat != null && s.lng != null).map(s => ({ name: s.name, lat: s.lat!, lng: s.lng! }))
      await googleRouteRepo.append(tripId, { dayId: Number(target), stops }, requestId.current)
      setSaved(true)
      await useTripStore.getState().loadTrip(tripId)
      setOpen(false)
    } catch (error) { setFailure(getApiErrorMessage(error, t('common.error'))) }
    finally { setBusy(false) }
  }
  const show = () => {
    setUrl(''); setPreview(null); setFailure(''); setSaved(false)
    setTarget(String(dayId ?? days[0]?.id ?? ''))
    requestId.current = generateUUID(); setOpen(true)
  }
  const resolved = preview?.stops.filter(s => s.lat != null && s.lng != null) ?? []
  return <>
    <Tooltip label={t('roadtrip.import.title')}>
      <button type="button" aria-label={t('roadtrip.import.title')} className="shrink-0 rounded-lg p-2 text-content-muted hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent"
        onClick={e => menu.open(e, [{ label: t('roadtrip.import.title'), icon: Link2, onClick: show }], true)}>
        <MoreHorizontal size={18} />
      </button>
    </Tooltip>
    <ContextMenu menu={menu.menu} onClose={menu.close} />
    <Modal isOpen={open} onClose={() => { if (!busy) setOpen(false) }} title={t('roadtrip.import.title')} size="lg">
      <div className="space-y-4">
        <p className="text-caption text-content-muted">{t('roadtrip.import.note')}</p>
        {!preview ? <input type="url" value={url} disabled={busy} onChange={e => setUrl(e.target.value)} aria-label="Google Maps URL" placeholder="https://maps.app.goo.gl/…"
          className="w-full rounded-xl border border-edge bg-surface-input p-3 text-body text-content" /> : <>
          <CustomSelect value={target} onChange={value => { setTarget(String(value)); requestId.current = generateUUID() }}
            options={days.map(day => ({ value: String(day.id), label: day.title || `${t('roadtrip.import.day')} ${day.day_number}` }))} disabled={busy || saved} />
          <ol className="max-h-64 space-y-2 overflow-auto">
            {preview.stops.map((stop, index) => <li key={index} className="flex items-baseline gap-3 text-body text-content">
              <span className="text-caption tabular-nums text-content-muted">{index + 1}</span>
              <span className="min-w-0">{stop.name}{stop.name !== `${stop.lat}, ${stop.lng}` && <span className="block text-caption text-content-muted">{stop.lat == null || stop.lng == null ? t('roadtrip.import.unresolved') : `${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`}</span>}</span>
            </li>)}
          </ol>
        </>}
        {failure && <p role="alert" className="text-caption text-danger">{saved ? t('common.saved') + ': ' : ''}{failure}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" disabled={busy} className="rounded-lg px-3 py-2 text-body text-content-secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</button>
          <button type="button" disabled={busy || saved || (!preview ? !url.trim() : resolved.length < 2 || !target)} onClick={() => void (preview ? save() : inspect())}
            className="rounded-lg bg-accent px-4 py-2 text-body font-medium text-accent-text disabled:opacity-50">
            {busy ? t('common.loading') : t(preview ? 'common.import' : 'common.preview')}
          </button>
        </div>
      </div>
    </Modal>
  </>
}
