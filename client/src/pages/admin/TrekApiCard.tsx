import React from 'react'
import TrekMark from '../../components/shared/TrekMark'
import { fs } from '../../components/shared/DialogShell'
import { StatusPill } from '../../components/Settings/settingsKit'
import ServiceIdentityPanel from '../../components/Admin/ServiceIdentityPanel'
import PlaceContribPanel from '../../components/Admin/PlaceContribPanel'
import type { TranslationFn } from '../../types'
import { TREK_API_SOURCES as SOURCES, trekApiFacts } from '../../components/Admin/trekApiModel'

interface TrekApiCardProps {
  t: TranslationFn
  managed?: boolean
}

/**
 * The TREK API, above the Google key because it is the alternative to it: the
 * place index, the address search and the routing an installation gets from
 * the TREK services, each listed with what it answers.
 *
 * Given real weight on the page on purpose: it is what makes a key optional
 * instead of expected. The weight comes from the mark, one line of type and an
 * accent ring — not from a tinted panel, which is what the weather block used
 * to do and what made it shout over the settings it sat next to.
 *
 * Everything a reader can check is a measured number, not a claim: 73.6 million
 * is the row count of the current index, "no queries logged" is enforced in
 * three places on the server rather than promised here, and the allowance below
 * the facts is what the service itself reports for this installation.
 */
export default function TrekApiCard({ t, managed = false }: TrekApiCardProps): React.ReactElement {
  const facts = trekApiFacts(t)

  return (
    <section className="overflow-hidden rounded-[12px] border bg-surface-card"
      style={{ borderColor: 'color-mix(in srgb, var(--accent) 40%, transparent)' }}>
      <div className="flex flex-col gap-3 p-3.5">
        {/* The recommendation, moved here from the Google field. It is the whole
            point of the block: a key should be the exception, not the default.
            A pill beside the mark rather than a banner, so it does not shout
            over the settings around it. */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <TrekMark className="h-7 w-auto text-content" aria-label="TREK API" />
          <StatusPill tone="accent">{t('admin.trekApi.badgeDefault')}</StatusPill>
        </div>

        <p className="m-0 leading-relaxed text-content-secondary" style={fs(13, 'body')}>
          {t('admin.trekApi.tagline')}
        </p>

        {/* What it offers as compact badges that wrap, not a list of rows. */}
        <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
          {facts.map(({ Icon, text }) => (
            <li key={text} className="inline-flex items-center gap-1.5 rounded-full border border-edge-faint bg-surface-secondary px-2.5 py-1 text-content-secondary" style={fs(11.5)}>
              <Icon size={12} strokeWidth={2} aria-hidden="true" className="flex-none text-content-muted" />
              {text}
            </li>
          ))}
        </ul>

        <ServiceIdentityPanel managed={managed} />
        <PlaceContribPanel />
      </div>

      {/* The sources, named because their licences ask for it, in one line under
          the card instead of a list of every field the service answers. */}
      <p className="m-0 border-t border-edge-faint px-3.5 py-2.5 leading-snug text-content-faint" style={fs(11.5)}>
        <span className="font-semibold text-content-muted">{t('admin.trekApi.sourcesLabel')}:</span> {SOURCES.join(', ')}
      </p>
    </section>
  )
}
