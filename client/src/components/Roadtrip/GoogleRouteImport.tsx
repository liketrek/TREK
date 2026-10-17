import { useEffect, useId, useRef, useState } from 'react'
import { MoreHorizontal, Link2 } from 'lucide-react'
import { useTranslation } from '../../i18n/TranslationContext'
import { useTripStore } from '../../store/tripStore'
import { googleRouteRepo } from '../../repo/googleRouteRepo'
import { generateUUID } from '../../sync/mutationQueue'
import { getApiErrorMessage } from '../../types'
import type { GoogleRoutePreview } from '@trek/shared'
import { DialogButton, DialogFooter, DialogHeader, DialogSection, DialogShell, DialogTile, FooterSpacer, NEUTRAL_TINT, fs } from '../shared/DialogShell'
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
  const labelId = useId()
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
  // Every way out is held while a preview or an import is in flight, as before.
  const close = () => { if (!busy) setOpen(false) }
  const resolved = preview?.stops.filter(s => s.lat != null && s.lng != null) ?? []
  return <>
    <Tooltip label={t('roadtrip.import.title')}>
      <button type="button" aria-label={t('roadtrip.import.title')} className="shrink-0 rounded-lg p-2 text-content-muted hover:bg-surface-hover focus-visible:ring-2 focus-visible:ring-accent"
        onClick={e => menu.open(e, [{ label: t('roadtrip.import.title'), icon: Link2, onClick: show }], true)}>
        <MoreHorizontal size={18} />
      </button>
    </Tooltip>
    <ContextMenu menu={menu.menu} onClose={menu.close} />
    <DialogShell
      open={open}
      onClose={close}
      blocked={busy}
      labelledBy={labelId}
      width="narrow"
      header={(
        <DialogHeader
          tile={<DialogTile><Link2 size={20} strokeWidth={1.9} className="text-content-muted" /></DialogTile>}
          tint={NEUTRAL_TINT}
          labelId={labelId}
          onClose={close}
          title={t('roadtrip.import.title')}
          sub={t('roadtrip.import.note')}
          subWraps
        />
      )}
      footer={(
        <DialogFooter>
          <FooterSpacer />
          <DialogButton disabled={busy} onClick={close}>{t('common.cancel')}</DialogButton>
          <DialogButton variant="primary" disabled={busy || saved || (!preview ? !url.trim() : resolved.length < 2 || !target)} onClick={() => void (preview ? save() : inspect())}>
            {busy ? t('common.loading') : t(preview ? 'common.import' : 'common.preview')}
          </DialogButton>
        </DialogFooter>
      )}
    >
      {!preview ? <input type="url" value={url} disabled={busy} onChange={e => setUrl(e.target.value)} aria-label="Google Maps URL" placeholder="https://maps.app.goo.gl/…"
        className="w-full rounded-[10px] border border-edge bg-surface-input px-3 py-2.5 text-content outline-none placeholder:text-content-faint focus:ring-2 focus:ring-[color:var(--text-primary)] disabled:opacity-50"
        style={fs(13, 'body')} /> : <>
        <DialogSection label={t('roadtrip.import.day')}>
          <CustomSelect value={target} onChange={value => { setTarget(String(value)); requestId.current = generateUUID() }}
            options={days.map(day => ({ value: String(day.id), label: day.title || `${t('roadtrip.import.day')} ${day.day_number}` }))} disabled={busy || saved} />
        </DialogSection>
        <ol className="m-0 flex max-h-64 list-none flex-col gap-2.5 overflow-auto rounded-[14px] border border-edge-faint bg-surface-secondary p-3.5">
          {preview.stops.map((stop, index) => <li key={index} className="flex items-baseline gap-3 text-content" style={fs(13, 'body')}>
            <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-surface-card font-semibold tabular-nums text-content-muted shadow-sm" style={fs(10.5)}>{index + 1}</span>
            <span className="min-w-0 break-words">{stop.name}{stop.name !== `${stop.lat}, ${stop.lng}` && <span className="block font-geist text-content-muted" style={fs(11.5)}>{stop.lat == null || stop.lng == null ? t('roadtrip.import.unresolved') : `${stop.lat.toFixed(5)}, ${stop.lng.toFixed(5)}`}</span>}</span>
          </li>)}
        </ol>
      </>}
      {failure && <p role="alert" className="m-0 text-caption text-danger">{saved ? t('common.saved') + ': ' : ''}{failure}</p>}
    </DialogShell>
  </>
}
