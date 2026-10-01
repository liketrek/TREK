import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import en from '@trek/shared/i18n/en'
import { headingSlug } from './headingSlug'
import { dashboardGuides } from './contexts/dashboard'
import { vacayGuides } from './contexts/vacay'
import { atlasGuides } from './contexts/atlas'
import { collectionsGuides } from './contexts/collections'
import { journeyGuides, journalGuides, studioGuides } from './contexts/journey'
import { settingsGuides } from './contexts/settings'
import { adminGuides } from './contexts/admin'
import { tripGuides } from './contexts/trip'
import { tripPlacesGuides } from './contexts/tripPlaces'
import { tripDaysGuides } from './contexts/tripDays'
import { tripRoadtripGuides } from './contexts/tripRoadtrip'
import { tripCollabGuides } from './contexts/tripCollab'
import { tripFilesGuides } from './contexts/tripFiles'
import { tripCostsGuides } from './contexts/tripCosts'
import { tripListsGuides } from './contexts/tripLists'
import { tripBookingsGuides } from './contexts/tripBookings'
import { tripTransportsGuides } from './contexts/tripTransports'
import { tripMapGuides } from './contexts/tripMap'
import { tripDayDetailGuides } from './contexts/tripDayDetail'
import { tripPlaceGuides } from './contexts/tripPlace'
import {
  HELP_CONTEXTS, HELP_GUIDES, getHelpContext, getHelpGuide, guidesFor, allHelpGuides,
  ctxKey, ctxBulletKey, guideKey, guideStepKey, guideTipKey, helpMedia, docsRoute,
  topLevelHelpContexts, childHelpContexts, helpContextTrail,
} from './registry'

/**
 * The registry is data; these tests are the gate that keeps it honest: every
 * registered screen and guide has its words in the canonical locale, its
 * pictures on disk, and its cross-references pointing at things that exist.
 * A guide that is registered but not written (or not recorded) fails here
 * rather than rendering a raw key or a broken image to a reader.
 */

const strings = en as Record<string, unknown>
const has = (key: string) => typeof strings[key] === 'string' && (strings[key] as string).length > 0
const MEDIA_ROOT = path.join(process.cwd(), 'public', 'help-media')
const onDisk = (url: string) => existsSync(path.join(MEDIA_ROOT, url.replace(/^\/help-media\//, '')))

describe('help registry: structure', () => {
  it('registers the dashboard with its guides', () => {
    const ctx = getHelpContext('dashboard')
    expect(ctx).not.toBeNull()
    expect(ctx!.guides.length).toBeGreaterThan(0)
    expect(guidesFor(ctx!).map(g => g.id)).toEqual(ctx!.guides)
  })

  it('answers null for an unknown or missing id', () => {
    expect(getHelpContext('no-such-screen')).toBeNull()
    expect(getHelpContext(null)).toBeNull()
    expect(getHelpContext(undefined)).toBeNull()
    expect(getHelpGuide('no-such-guide')).toBeNull()
    expect(getHelpGuide(null)).toBeNull()
  })

  it('lists every guide of every context, and nothing that belongs nowhere', () => {
    const listed = new Set([...HELP_CONTEXTS.values()].flatMap(c => c.guides))
    for (const guide of allHelpGuides()) {
      expect(listed.has(guide.id), `guide "${guide.id}" is not listed by any context`).toBe(true)
      expect(HELP_CONTEXTS.has(guide.context), `guide "${guide.id}" names unknown context "${guide.context}"`).toBe(true)
      expect(HELP_CONTEXTS.get(guide.context)!.guides).toContain(guide.id)
    }
    for (const ctx of HELP_CONTEXTS.values()) {
      for (const id of ctx.guides) expect(HELP_GUIDES.has(id), `context "${ctx.id}" lists unknown guide "${id}"`).toBe(true)
    }
  })

  it('hangs sub-screens under screens that exist, never under themselves', () => {
    for (const ctx of HELP_CONTEXTS.values()) {
      if (!ctx.parent) continue
      expect(HELP_CONTEXTS.has(ctx.parent), `context "${ctx.id}" names unknown parent "${ctx.parent}"`).toBe(true)
      expect(ctx.parent).not.toBe(ctx.id)
      expect(helpContextTrail(ctx).map(c => c.id)).toEqual([ctx.parent, ctx.id])
    }
    expect(topLevelHelpContexts().every(c => !c.parent)).toBe(true)
    expect(childHelpContexts('journey').map(c => c.id)).toEqual(['journey-detail', 'journey-studio'])
  })

  it('only relates guides to guides that exist', () => {
    for (const guide of allHelpGuides()) {
      for (const rel of guide.related ?? []) {
        expect(HELP_GUIDES.has(rel), `guide "${guide.id}" relates to unknown "${rel}"`).toBe(true)
        expect(rel).not.toBe(guide.id)
      }
    }
  })

  it('never registers two guides under one id (the pictures live by id)', () => {
    // Every context file's list, before the registry folds them into a map.
    const lists = [
      dashboardGuides, vacayGuides, atlasGuides, collectionsGuides, journeyGuides, journalGuides, studioGuides,
      settingsGuides, adminGuides, tripGuides, tripDaysGuides, tripPlacesGuides,
      tripRoadtripGuides,
      tripCollabGuides,
      tripFilesGuides,
      tripCostsGuides,
      tripListsGuides,
      tripBookingsGuides,
      tripTransportsGuides,
      tripMapGuides,
      tripDayDetailGuides,
      tripPlaceGuides,
    ]
    const ids = lists.flat().map(g => g.id)
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i)
    expect(dupes).toEqual([])
    expect(allHelpGuides()).toHaveLength(ids.length)
  })

  it('has sane counts on every guide', () => {
    for (const guide of allHelpGuides()) {
      expect(guide.steps, guide.id).toBeGreaterThan(0)
      expect(guide.tips, guide.id).toBeGreaterThanOrEqual(0)
      expect(['quick', 'guide', 'tour']).toContain(guide.size)
    }
  })
})

describe('help registry: every word exists in the canonical locale', () => {
  it('contexts', () => {
    for (const ctx of HELP_CONTEXTS.values()) {
      expect(has(ctxKey(ctx.id, 'title')), ctxKey(ctx.id, 'title')).toBe(true)
      expect(has(ctxKey(ctx.id, 'summary')), ctxKey(ctx.id, 'summary')).toBe(true)
      for (let n = 1; n <= ctx.bullets; n++) expect(has(ctxBulletKey(ctx.id, n)), ctxBulletKey(ctx.id, n)).toBe(true)
      expect(has(ctxBulletKey(ctx.id, ctx.bullets + 1)), 'no bullet beyond the declared count').toBe(false)
    }
  })

  it('guides', () => {
    for (const guide of allHelpGuides()) {
      for (const part of ['title', 'goal', 'result'] as const) expect(has(guideKey(guide.id, part)), guideKey(guide.id, part)).toBe(true)
      for (let n = 1; n <= guide.steps; n++) expect(has(guideStepKey(guide.id, n)), guideStepKey(guide.id, n)).toBe(true)
      expect(has(guideStepKey(guide.id, guide.steps + 1)), `${guide.id}: no step beyond the declared count`).toBe(false)
      for (let n = 1; n <= guide.tips; n++) expect(has(guideTipKey(guide.id, n)), guideTipKey(guide.id, n)).toBe(true)
      expect(has(guideTipKey(guide.id, guide.tips + 1)), `${guide.id}: no tip beyond the declared count`).toBe(false)
      expect(has(guideKey(guide.id, 'link')), `${guide.id}: link label iff link`).toBe(Boolean(guide.link))
    }
  })
})

describe('help registry: every promised picture is on disk', () => {
  it('context heroes', () => {
    for (const ctx of HELP_CONTEXTS.values()) {
      if (ctx.hero) expect(onDisk(helpMedia.hero(ctx.id)), helpMedia.hero(ctx.id)).toBe(true)
    }
  })

  it('guide steps and results', () => {
    for (const guide of allHelpGuides()) {
      if (guide.media.steps) {
        for (let n = 1; n <= guide.steps; n++) expect(onDisk(helpMedia.step(guide.id, n)), helpMedia.step(guide.id, n)).toBe(true)
      }
      if (guide.media.result) expect(onDisk(helpMedia.result(guide.id)), helpMedia.result(guide.id)).toBe(true)
    }
  })
})

describe('help registry: every doc link resolves in the wiki', () => {
  // The reader opens a doc link at /help/<slug>#<anchor>, which HelpPage renders
  // from wiki/<slug>.md and anchors with headingSlug. A slug or an anchor that is
  // not there gives a 404 or a jump to nowhere, and nothing else in this file
  // notices: four of them had already shipped when this was written.
  const WIKI = path.join(process.cwd(), '..', 'wiki')
  const anchorsOf = (slug: string): Set<string> =>
    new Set(
      readFileSync(path.join(WIKI, `${slug}.md`), 'utf8')
        .split('\n')
        .map(line => /^#{1,6}\s+(.*?)\s*$/.exec(line)?.[1])
        .filter((h): h is string => h !== undefined)
        .map(h =>
          headingSlug(
            h
              .replace(/`([^`]*)`/g, '$1')
              .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
              .replace(/\*\*([^*]*)\*\*/g, '$1'),
          ),
        ),
    )

  const pages = new Set(readdirSync(WIKI).filter(f => f.endsWith('.md')).map(f => f.slice(0, -3)))
  const links: Array<[string, { slug: string; anchor?: string }]> = [
    ...[...HELP_CONTEXTS.values()].flatMap(c => c.docs.map(d => [`context "${c.id}"`, d] as [string, typeof d])),
    ...allHelpGuides().flatMap(g => (g.docs ? [[`guide "${g.id}"`, g.docs] as [string, typeof g.docs]] : [])),
  ].filter((entry): entry is [string, { slug: string; anchor?: string }] => Boolean(entry[1]))

  it('names a wiki page that exists', () => {
    for (const [who, link] of links) expect(pages.has(link.slug), `${who} links to missing page "${link.slug}"`).toBe(true)
  })

  it('names a heading that exists on that page', () => {
    for (const [who, link] of links) {
      if (!link.anchor) continue
      expect(anchorsOf(link.slug).has(link.anchor), `${who}: "${link.slug}" has no heading "#${link.anchor}"`).toBe(true)
    }
  })
})

describe('help registry: helpers', () => {
  it('builds media paths under /help-media as webp', () => {
    expect(helpMedia.hero('dashboard')).toBe('/help-media/ctx/dashboard.webp')
    expect(helpMedia.step('create-trip', 3)).toBe('/help-media/create-trip/step-3.webp')
    expect(helpMedia.result('create-trip')).toBe('/help-media/create-trip/result.webp')
  })

  it('builds wiki routes with and without an anchor', () => {
    expect(docsRoute({ slug: 'Creating-a-Trip' })).toBe('/help/Creating-a-Trip')
    expect(docsRoute({ slug: 'Creating-a-Trip', anchor: 'fields' })).toBe('/help/Creating-a-Trip#fields')
  })
})
