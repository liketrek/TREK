import { describe, expect, it } from 'vitest'
import { COINCIDENT_RADIUS_PX, groupCoincidentPlaces, STACK_RADIUS_PX } from './coincidentPlaces'

interface Stop { id: number; x: number; y: number }
const stop = (id: number, x: number, y = 0): Stop => ({ id, x, y })
const project = (item: Stop) => ({ x: item.x, y: item.y })

describe('stops that share a spot on screen', () => {
  it('COINCIDENT-001: stops on one coordinate become a single group', () => {
    const groups = groupCoincidentPlaces([stop(1, 40), stop(2, 40), stop(3, 40)], project)
    expect(groups).toHaveLength(1)
    expect(groups[0].members.map(member => member.id)).toEqual([1, 2, 3])
    expect(groups[0].lead.id).toBe(1)
  })

  it('COINCIDENT-002: the fold reaches no further than the pins that cover each other', () => {
    const apart = groupCoincidentPlaces([stop(1, 0), stop(2, COINCIDENT_RADIUS_PX)], project)
    expect(apart.map(group => group.members.length)).toEqual([1, 1])
    // Inside the radius the lower pin has nothing showing to click at anyway.
    const touching = groupCoincidentPlaces([stop(1, 0), stop(2, COINCIDENT_RADIUS_PX - 0.5)], project)
    expect(touching.map(group => group.members.length)).toEqual([2])
    // A pin's width apart is two ordinary neighbouring stops — a hotel and the
    // restaurant across the street — and both of them keep a pin, since the renderer
    // this grouping serves has no bubble to put the second one in (#2344).
    const neighbours = groupCoincidentPlaces([stop(1, 0), stop(2, STACK_RADIUS_PX)], project)
    expect(neighbours.map(group => group.members.length)).toEqual([1, 1])
  })

  it('COINCIDENT-003: the same stops group the same way whatever order they arrive in', () => {
    const stops = [stop(3, 100), stop(1, 0), stop(2, 1), stop(1, 0)]
    const groups = groupCoincidentPlaces(stops, project)
    expect(groups.map(group => group.members.map(member => member.id))).toEqual([[1, 2], [3]])
    expect(groupCoincidentPlaces([...stops].reverse(), project)).toEqual(groups)
  })

  it('COINCIDENT-004: a stop the map cannot place keeps a group of its own rather than vanishing', () => {
    const missing = { id: 9, x: Number.NaN, y: 0 }
    const groups = groupCoincidentPlaces([stop(1, 0), missing, stop(2, 400)], item => (
      item.id === 9 ? null : project(item)
    ))
    expect(groups.map(group => group.members.map(member => member.id))).toEqual([[1], [2], [9]])
    expect(groupCoincidentPlaces([missing], project).map(group => group.lead)).toEqual([missing])
    // And two of them stay apart: an item nothing could place cannot swallow another.
    const unplaceable = groupCoincidentPlaces([stop(1, 0), stop(2, 0)], () => null)
    expect(unplaceable.map(group => group.members.map(member => member.id))).toEqual([[1], [2]])
  })

  it('COINCIDENT-005: the selected stop is the one drawn for its stack', () => {
    const stops = [stop(1, 40), stop(2, 40), stop(3, 400)]
    expect(groupCoincidentPlaces(stops, project, 2)[0].lead.id).toBe(2)
    // A selection from another stack, or none at all, leaves the first member leading.
    expect(groupCoincidentPlaces(stops, project, 3)[0].lead.id).toBe(1)
    expect(groupCoincidentPlaces(stops, project, null)[0].lead.id).toBe(1)
  })
})
