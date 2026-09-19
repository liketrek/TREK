import React, { useState } from 'react'
import { Building2, Check, CalendarDays, Globe2, Hourglass, Info, Loader2, MapPin, RefreshCw, Star } from 'lucide-react'
import type { DawarichAtlasSuggestions, DawarichBucketScan } from '@trek/shared'
import { DAWARICH_BUCKET_MATCH_MIN_MINUTES, DAWARICH_BUCKET_MATCH_RADIUS_M } from '@trek/shared'
import { useTranslation } from '../../i18n'
import { useToast } from '../shared/Toast'
import { Skeleton } from '../shared/Skeleton'
import { SlidingTabs } from '../shared/SlidingTabs'
import Modal from '../shared/Modal'
import MSheet from '../../mobile/components/MSheet'
import { FormSheetHeader } from '../../mobile/screens/trip/sheets/PlSheetChrome'
import { useIsPhone } from '../../mobile/useIsPhone'
import DawarichIcon from '../shared/DawarichIcon'
import DawarichBadge from './DawarichBadge'
import { dawarichApi } from '../../api/dawarich'
import { dawarichRepo, DawarichOfflineError } from '../../repo/dawarichRepo'
import { isEffectivelyOffline } from '../../sync/networkMode'
import { formatDuration } from './dawarichSuggestionModel'
import { cityLine, countryLabel, countryWindow, formatDistance, newCountries, orderedMatches } from './dawarichAtlasModel'

type Tab = 'wishes' | 'countries'

/**
 * Everything Dawarich can answer about the Atlas, in a room of its own.
 *
 * It used to be a card wedged under the wishlist, which made two different
 * questions — "which wishes did I actually reach?" and "which countries was I
 * in?" — look like one paragraph of small print. Both are offers that need
 * reading before they are accepted, and reading needs space, so they get a
 * dialog with a tab each, one selection model and one confirm button.
 *
 * Nothing here runs on its own. The Atlas is curated — it carries tombstones
 * precisely so a country somebody removed stays removed — and a background job
 * that ticked countries off would be fighting its owner.
 */
export default function DawarichAtlasDialog({
  isOpen,
  initialTab = 'wishes',
  onClose,
  onChanged,
}: {
  isOpen: boolean
  /** Which question was asked to open it — the panel has a button per tab. */
  initialTab?: Tab
  onClose: () => void
  /** Called after something was written, so the Atlas can re-read itself. */
  onChanged?: () => void
}): React.ReactElement {
  const { t, locale } = useTranslation()
  const toast = useToast()
  const phone = useIsPhone()
  const [tab, setTab] = useState<Tab>(initialTab)

  const [scan, setScan] = useState<DawarichBucketScan | null>(null)
  const [scanning, setScanning] = useState(false)
  const [picked, setPicked] = useState<Set<number>>(new Set())

  const [countries, setCountries] = useState<DawarichAtlasSuggestions | null>(null)
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [pickedCountries, setPickedCountries] = useState<Set<string>>(new Set())
  // One write at a time: the button stays on screen while the request is in
  // flight, and a second press would send the same confirmation twice.
  const [writing, setWriting] = useState(false)

  const matches = orderedMatches(scan?.matches ?? [])
  const openMatches = matches.filter(match => !match.alreadyVisited)
  const offered = newCountries(countries?.countries ?? [])

  const runScan = async (): Promise<void> => {
    setScanning(true)
    try {
      const result = await dawarichRepo.bucketScan()
      setScan(result)
      // Everything with a match and not already ticked starts selected: the
      // common case is "yes, all of those", and unticking the odd one is less
      // work than ticking twenty.
      setPicked(new Set(result.matches.filter(m => m.match && !m.alreadyVisited).map(m => m.itemId)))
    } catch (err) {
      toast.error(failureText(err, t))
    } finally {
      setScanning(false)
    }
  }

  const loadCountries = async (): Promise<void> => {
    setLoadingCountries(true)
    try {
      const { from, to } = countryWindow(new Date())
      const result = await dawarichRepo.atlasSuggestions(from, to)
      setCountries(result)
      setPickedCountries(new Set(newCountries(result.countries).map(c => c.countryCode)))
    } catch (err) {
      toast.error(failureText(err, t))
    } finally {
      setLoadingCountries(false)
    }
  }

  const confirmWishes = async (): Promise<void> => {
    if (picked.size === 0 || writing) return
    // Writes are online-only: the reads are gated in the repo, and firing a
    // confirmation into a dead connection would hang to a timeout and then
    // report a server error for something the server never saw.
    if (isEffectivelyOffline()) {
      toast.error(t('dawarich.error.offline'))
      return
    }
    setWriting(true)
    try {
      // Ticked off on the day each wish was reached, not on today. The dialog is
      // holding that date for every row it is about to write, so it says it;
      // grouping by date keeps that to one request per day rather than per wish.
      const byDate = new Map<string, number[]>()
      for (const m of matches) {
        if (!picked.has(m.itemId) || !m.match) continue
        const bucket = byDate.get(m.match.at)
        if (bucket) bucket.push(m.itemId)
        else byDate.set(m.match.at, [m.itemId])
      }
      const results = await Promise.all(
        [...byDate].map(([at, ids]) => dawarichApi.confirmBucketVisits(ids, at)),
      )
      const result = { updated: results.reduce((sum, r) => sum + r.updated, 0) }
      toast.success(t('dawarich.bucket.confirmed', { count: result.updated }))
      // Marked in place rather than rescanned: the scan costs one upstream
      // request per wish, and the reader already knows what they just ticked.
      setScan(prev =>
        prev === null
          ? prev
          : { ...prev, matches: prev.matches.map(m => (picked.has(m.itemId) ? { ...m, alreadyVisited: true } : m)) },
      )
      setPicked(new Set())
      onChanged?.()
    } catch (err) {
      toast.error(failureText(err, t))
    } finally {
      setWriting(false)
    }
  }

  const confirmCountries = async (): Promise<void> => {
    if (pickedCountries.size === 0 || writing) return
    if (isEffectivelyOffline()) {
      toast.error(t('dawarich.error.offline'))
      return
    }
    setWriting(true)
    try {
      const result = await dawarichApi.acceptAtlasCountries([...pickedCountries])
      toast.success(t('dawarich.atlas.accepted', { count: result.marked }))
      setCountries(prev =>
        prev === null
          ? prev
          : {
              ...prev,
              countries: prev.countries.map(c =>
                pickedCountries.has(c.countryCode) ? { ...c, alreadyVisited: true } : c,
              ),
            },
      )
      setPickedCountries(new Set())
      onChanged?.()
    } catch (err) {
      toast.error(failureText(err, t))
    } finally {
      setWriting(false)
    }
  }

  const toggle = <T,>(set: Set<T>, value: T): Set<T> => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  }

  const busy = tab === 'wishes' ? scanning : loadingCountries
  const loaded = tab === 'wishes' ? scan !== null : countries !== null
  const selected = tab === 'wishes' ? picked.size : pickedCountries.size
  // Nothing was found, so there is nothing to confirm — the empty state says so
  // in a sentence, and a greyed-out "Add 0 countries" underneath it only asks to
  // be understood.
  const anything = tab === 'wishes' ? matches.length > 0 : offered.length > 0

  // The same two questions in both shells — only the frame differs.
  const body = (
      <div className="space-y-4">
        <SlidingTabs<Tab>
          tabs={[
            { id: 'wishes', label: t('dawarich.atlas.tab.wishes'), icon: Star, count: openMatches.length || undefined },
            { id: 'countries', label: t('dawarich.atlas.tab.countries'), icon: Globe2, count: offered.length || undefined },
          ]}
          activeTab={tab}
          onChange={setTab}
          size="sm"
          fullWidth
        />

        {tab === 'wishes' ? (
          <Section
            icon={Star}
            title={t('dawarich.bucket.title')}
            description={t('dawarich.bucket.description')}
            action={t('dawarich.bucket.scan')}
            busyLabel={t('dawarich.bucket.scanning')}
            busy={scanning}
            loaded={scan !== null}
            onRun={() => { void runScan() }}
            empty={matches.length === 0}
            emptyLabel={t('dawarich.bucket.noMatches')}
            notes={[
              scan && scan.skippedWithoutCoordinates > 0
                ? t('dawarich.bucket.skipped', { count: scan.skippedWithoutCoordinates })
                : null,
              scan?.truncated ? t('dawarich.bucket.truncated') : null,
              t('dawarich.bucket.rule', {
                meters: DAWARICH_BUCKET_MATCH_RADIUS_M,
                minutes: DAWARICH_BUCKET_MATCH_MIN_MINUTES,
              }),
            ]}
          >
            {matches.map(match => (
              <Row
                key={match.itemId}
                name={match.name}
                checked={picked.has(match.itemId)}
                disabled={match.alreadyVisited}
                onToggle={() => setPicked(prev => toggle(prev, match.itemId))}
                leading={
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-surface-secondary">
                    <Star className="w-4 h-4 text-accent-on" />
                  </span>
                }
              >
                {match.alreadyVisited ? (
                  <DawarichBadge icon={Check} tone="success" size="sm">
                    {t('dawarich.bucket.alreadyVisited')}
                  </DawarichBadge>
                ) : (
                  <>
                    <DawarichBadge icon={MapPin} size="sm">
                      {formatDistance(match.match!.distanceMeters, t)}
                    </DawarichBadge>
                    <DawarichBadge icon={Hourglass} size="sm">
                      {formatDuration(match.match!.minutes, t)}
                    </DawarichBadge>
                    <DawarichBadge icon={CalendarDays} size="sm">
                      {new Date(match.match!.at).toLocaleDateString(locale, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}
                    </DawarichBadge>
                  </>
                )}
              </Row>
            ))}
          </Section>
        ) : (
          <Section
            icon={Globe2}
            title={t('dawarich.atlas.title')}
            description={t('dawarich.atlas.description')}
            action={t('dawarich.atlas.load')}
            busyLabel={t('dawarich.atlas.loading')}
            busy={loadingCountries}
            loaded={countries !== null}
            onRun={() => { void loadCountries() }}
            empty={offered.length === 0}
            emptyLabel={t('dawarich.atlas.empty')}
            notes={[
              countries && countries.unresolved.length > 0
                ? t('dawarich.atlas.unresolved', { names: countries.unresolved.join(', ') })
                : null,
              countries ? t('dawarich.atlas.window') : null,
            ]}
          >
            {offered.map(country => (
              <Row
                key={country.countryCode}
                name={countryLabel(country.countryCode, country.sourceName, locale)}
                checked={pickedCountries.has(country.countryCode)}
                onToggle={() => setPickedCountries(prev => toggle(prev, country.countryCode))}
                leading={
                  // The Atlas page draws its countries with the same flags, and a
                  // list of country names without them looks like a spreadsheet.
                  <img
                    src={`https://flagcdn.com/w40/${country.countryCode.toLowerCase()}.png`}
                    alt=""
                    className="h-6 w-8 flex-shrink-0 rounded object-cover"
                  />
                }
              >
                {country.cities.length > 0 && (
                  <>
                    <DawarichBadge icon={Building2} size="sm">
                      {country.cities.length === 1
                        ? t('dawarich.atlas.citiesOne')
                        : t('dawarich.atlas.cities', { count: country.cities.length })}
                    </DawarichBadge>
                    <span className="min-w-0 truncate text-caption text-content-muted">
                      {cityLine(country.cities)}
                    </span>
                  </>
                )}
              </Row>
            ))}
          </Section>
        )}
      </div>
  )

  // Rendered or not, rather than `hidden`: the attribute loses to the display
  // utility on the class list, so the button stayed on screen greyed out.
  const confirmButton = !loaded || !anything ? null : (
    <button
      type="button"
      onClick={() => { void (tab === 'wishes' ? confirmWishes() : confirmCountries()) }}
      disabled={selected === 0 || writing}
      className={
        phone
          ? 'inline-flex h-[38px] items-center gap-2 rounded-full bg-m-act px-4 text-[0.8125rem] font-bold text-m-actfg disabled:opacity-40'
          : 'inline-flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-caption font-semibold text-accent-text hover:bg-accent-hover disabled:opacity-40'
      }
    >
      <Check className="w-3.5 h-3.5" />
      {tab === 'wishes'
        ? t('dawarich.bucket.confirm', { count: selected })
        : t('dawarich.atlas.accept', { count: selected })}
    </button>
  )

  const againButton = loaded ? (
    <button
      type="button"
      onClick={() => { void (tab === 'wishes' ? runScan() : loadCountries()) }}
      disabled={busy}
      className={
        phone
          ? 'inline-flex h-[38px] items-center gap-2 rounded-full border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] px-4 text-[0.8125rem] font-bold text-m-muted disabled:opacity-50'
          : 'inline-flex items-center gap-2 rounded-lg border border-edge px-3 py-2 text-caption font-medium text-content-secondary hover:bg-surface-hover disabled:opacity-50'
      }
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
      {t('dawarich.again')}
    </button>
  ) : null

  // The phone shell has its own sheet, its own rounding and its own pill
  // buttons, and every other panel on it uses them.
  if (phone) {
    return (
      <MSheet open={isOpen} onClose={onClose} variant="bottom" material="glass" ariaLabel={t('dawarich.title')}>
        <div className="flex max-h-[88dvh] min-h-0 flex-col">
          <FormSheetHeader
            leading={
              <span className="flex h-10 w-10 flex-none overflow-hidden rounded-[13px]">
                <DawarichIcon size={40} />
              </span>
            }
            title={t('dawarich.title')}
            subtitle={t('dawarich.atlas.dialogSubtitle')}
            onClose={onClose}
            closeLabel={t('common.close')}
          />
          <div className="min-h-0 flex-1 overflow-y-auto px-[18px] pb-3">{body}</div>
          <div className="flex flex-none items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[18px] pb-4 pt-3">
            <span className="min-w-0 flex-1 truncate font-geist text-[0.71875rem] text-m-muted">
              {selected > 0 ? t('dawarich.selected', { count: selected }) : ''}
            </span>
            {againButton}
            {confirmButton}
          </div>
        </div>
      </MSheet>
    )
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <span className="flex items-center gap-2.5">
          {/* Rounded, like every other avatar-sized mark in TREK: the logo is a
              square badge and a hard corner beside a rounded dialog reads as a
              pasted-in image. */}
          <span className="flex-shrink-0 overflow-hidden rounded-lg">
            <DawarichIcon size={26} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-subtitle font-semibold text-content">{t('dawarich.title')}</span>
            <span className="block truncate text-caption font-normal text-content-muted">
              {t('dawarich.atlas.dialogSubtitle')}
            </span>
          </span>
        </span>
      }
      footer={
        <div className="flex w-full items-center justify-between gap-3">
          <span className="text-caption text-content-muted">
            {selected > 0 ? t('dawarich.selected', { count: selected }) : ''}
          </span>
          <div className="flex items-center gap-2">
            {againButton}
            {confirmButton}
          </div>
        </div>
      }
    >
      {body}
    </Modal>
  )
}

/**
 * One half of the dialog: the pitch before anything has been asked, the wait
 * while it is being asked, and the answer.
 *
 * Both halves behave identically, which is the point — the two questions are
 * different, the shape of answering them is not.
 */
function Section({
  icon: Icon,
  title,
  description,
  action,
  busyLabel,
  busy,
  loaded,
  onRun,
  empty,
  emptyLabel,
  notes,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  action: string
  busyLabel: string
  busy: boolean
  loaded: boolean
  onRun: () => void
  empty: boolean
  emptyLabel: string
  notes: (string | null)[]
  children: React.ReactNode
}): React.ReactElement {
  if (busy) {
    return (
      <div className="space-y-2" aria-busy>
        <p className="text-caption text-content-muted">{busyLabel}</p>
        {[0, 1, 2].map(i => (
          <div key={i} className="flex items-center gap-3 rounded-xl border border-edge p-3">
            <Skeleton width={32} height={32} radius={8} />
            <div className="flex-1 space-y-1.5">
              <Skeleton width="45%" height={13} radius={4} />
              <Skeleton width="70%" height={11} radius={4} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!loaded) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-edge px-6 py-8 text-center">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-secondary">
          <Icon className="w-5 h-5 text-content-secondary" />
        </span>
        <p className="text-body font-semibold text-content">{title}</p>
        <p className="mt-1.5 max-w-md text-caption text-content-muted">{description}</p>
        <button
          type="button"
          onClick={onRun}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-caption font-semibold text-accent-text hover:bg-accent-hover"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {action}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {empty ? (
        <div className="rounded-xl border border-dashed border-edge px-6 py-8 text-center text-caption text-content-muted">
          {emptyLabel}
        </div>
      ) : (
        <div className="space-y-1.5">{children}</div>
      )}
      {notes.filter(Boolean).length > 0 && (
        <div className="space-y-1 border-t border-edge-faint pt-2.5">
          {notes.filter(Boolean).map(note => (
            <p key={note} className="flex items-start gap-1.5 text-caption text-content-faint">
              <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
              {note}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * A selectable answer: what it is on the left, why it is being offered
 * underneath, and a tick that says whether it will be applied.
 *
 * The whole row is the control — a 16px checkbox is a hard target on a phone,
 * and there is nothing else in the row to click.
 */
function Row({
  name,
  checked,
  disabled = false,
  onToggle,
  leading,
  children,
}: {
  name: string
  checked: boolean
  disabled?: boolean
  onToggle: () => void
  leading: React.ReactNode
  children: React.ReactNode
}): React.ReactElement {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={name}
      disabled={disabled}
      onClick={onToggle}
      className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-colors ${
        checked ? 'border-accent bg-accent-subtle' : 'border-edge hover:bg-surface-hover'
      } ${disabled ? 'opacity-60' : ''}`}
    >
      <span
        aria-hidden
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded ${
          checked ? 'bg-accent' : 'border-[1.5px] border-edge'
        }`}
      >
        {checked && <Check className="w-2.5 h-2.5 text-accent-text" strokeWidth={3} />}
      </span>
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-body font-medium text-content">{name}</span>
        <span className="mt-1 flex flex-wrap items-center gap-1">{children}</span>
      </span>
    </button>
  )
}

/**
 * What to tell the reader when a question could not be asked.
 *
 * Being offline is not an error the server reported — nothing was sent — and
 * "something went wrong" for a plane journey is the kind of message that sends
 * somebody looking for a bug in their Dawarich instance.
 */
function failureText(err: unknown, t: (key: string) => string): string {
  if (err instanceof DawarichOfflineError) return t('dawarich.error.offline')
  return errorText(err) ?? t('dawarich.error.unknown')
}

/** The server's `{ error }` envelope, when there is one. */
function errorText(err: unknown): string | null {
  const data = (err as { response?: { data?: { error?: unknown } } })?.response?.data
  return typeof data?.error === 'string' ? data.error : null
}
