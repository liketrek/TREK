import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { FormEvent } from 'react'
import { render, screen, fireEvent } from '../../tests/helpers/render'
import ForgotPasswordPage from './ForgotPasswordPage'

// FE-PAGE-FORGOTUI-001 to FE-PAGE-FORGOTUI-008
//
// ForgotPasswordPage is a wiring container over useForgotPassword (covered in
// forgotPassword/useForgotPassword.test.ts). The hook is mocked so the form,
// the sent screen and the SMTP hint can each be rendered on demand.

const mocks = vi.hoisted(() => ({ forgot: {} as Record<string, unknown> }))

vi.mock('./forgotPassword/useForgotPassword', () => ({ useForgotPassword: () => mocks.forgot }))

const navigate = vi.fn((_to: string) => {})
const setEmail = vi.fn((_v: string) => {})
const handleSubmit = vi.fn(async (_e: FormEvent) => {})

function setForgot(over: Record<string, unknown> = {}) {
  mocks.forgot = {
    navigate,
    email: '',
    setEmail,
    submitted: false,
    isLoading: false,
    smtpConfigured: true,
    handleSubmit,
    ...over,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  setForgot()
})

describe('ForgotPasswordPage', () => {
  it('FE-PAGE-FORGOTUI-001: renders the request form and the back link', () => {
    setForgot()
    render(<ForgotPasswordPage />)

    expect(screen.getByRole('heading', { name: 'Reset your password' })).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send reset link' })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: 'Back to sign in' }))
    expect(navigate).toHaveBeenCalledWith('/login')
  })

  it('FE-PAGE-FORGOTUI-002: typing an address is reported upwards', () => {
    setForgot({ email: 'a@b.de' })
    render(<ForgotPasswordPage />)

    const input = screen.getByPlaceholderText('your@email.com')
    expect(input).toHaveValue('a@b.de')
    fireEvent.change(input, { target: { value: 'a@b.dev' } })
    expect(setEmail).toHaveBeenCalledWith('a@b.dev')
  })

  it('FE-PAGE-FORGOTUI-003: focusing and blurring the field swaps its border colour', () => {
    setForgot()
    render(<ForgotPasswordPage />)

    const input = screen.getByPlaceholderText('your@email.com') as HTMLInputElement
    fireEvent.focus(input)
    expect(input.style.borderColor).toBe('rgb(17, 24, 39)')
    fireEvent.blur(input)
    expect(input.style.borderColor).toBe('rgb(229, 231, 235)')
  })

  it('FE-PAGE-FORGOTUI-004: submitting delegates to the hook', () => {
    setForgot({ email: 'a@b.de' })
    render(<ForgotPasswordPage />)

    fireEvent.submit(screen.getByRole('button', { name: 'Send reset link' }).closest('form') as HTMLFormElement)
    expect(handleSubmit).toHaveBeenCalled()
  })

  it('FE-PAGE-FORGOTUI-005: a running submit disables the button and shows the pending label', () => {
    setForgot({ isLoading: true })
    render(<ForgotPasswordPage />)

    const btn = screen.getByRole('button', { name: 'Signing in…' })
    expect(btn).toBeDisabled()
    expect(btn.style.opacity).toBe('0.7')
    expect(btn.style.cursor).toBe('default')
  })

  it('FE-PAGE-FORGOTUI-006: the SMTP hint appears on the form only when the probe said no', () => {
    setForgot({ smtpConfigured: false })
    const { rerender } = render(<ForgotPasswordPage />)
    expect(screen.getByText(/console/i)).toBeInTheDocument()

    // Still pending (null) or configured (true) keeps the hint hidden.
    setForgot({ smtpConfigured: null })
    rerender(<ForgotPasswordPage />)
    expect(screen.queryByText(/console/i)).toBeNull()

    setForgot({ smtpConfigured: true })
    rerender(<ForgotPasswordPage />)
    expect(screen.queryByText(/console/i)).toBeNull()
  })

  it('FE-PAGE-FORGOTUI-007: after submitting, the confirmation replaces the form', () => {
    setForgot({ submitted: true })
    render(<ForgotPasswordPage />)

    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    expect(screen.queryByPlaceholderText('your@email.com')).toBeNull()
    expect(screen.queryByText(/console/i)).toBeNull()

    // Both the top link and the bottom button navigate back to the login page.
    const backButtons = screen.getAllByRole('button', { name: 'Back to sign in' })
    expect(backButtons).toHaveLength(2)
    fireEvent.click(backButtons[1])
    expect(navigate).toHaveBeenCalledWith('/login')
  })

  it('FE-PAGE-FORGOTUI-008: the confirmation repeats the SMTP warning when mail is not configured', () => {
    setForgot({ submitted: true, smtpConfigured: false })
    render(<ForgotPasswordPage />)

    expect(screen.getByRole('heading', { name: 'Check your email' })).toBeInTheDocument()
    expect(screen.getByText(/console/i)).toBeInTheDocument()
  })
})
