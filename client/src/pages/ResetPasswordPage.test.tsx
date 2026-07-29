import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { FormEvent } from 'react'
import { render, screen, fireEvent } from '../../tests/helpers/render'
import ResetPasswordPage from './ResetPasswordPage'

// FE-PAGE-RESETUI-001 to FE-PAGE-RESETUI-010
//
// ResetPasswordPage is a wiring container over useResetPassword (covered in
// resetPassword/useResetPassword.test.ts). The hook is mocked so the success,
// broken-link, password and MFA screens can each be rendered directly.

const mocks = vi.hoisted(() => ({ reset: {} as Record<string, unknown> }))

vi.mock('./resetPassword/useResetPassword', () => ({ useResetPassword: () => mocks.reset }))

const navigate = vi.fn((_to: string) => {})
const setPw = vi.fn((_v: string) => {})
const setPw2 = vi.fn((_v: string) => {})
const setShowPw = vi.fn((_v: boolean | ((p: boolean) => boolean)) => {})
const setMfaCode = vi.fn((_v: string) => {})
const handleSubmit = vi.fn(async (_e: FormEvent) => {})

function setReset(over: Record<string, unknown> = {}) {
  mocks.reset = {
    navigate,
    token: 'tok-1',
    pw: '',
    setPw,
    pw2: '',
    setPw2,
    showPw: false,
    setShowPw,
    mfaCode: '',
    setMfaCode,
    mfaRequired: false,
    error: '',
    success: false,
    isLoading: false,
    handleSubmit,
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  setReset()
})

describe('ResetPasswordPage', () => {
  it('FE-PAGE-RESETUI-001: renders the password form for a valid token', () => {
    setReset()
    render(<ResetPasswordPage />)

    expect(screen.getByRole('heading', { name: 'Set a new password' })).toBeInTheDocument()
    expect(screen.getByText(/Pick a strong password/)).toBeInTheDocument()
    expect(screen.getByText('New password')).toBeInTheDocument()
    expect(screen.getByText('Confirm new password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeEnabled()
    expect(screen.queryByText('2FA code')).toBeNull()
  })

  it('FE-PAGE-RESETUI-002: typing into both password fields is reported upwards', () => {
    setReset({ pw: 'abc', pw2: 'abd' })
    render(<ResetPasswordPage />)

    const [pwInput, pw2Input] = screen.getAllByPlaceholderText('••••••••')
    expect(pwInput).toHaveValue('abc')
    expect(pw2Input).toHaveValue('abd')

    fireEvent.change(pwInput, { target: { value: 'abcd' } })
    expect(setPw).toHaveBeenCalledWith('abcd')
    fireEvent.change(pw2Input, { target: { value: 'abcde' } })
    expect(setPw2).toHaveBeenCalledWith('abcde')
  })

  it('FE-PAGE-RESETUI-003: submitting the form delegates to the hook', () => {
    setReset({ pw: 'longenough', pw2: 'longenough' })
    render(<ResetPasswordPage />)

    fireEvent.submit(screen.getByRole('button', { name: 'Reset password' }).closest('form') as HTMLFormElement)
    expect(handleSubmit).toHaveBeenCalled()
  })

  it('FE-PAGE-RESETUI-004: the reveal toggle flips the input type and asks for the opposite state', () => {
    setReset()
    const { rerender } = render(<ResetPasswordPage />)

    const [pwInput] = screen.getAllByPlaceholderText('••••••••')
    expect(pwInput).toHaveAttribute('type', 'password')

    const toggle = pwInput.parentElement?.querySelector('button') as HTMLButtonElement
    fireEvent.click(toggle)
    expect(setShowPw).toHaveBeenCalled()
    const updater = setShowPw.mock.calls[0][0] as (p: boolean) => boolean
    expect(updater(false)).toBe(true)

    setReset({ showPw: true })
    rerender(<ResetPasswordPage />)
    expect(screen.getAllByPlaceholderText('••••••••')[0]).toHaveAttribute('type', 'text')
  })

  it('FE-PAGE-RESETUI-005: focusing and blurring an input swaps its border colour', () => {
    setReset()
    render(<ResetPasswordPage />)

    const [pwInput, pw2Input] = screen.getAllByPlaceholderText('••••••••')
    fireEvent.focus(pwInput)
    expect((pwInput as HTMLInputElement).style.borderColor).toBe('rgb(17, 24, 39)')
    fireEvent.blur(pwInput)
    expect((pwInput as HTMLInputElement).style.borderColor).toBe('rgb(229, 231, 235)')

    fireEvent.focus(pw2Input)
    expect((pw2Input as HTMLInputElement).style.borderColor).toBe('rgb(17, 24, 39)')
    fireEvent.blur(pw2Input)
    expect((pw2Input as HTMLInputElement).style.borderColor).toBe('rgb(229, 231, 235)')
  })

  it('FE-PAGE-RESETUI-006: an error from the hook is shown above the form', () => {
    setReset({ error: "Passwords don't match" })
    render(<ResetPasswordPage />)

    expect(screen.getByText("Passwords don't match")).toBeInTheDocument()
    // The form is still there so the user can correct the input.
    expect(screen.getByRole('button', { name: 'Reset password' })).toBeInTheDocument()
  })

  it('FE-PAGE-RESETUI-007: the MFA step replaces the password fields with a code field', () => {
    setReset({ mfaRequired: true, mfaCode: '12' })
    render(<ResetPasswordPage />)

    expect(screen.getByText(/Enter your 2FA code/)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('••••••••')).toBeNull()

    const codeInput = screen.getByPlaceholderText('123456 or backup-code')
    expect(codeInput).toHaveValue('12')
    fireEvent.change(codeInput, { target: { value: '123' } })
    expect(setMfaCode).toHaveBeenCalledWith('123')

    fireEvent.focus(codeInput)
    expect((codeInput as HTMLInputElement).style.borderColor).toBe('rgb(17, 24, 39)')
    fireEvent.blur(codeInput)
    expect((codeInput as HTMLInputElement).style.borderColor).toBe('rgb(229, 231, 235)')

    expect(screen.getByRole('button', { name: 'Verify & reset' })).toBeInTheDocument()
  })

  it('FE-PAGE-RESETUI-008: a running submit disables the button and swaps its label', () => {
    setReset({ isLoading: true })
    render(<ResetPasswordPage />)

    const btn = screen.getByRole('button', { name: '…' })
    expect(btn).toBeDisabled()
    expect(btn.style.opacity).toBe('0.7')
    expect(btn.style.cursor).toBe('default')
  })

  it('FE-PAGE-RESETUI-009: a successful reset shows the confirmation and links back to sign in', () => {
    setReset({ success: true })
    render(<ResetPasswordPage />)

    expect(screen.getByRole('heading', { name: 'Password updated' })).toBeInTheDocument()
    expect(screen.getByText('You can now sign in with your new password.')).toBeInTheDocument()
    expect(screen.queryByRole('form')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }))
    expect(navigate).toHaveBeenCalledWith('/login')
  })

  it('FE-PAGE-RESETUI-010: a missing token shows the broken-link screen instead of the form', () => {
    setReset({ token: '', error: 'Invalid reset link' })
    render(<ResetPasswordPage />)

    expect(screen.getByRole('heading', { name: 'Invalid reset link' })).toBeInTheDocument()
    expect(screen.getByText(/This link is missing or broken/)).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('••••••••')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Send reset link' }))
    expect(navigate).toHaveBeenCalledWith('/forgot-password')
  })

  it('FE-PAGE-RESETUI-011: the success screen wins over a missing token', () => {
    setReset({ token: '', success: true })
    render(<ResetPasswordPage />)

    expect(screen.getByRole('heading', { name: 'Password updated' })).toBeInTheDocument()
    expect(screen.queryByText('Invalid reset link')).toBeNull()
  })
})
