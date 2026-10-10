// FE-PLANNER-TIMECONFIRM-001 to FE-PLANNER-TIMECONFIRM-004
import { render, screen } from '../../../tests/helpers/render'
import userEvent from '@testing-library/user-event'
import { DayPlanSidebarTimeConfirmModal } from './DayPlanSidebarTimeConfirmModal'

const t = (key: string, params?: Record<string, unknown>) =>
  params ? `${key}|${Object.values(params).join('|')}` : key

const pending = { dayId: 10, fromId: 22, time: '14:00' }

function setup(timeConfirm: typeof pending | null = pending) {
  const setTimeConfirm = vi.fn()
  const confirmTimeRemoval = vi.fn()
  render(<DayPlanSidebarTimeConfirmModal timeConfirm={timeConfirm} setTimeConfirm={setTimeConfirm} confirmTimeRemoval={confirmTimeRemoval} t={t} />)
  return { setTimeConfirm, confirmTimeRemoval }
}

describe('DayPlanSidebarTimeConfirmModal', () => {
  it('FE-PLANNER-TIMECONFIRM-001: nothing pending, nothing asked', () => {
    setup(null)
    expect(screen.queryByText('dayplan.confirmRemoveTimeTitle')).not.toBeInTheDocument()
  })

  it('FE-PLANNER-TIMECONFIRM-002: asks with the time that would be dropped', () => {
    setup()
    expect(screen.getByText('dayplan.confirmRemoveTimeTitle')).toBeInTheDocument()
    expect(screen.getByText('dayplan.confirmRemoveTimeBody|14:00')).toBeInTheDocument()
  })

  it('FE-PLANNER-TIMECONFIRM-003: Confirm removes the time, Cancel leaves it', async () => {
    const user = userEvent.setup()
    const s = setup()
    await user.click(screen.getByRole('button', { name: 'common.cancel' }))
    expect(s.setTimeConfirm).toHaveBeenCalledWith(null)
    expect(s.confirmTimeRemoval).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /confirm/i }))
    expect(s.confirmTimeRemoval).toHaveBeenCalledTimes(1)
  })

  it('FE-PLANNER-TIMECONFIRM-004: Escape takes the question back', async () => {
    const user = userEvent.setup()
    const s = setup()
    await user.keyboard('{Escape}')
    expect(s.setTimeConfirm).toHaveBeenCalledWith(null)
    expect(s.confirmTimeRemoval).not.toHaveBeenCalled()
  })
})
