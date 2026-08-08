import type { ComponentProps } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '../../../helpers/render'
import MCollLabelsSheet from '../../../../src/mobile/screens/collections/MCollLabelsSheet'
import type { LabelOption } from '../../../../src/pages/collections/collectionsModel'
import { SWATCH_COLORS } from '../../../../src/mobile/screens/collections/collectionsMobileModel'
import { useTranslation } from '../../../../src/i18n'

// FE-MOB-CLBLS-001 to FE-MOB-CLBLS-018

const LABELS: LabelOption[] = [
  { id: 1, name: 'Food', color: '#EF4444', count: 4 },
  // No colour — falls back to the first swatch.
  { id: 2, name: 'Museums', color: null, count: 0 },
]

function Harness(props: Omit<ComponentProps<typeof MCollLabelsSheet>, 't'>) {
  const { t } = useTranslation()
  return <MCollLabelsSheet {...props} t={t} />
}

type Props = ComponentProps<typeof MCollLabelsSheet>

function setup(over: Partial<Props> = {}) {
  const onCreate = vi.fn<Props['onCreate']>().mockResolvedValue(undefined)
  const onUpdate = vi.fn<Props['onUpdate']>().mockResolvedValue(undefined)
  const onDelete = vi.fn<Props['onDelete']>().mockResolvedValue(undefined)
  const onAssign = vi.fn<Props['onAssign']>().mockResolvedValue(undefined)
  const onSwitchToManage = vi.fn()
  const onClose = vi.fn()
  const props = {
    open: true,
    mode: 'manage' as const,
    labels: LABELS,
    selectedCount: 2,
    onCreate,
    onUpdate,
    onDelete,
    onAssign,
    onSwitchToManage,
    onClose,
    ...over,
  }
  const view = render(<Harness {...props} />)
  return { ...view, onCreate, onUpdate, onDelete, onAssign, onSwitchToManage, onClose, props }
}

describe('MCollLabelsSheet', () => {
  it('FE-MOB-CLBLS-001: manage mode heads the sheet and lists every label with its usage count', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Manage labels' })).toBeInTheDocument()
    expect(screen.getByText('Food')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('Museums')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('FE-MOB-CLBLS-002: the add button stays disabled until the name has content', () => {
    setup()
    const add = screen.getByRole('button', { name: /Add label/ })
    expect(add).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('e.g. Berlin'), { target: { value: '  ' } })
    expect(add).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('e.g. Berlin'), { target: { value: 'Bars' } })
    expect(add).not.toBeDisabled()
  })

  it('FE-MOB-CLBLS-003: creating a label trims the name and sends the default swatch', async () => {
    const { onCreate } = setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Berlin'), { target: { value: '  Bars ' } })
    fireEvent.click(screen.getByRole('button', { name: /Add label/ }))
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Bars', SWATCH_COLORS[0]))
    // The form resets for the next label.
    await waitFor(() => expect(screen.getByPlaceholderText('e.g. Berlin')).toHaveValue(''))
  })

  it('FE-MOB-CLBLS-004: the picked swatch is sent along and marked pressed', async () => {
    const { onCreate } = setup()
    fireEvent.click(screen.getByRole('button', { name: SWATCH_COLORS[3] }))
    expect(screen.getByRole('button', { name: SWATCH_COLORS[3] })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: SWATCH_COLORS[0] })).toHaveAttribute('aria-pressed', 'false')

    fireEvent.change(screen.getByPlaceholderText('e.g. Berlin'), { target: { value: 'Bars' } })
    fireEvent.click(screen.getByRole('button', { name: /Add label/ }))
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Bars', SWATCH_COLORS[3]))
  })

  it('FE-MOB-CLBLS-005: Enter in the name field submits, other keys do not', async () => {
    const { onCreate } = setup()
    const input = screen.getByPlaceholderText('e.g. Berlin')
    fireEvent.change(input, { target: { value: 'Bars' } })
    fireEvent.keyDown(input, { key: 'a' })
    expect(onCreate).not.toHaveBeenCalled()

    fireEvent.keyDown(input, { key: 'Enter' })
    await waitFor(() => expect(onCreate).toHaveBeenCalledWith('Bars', SWATCH_COLORS[0]))
  })

  it('FE-MOB-CLBLS-006: a blank name never reaches the callback', () => {
    const { onCreate } = setup()
    fireEvent.keyDown(screen.getByPlaceholderText('e.g. Berlin'), { key: 'Enter' })
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('FE-MOB-CLBLS-007: the pencil seeds the form and switches the button to Save', async () => {
    const { onUpdate, onCreate } = setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[0])
    expect(screen.getByPlaceholderText('e.g. Berlin')).toHaveValue('Food')
    expect(screen.getByRole('button', { name: '#EF4444' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.change(screen.getByPlaceholderText('e.g. Berlin'), { target: { value: 'Eating' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(1, { name: 'Eating', color: '#EF4444' }))
    expect(onCreate).not.toHaveBeenCalled()
    // Back to create mode once the save has settled.
    await waitFor(() => expect(screen.getByRole('button', { name: /Add label/ })).toBeInTheDocument())
  })

  it('FE-MOB-CLBLS-008: editing a colourless label starts from the first swatch', () => {
    setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Edit' })[1])
    expect(screen.getByPlaceholderText('e.g. Berlin')).toHaveValue('Museums')
    expect(screen.getByRole('button', { name: SWATCH_COLORS[0] })).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-MOB-CLBLS-009: the trash icon deletes that label', async () => {
    const { onDelete } = setup()
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1])
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(2))
  })

  it('FE-MOB-CLBLS-010: a second submit is swallowed while the first is still running', async () => {
    let resolve!: () => void
    const onCreate = vi.fn<Props['onCreate']>().mockReturnValue(new Promise<void>(r => { resolve = r }))
    setup({ onCreate })
    fireEvent.change(screen.getByPlaceholderText('e.g. Berlin'), { target: { value: 'Bars' } })
    fireEvent.click(screen.getByRole('button', { name: /Add label/ }))
    fireEvent.click(screen.getByRole('button', { name: /Add label/ }))
    expect(onCreate).toHaveBeenCalledTimes(1)

    resolve()
    await waitFor(() => expect(screen.getByPlaceholderText('e.g. Berlin')).toHaveValue(''))
  })

  it('FE-MOB-CLBLS-011: manage mode with no labels shows the empty line without the assign hint', () => {
    setup({ labels: [] })
    expect(screen.getByText('No labels yet')).toBeInTheDocument()
    expect(screen.queryByText('Create a label first to group places in this list.')).not.toBeInTheDocument()
  })

  it('FE-MOB-CLBLS-012: assign mode titles with the selection size and drops the create form', () => {
    setup({ mode: 'assign' })
    expect(screen.getByRole('dialog', { name: 'Add labels to 2 places' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('e.g. Berlin')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Assign label/ })).toBeDisabled()
  })

  it('FE-MOB-CLBLS-013: assign mode toggles labels as checkboxes and sends the checked ids', async () => {
    const { onAssign } = setup({ mode: 'assign' })
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes[0]).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(boxes[0])
    fireEvent.click(boxes[1])
    expect(boxes[0]).toHaveAttribute('aria-checked', 'true')
    expect(boxes[0].querySelector('.lucide-check')).not.toBeNull()

    // Untick the second one again — only the first is submitted.
    fireEvent.click(boxes[1])
    expect(boxes[1]).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(screen.getByRole('button', { name: /Assign label/ }))
    await waitFor(() => expect(onAssign).toHaveBeenCalledWith([1]))
  })

  it('FE-MOB-CLBLS-014: assigning nothing never reaches the callback', () => {
    const { onAssign } = setup({ mode: 'assign' })
    fireEvent.click(screen.getByRole('button', { name: /Assign label/ }))
    expect(onAssign).not.toHaveBeenCalled()
  })

  it('FE-MOB-CLBLS-015: the footer link switches over to label management', () => {
    const { onSwitchToManage } = setup({ mode: 'assign' })
    fireEvent.click(screen.getByRole('button', { name: 'Manage labels' }))
    expect(onSwitchToManage).toHaveBeenCalled()
  })

  it('FE-MOB-CLBLS-016: assign mode with no labels adds the "create one first" hint', () => {
    setup({ mode: 'assign', labels: [] })
    expect(screen.getByText('No labels yet')).toBeInTheDocument()
    expect(screen.getByText('Create a label first to group places in this list.')).toBeInTheDocument()
  })

  it('FE-MOB-CLBLS-017: closing the sheet clears the draft, and the header close hands back', () => {
    const { rerender, props, onClose } = setup()
    fireEvent.change(screen.getByPlaceholderText('e.g. Berlin'), { target: { value: 'Bars' } })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalled()

    rerender(<Harness {...props} open={false} />)
    rerender(<Harness {...props} open />)
    expect(screen.getByPlaceholderText('e.g. Berlin')).toHaveValue('')
    expect(screen.getByRole('button', { name: SWATCH_COLORS[0] })).toHaveAttribute('aria-pressed', 'true')
  })

  it('FE-MOB-CLBLS-018: a closed sheet renders nothing at all', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('FE-MOB-CLBLS-019: a delete waits for the running create instead of overtaking it', async () => {
    let resolve!: () => void
    const onCreate = vi.fn<Props['onCreate']>().mockReturnValue(new Promise<void>(r => { resolve = r }))
    const { onDelete } = setup({ onCreate })
    fireEvent.change(screen.getByPlaceholderText('e.g. Berlin'), { target: { value: 'Bars' } })
    fireEvent.click(screen.getByRole('button', { name: /Add label/ }))

    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    expect(onDelete).not.toHaveBeenCalled()

    resolve()
    await waitFor(() => expect(screen.getAllByRole('button', { name: 'Delete' })[0]).not.toBeDisabled())
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0])
    await waitFor(() => expect(onDelete).toHaveBeenCalledWith(1))
  })
})
