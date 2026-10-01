/**
 * A synthetic Dawarich recording for the help-center pictures.
 *
 * TREK only ever reads from Dawarich, so the media run has to put a recording
 * there itself. This module makes one: a phone track that follows the seeded
 * demo trip through Tokyo and Kyoto, day by day, plus five short trips in the
 * year before it so the Atlas has countries to offer. Everything is relative to
 * the day the pictures are taken, so it stays inside the trip's dates whenever
 * the run happens.
 *
 * The points go through Dawarich's own batch endpoint as GeoJSON features;
 * see `ensureDawarichFixtures` in fixtures.ts for the upload.
 */

export interface TrackFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: {
    timestamp: string
    horizontal_accuracy: number
    altitude: number
    speed: number
    device_id: string
  }
}

/** One place on a day: when the phone gets there (local time) and how long it stays. */
interface Waypoint {
  t: string
  lat: number
  lng: number
  stay?: number
}

interface DayPlan {
  offset: number
  utcOffset: number
  points: Waypoint[]
}

export const DAWARICH_DEVICE = 'trek-help-fixture'

const JST = 9

// Every place the trail visits. The trip's own places come first and match the
// seed's coordinates, so the dashed line ends exactly on the markers.
const P = {
  sensoji: [35.7148, 139.7967],
  nakamise: [35.7118, 139.7963],
  asakusaStation: [35.7109, 139.7975],
  toyosuStation: [35.6551, 139.7961],
  teamlab: [35.6486, 139.79],
  shinjukuStation: [35.6896, 139.7006],
  gracery: [35.6946, 139.7012],
  shibuya: [35.6595, 139.7005],
  harajuku: [35.6702, 139.7027],
  meiji: [35.6764, 139.6993],
  ueno: [35.7146, 139.7714],
  akihabara: [35.6984, 139.7731],
  ginza: [35.6717, 139.765],
  tsukiji: [35.6654, 139.7707],
  tokyoTower: [35.6586, 139.7454],
  roppongi: [35.6605, 139.7292],
  tokyoStation: [35.6812, 139.7671],
  shinYokohama: [35.5075, 139.6174],
  nagoya: [35.1709, 136.8815],
  kyotoStation: [34.9858, 135.7588],
  kanra: [34.9942, 135.7592],
  fushimi: [34.9671, 135.7727],
  arashiyama: [35.017, 135.6716],
  togetsukyo: [35.013, 135.6776],
  nishiki: [35.005, 135.7649],
  kiyomizu: [34.9949, 135.785],
  gion: [35.0037, 135.7752],
  yasaka: [35.0037, 135.7785],
  todaiji: [34.689, 135.8398],
  naraPark: [34.6851, 135.843],
  ginkakuji: [35.027, 135.7982],
  philosophersPath: [35.0227, 135.7948],
  nanzenji: [35.0114, 135.7939],
  heian: [35.0163, 135.7824],
} as const

type Place = readonly [number, number]

const at = (t: string, [lat, lng]: Place, stay?: number): Waypoint => ({ t, lat, lng, stay })

/** The trip itself: the last day is the picture day (offset 0), the first is nine days before. */
function japanDays(): DayPlan[] {
  const day = (offset: number, points: Waypoint[]): DayPlan => ({ offset, utcOffset: JST, points })
  return [
    day(-9, [
      at('08:40', P.gracery, 10),
      at('09:30', P.sensoji, 90),
      at('11:05', P.nakamise, 40),
      at('11:50', P.asakusaStation, 5),
      at('12:40', P.ginza, 70),
      at('13:50', P.toyosuStation, 5),
      at('14:00', P.teamlab, 120),
      at('16:10', P.toyosuStation, 5),
      at('17:00', P.shinjukuStation, 10),
      at('17:15', P.gracery, 60),
      at('19:00', P.shinjukuStation, 90),
      at('21:00', P.gracery, 30),
    ]),
    day(-8, [
      at('09:00', P.gracery, 10),
      at('09:40', P.shibuya, 45),
      at('10:40', P.harajuku, 30),
      at('11:20', P.meiji, 75),
      at('13:00', P.harajuku, 60),
      at('14:30', P.shibuya, 90),
      at('16:40', P.shinjukuStation, 10),
      at('17:00', P.gracery, 240),
    ]),
    day(-7, [
      at('09:10', P.gracery, 10),
      at('10:00', P.ueno, 120),
      at('12:30', P.akihabara, 100),
      at('14:40', P.ginza, 120),
      at('17:20', P.shinjukuStation, 10),
      at('17:40', P.gracery, 200),
    ]),
    day(-6, [
      at('08:30', P.gracery, 10),
      at('09:20', P.tsukiji, 90),
      at('11:30', P.tokyoTower, 80),
      at('13:30', P.roppongi, 150),
      at('16:40', P.shinjukuStation, 10),
      at('17:00', P.gracery, 240),
    ]),
    day(-5, [
      at('07:40', P.gracery, 10),
      at('08:15', P.tokyoStation, 15),
      at('08:48', P.shinYokohama, 1),
      at('10:05', P.nagoya, 1),
      at('10:45', P.kyotoStation, 20),
      at('11:20', P.kanra, 120),
      at('14:00', P.gion, 90),
      at('16:20', P.kanra, 30),
      at('17:00', P.fushimi, 150),
      at('20:00', P.kanra, 60),
    ]),
    day(-4, [
      at('08:30', P.kanra, 10),
      at('09:30', P.togetsukyo, 30),
      at('10:10', P.arashiyama, 60),
      at('11:20', P.togetsukyo, 40),
      at('12:30', P.nishiki, 90),
      at('14:20', P.gion, 60),
      at('15:40', P.kanra, 240),
    ]),
    day(-3, [
      at('09:00', P.kanra, 10),
      at('09:50', P.kiyomizu, 100),
      at('11:50', P.yasaka, 40),
      at('12:40', P.gion, 120),
      at('15:00', P.heian, 60),
      at('16:30', P.kanra, 240),
    ]),
    day(-2, [
      at('08:20', P.kanra, 10),
      at('08:45', P.kyotoStation, 15),
      at('09:45', P.naraPark, 60),
      at('11:00', P.todaiji, 90),
      at('12:40', P.naraPark, 120),
      at('15:30', P.kyotoStation, 10),
      at('16:00', P.kanra, 200),
    ]),
    day(-1, [
      at('09:00', P.kanra, 10),
      at('09:50', P.nanzenji, 60),
      at('11:00', P.philosophersPath, 45),
      at('11:50', P.ginkakuji, 60),
      at('13:20', P.nishiki, 90),
      at('15:20', P.kanra, 240),
    ]),
    day(0, [
      at('08:30', P.kanra, 30),
      at('09:30', P.gion, 60),
      at('11:00', P.nishiki, 60),
      at('12:30', P.kanra, 60),
      at('14:00', P.kyotoStation, 120),
    ]),
  ]
}

/**
 * Five short trips in the year before the pictures, in countries the Atlas does
 * not have yet: Portugal, Jordan, Czechia, South Korea and Taiwan. Jordan
 * dwells at Petra long enough for the wishlist rule (250 m, 20 minutes).
 */
function worldDays(): DayPlan[] {
  const day = (offset: number, utcOffset: number, points: Waypoint[]): DayPlan => ({ offset, utcOffset, points })
  return [
    // Portugal, spring
    day(-158, 1, [
      at('09:30', [38.7077, -9.1366], 60),
      at('11:00', [38.7114, -9.13], 120),
      at('14:00', [38.6979, -9.2065], 90),
      at('15:50', [38.6916, -9.216], 60),
      at('18:00', [38.7077, -9.1366], 120),
    ]),
    day(-157, 1, [
      at('10:00', [41.1407, -8.611], 90),
      at('12:00', [41.147, -8.6149], 60),
      at('13:30', [41.1403, -8.6094], 120),
      at('16:00', [41.1496, -8.6109], 120),
    ]),
    // Jordan, late winter
    day(-205, 3, [
      at('09:00', [31.9544, 35.9344], 90),
      at('11:00', [31.9539, 35.9106], 120),
      at('15:00', [31.717, 35.587], 150),
    ]),
    day(-204, 3, [
      at('08:30', [30.3285, 35.4444], 90),
      at('10:20', [30.3222, 35.4517], 120),
      at('13:00', [30.3285, 35.4444], 60),
      at('15:30', [29.576, 35.42], 180),
    ]),
    // Czechia, early summer
    day(-100, 2, [
      at('09:30', [50.0875, 14.4213], 90),
      at('11:15', [50.0865, 14.4114], 45),
      at('12:30', [50.0911, 14.4016], 150),
      at('16:00', [50.0645, 14.4183], 90),
    ]),
    day(-99, 2, [
      at('10:00', [50.0793, 14.4275], 120),
      at('13:00', [50.0865, 14.4114], 60),
      at('15:00', [50.0875, 14.4213], 120),
    ]),
    // South Korea and Taiwan, one journey last autumn
    day(-300, 9, [
      at('09:30', [37.5796, 126.977], 120),
      at('12:00', [37.5826, 126.9831], 90),
      at('14:30', [37.5636, 126.9856], 120),
      at('17:30', [37.5512, 126.9882], 90),
    ]),
    day(-299, 9, [
      at('10:00', [37.5563, 126.9236], 150),
      at('14:00', [37.5796, 126.977], 90),
    ]),
    day(-297, 8, [
      at('10:00', [25.0372, 121.4999], 60),
      at('11:30', [25.0421, 121.5074], 120),
      at('15:00', [25.0339, 121.5645], 120),
      at('18:30', [25.088, 121.5245], 120),
    ]),
    day(-296, 8, [
      at('10:30', [25.1096, 121.8446], 240),
      at('16:00', [25.0421, 121.5074], 120),
    ]),
  ]
}

/** Deterministic jitter, so two runs produce the same recording. */
function noise(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453
  return x - Math.floor(x)
}

function isoAt(dayIso: string, hhmm: string, utcOffset: number, plusSeconds = 0): string {
  const [h, m] = hhmm.split(':').map(Number)
  const local = Date.UTC(+dayIso.slice(0, 4), +dayIso.slice(5, 7) - 1, +dayIso.slice(8, 10), h, m)
  return new Date(local - utcOffset * 3600_000 + plusSeconds * 1000).toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

function shiftDay(baseDay: string, offset: number): string {
  const d = new Date(`${baseDay}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + offset)
  return d.toISOString().slice(0, 10)
}

function feature(lng: number, lat: number, timestamp: string, speed: number, seed: number): TrackFeature {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [+lng.toFixed(6), +lat.toFixed(6)] },
    properties: {
      timestamp,
      horizontal_accuracy: 4 + Math.round(noise(seed) * 8),
      altitude: 20 + Math.round(noise(seed + 1) * 30),
      speed: +speed.toFixed(2),
      device_id: DAWARICH_DEVICE,
    },
  }
}

/** Turns one day's waypoints into a track: a point a minute while moving, one every five while staying. */
function dayFeatures(dayIso: string, plan: DayPlan, seedBase: number): TrackFeature[] {
  const out: TrackFeature[] = []
  const pts = plan.points
  let seed = seedBase
  for (let i = 0; i < pts.length; i++) {
    const here = pts[i]
    const stay = here.stay ?? 0
    const arrive = minutes(here.t)
    for (let k = 0; k <= stay; k += 5) {
      seed++
      const wobble = 0.00012
      out.push(
        feature(
          here.lng + (noise(seed) - 0.5) * wobble,
          here.lat + (noise(seed + 7) - 0.5) * wobble,
          isoAt(dayIso, here.t, plan.utcOffset, k * 60),
          0,
          seed,
        ),
      )
    }
    const next = pts[i + 1]
    if (!next) break
    const leaveAt = arrive + stay
    const travel = minutes(next.t) - leaveAt
    if (travel <= 0) continue
    // Moving: straight line with a little sway, a point a minute. Long hops
    // (the Shinkansen) get thinned out so a day never exceeds Dawarich's page.
    const step = travel > 60 ? 2 : 1
    const km = Math.hypot((next.lat - here.lat) * 111, (next.lng - here.lng) * 91)
    const speed = (km * 1000) / (travel * 60)
    for (let m = step; m < travel; m += step) {
      seed++
      const f = m / travel
      const sway = Math.sin(f * Math.PI) * 0.0008 * (noise(seed) - 0.5)
      out.push(
        feature(
          here.lng + (next.lng - here.lng) * f + sway,
          here.lat + (next.lat - here.lat) * f + sway,
          isoAt(dayIso, here.t, plan.utcOffset, (stay + m) * 60),
          speed,
          seed,
        ),
      )
    }
  }
  return out
}

/** The whole recording for a picture day: the trip's ten days plus the year before. */
export function dawarichRecording(baseDay: string): { trip: TrackFeature[]; world: TrackFeature[] } {
  const build = (plans: DayPlan[], seedBase: number) =>
    plans.flatMap((plan, i) => dayFeatures(shiftDay(baseDay, plan.offset), plan, seedBase + i * 10_000))
  return { trip: build(japanDays(), 1), world: build(worldDays(), 500_000) }
}

/** The UTC window one part of the recording covers, for checking whether it is already there. */
export function recordingWindow(baseDay: string, part: 'trip' | 'world'): { from: string; to: string } {
  const plans = part === 'trip' ? japanDays() : worldDays()
  const offsets = plans.map(p => p.offset)
  return { from: shiftDay(baseDay, Math.min(...offsets) - 1), to: shiftDay(baseDay, Math.max(...offsets) + 1) }
}
