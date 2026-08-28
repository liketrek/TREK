/**
 * Pure road-trip arithmetic — no React, no network, no store. Everything here is a
 * function of the stops, the routed legs and the day's rules, so it can be unit tested
 * on its own and reused by the map, the rail and (later) the MCP tool.
 */

/** Seconds → "2 h 10 min" / "45 min", matching the wording of the map's route connectors. */
export function formatDurationShort(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const h = Math.floor(safe / 3600)
  const m = Math.round((safe % 3600) / 60)
  // 59.6 min must not print as "60 min"; carry it.
  if (m === 60) return `${h + 1} h`
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`
  return `${m} min`
}

/** "09:45" → 585. Anything that is not a wall-clock time returns null. */
export function parseClock(value: string | null | undefined): number | null {
  if (!value) return null
  const m = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

/** 585 → "09:45". Minutes past midnight beyond a day wrap around and report the carry. */
export function formatClock(minutes: number): string {
  const day = 24 * 60
  const wrapped = ((minutes % day) + day) % day
  const h = Math.floor(wrapped / 60)
  const m = Math.round(wrapped % 60)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export interface ScheduleStop {
  /** Wall-clock time the user pinned on this stop, if any. */
  anchor: string | null
  /** Planned time spent here, in minutes. */
  dwellMinutes: number | null
}

export interface ScheduleWarning {
  /** Index of the stop the finding belongs to. */
  index: number
  code: 'late' | 'overnight'
  /** Minutes the computed arrival misses the anchor by (code 'late'). */
  minutes?: number
}

export interface ScheduleEntry {
  /** Computed arrival, or the anchor where the user pinned one. */
  arrival: string | null
  departure: string | null
  /** True when the time was pinned by the user rather than derived. */
  anchored: boolean
  /** Days past the first stop, so a chain running past midnight stays readable. */
  dayOffset: number
}

export interface Schedule {
  entries: ScheduleEntry[]
  warnings: ScheduleWarning[]
}

/**
 * Walks the chain forward: arrival = previous departure + driving time, departure =
 * arrival + time spent at the stop. A stop the user pinned a time on does not move —
 * it restarts the cascade from its own time, which is what makes a ferry, a museum
 * ticket or a hotel check-in usable as a fixed point (Furkot solves it the same way).
 *
 * `legSeconds[i]` is the drive from stop i to stop i+1; a leg that never routed is
 * `undefined` and breaks the chain rather than inventing a duration.
 */
export function computeSchedule(stops: ScheduleStop[], legSeconds: (number | undefined)[]): Schedule {
  const entries: ScheduleEntry[] = []
  const warnings: ScheduleWarning[] = []
  // Minutes since the first stop's midnight, so a chain crossing midnight keeps counting.
  let cursor: number | null = null
  let dayOffset = 0

  for (let i = 0; i < stops.length; i++) {
    const stop = stops[i]
    const anchor = parseClock(stop.anchor)
    let arrival: number | null = cursor

    if (anchor !== null) {
      if (arrival !== null) {
        const anchorToday = anchor + dayOffset * 24 * 60
        // The pinned time is in the past relative to the drive: the plan does not fit.
        if (arrival > anchorToday + 1) {
          warnings.push({ index: i, code: 'late', minutes: Math.round(arrival - anchorToday) })
        }
        arrival = anchorToday
      } else {
        arrival = anchor
      }
    }

    if (arrival === null) {
      entries.push({ arrival: null, departure: null, anchored: false, dayOffset: 0 })
      continue
    }

    const offset = Math.floor(arrival / (24 * 60))
    if (offset > dayOffset) {
      dayOffset = offset
      warnings.push({ index: i, code: 'overnight' })
    }

    const dwell = stop.dwellMinutes ?? 0
    const departure = arrival + dwell
    entries.push({
      arrival: formatClock(arrival),
      departure: formatClock(departure),
      anchored: anchor !== null,
      dayOffset: offset,
    })

    const leg = legSeconds[i]
    cursor = leg === undefined ? null : departure + Math.round(leg / 60)
  }

  return { entries, warnings }
}

/**
 * Splits a day's stops into the stretches that can be asked for in one routing request:
 * consecutive stops whose leg shares a travel mode.
 *
 * The router returns a leg for every consecutive pair of the waypoints it is handed, so
 * a day travelled one way is a single request rather than one per leg — the difference
 * between a road trip appearing at once and crawling in over ten seconds. A day that
 * mixes walking and driving splits at the change, because one request carries one mode.
 */
export function splitIntoRuns<T>(stops: T[], modeOfLeg: (from: T, to: T) => string): { stops: T[]; mode: string }[] {
  const runs: { stops: T[]; mode: string }[] = []
  let current: T[] = []
  let currentMode: string | null = null

  for (let i = 0; i < stops.length - 1; i++) {
    const mode = modeOfLeg(stops[i], stops[i + 1])
    if (currentMode === null) {
      current = [stops[i], stops[i + 1]]
      currentMode = mode
    } else if (mode === currentMode) {
      current.push(stops[i + 1])
    } else {
      runs.push({ stops: current, mode: currentMode })
      current = [stops[i], stops[i + 1]]
      currentMode = mode
    }
  }
  if (currentMode !== null && current.length > 1) runs.push({ stops: current, mode: currentMode })
  return runs
}

/** Total driving seconds of the legs that actually routed. */
export function sumLegSeconds(legSeconds: (number | undefined)[]): number {
  return legSeconds.reduce<number>((sum, s) => sum + (s ?? 0), 0)
}
