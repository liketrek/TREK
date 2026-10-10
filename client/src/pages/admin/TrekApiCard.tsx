import React from 'react'
import { Check, Library, X } from 'lucide-react'
import TrekMark from '../../components/shared/TrekMark'
import { fs } from '../../components/shared/DialogShell'
import { StatusPill } from '../../components/Settings/settingsKit'
import FoldSummary from './FoldSummary'
import type { TranslationFn } from '../../types'
import { TREK_API_SOURCES as SOURCES, trekApiFacts, trekApiFields } from '../../components/Admin/trekApiModel'

interface TrekApiCardProps {
  t: TranslationFn
}

/**
 * The TREK Places API, above the Google key because it is the alternative to it.
 *
 * Given real weight on the page on purpose: it is what makes a key optional
 * instead of expected. The weight comes from the mark, one line of type and an
 * accent ring — not from a tinted panel, which is what the weather block used
 * to do and what made it shout over the settings it sat next to.
 *
 * Everything a reader can check is a measured number, not a claim: 73.6 million
 * is the row count of the current index, and "no queries logged" is enforced in
 * three places on the server rather than promised here.
 */
const CHIP = 'rounded-full border px-2.5 py-[3px] font-medium'

/** One of the three lists under "more": an icon and a name, chips, a note. */
function FactGroup({ icon, title, note, children }: { icon: React.ReactNode; title: string; note: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 px-3.5 py-3">
      <p className="m-0 flex items-center gap-1.5 font-semibold text-content" style={fs(12.5, 'body')}>
        {icon}
        {title}
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" style={fs(11.5)}>{children}</ul>
      <p className="m-0 leading-normal text-content-faint" style={fs(11.5)}>{note}</p>
    </div>
  )
}

export default function TrekApiCard({ t }: TrekApiCardProps): React.ReactElement {
  const fields = trekApiFields(t)
  const facts = trekApiFacts(t)

  return (
    <div className="overflow-hidden rounded-[14px] border bg-surface-card shadow-sm"
      style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}>
      <div className="flex flex-col gap-3 px-3.5 pb-3.5 pt-3.5">
        {/* The recommendation, moved here from the Google field. It is the whole
            point of the block: a key should be the exception, not the default.
            A pill beside the mark rather than a banner, so it does not shout
            over the settings around it. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TrekMark className="h-7 w-auto text-content" aria-label="TREK Places API" />
          <StatusPill tone="accent">{t('admin.trekApi.badgeDefault')}</StatusPill>
        </div>

        <p className="m-0 leading-relaxed text-content-secondary" style={fs(13, 'body')}>
          {t('admin.trekApi.tagline')}
        </p>

        <ul className="m-0 grid list-none grid-cols-1 gap-x-4 gap-y-1.5 p-0 sm:grid-cols-2">
          {facts.map(({ Icon, text }) => (
            <li key={text} className="flex min-w-0 items-center gap-2 text-content-secondary" style={fs(12, 'body')}>
              <span className="grid h-6 w-6 flex-none place-items-center rounded-[8px] bg-surface-tertiary text-content-muted">
                <Icon size={13} strokeWidth={2} aria-hidden="true" />
              </span>
              <span className="min-w-0">{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <details className="group border-t border-edge-faint">
        <FoldSummary>
          <span className="font-medium text-content" style={fs(13, 'body')}>{t('admin.trekApi.more')}</span>
        </FoldSummary>
        <div className="divide-y divide-edge-faint border-t border-edge-faint bg-surface-secondary">
          {/* The fields as chips rather than a paragraph. A list of what you
              get is something you scan, not something you read, and a sentence
              forces the reader to parse commas to answer "is the phone number
              in there". */}
          <FactGroup
            icon={<Check size={14} strokeWidth={2.4} className="text-success" aria-hidden="true" />}
            title={t('admin.trekApi.included')}
            note={t('admin.trekApi.includedNote')}
          >
            {fields.map(field => (
              <li key={field} className={`${CHIP} border-edge-faint bg-surface-card text-content-secondary`}>{field}</li>
            ))}
          </FactGroup>

          {/* Named as plainly as what IS included. An admin who switches the
              source expecting ratings and a photograph of every restaurant
              should find that out here and not three weeks later. */}
          <FactGroup
            icon={<X size={14} strokeWidth={2.4} className="text-content-faint" aria-hidden="true" />}
            title={t('admin.trekApi.notIncluded')}
            note={t('admin.trekApi.notIncludedNote')}
          >
            {[t('admin.trekApi.notRatings'), t('admin.trekApi.notPhotos')].map(item => (
              <li key={item} className={`${CHIP} border-dashed border-edge text-content-faint`}>{item}</li>
            ))}
          </FactGroup>

          {/* Attribution, and not in the small print: the licences require the
              sources to be named, and naming them is also the answer to "where
              does this actually come from". */}
          <FactGroup
            icon={<Library size={14} strokeWidth={2} className="text-content-faint" aria-hidden="true" />}
            title={t('admin.trekApi.sourcesLabel')}
            note={t('admin.trekApi.sourcesNote')}
          >
            {SOURCES.map(source => (
              <li key={source} className={`${CHIP} border-edge-faint bg-surface-card text-content-secondary`}>{source}</li>
            ))}
          </FactGroup>
        </div>
      </details>
    </div>
  )
}
