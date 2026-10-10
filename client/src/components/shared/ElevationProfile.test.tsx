import { act, fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import ElevationProfile from './ElevationProfile'
import type { RouteProfileFocus } from '../../utils/routeGeometry'
import * as elevationProfileModel from './elevationProfileModel'

const samples = [
  { distanceMeters: 0, elevationMeters: 100, lat: 48, lng: 11 },
  { distanceMeters: 100, elevationMeters: 200, lat: 48.01, lng: 11.01 },
  { distanceMeters: 300, elevationMeters: 150, lat: 48.03, lng: 11.03 },
]

function InteractiveProfile({ onFocus, samples: profileSamples = samples, externalFocus = null, height = 100 }: {
  onFocus?: (focus: RouteProfileFocus | null) => void
  samples?: typeof samples
  externalFocus?: RouteProfileFocus | null
  height?: number
}) {
  const [focus, setFocus] = useState<RouteProfileFocus | null>(null)
  return <ElevationProfile samples={profileSamples} height={height} color="currentColor" gradientId="interactive" ariaLabel="Elevation profile" focus={externalFocus ?? focus} onFocusChange={next => { setFocus(next); onFocus?.(next) }} formatFocus={point => `${point.distanceMeters} m · ${point.elevationMeters} m`} />
}

describe('ElevationProfile', () => {
  it('positions samples by travelled distance rather than array index', () => {
    const { container } = render(
      <ElevationProfile
        samples={[
          { distanceMeters: 0, elevationMeters: 100 },
          { distanceMeters: 100, elevationMeters: 150 },
          { distanceMeters: 1000, elevationMeters: 120 },
        ]}
        color="currentColor"
        gradientId="test-profile"
      />,
    )

    const path = container.querySelector('path[stroke]')?.getAttribute('d')
    expect(path).toBe('M0.0,96.0 L44.0,4.0 L440.0,59.2')
  })

  it('renders nothing without at least two samples', () => {
    const { container } = render(<ElevationProfile samples={[]} color="currentColor" gradientId="empty-profile" />)
    expect(container).toBeEmptyDOMElement()
  })

  it('maps pointer position to distance and shows the corresponding focus readout', () => {
    const onFocus = vi.fn()
    const frames: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { frames.push(callback); return frames.length })
    render(<InteractiveProfile onFocus={onFocus} />)
    const profile = screen.getByRole('group', { name: 'Elevation profile' })
    vi.spyOn(profile, 'getBoundingClientRect').mockReturnValue({
      x: 10, y: 0, left: 10, top: 0, right: 450, bottom: 100, width: 440, height: 100,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.pointerMove(profile, { clientX: 230, pointerType: 'mouse' })
    act(() => frames.shift()?.(16))

    expect(onFocus).toHaveBeenLastCalledWith({ distanceMeters: 150, elevationMeters: 187.5, lat: 48.015, lng: 11.015, sampleIndex: 1 })
    expect(profile.querySelector('[data-profile-focus-line]')).toBeInTheDocument()
    expect(profile.querySelector('[data-profile-focus-point]')).toBeInTheDocument()
    const readout = profile.parentElement?.querySelector('[data-profile-focus-readout]')
    expect(readout?.textContent).toBe('150 m · 187.5 m')
    expect(readout).toHaveClass('rounded-lg', 'border-edge-faint', 'bg-surface-card', 'text-content', 'shadow-elevated')
    expect(readout).toHaveStyle({ fontFamily: 'var(--font-system)', fontWeight: '500', pointerEvents: 'none' })
    expect(readout).toHaveStyle({ maxWidth: 'min(164px, calc(100% - 8px))' })
    expect(profile).toHaveStyle({ fontFamily: 'var(--font-system)' })
    expect(profile.querySelector('[data-profile-focus-line]')).toHaveAttribute('stroke', 'var(--text-muted)')
    expect(profile.querySelector('[data-profile-focus-point]')).toHaveAttribute('stroke', 'var(--bg-card)')
    expect(profile.parentElement?.querySelector('[aria-live="polite"]')?.textContent).toBe('')
    fireEvent.pointerMove(profile, { clientX: -50, pointerType: 'mouse' })
    act(() => frames.shift()?.(32))
    expect(onFocus).toHaveBeenLastCalledWith({ distanceMeters: 0, elevationMeters: 100, lat: 48, lng: 11, sampleIndex: 0 })
    fireEvent.pointerMove(profile, { clientX: 900, pointerType: 'mouse' })
    act(() => frames.shift()?.(48))
    expect(onFocus).toHaveBeenLastCalledWith({ distanceMeters: 300, elevationMeters: 150, lat: 48.03, lng: 11.03, sampleIndex: 2 })
    fireEvent.pointerLeave(profile)
    expect(onFocus).toHaveBeenLastCalledWith(null)
    vi.restoreAllMocks()
  })

  it('supports focus, arrow keys, Home, End and Escape without pointer input', () => {
    const onFocus = vi.fn()
    render(<InteractiveProfile onFocus={onFocus} />)
    const profile = screen.getByRole('group', { name: 'Elevation profile' })
    profile.focus()
    expect(onFocus).toHaveBeenLastCalledWith({ distanceMeters: 0, elevationMeters: 100, lat: 48, lng: 11, sampleIndex: 0 })
    fireEvent.keyDown(profile, { key: 'ArrowRight' })
    expect(onFocus).toHaveBeenLastCalledWith({ distanceMeters: 100, elevationMeters: 200, lat: 48.01, lng: 11.01, sampleIndex: 1 })
    fireEvent.keyDown(profile, { key: 'End' })
    expect(onFocus).toHaveBeenLastCalledWith({ distanceMeters: 300, elevationMeters: 150, lat: 48.03, lng: 11.03, sampleIndex: 2 })
    fireEvent.keyDown(profile, { key: 'Home' })
    expect(onFocus).toHaveBeenLastCalledWith({ distanceMeters: 0, elevationMeters: 100, lat: 48, lng: 11, sampleIndex: 0 })
    fireEvent.keyDown(profile, { key: 'Escape' })
    expect(onFocus).toHaveBeenLastCalledWith(null)
    expect(profile.parentElement?.querySelector('[aria-live="polite"]')?.textContent).toBe('')
  })

  it('is not keyboard-focusable or interactive without geographic sample coordinates', () => {
    render(<ElevationProfile samples={[{ distanceMeters: 0, elevationMeters: 10 }, { distanceMeters: 100, elevationMeters: 20 }]} color="currentColor" gradientId="no-coordinates" ariaLabel="Elevation profile" onFocusChange={vi.fn()} />)
    expect(screen.queryByRole('group', { name: 'Elevation profile' })).toBeNull()
    expect(document.querySelector('svg[tabindex="0"]')).toBeNull()
  })

  it('reuses static chart geometry for pointer, keyboard and external focus updates', () => {
    const prepared = vi.spyOn(elevationProfileModel, 'prepareElevationProfileChart')
    const callbacks = new Map<number, FrameRequestCallback>()
    let nextFrameId = 0
    const raf = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      const id = ++nextFrameId
      callbacks.set(id, callback)
      return id
    })
    const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { callbacks.delete(id) })
    const onFocus = vi.fn()
    const { rerender, unmount } = render(<InteractiveProfile onFocus={onFocus} />)
    const profile = screen.getByRole('group', { name: 'Elevation profile' })
    expect(prepared).toHaveBeenCalledTimes(1)
    vi.spyOn(profile, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 440, bottom: 100, width: 440, height: 100,
      toJSON: () => ({}),
    } as DOMRect)

    fireEvent.pointerMove(profile, { clientX: 90, pointerType: 'mouse' })
    fireEvent.pointerMove(profile, { clientX: 180, pointerType: 'mouse' })
    fireEvent.pointerMove(profile, { clientX: 270, pointerType: 'mouse' })
    expect(raf).toHaveBeenCalledTimes(1)
    expect(prepared).toHaveBeenCalledTimes(1)
    const pendingFrameId = [...callbacks.keys()][0]
    fireEvent.pointerLeave(profile)
    expect(cancel).toHaveBeenCalledWith(pendingFrameId)
    expect(callbacks.size).toBe(0)

    fireEvent.pointerMove(profile, { clientX: 270, pointerType: 'mouse' })
    expect(raf).toHaveBeenCalledTimes(2)
    const [frameId, callback] = [...callbacks.entries()][0]
    act(() => callback(16))
    callbacks.delete(frameId)
    expect(onFocus).toHaveBeenLastCalledWith(expect.objectContaining({ sampleIndex: 1 }))
    expect(onFocus).toHaveBeenCalledTimes(2)
    expect(prepared).toHaveBeenCalledTimes(1)

    fireEvent.keyDown(profile, { key: 'ArrowRight' })
    fireEvent.keyDown(profile, { key: 'ArrowLeft' })
    expect(prepared).toHaveBeenCalledTimes(1)

    const externalFocus = { distanceMeters: 100, elevationMeters: 200, lat: 48.01, lng: 11.01, sampleIndex: 1 }
    rerender(<InteractiveProfile samples={samples} externalFocus={externalFocus} onFocus={onFocus} />)
    expect(prepared).toHaveBeenCalledTimes(1)

    rerender(<InteractiveProfile samples={samples} externalFocus={externalFocus} height={120} onFocus={onFocus} />)
    expect(prepared).toHaveBeenCalledTimes(2)
    unmount()
  })
})
