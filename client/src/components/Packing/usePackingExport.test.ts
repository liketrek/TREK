// FE-PACKEXPORTHOOK-001 to FE-PACKEXPORTHOOK-009
import { createElement, type ReactNode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PackingItem } from '../../types'
import { TranslationProvider } from '../../i18n/TranslationContext'
import { useAddonStore } from '../../store/addonStore'
import { useTripStore } from '../../store/tripStore'
import { isEffectivelyOffline } from '../../sync/networkMode'
import { downloadBlob } from '../../utils/fileDownload'
import { packingApi } from '../../api/client'
import { appFontFaces, tripDateRange, usePackingExport } from './usePackingExport'
import { PACKING_PLACEHOLDER_NAME } from './packingListPanel.constants'

vi.mock('../../api/client', () => ({ packingApi: { listBags: vi.fn() } }))
vi.mock('../../utils/fileDownload', () => ({ downloadBlob: vi.fn() }))
vi.mock('../../sync/networkMode', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../sync/networkMode')>()),
  isEffectivelyOffline: vi.fn(() => false),
}))

let nextId = 1
const item = (over: Partial<PackingItem>): PackingItem => ({
  id: nextId++, trip_id: 7, name: 'Item', checked: 0, category: 'Clothing', sort_order: 0,
  weight_grams: null, bag_id: null, quantity: 1, is_private: 0, ...over,
})

const ITEMS = [
  item({ name: 'Socks', quantity: 7, weight_grams: 40, bag_id: 1 }),
  item({ name: PACKING_PLACEHOLDER_NAME, category: 'Empty list' }),
  item({ name: 'Diary', category: 'Personal', is_private: 1 }),
]

const wrapper = ({ children }: { children: ReactNode }) => createElement(TranslationProvider, null, children)

/** What the last download wrote, as text, with its file name. */
async function lastDownload(): Promise<{ name: string; text: string; type: string }> {
  const calls = vi.mocked(downloadBlob).mock.calls
  const [blob, name] = calls[calls.length - 1] as [Blob, string]
  return { name, text: await blob.text(), type: blob.type }
}

beforeEach(() => {
  useTripStore.setState({ trip: { id: 7, title: 'Lisbon & Porto', start_date: '2026-10-09', end_date: '2026-10-16' } as never, packingItems: ITEMS })
  useAddonStore.setState({ bagTracking: true })
  vi.mocked(isEffectivelyOffline).mockReturnValue(false)
  vi.mocked(packingApi.listBags).mockResolvedValue({ bags: [{ id: 1, name: 'Suitcase', color: '#f97316' }] })
})

afterEach(() => {
  vi.clearAllMocks()
  useTripStore.setState({ trip: null as never, packingItems: [] })
  useAddonStore.setState({ bagTracking: false })
})

describe('usePackingExport', () => {
  it('FE-PACKEXPORTHOOK-001: exports the Shared view without private items or category placeholders', async () => {
    const { result } = renderHook(() => usePackingExport(7, 'common'), { wrapper })
    expect(result.current.hasItems).toBe(true)
    act(() => result.current.exportMarkdown())
    const file = await lastDownload()
    expect(file.name).toBe('packing-list-lisbon-porto.md')
    expect(file.type).toBe('text/markdown;charset=utf-8')
    expect(file.text).toContain('# Packing List: Lisbon & Porto (Shared)')
    expect(file.text).toContain('- [ ] 7 × Socks (40 g)')
    expect(file.text).not.toContain('Diary')
    expect(file.text).not.toContain(PACKING_PLACEHOLDER_NAME)
    expect(file.text).not.toContain('Empty list')
  })

  it('FE-PACKEXPORTHOOK-002: exports My list with only the private items', async () => {
    const { result } = renderHook(() => usePackingExport(7, 'personal'), { wrapper })
    act(() => result.current.exportMarkdown())
    const file = await lastDownload()
    expect(file.text).toContain('(My list)')
    expect(file.text).toContain('- [ ] Diary')
    expect(file.text).not.toContain('Socks')
  })

  it('FE-PACKEXPORTHOOK-003: writes the bag names into the CSV', async () => {
    const { result } = renderHook(() => usePackingExport(7, 'common'), { wrapper })
    await act(() => result.current.exportCsv())
    const file = await lastDownload()
    expect(file.name).toBe('packing-list-lisbon-porto.csv')
    expect(file.text).toBe('Clothing,7 × Socks,40,Suitcase,\n')
    expect(packingApi.listBags).toHaveBeenCalledWith(7)
  })

  it('FE-PACKEXPORTHOOK-004: goes without bags offline, with bag tracking off, or when the bags cannot be read', async () => {
    vi.mocked(isEffectivelyOffline).mockReturnValue(true)
    const { result, rerender } = renderHook(() => usePackingExport(7, 'common'), { wrapper })
    await act(() => result.current.exportCsv())
    expect((await lastDownload()).text).toBe('Clothing,7 × Socks,40,,\n')

    vi.mocked(isEffectivelyOffline).mockReturnValue(false)
    act(() => useAddonStore.setState({ bagTracking: false }))
    rerender()
    await act(() => result.current.exportCsv())
    expect((await lastDownload()).text).toBe('Clothing,7 × Socks,40,,\n')
    expect(packingApi.listBags).not.toHaveBeenCalled()

    act(() => useAddonStore.setState({ bagTracking: true }))
    rerender()
    vi.mocked(packingApi.listBags).mockRejectedValue(new Error('Network Error'))
    await act(() => result.current.exportCsv())
    expect((await lastDownload()).text).toBe('Clothing,7 × Socks,40,,\n')
  })

  it('FE-PACKEXPORTHOOK-005: opens the printable page with the trip, its dates and the list’s labels, and closes it', async () => {
    const { result } = renderHook(() => usePackingExport(7, 'common'), { wrapper })
    expect(result.current.printHtml).toBeNull()
    expect(result.current.printTitle).toBe('Packing List: Lisbon & Porto')
    await act(() => result.current.openPrint())
    const html = result.current.printHtml ?? ''
    expect(html).toContain('<h1>Lisbon &amp; Porto</h1>')
    expect(html).toContain('Packing List · Shared')
    expect(html).toContain('<span>Items</span>')
    expect(html).toContain('<span>Packed</span>')
    expect(html).toContain('<i style="background:#f97316"></i>Suitcase')
    expect(html).toContain(`${window.location.origin}/logo-light.svg`)
    expect(html).toMatch(/Oct\D+9\D+16, 2026/)
    act(() => result.current.closePrint())
    await waitFor(() => expect(result.current.printHtml).toBeNull())
  })

  it('FE-PACKEXPORTHOOK-006: has nothing to export for an empty view', () => {
    act(() => useTripStore.setState({ packingItems: [item({ name: PACKING_PLACEHOLDER_NAME })] }))
    const { result } = renderHook(() => usePackingExport(7, 'common'), { wrapper })
    expect(result.current.hasItems).toBe(false)
  })
})

describe('tripDateRange', () => {
  it('FE-PACKEXPORTHOOK-007: formats one day, a range, or nothing, on the calendar day whatever the offset', () => {
    expect(tripDateRange(null, null, 'en')).toBeNull()
    expect(tripDateRange('2026-10-09', '2026-10-09', 'en')).toBe('Oct 9, 2026')
    expect(tripDateRange('2026-10-09', null, 'de')).toBe('9. Okt. 2026')
    expect(tripDateRange('2026-12-30', '2027-01-02', 'en')).toMatch(/Dec 30, 2026\D+Jan 2, 2027/)
  })
})

describe('appFontFaces', () => {
  it('FE-PACKEXPORTHOOK-008: copies the family’s @font-face rules with absolute urls and skips sheets it may not read', () => {
    const fontFace = (cssText: string) => ({ type: CSSRule.FONT_FACE_RULE, cssText })
    const doc = {
      baseURI: 'https://trek.example/trips/7',
      styleSheets: [
        {
          href: 'https://trek.example/assets/index.css',
          cssRules: [
            fontFace('@font-face { font-family: Poppins; src: url("./poppins-400.woff2") format("woff2"); }'),
            fontFace('@font-face { font-family: Geist; src: url(/geist.woff2); }'),
            { type: CSSRule.STYLE_RULE, cssText: 'body { font-family: Poppins; }' },
          ],
        },
        { href: null, cssRules: [fontFace("@font-face { font-family: 'Poppins'; src: url(/assets/poppins-700.woff2); }")] },
        { href: 'https://cdn.example/x.css', get cssRules(): never { throw new DOMException('blocked', 'SecurityError') } },
      ],
    } as unknown as Document
    const css = appFontFaces('Poppins', doc)
    expect(css).toContain('url("https://trek.example/assets/poppins-400.woff2")')
    expect(css).toContain('url(https://trek.example/assets/poppins-700.woff2)')
    expect(css).not.toContain('Geist')
    expect(css).not.toContain('body {')
  })

  it('FE-PACKEXPORTHOOK-009: reads the live document by default without throwing', () => {
    expect(typeof appFontFaces('Poppins')).toBe('string')
  })
})
