import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { packingApi } from '../../../../src/api/client'
import MPackingImportSheet from '../../../../src/mobile/screens/trip/tabs/MPackingImportSheet'
import { useTripStore } from '../../../../src/store/tripStore'
import type { PackingItem } from '../../../../src/types'
import { buildPlanner } from '../../../helpers/mobileTrip'
import { resetAllStores, seedStore } from '../../../helpers/store'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'

// FE-MOB-PACKIMP-001 to FE-MOB-PACKIMP-012

function packItem(overrides: Partial<PackingItem> = {}): PackingItem {
  return {
    id: 1, trip_id: 1, name: 'Passport', checked: 0, category: 'Documents', sort_order: 0,
    ...overrides,
  } as PackingItem
}

function setup(text?: string) {
  const onClose = vi.fn()
  const planner = buildPlanner({ tripId: 7 })
  const view = render(<MPackingImportSheet planner={planner} open onClose={onClose} />)
  if (text != null) {
    fireEvent.change(screen.getByPlaceholderText('packing.importPlaceholder'), { target: { value: text } })
  }
  return { onClose, planner, view }
}

describe('MPackingImportSheet', () => {
  beforeEach(() => {
    resetAllStores()
    seedStore(useTripStore, { packingItems: [packItem()] })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('FE-MOB-PACKIMP-001: stays unmounted while closed', () => {
    const planner = buildPlanner()
    render(<MPackingImportSheet planner={planner} open={false} onClose={vi.fn()} />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('FE-MOB-PACKIMP-002: renders the hint, textarea and a disabled zero-count submit', () => {
    setup()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'packing.importTitle')
    expect(screen.getByText('packing.importHint')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('packing.importPlaceholder')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'packing.importAction:0' })).toBeDisabled()
  })

  it('FE-MOB-PACKIMP-003: counts the parsed lines in the submit label', () => {
    setup('Documents, Passport, 30\nClothing, Socks\n\n')
    expect(screen.getByRole('button', { name: 'packing.importAction:2' })).toBeEnabled()
  })

  it('FE-MOB-PACKIMP-004: warns when text parses to nothing', () => {
    setup(',')
    expect(screen.getByText('packing.importEmpty')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'packing.importAction:0' })).toBeDisabled()
  })

  it('FE-MOB-PACKIMP-005: keeps the warning hidden for blank input', () => {
    setup('   ')
    expect(screen.queryByText('packing.importEmpty')).toBeNull()
  })

  it('FE-MOB-PACKIMP-006: posts the parsed items and appends the response to the store', async () => {
    const imported = [packItem({ id: 50, name: 'Socks', category: 'Clothing' })]
    const spy = vi.spyOn(packingApi, 'bulkImport').mockResolvedValue({ items: imported, count: 1 })
    const { onClose, planner } = setup('Clothing, Socks, 120, Backpack, checked')

    fireEvent.click(screen.getByRole('button', { name: 'packing.importAction:1' }))

    await waitFor(() => expect(onClose).toHaveBeenCalled())
    expect(spy).toHaveBeenCalledWith(7, [
      { name: 'Socks', category: 'Clothing', weight_grams: '120', bag: 'Backpack', checked: true },
    ])
    expect(planner.toast.success).toHaveBeenCalledWith('packing.importSuccess:1')
    expect(useTripStore.getState().packingItems.map(i => i.id)).toEqual([1, 50])
  })

  it('FE-MOB-PACKIMP-007: clears the textarea after a successful import', async () => {
    vi.spyOn(packingApi, 'bulkImport').mockResolvedValue({ items: [], count: 0 })
    setup('Socks')

    fireEvent.click(screen.getByRole('button', { name: 'packing.importAction:1' }))

    await waitFor(() => expect(screen.getByPlaceholderText('packing.importPlaceholder')).toHaveValue(''))
  })

  it('FE-MOB-PACKIMP-008: reports a failed import and keeps the sheet open', async () => {
    vi.spyOn(packingApi, 'bulkImport').mockRejectedValue(new Error('boom'))
    const { onClose, planner } = setup('Socks')

    fireEvent.click(screen.getByRole('button', { name: 'packing.importAction:1' }))

    await waitFor(() => expect(planner.toast.error).toHaveBeenCalledWith('packing.importError'))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByPlaceholderText('packing.importPlaceholder')).toHaveValue('Socks')
  })

  it('FE-MOB-PACKIMP-009: opens the file picker from the CSV button', () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {})
    setup()

    fireEvent.click(screen.getByRole('button', { name: 'packing.importCsv' }))

    expect(click).toHaveBeenCalled()
  })

  it('FE-MOB-PACKIMP-010: fills the textarea from a picked file', async () => {
    const { view } = setup()
    const input = view.container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement
    const file = new File(['Clothing, Socks\nClothing, Shirt'], 'list.csv', { type: 'text/csv' })

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() =>
      expect(screen.getByPlaceholderText('packing.importPlaceholder')).toHaveValue('Clothing, Socks\nClothing, Shirt'),
    )
    expect(screen.getByRole('button', { name: 'packing.importAction:2' })).toBeEnabled()
  })

  it('FE-MOB-PACKIMP-011: ignores a change event without a file', () => {
    const { view } = setup()
    const input = view.container.ownerDocument.querySelector('input[type="file"]') as HTMLInputElement

    fireEvent.change(input, { target: { files: [] } })

    expect(screen.getByPlaceholderText('packing.importPlaceholder')).toHaveValue('')
  })

  it('FE-MOB-PACKIMP-012: closes on cancel without importing', () => {
    const spy = vi.spyOn(packingApi, 'bulkImport')
    const { onClose } = setup('Socks')

    fireEvent.click(screen.getByRole('button', { name: 'common.cancel' }))

    expect(onClose).toHaveBeenCalled()
    expect(spy).not.toHaveBeenCalled()
  })
})
