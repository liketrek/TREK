// FE-COMP-PLUGINCAPS-001 to FE-COMP-PLUGINCAPS-013
import { describe, it, expect } from 'vitest'
import { ArrowRight, Database, LayoutDashboard, MapPinned, Signpost, Wallet, Waves } from 'lucide-react'
import { POI_CATEGORY_PERMISSION, declaredPoiCategories, deriveCaps } from './pluginCaps'

const t = (key: string) => `t:${key}`
const labels = (perms: string[], caps = {}) => deriveCaps(perms, caps, t).map(c => c.label)

/**
 * The ONE place both admin shells turn a plugin's manifest into chips. The desktop
 * panel and the phone panel only draw what this returns.
 */
describe('deriveCaps', () => {
  it('FE-COMP-PLUGINCAPS-001: data grants, then the widget, then hooks, then hosts, in that order', () => {
    const caps = deriveCaps(
      ['http:outbound:api.acme.io', 'hook:search-provider', 'db:read:trips', 'mcp:tools'],
      { widget: { slot: 'hero' } },
      t,
    )
    expect(caps.map(c => c.label)).toEqual([
      't:admin.plugins.cap.readsTrips',
      't:admin.plugins.cap.heroWidget',
      't:admin.plugins.cap.mcpTools',
      't:admin.plugins.cap.search',
      'api.acme.io',
    ])
    expect(caps[0].icon).toBe(Database)
    expect(caps[1].icon).toBe(LayoutDashboard)
    expect(caps[4]).toEqual({ icon: ArrowRight, label: 'api.acme.io', net: true })
    expect(caps.slice(0, 4).every(c => !c.net)).toBe(true)
  })

  it('FE-COMP-PLUGINCAPS-002: every known grant has its own chip', () => {
    expect(labels([
      'db:read:trips', 'db:read:users', 'db:write:costs', 'db:read:packing', 'db:read:files', 'db:write:places',
      'db:write:days', 'db:write:itinerary', 'db:write:trips', 'db:meta', 'mcp:tools', 'ws:broadcast:trip',
      'hook:photo-provider', 'hook:calendar-source', 'hook:place-detail-provider', 'hook:search-provider',
      'hook:poi-category-provider', 'hook:trip-warning-provider', 'hook:map-layer-provider', 'hook:route-provider',
      'hook:day-schedule-provider', 'hook:day-tint-provider', 'geolocation:read', 'hook:notification-channel',
      'events:subscribe',
    ])).toEqual([
      'readsTrips', 'readsUsers', 'writesCosts', 'readsPacking', 'readsFiles', 'writesPlaces', 'writesDays',
      'writesItinerary', 'writesTrips', 'metadata', 'mcpTools', 'realtime', 'photos', 'calendar', 'placeDetails',
      'search', 'poiCategories', 'warnings', 'mapLayers', 'routing', 'daySchedule', 'dayTint', 'geolocation',
      'notificationChannel', 'events',
    ].map(k => `t:admin.plugins.cap.${k}`))
  })

  it('FE-COMP-PLUGINCAPS-003: the POI category grant gets the map-categories chip (#1781)', () => {
    const [chip] = deriveCaps([POI_CATEGORY_PERMISSION], {}, t)
    expect(chip).toEqual({ icon: MapPinned, label: 't:admin.plugins.cap.poiCategories' })
    expect(labels(['hook:search-provider'])).not.toContain('t:admin.plugins.cap.poiCategories')
  })

  it('FE-COMP-PLUGINCAPS-004: writing costs hides the read-only costs chip', () => {
    expect(labels(['db:read:costs'])).toEqual(['t:admin.plugins.cap.readsCosts'])
    expect(labels(['db:read:costs', 'db:write:costs'])).toEqual(['t:admin.plugins.cap.writesCosts'])
    expect(deriveCaps(['db:read:costs'], {}, t)[0].icon).toBe(Wallet)
  })

  it('FE-COMP-PLUGINCAPS-005: each widget slot has its own wording, and anything else is a plain widget', () => {
    const slot = (s?: string) => labels([], { widget: s === undefined ? {} : { slot: s } })
    expect(slot('hero')).toEqual(['t:admin.plugins.cap.heroWidget'])
    expect(slot('place-detail')).toEqual(['t:admin.plugins.cap.placeSlot'])
    expect(slot('day-detail')).toEqual(['t:admin.plugins.cap.daySlot'])
    expect(slot('reservation-detail')).toEqual(['t:admin.plugins.cap.reservationSlot'])
    expect(slot()).toEqual(['t:admin.plugins.cap.widget'])
    // Names of Object.prototype members are unknown slots, not lookups into the prototype.
    expect(slot('constructor')).toEqual(['t:admin.plugins.cap.widget'])
    expect(slot('toString')).toEqual(['t:admin.plugins.cap.widget'])
  })

  it('FE-COMP-PLUGINCAPS-006: replacing planner tabs is chipped, an empty list is not', () => {
    expect(labels([], { tripPage: { replaces: ['collab'] } })).toEqual(['t:admin.plugins.cap.replacesTabs'])
    expect(labels([], { tripPage: { replaces: [] } })).toEqual([])
    expect(labels([], { tripPage: {} })).toEqual([])
  })

  it('FE-COMP-PLUGINCAPS-007: every outbound host is its own network chip, a bare prefix is none', () => {
    const caps = deriveCaps(['http:outbound:a.example', 'http:outbound:', 'http:outbound:b.example'], {}, t)
    expect(caps).toEqual([
      { icon: ArrowRight, label: 'a.example', net: true },
      { icon: ArrowRight, label: 'b.example', net: true },
    ])
  })

  it('FE-COMP-PLUGINCAPS-008: a plugin that asks for nothing gets no chips', () => {
    expect(deriveCaps([], {}, t)).toEqual([])
    expect(labels(['db:own', 'x:unknown'])).toEqual([])
  })
})

describe('declaredPoiCategories', () => {
  const trailheads = { id: 'trailheads', label: 'Trailheads', labels: { de: 'Wanderparkplätze' }, icon: 'Signpost', color: '#2f855a' }
  const swimming = { id: 'swimming', label: 'Swimming spots', icon: 'Waves', color: '#0369a1' }

  it('FE-COMP-PLUGINCAPS-009: the declared categories in declaration order, with icon and colour resolved', () => {
    expect(declaredPoiCategories('trail-finder', [POI_CATEGORY_PERMISSION], [trailheads, swimming], 'en')).toEqual([
      { id: 'trailheads', label: 'Trailheads', Icon: Signpost, color: '#2f855a' },
      { id: 'swimming', label: 'Swimming spots', Icon: Waves, color: '#0369a1' },
    ])
  })

  it('FE-COMP-PLUGINCAPS-010: the label follows the admin language and falls back to the default', () => {
    const [de] = declaredPoiCategories('trail-finder', [POI_CATEGORY_PERMISSION], [trailheads], 'de')
    expect(de.label).toBe('Wanderparkplätze')
    const [fr] = declaredPoiCategories('trail-finder', [POI_CATEGORY_PERMISSION], [trailheads], 'fr')
    expect(fr.label).toBe('Trailheads')
    // An inherited name is not a language the plugin wrote a label for.
    const [inherited] = declaredPoiCategories('trail-finder', [POI_CATEGORY_PERMISSION], [trailheads], 'toString')
    expect(inherited.label).toBe('Trailheads')
  })

  it('FE-COMP-PLUGINCAPS-011: nothing without the grant, because the feed would never serve them', () => {
    expect(declaredPoiCategories('trail-finder', ['hook:search-provider'], [trailheads], 'en')).toEqual([])
    expect(declaredPoiCategories('trail-finder', [], [trailheads], 'en')).toEqual([])
  })

  it('FE-COMP-PLUGINCAPS-012: entries the schema refuses are dropped, never drawn', () => {
    const declared = declaredPoiCategories('trail-finder', [POI_CATEGORY_PERMISSION], [
      { ...swimming, id: 'css', color: '#2f855a;background:url(https://x)' },
      { ...swimming, id: 'skull', icon: 'Skull' },
      trailheads,
      { ...trailheads, label: 'A repeated id' },
    ], 'en')
    expect(declared).toEqual([{ id: 'trailheads', label: 'Trailheads', Icon: Signpost, color: '#2f855a' }])
    const odd = declaredPoiCategories('trail-finder', [POI_CATEGORY_PERMISSION], [{ ...swimming, id: 'Bad Id' }, 'not an object', swimming], 'en')
    expect(odd.map(c => c.id)).toEqual(['swimming'])
    expect(declaredPoiCategories('trail-finder', [POI_CATEGORY_PERMISSION], { trailheads }, 'en')).toEqual([])
    expect(declaredPoiCategories('trail-finder', [POI_CATEGORY_PERMISSION], undefined, 'en')).toEqual([])
    // A plugin id no pill key could carry takes all of its categories with it.
    expect(declaredPoiCategories('Not A Plugin', [POI_CATEGORY_PERMISSION], [trailheads], 'en')).toEqual([])
  })

  it('FE-COMP-PLUGINCAPS-013: no more than the cap, as the explore pill would show', () => {
    const five = ['a1', 'b1', 'c1', 'd1', 'e1'].map(id => ({ ...swimming, id }))
    const declared = declaredPoiCategories('trail-finder', [POI_CATEGORY_PERMISSION], five, 'en')
    expect(declared.map(c => c.id)).toEqual(['a1', 'b1', 'c1', 'd1'])
  })
})
