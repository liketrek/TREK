import { getMergedItems, getTransportForDay, hidesOnMiddleDay } from '../../utils/dayMerge'
import { isDayInAccommodationRange } from '../../utils/dayOrder'
import { SharedDayCard } from './SharedDayCard'
import { SharedMap, type MapPlace } from './SharedMap'
import { SharedUnplannedCard } from './SharedUnplannedCard'
import { dayHasEntries, stopNumbers, unplannedPlaces } from './sharedTripModel'

interface Assignment {
  id: number
  order_index?: number | null
  accommodation_id?: number | null
  notes?: string | null
  place?: (MapPlace & { category_id?: number | null }) | null
}

interface SharedPlanViewProps {
  // The share payload is an open-ended snapshot, typed loosely at the hook.
  data: {
    days?: { id: number; day_number: number; title?: string | null; date?: string | null }[]
    assignments?: Record<string, Assignment[]>
    dayNotes?: Record<string, { id: number; text: string; time?: string | null; sort_order?: number | null }[]>
    places?: (MapPlace & { category_id?: number | null })[]
    reservations?: { id: number; type: string; title: string; day_id?: number | null; end_day_id?: number | null }[]
    accommodations?: { id: number; place_name?: string | null; start_day_id?: number | null; end_day_id?: number | null }[]
    categories?: { id: number; color?: string | null; icon?: string | null }[]
    cartoApiKey?: string | null
  }
  selectedDay: number | null
  onSelectDay: (id: number | null) => void
  onPickDayOnMap: (id: number | null) => void
  collapsedDays: ReadonlySet<number>
  onToggleDay: (id: number) => void
  /** The owner shared only travel and stays (#1712): empty days and the unplanned pool stay out. */
  travelOnly?: boolean
}

/**
 * The Plan tab: the days as the planner's cards on the left, the map beside
 * them and staying in view while they scroll. On a phone the map comes first
 * and the days follow under it.
 */
export function SharedPlanView({ data, selectedDay, onSelectDay, onPickDayOnMap, collapsedDays, onToggleDay, travelOnly = false }: SharedPlanViewProps) {
  const days = [...(data.days || [])].sort((a, b) => a.day_number - b.day_number)
  const assignments = data.assignments || {}

  // The stop a booked night wrote onto its check-in day heads that day since the
  // reseat, and the planner's numbers leave it out (the day list does too). So the
  // numbers and the day line are counted over the traveller's own stops, or the
  // hotel wore badge 1, every real stop read one higher than in the app, and the
  // line set off from where the day ends. Its pin stays on the day, unnumbered,
  // the way the planner keeps the hotel on the map.
  const stopsOf = (dayId: number) => (assignments[String(dayId)] || []).filter(a => a.accommodation_id == null)
  const dayAssignments = selectedDay
    ? [...(assignments[String(selectedDay)] || [])].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    : []
  const selectedNumbers = stopNumbers(selectedDay ? stopsOf(selectedDay) : [])
  // The places these assignments sit on, in their order, each drawn once.
  const located = (list: Assignment[]) => {
    const seen = new Set<number>()
    return list.map(a => a.place).filter((p): p is MapPlace => {
      if (!p?.lat || !p?.lng || seen.has(p.id)) return false
      seen.add(p.id)
      return true
    })
  }
  const mapPlaces = selectedDay ? located(dayAssignments) : (data.places || []).filter(p => p?.lat && p?.lng)
  const dayLine = located(dayAssignments.filter(a => a.accommodation_id == null))

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
      <div className="h-[340px] lg:sticky lg:top-[76px] lg:order-2 lg:h-[calc(100vh-96px)]">
        <SharedMap
          places={mapPlaces}
          line={dayLine}
          orderByPlace={selectedNumbers.byPlace}
          cartoApiKey={data.cartoApiKey}
          days={days}
          selectedDay={selectedDay}
          onSelectDay={onPickDayOnMap}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-3 lg:order-1">
        {days.map((day, index) => {
          // Without the booked nights: the day already shows each of them as its
          // own pill, and the stop a booking writes for the drive would be that
          // same hotel a second time. There is no road trip view on a shared link,
          // so the stop has nothing else to do here.
          const stops = stopsOf(day.id)
          const transports = getTransportForDay({
            reservations: data.reservations || [],
            dayId: day.id,
            dayAssignmentIds: stops.map(a => a.id),
            days,
          })
          // The shared link has to say what the app says: a multi-day parking only
          // shows up on its drop-off and pickup day (#1937).
          const items = getMergedItems({
            dayAssignments: stops,
            dayNotes: data.dayNotes?.[String(day.id)] || [],
            dayTransports: transports,
            dayId: day.id,
          }).filter(item => !(item.type === 'transport' && hidesOnMiddleDay(item.data, day.id)))
          const stays = (data.accommodations || []).filter(a => isDayInAccommodationRange(day, a.start_day_id, a.end_day_id, days))
          if (travelOnly && !dayHasEntries(items.length, stays.length)) return null
          return (
            <SharedDayCard
              key={day.id}
              day={day}
              index={index}
              selected={selectedDay === day.id}
              collapsed={collapsedDays.has(day.id)}
              onSelect={() => onSelectDay(selectedDay === day.id ? null : day.id)}
              onToggleCollapse={() => onToggleDay(day.id)}
              items={items}
              stays={stays}
              // A share can still carry an assignment for a deleted place. The list
              // skips those rows, so the count must not count them either.
              placeCount={stops.filter(a => a.place).length}
              stopNumber={stopNumbers(stops).byAssignment}
              categories={data.categories || []}
              travelOnly={travelOnly}
            />
          )
        })}
        {!travelOnly && <SharedUnplannedCard places={unplannedPlaces(data.places || [], assignments)} categories={data.categories || []} />}
      </div>
    </div>
  )
}
