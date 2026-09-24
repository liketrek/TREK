import { useState } from 'react'
import { Check, ChevronRight, Globe2, KeyRound, Library, ShieldOff, WifiOff, X } from 'lucide-react'
import TrekMark from '../../../components/shared/TrekMark'
import { useTranslation } from '../../../i18n'

/**
 * The API-keys card's two building blocks, in the phone's own material.
 *
 * The desktop tab was rebuilt around one idea: a key should be the exception
 * rather than the thing you are expected to paste. The TREK Places API leads,
 * the paid providers follow as comparable blocks, and the "recommended" mark
 * belongs to the free option instead of to the Google field. The phone still
 * had the older shape, where Google wore the recommendation and TREK was not on
 * the screen at all, which is the opposite advice on the same setting.
 *
 * Rebuilt rather than shared with the desktop component: every surface, radius
 * and type size here comes from the mobile tokens, and the desktop card is a
 * two-column layout with a hover-revealed disclosure. What is shared is the
 * wording, key for key, so the two pages cannot drift in what they claim.
 */

/**
 * Proper nouns, so they are not translated. Naming them is also a licence
 * obligation rather than decoration: ODbL and CC BY-SA both require attribution
 * wherever their content is shown.
 */
const SOURCES = ['Overture Maps Foundation', 'OpenStreetMap', 'Wikivoyage', 'Wikimedia']

const chip = 'rounded-full border border-[color:var(--m-rowbr)] px-2 py-[2px] font-geist text-[0.625rem]'

/** One group of chips inside the disclosure: what you get, what you do not, where it comes from. */
function ChipGroup({
  icon,
  label,
  items,
  note,
  dashed = false,
}: {
  icon: React.ReactNode
  label: string
  items: string[]
  note: string
  dashed?: boolean
}) {
  return (
    <div className="rounded-[14px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)] p-[11px]">
      <p className="flex items-center gap-[6px] text-[0.6875rem] font-bold text-m-ink">
        {icon}
        {label}
      </p>
      <ul className="mt-2 flex flex-wrap gap-[5px]">
        {items.map(item => (
          <li key={item} className={`${chip} ${dashed ? 'border-dashed text-m-faint' : 'text-m-muted'}`}>
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-2 font-geist text-[0.625rem] leading-relaxed text-m-faint">{note}</p>
    </div>
  )
}

/** The TREK Places API, above the paid keys because it is the alternative to them. */
export function MTrekApiBlock() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  const facts = [
    { Icon: Globe2, text: t('admin.trekApi.factPlaces') },
    { Icon: KeyRound, text: t('admin.trekApi.factNoKey') },
    { Icon: WifiOff, text: t('admin.trekApi.factOffline') },
    { Icon: ShieldOff, text: t('admin.trekApi.factPrivacy') },
  ]

  // The same fields the desktop card lists, reusing words TREK already has.
  const fields = [
    t('places.formName'),
    t('collections.coordinates'),
    t('places.formCategory'),
    t('places.formAddress'),
    t('admin.trekApi.fieldPhone'),
    t('common.email'),
    t('places.formWebsite'),
    t('places.formDescription'),
    t('inspector.openingHours'),
    t('admin.trekApi.fieldStableId'),
  ]

  return (
    <div className="relative mt-[18px]">
      {/* The recommendation sits on the border, as on the desktop card, and small:
          a wide coloured banner would shout over the settings beside it. */}
      <span className="pointer-events-none absolute -top-2 left-3 z-10 rounded-md bg-m-act px-2 py-[1px] font-geist text-[0.5625rem] font-bold tracking-[.12em] text-m-actfg uppercase">
        {t('admin.trekApi.badgeDefault')}
      </span>

      <div className="overflow-hidden rounded-[16px] border border-[color:var(--m-act)] bg-[color:var(--m-ic)]">
        <div className="px-[14px] pt-[18px] pb-[13px]">
          <TrekMark className="h-6 w-auto text-m-ink" aria-label="TREK Places API" />
          <p className="mt-[9px] text-[0.8125rem] leading-relaxed text-m-muted">{t('admin.trekApi.tagline')}</p>
          <ul className="mt-3 grid grid-cols-1 gap-[7px]">
            {facts.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-2 font-geist text-[0.6875rem] text-m-muted">
                <Icon size={13} strokeWidth={2} className="flex-none text-m-faint" aria-hidden />
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* A button rather than <details>: the phone shell styles its own
            disclosures and Safari draws a marker on the summary that no reset
            reaches reliably. */}
        <button
          type="button"
          onClick={() => setOpen(v => !v)}
          aria-expanded={open}
          className="flex w-full items-center gap-2 border-t border-[color:var(--m-rowbr)] px-[14px] py-[10px] text-left"
        >
          <ChevronRight
            size={15}
            strokeWidth={2.2}
            className={`flex-none text-m-faint transition-transform ${open ? 'rotate-90' : ''}`}
            aria-hidden
          />
          <span className="text-[0.8125rem] font-semibold text-m-muted">{t('admin.trekApi.more')}</span>
        </button>

        {open && (
          <div className="space-y-[9px] px-[14px] pt-1 pb-[14px]">
            <ChipGroup
              icon={<Check size={13} strokeWidth={2.4} className="text-[color:var(--m-st-confirmed)]" aria-hidden />}
              label={t('admin.trekApi.included')}
              items={fields}
              note={t('admin.trekApi.includedNote')}
            />
            <ChipGroup
              icon={<X size={13} strokeWidth={2.4} className="text-m-faint" aria-hidden />}
              label={t('admin.trekApi.notIncluded')}
              items={[t('admin.trekApi.notRatings'), t('admin.trekApi.notPhotos')]}
              note={t('admin.trekApi.notIncludedNote')}
              dashed
            />
            <ChipGroup
              icon={<Library size={13} strokeWidth={2.2} className="text-m-faint" aria-hidden />}
              label={t('admin.trekApi.sourcesLabel')}
              items={SOURCES}
              note={t('admin.trekApi.sourcesNote')}
            />
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * A folded group of settings that belong to the block above them.
 *
 * Closed to begin with, and on purpose: the four Google switches are set once
 * when a key is pasted and never touched again, and open they were longer than
 * everything else on the card put together.
 */
export function MBlockDisclosure({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="-mx-[14px] -mb-[13px] mt-1 border-t border-[color:var(--m-rowbr)]">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-[14px] py-[10px] text-left"
      >
        <ChevronRight
          size={15}
          strokeWidth={2.2}
          className={`flex-none text-m-faint transition-transform ${open ? 'rotate-90' : ''}`}
          aria-hidden
        />
        <span className="text-[0.8125rem] font-semibold text-m-muted">{label}</span>
      </button>
      {open && <div className="px-[14px] pb-[10px]">{children}</div>}
    </div>
  )
}

/**
 * One paid provider, in the same shape as the TREK block above it, so the card
 * reads as a list of comparable options rather than one highlighted thing with
 * loose fields underneath.
 */
export function MProviderBlock({
  title,
  badge,
  tone = 'muted',
  children,
}: {
  title: string
  badge?: string
  /** `caution` marks a provider that costs something other than money. Never `danger`: using a key is a legitimate choice. */
  tone?: 'muted' | 'caution'
  children: React.ReactNode
}) {
  return (
    // The ribbon rides on the top border, so the block needs room above it or the
    // capitals touch whatever ends the block before.
    <div className={`relative ${badge ? 'mt-[18px]' : 'mt-3'}`}>
      {badge && (
        <span
          className={`pointer-events-none absolute -top-2 left-3 z-10 rounded-md border px-2 py-[1px] font-geist text-[0.5625rem] font-bold tracking-[.12em] uppercase ${
            tone === 'caution'
              ? 'border-[color:var(--m-st-pending)] bg-[color:color-mix(in_srgb,var(--m-st-pending)_16%,var(--m-sheetop))] text-[color:var(--m-st-pending)]'
              : 'border-[color:var(--m-rowbr)] bg-[color:var(--m-sheetop)] text-m-faint'
          }`}
        >
          {badge}
        </span>
      )}
      <div className="overflow-hidden rounded-[16px] border border-[color:var(--m-rowbr)] bg-[color:var(--m-ic)]">
        <div className="px-[14px] pt-[18px] pb-[13px]">
          <p className="text-[0.8125rem] font-semibold text-m-ink">{title}</p>
          <div className="mt-[10px] space-y-3">{children}</div>
        </div>
      </div>
    </div>
  )
}
