// FE-NAMEDLG-001 to FE-NAMEDLG-004
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '../../../tests/helpers/render'
import NameDialog from './NameDialog'

function setup(value: string, open = true) {
  const onChange = vi.fn()
  const onConfirm = vi.fn()
  const onClose = vi.fn()
  render(
    <NameDialog open={open} title="Add list" placeholder="List name" confirmLabel="Add"
      value={value} onChange={onChange} onConfirm={onConfirm} onClose={onClose} />,
  )
  return { onChange, onConfirm, onClose }
}

describe('NameDialog', () => {
  it('FE-NAMEDLG-001: asks for the name under its title, confirm waiting for one', () => {
    const { onChange } = setup('')
    expect(screen.getByText('Add list')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()

    fireEvent.change(screen.getByPlaceholderText('List name'), { target: { value: 'Rain kit' } })
    expect(onChange).toHaveBeenCalledWith('Rain kit')
  })

  it('FE-NAMEDLG-002: Enter and the button confirm a typed name', () => {
    const { onConfirm } = setup('Rain kit')
    fireEvent.keyDown(screen.getByPlaceholderText('List name'), { key: 'Enter' })
    fireEvent.click(screen.getByRole('button', { name: 'Add' }))
    expect(onConfirm).toHaveBeenCalledTimes(2)
  })

  it('FE-NAMEDLG-003: Enter on a blank name does nothing, Cancel closes', () => {
    const { onConfirm, onClose } = setup('   ')
    fireEvent.keyDown(screen.getByPlaceholderText('List name'), { key: 'Enter' })
    expect(onConfirm).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('FE-NAMEDLG-004: stays out of the page while closed', () => {
    setup('', false)
    expect(screen.queryByPlaceholderText('List name')).toBeNull()
  })
})
