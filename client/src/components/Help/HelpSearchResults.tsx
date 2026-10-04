import React, { useMemo } from 'react'
import { Loader2, SearchX } from 'lucide-react'
import { useTranslation } from '../../i18n'
import { useHelpStore } from '../../store/helpStore'
import { allHelpGuides, guideKey, guideStepKey, guideTipKey, ctxKey } from '../../help/registry'
import type { HelpGuide } from '../../help/types'
import { GuideCard, SectionLabel } from './HelpHome'
import HelpDocLink from './HelpDocLink'

/** Guides shown for a query, at most. The docs list is capped by the server. */
const MAX_GUIDES = 8

/** Words that carry no meaning on their own; "how do I create a trip" is "create trip". */
const STOP = new Set(['a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'how', 'do', 'i', 'my', 'is', 'it', 'with'])

/** Lower-case, accents stripped, so "Fjorde" finds "fjorde" and "cafe" finds "Café". */
const fold = (text: string): string => text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** The query as the words that matter, or all of them when only stop words were typed. */
function queryWords(query: string): string[] {
  const words = fold(query).split(/[^\p{L}\p{N}]+/u).filter(Boolean)
  const meaningful = words.filter(w => !STOP.has(w))
  return meaningful.length > 0 ? meaningful : words
}

/**
 * Score a guide against the query using the words the reader sees, in their
 * language: title, goal, the screen it belongs to, steps, tips and result.
 * Every word of the query has to occur somewhere; a word in the title counts
 * most, and a title that holds all of them ranks first.
 */
function scoreGuide(guide: HelpGuide, words: string[], t: (key: string) => string): number {
  if (words.length === 0) return 0
  const fields: { text: string; weight: number }[] = [
    { text: fold(t(guideKey(guide.id, 'title'))), weight: 6 },
    { text: fold(t(guideKey(guide.id, 'goal'))), weight: 3 },
    { text: fold(t(ctxKey(guide.context, 'title'))), weight: 2 },
    { text: fold(t(guideKey(guide.id, 'result'))), weight: 1 },
  ]
  for (let n = 1; n <= guide.steps; n++) fields.push({ text: fold(t(guideStepKey(guide.id, n))), weight: 1 })
  for (let n = 1; n <= guide.tips; n++) fields.push({ text: fold(t(guideTipKey(guide.id, n))), weight: 1 })
  let score = 0
  for (const word of words) {
    let best = 0
    for (const f of fields) {
      if (!f.text.includes(word)) continue
      // A whole word beats a fragment: "trip" in "trips" is fine, "rip" in "trip" is not much.
      const whole = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(word)}([^\\p{L}\\p{N}]|$)`, 'u').test(f.text)
      best = Math.max(best, whole ? f.weight * 2 : f.weight)
    }
    if (best === 0) return 0
    score += best
  }
  if (words.every(w => fields[0].text.includes(w))) score += 10
  return score
}

/** Search across every registered guide and the docs; both lists live here. */
export default function HelpSearchResults(): React.ReactElement {
  const { t } = useTranslation()
  const query = useHelpStore(s => s.query)
  const status = useHelpStore(s => s.searchStatus)
  const docHits = useHelpStore(s => s.docHits)
  const q = query.trim()

  const guides = useMemo(() => {
    const words = queryWords(q)
    return allHelpGuides()
      .map(g => ({ g, score: scoreGuide(g, words, t) }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_GUIDES)
      .map(x => x.g)
  }, [q, t])

  const nothing = guides.length === 0 && status === 'done' && docHits.length === 0

  return (
    <div className="trek-help-view flex flex-col gap-8">
      <h1 className="text-title font-bold text-content leading-tight">{query.trim()}</h1>
      {guides.length > 0 && (
        <section className="flex flex-col gap-2">
          <SectionLabel>{t('help.center.searchGuides')}</SectionLabel>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {guides.map(g => (
              <li key={g.id}>
                <GuideCard guide={g} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <SectionLabel>{t('help.center.searchDocs')}</SectionLabel>
          {status === 'loading' && <Loader2 className="w-3.5 h-3.5 animate-spin text-content-faint" />}
        </div>
        {status === 'error' && <p className="text-body text-content-muted">{t('help.center.searchError')}</p>}
        {docHits.length > 0 && (
          <ul className="flex flex-col gap-1">
            {docHits.map(hit => (
              <li key={`${hit.slug}#${hit.anchor ?? ''}`}>
                <HelpDocLink
                  to={`/help/${hit.slug}${hit.anchor ? `#${hit.anchor}` : ''}`}
                  title={hit.heading ? `${hit.title} · ${hit.heading}` : hit.title}
                  subtitle={hit.snippet}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      {nothing && (
        <div className="flex flex-col items-center text-center gap-2 py-10">
          <SearchX className="w-6 h-6 text-content-faint" />
          <p className="text-body text-content-muted">{t('help.center.searchEmpty', { query: query.trim() })}</p>
        </div>
      )}
    </div>
  )
}
