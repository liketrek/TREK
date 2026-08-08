import React, { Suspense } from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ErrorBoundary from '../components/shared/ErrorBoundary'
import { lazyWithRetry, retryUrlFor } from './lazyWithRetry'

// Every case needs its own URL: the one-shot guard is a module-level Set that
// lives for the whole file.
const viteMessage = (url: string) => `Failed to fetch dynamically imported module: ${url}`

beforeEach(() => {
  sessionStorage.clear()
})

describe('retryUrlFor', () => {
  it('FE-UTIL-LAZYRETRY-001: busts the cache on the URL the browser named', () => {
    const url = retryUrlFor(new Error(viteMessage('https://trek.example/assets/AtlasPage-a1b2.js')))
    expect(url).toMatch(/^https:\/\/trek\.example\/assets\/AtlasPage-a1b2\.js\?t=\d+$/)
  })

  it('FE-UTIL-LAZYRETRY-002: retries a given chunk only once', () => {
    const message = viteMessage('https://trek.example/assets/VacayPage-c3d4.js')
    expect(retryUrlFor(new Error(message))).not.toBeNull()
    // A second attempt would be the loop the route boundary is there to break.
    expect(retryUrlFor(new Error(message))).toBeNull()
  })

  it('FE-UTIL-LAZYRETRY-003: leaves ordinary errors to the boundary', () => {
    expect(retryUrlFor(new Error('Cannot read properties of undefined'))).toBeNull()
  })

  it('FE-UTIL-LAZYRETRY-004: gives up when the message names no URL', () => {
    // Safari's wording, which carries no URL at all.
    expect(retryUrlFor(new Error('Importing a module script failed.'))).toBeNull()
    // And a relative path leaves nothing to bust.
    expect(retryUrlFor(new Error(viteMessage('/assets/JourneyPage-e5f6.js')))).toBeNull()
  })

  it('FE-UTIL-LAZYRETRY-005: does not try to import a stylesheet', () => {
    const css = new Error('Unable to preload CSS for https://trek.example/assets/PhotoLightbox-g7h8.css')
    expect(retryUrlFor(css)).toBeNull()
  })
})

describe('lazyWithRetry', () => {
  it('FE-UTIL-LAZYRETRY-006: renders the default export once the chunk arrives', async () => {
    const Page = lazyWithRetry(async () => ({ default: () => <div>Atlas</div> }))
    render(
      <Suspense fallback={<span>loading</span>}>
        <Page />
      </Suspense>
    )
    expect(await screen.findByText('Atlas')).toBeInTheDocument()
  })

  it('FE-UTIL-LAZYRETRY-007: clears the reload marker once a chunk has loaded', async () => {
    // Set by reloadOnceForChunk() before the reload that got us here. Clearing it
    // any earlier — main.tsx used to do it right after render() — would let a
    // genuinely missing chunk reload the tab over and over.
    sessionStorage.setItem('trek:chunk-reload', '1750000000000')

    const Page = lazyWithRetry(async () => ({ default: () => <div>Dashboard</div> }))
    render(
      <Suspense fallback={<span>loading</span>}>
        <Page />
      </Suspense>
    )

    expect(await screen.findByText('Dashboard')).toBeInTheDocument()
    expect(sessionStorage.getItem('trek:chunk-reload')).toBeNull()
  })

  it('FE-UTIL-LAZYRETRY-008: hands a non-chunk failure to the boundary', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const Page = lazyWithRetry<React.ComponentType>(() => Promise.reject(new Error('boom')))

    render(
      <ErrorBoundary boundaryId="test" fallback={<div>caught</div>}>
        <Suspense fallback={<span>loading</span>}>
          <Page />
        </Suspense>
      </ErrorBoundary>
    )

    expect(await screen.findByText('caught')).toBeInTheDocument()
    // The marker belongs to reloadOnceForChunk; a plain throw must not touch it.
    expect(sessionStorage.getItem('trek:chunk-reload')).toBeNull()
  })
})
