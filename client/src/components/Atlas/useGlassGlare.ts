import { useRef, type RefObject } from 'react'

export interface GlassGlare {
  /** Goes on the panel itself — the glare is measured against its box. */
  panelRef: RefObject<HTMLDivElement | null>
  /** The soft light under the cursor. */
  glareRef: RefObject<HTMLDivElement | null>
  /** The lit stretch of border around it. */
  borderGlareRef: RefObject<HTMLDivElement | null>
  onMouseMove: (e: { clientX: number; clientY: number }) => void
  onMouseLeave: () => void
}

/**
 * The Atlas panels' liquid-glass hover: a pool of light under the cursor and the
 * piece of border nearest to it lighting up.
 *
 * Extracted so a second panel beside the first one behaves identically. Two
 * hand-copied versions of a gradient are two versions that drift, and the whole
 * point of the effect is that the panels look like one material.
 *
 * Written straight to the DOM rather than through state: this runs on every
 * mousemove, and a re-render per frame would cost more than the effect is worth.
 */
export function useGlassGlare(dark: boolean): GlassGlare {
  const panelRef = useRef<HTMLDivElement>(null)
  const glareRef = useRef<HTMLDivElement>(null)
  const borderGlareRef = useRef<HTMLDivElement>(null)

  const onMouseMove = (e: { clientX: number; clientY: number }): void => {
    if (!panelRef.current || !glareRef.current || !borderGlareRef.current) return
    const rect = panelRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    glareRef.current.style.background = `radial-gradient(circle 300px at ${x}px ${y}px, ${dark ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.25)'} 0%, transparent 70%)`
    glareRef.current.style.opacity = '1'
    borderGlareRef.current.style.opacity = '1'
    borderGlareRef.current.style.maskImage = `radial-gradient(circle 150px at ${x}px ${y}px, black 0%, transparent 100%)`
    borderGlareRef.current.style.webkitMaskImage = `radial-gradient(circle 150px at ${x}px ${y}px, black 0%, transparent 100%)`
  }

  const onMouseLeave = (): void => {
    if (glareRef.current) glareRef.current.style.opacity = '0'
    if (borderGlareRef.current) borderGlareRef.current.style.opacity = '0'
  }

  return { panelRef, glareRef, borderGlareRef, onMouseMove, onMouseLeave }
}
