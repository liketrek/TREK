// FE-LOGIN-WIRE-001 to FE-LOGIN-WIRE-024
//
// LoginPage is a wiring container (see client/scripts/check-page-pattern.mjs): the
// behaviour lives in useLogin. These tests stub the hook and drive the markup
// directly, which is the only way to reach the states the hook rarely produces
// (OIDC-only, passkeys, forced password change) and the presentation handlers.
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '../../tests/helpers/render';
import { resetAllStores, seedStore } from '../../tests/helpers/store';
import { useSettingsStore } from '../store/settingsStore';
import LoginPage from './LoginPage';
import { useLogin } from './login/useLogin';

vi.mock('./login/useLogin', () => ({ useLogin: vi.fn() }));
vi.mock('./login/LoginWorld', () => ({
  default: ({ variant }: { variant?: string }) => <div data-testid="login-world" data-variant={variant ?? 'ambient'} />,
}));

const EMAIL_PLACEHOLDER = 'your@email.com';
const PASSWORD_PLACEHOLDER = '••••••••';

function makeFixture() {
  return {
    navigate: vi.fn(),
    mode: 'login' as 'login' | 'register',
    setMode: vi.fn(),
    username: '',
    setUsername: vi.fn(),
    email: '',
    setEmail: vi.fn(),
    password: '',
    setPassword: vi.fn(),
    rememberMe: false,
    setRememberMe: vi.fn(),
    showPassword: false,
    setShowPassword: vi.fn(),
    isLoading: false,
    error: '',
    setError: vi.fn(),
    insecureCookie: false,
    appConfig: {
      has_users: true,
      allow_registration: true,
      setup_complete: true,
      demo_mode: false,
      oidc_configured: false,
      oidc_display_name: undefined as string | undefined,
      oidc_only_mode: false,
      password_login: true,
      password_registration: true,
      oidc_login: false,
      oidc_registration: false,
      passkey_login: false,
      passkey_configured: false,
      env_override_oidc_only: false,
    },
    inviteToken: '',
    langDropdownOpen: false,
    setLangDropdownOpen: vi.fn(),
    setLanguageLocal: vi.fn(),
    showTakeoff: false,
    mfaStep: false,
    setMfaStep: vi.fn(),
    mfaToken: '',
    setMfaToken: vi.fn(),
    mfaCode: '',
    setMfaCode: vi.fn(),
    passwordChangeStep: false,
    newPassword: '',
    setNewPassword: vi.fn(),
    confirmPassword: '',
    setConfirmPassword: vi.fn(),
    noRedirect: false,
    showRegisterOption: true,
    oidcOnly: false,
    handleDemoLogin: vi.fn(async () => {}),
    handleSubmit: vi.fn(async (_e: React.FormEvent<HTMLFormElement>) => {}),
    handlePasskeyLogin: vi.fn(async () => {}),
  };
}

type Fixture = ReturnType<typeof makeFixture>;

let fixture: Fixture;

function renderPage(f: Fixture = fixture) {
  vi.mocked(useLogin).mockReturnValue(f as unknown as ReturnType<typeof useLogin>);
  return render(<LoginPage />);
}

/** Both hover handlers on an element, asserting the leave handler restores the entry state. */
function hoverRoundTrip(el: HTMLElement, prop: 'background' | 'transform' | 'color' | 'borderColor') {
  const before = el.style[prop];
  fireEvent.mouseEnter(el);
  const hovered = el.style[prop];
  fireEvent.mouseLeave(el);
  return { before, hovered, after: el.style[prop] };
}

beforeEach(() => {
  resetAllStores();
  fixture = makeFixture();
});

describe('LoginPage — takeoff', () => {
  it('FE-LOGIN-WIRE-001: replaces the form with the takeoff world and the tagline', () => {
    fixture.showTakeoff = true;
    renderPage();

    expect(document.querySelector('.takeoff-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('login-world')).toHaveAttribute('data-variant', 'takeoff');
    expect(screen.getByAltText('TREK')).toHaveAttribute('src', '/logo-light.svg');
    expect(screen.queryByPlaceholderText(EMAIL_PLACEHOLDER)).toBeNull();
  });
});

describe('LoginPage — language switcher', () => {
  it('FE-LOGIN-WIRE-002: the globe button toggles the dropdown without closing it again', () => {
    renderPage();
    const button = screen.getByRole('button', { name: 'Change language' });

    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveTextContent('English');

    fireEvent.click(button);
    const toggle = vi.mocked(fixture.setLangDropdownOpen).mock.calls[0][0] as (open: boolean) => boolean;
    expect(toggle(false)).toBe(true);
    expect(toggle(true)).toBe(false);
  });

  it('FE-LOGIN-WIRE-003: the globe button reacts to hover', () => {
    renderPage();
    const { before, hovered, after } = hoverRoundTrip(
      screen.getByRole('button', { name: 'Change language' }),
      'background',
    );

    expect(hovered).not.toBe(before);
    expect(after).toBe(before);
  });

  it('FE-LOGIN-WIRE-034: falls back to the bare code when the stored language has no label', () => {
    seedStore(useSettingsStore, { settings: { language: 'xx' } });
    renderPage();

    expect(screen.getByRole('button', { name: 'Change language' })).toHaveTextContent('XX');
  });

  it('FE-LOGIN-WIRE-004: the open dropdown lists every language and marks the active one', () => {
    fixture.langDropdownOpen = true;
    renderPage();

    expect(screen.getByRole('button', { name: 'Change language' })).toHaveAttribute('aria-expanded', 'true');
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(23);
    expect(screen.getByRole('option', { name: 'Deutsch' })).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('option', { name: 'English' })).toHaveAttribute('aria-selected', 'true');
  });

  it('FE-LOGIN-WIRE-005: picking a language applies it and closes the dropdown', () => {
    fixture.langDropdownOpen = true;
    renderPage();

    fireEvent.click(screen.getByRole('option', { name: 'Français' }));

    expect(fixture.setLanguageLocal).toHaveBeenCalledWith('fr');
    expect(fixture.setLangDropdownOpen).toHaveBeenCalledWith(false);
  });

  it('FE-LOGIN-WIRE-006: clicks inside the dropdown never reach the document closer', () => {
    fixture.langDropdownOpen = true;
    renderPage();
    const documentClick = vi.fn();
    document.addEventListener('click', documentClick);

    fireEvent.click(screen.getByRole('option', { name: 'Español' }));

    expect(fixture.setLanguageLocal).toHaveBeenCalledWith('es');
    expect(documentClick).not.toHaveBeenCalled();
    document.removeEventListener('click', documentClick);
  });

  it('FE-LOGIN-WIRE-007: hover highlights an inactive option and leaves the active one alone', () => {
    fixture.langDropdownOpen = true;
    renderPage();

    const inactive = hoverRoundTrip(screen.getByRole('option', { name: 'Italiano' }), 'background');
    expect(inactive.hovered).not.toBe(inactive.before);
    expect(inactive.after).toBe(inactive.before);

    const active = hoverRoundTrip(screen.getByRole('option', { name: 'English' }), 'background');
    expect(active.hovered).toBe(active.before);
    expect(active.after).toBe(active.before);
  });
});

describe('LoginPage — OIDC-only mode', () => {
  it('FE-LOGIN-WIRE-008: offers only the SSO link, named after the provider', () => {
    fixture.oidcOnly = true;
    fixture.appConfig.oidc_display_name = 'Authentik';
    renderPage();

    expect(screen.queryByPlaceholderText(EMAIL_PLACEHOLDER)).toBeNull();
    const link = screen.getByRole('link', { name: /sign in with authentik/i });
    expect(link).toHaveAttribute('href', '/api/auth/oidc/login');
    expect(
      screen.getByText('Password authentication is disabled. Please sign in using your SSO provider.'),
    ).toBeInTheDocument();
  });

  it('FE-LOGIN-WIRE-009: explains the logout and carries the invite token into the SSO link', () => {
    fixture.oidcOnly = true;
    fixture.noRedirect = true;
    fixture.inviteToken = 'inv/42';
    fixture.error = 'Invalid session. Please try again.';
    renderPage();

    expect(
      screen.getByText('You have been logged out. Sign in again using your SSO provider.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Invalid session. Please try again.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in with sso/i })).toHaveAttribute(
      'href',
      '/api/auth/oidc/login?invite=inv%2F42',
    );
  });

  it('FE-LOGIN-WIRE-010: the SSO button darkens on hover', () => {
    fixture.oidcOnly = true;
    renderPage();

    const { before, hovered, after } = hoverRoundTrip(
      screen.getByRole('link', { name: /sign in with sso/i }),
      'background',
    );
    expect(hovered).not.toBe(before);
    expect(after).toBe(before);
  });
});

describe('LoginPage — password form', () => {
  it('FE-LOGIN-WIRE-011: the eye button flips the password visibility', () => {
    renderPage();
    const input = screen.getByPlaceholderText(PASSWORD_PLACEHOLDER);
    expect(input).toHaveAttribute('type', 'password');

    const buttons = screen.getAllByRole('button');
    const toggle = buttons.find((b) => b.getAttribute('type') === 'button' && b.querySelector('svg') && b.style.right === '12px')!;
    fireEvent.click(toggle);

    const updater = vi.mocked(fixture.setShowPassword).mock.calls[0][0] as (v: boolean) => boolean;
    expect(updater(false)).toBe(true);
  });

  it('FE-LOGIN-WIRE-012: showPassword renders the value in clear text', () => {
    fixture.showPassword = true;
    fixture.password = 'hunter2';
    renderPage();

    expect(screen.getByDisplayValue('hunter2')).toHaveAttribute('type', 'text');
  });

  it('FE-LOGIN-WIRE-013: the remember-me label toggles the switch', () => {
    renderPage();

    fireEvent.click(screen.getByText('Remember me', { selector: 'span' }));
    expect(fixture.setRememberMe).toHaveBeenCalledWith(true);

    fireEvent.click(screen.getByRole('button', { name: 'Remember me' }));
    expect(fixture.setRememberMe).toHaveBeenCalledTimes(2);
  });

  it('FE-LOGIN-WIRE-014: the forgot-password link routes and highlights on hover', () => {
    renderPage();
    const button = screen.getByRole('button', { name: /forgot password/i });

    const { before, hovered, after } = hoverRoundTrip(button, 'color');
    expect(hovered).not.toBe(before);
    expect(after).toBe(before);

    fireEvent.click(button);
    expect(fixture.navigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('FE-LOGIN-WIRE-015: submitting the form goes through the hook', () => {
    renderPage();

    fireEvent.submit(document.querySelector('form')!);
    expect(fixture.handleSubmit).toHaveBeenCalled();
  });

  it('FE-LOGIN-WIRE-016: the loading state disables the submit button and swaps the label', () => {
    fixture.isLoading = true;
    renderPage();

    const submit = screen.getByRole('button', { name: /signing in/i });
    expect(submit).toBeDisabled();
    expect(submit.style.cursor).toBe('default');
    expect(submit.style.opacity).toBe('0.7');
  });

  it('FE-LOGIN-WIRE-017: the warning banner explains a dropped Secure cookie', () => {
    fixture.insecureCookie = true;
    renderPage();

    expect(screen.getByText("Login won't stick over HTTP")).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /troubleshooting/i })).not.toBeInTheDocument();
  });
});

describe('LoginPage — MFA step', () => {
  beforeEach(() => {
    fixture.mfaStep = true;
    fixture.mfaToken = 'mfa-tok';
  });

  it('FE-LOGIN-WIRE-018: shows only the code field and normalises what is typed', () => {
    renderPage();

    expect(screen.getByText('Two-factor authentication')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(EMAIL_PLACEHOLDER)).toBeNull();

    const input = screen.getByPlaceholderText('000000 or XXXX-XXXX');
    fireEvent.change(input, { target: { value: 'abcd-efgh' } });
    expect(fixture.setMfaCode).toHaveBeenCalledWith('ABCD-EFGH');

    fireEvent.change(input, { target: { value: 'x'.repeat(40) } });
    expect(fixture.setMfaCode).toHaveBeenLastCalledWith('X'.repeat(24));
  });

  it('FE-LOGIN-WIRE-019: the back link drops the pending MFA challenge', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /back to sign in/i }));

    expect(fixture.setMfaStep).toHaveBeenCalledWith(false);
    expect(fixture.setMfaToken).toHaveBeenCalledWith('');
    expect(fixture.setMfaCode).toHaveBeenCalledWith('');
    expect(fixture.setError).toHaveBeenCalledWith('');
  });

  it('FE-LOGIN-WIRE-020: the submit button verifies instead of signing in', () => {
    fixture.isLoading = true;
    renderPage();

    expect(screen.getByRole('button', { name: /verify/i })).toBeDisabled();
  });
});

describe('LoginPage — forced password change', () => {
  beforeEach(() => {
    fixture.passwordChangeStep = true;
  });

  it('FE-LOGIN-WIRE-021: swaps the form for the two new-password fields', () => {
    renderPage();

    expect(screen.getByText(/You must change your password before you can continue/)).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(EMAIL_PLACEHOLDER)).toBeNull();
    expect(screen.queryByPlaceholderText(PASSWORD_PLACEHOLDER)).toBeNull();

    fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: 'newpassword123' } });
    expect(fixture.setNewPassword).toHaveBeenCalledWith('newpassword123');

    fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: 'newpassword123' } });
    expect(fixture.setConfirmPassword).toHaveBeenCalledWith('newpassword123');
  });

  it('FE-LOGIN-WIRE-022: hides the register toggle and labels the button "Update password"', () => {
    fixture.isLoading = true;
    renderPage();

    expect(screen.getByRole('button', { name: /update password/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^register$/i })).toBeNull();
  });
});

describe('LoginPage — register mode', () => {
  it('FE-LOGIN-WIRE-023: switching to register resets the pending MFA state', () => {
    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /^register$/i }));

    const updater = vi.mocked(fixture.setMode).mock.calls[0][0] as (m: 'login' | 'register') => 'login' | 'register';
    expect(updater('login')).toBe('register');
    expect(updater('register')).toBe('login');
    expect(fixture.setError).toHaveBeenCalledWith('');
    expect(fixture.setMfaStep).toHaveBeenCalledWith(false);
    expect(fixture.setMfaToken).toHaveBeenCalledWith('');
    expect(fixture.setMfaCode).toHaveBeenCalledWith('');
  });

  it('FE-LOGIN-WIRE-024: asks for an admin account on a fresh instance', () => {
    fixture.mode = 'register';
    fixture.appConfig.has_users = false;
    renderPage();

    expect(screen.getByRole('heading', { name: 'Create Admin Account' })).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText('admin'), { target: { value: 'root' } });
    expect(fixture.setUsername).toHaveBeenCalledWith('root');
    // No users yet means no "already have an account?" toggle.
    expect(screen.queryByRole('button', { name: /^sign in$/i })).toBeNull();
  });

  it('FE-LOGIN-WIRE-025: shows the creating label while the account is being made', () => {
    fixture.mode = 'register';
    fixture.isLoading = true;
    renderPage();

    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled();
  });
});

describe('LoginPage — alternative sign-in buttons', () => {
  it('FE-LOGIN-WIRE-026: the SSO button sits behind an "or" divider and reacts to hover', () => {
    fixture.appConfig.oidc_configured = true;
    fixture.appConfig.oidc_login = true;
    fixture.appConfig.oidc_display_name = 'Keycloak';
    fixture.inviteToken = 'abc';
    renderPage();

    expect(screen.getByText('or')).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /sign in with keycloak/i });
    expect(link).toHaveAttribute('href', '/api/auth/oidc/login?invite=abc&remember=0');

    const background = hoverRoundTrip(link, 'background');
    expect(background.hovered).not.toBe(background.before);
    expect(background.after).toBe(background.before);
  });

  it('FE-LOGIN-WIRE-026b: the SSO link carries remember=1 when the toggle is on, and no flag in register mode (#1927)', () => {
    fixture.appConfig.oidc_configured = true;
    fixture.appConfig.oidc_login = true;
    fixture.appConfig.oidc_display_name = 'Keycloak';
    fixture.rememberMe = true;
    renderPage();
    expect(screen.getByRole('link', { name: /sign in with keycloak/i }))
      .toHaveAttribute('href', '/api/auth/oidc/login?remember=1');

    cleanup();
    fixture.mode = 'register';
    renderPage();
    expect(screen.getByRole('link', { name: /sign in with keycloak/i }))
      .toHaveAttribute('href', '/api/auth/oidc/login');
  });

  it('FE-LOGIN-WIRE-027: the passkey button signs in and reacts to hover', () => {
    fixture.appConfig.passkey_login = true;
    fixture.appConfig.passkey_configured = true;
    renderPage();

    const button = screen.getByRole('button', { name: /sign in with a passkey/i });
    // No SSO button, so the passkey button brings its own divider.
    expect(screen.getByText('or')).toBeInTheDocument();

    const background = hoverRoundTrip(button, 'background');
    expect(background.hovered).not.toBe(background.before);
    expect(background.after).toBe(background.before);

    fireEvent.click(button);
    expect(fixture.handlePasskeyLogin).toHaveBeenCalled();
  });

  it('FE-LOGIN-WIRE-028: the passkey button borrows the SSO divider instead of adding a second one', () => {
    fixture.appConfig.oidc_configured = true;
    fixture.appConfig.oidc_login = true;
    fixture.appConfig.passkey_login = true;
    fixture.appConfig.passkey_configured = true;
    renderPage();

    expect(screen.getAllByText('or')).toHaveLength(1);
    expect(screen.getByRole('button', { name: /sign in with a passkey/i })).toBeInTheDocument();
  });

  it('FE-LOGIN-WIRE-029: the passkey button is inert while a sign-in is running', () => {
    fixture.appConfig.passkey_login = true;
    fixture.appConfig.passkey_configured = true;
    fixture.isLoading = true;
    renderPage();

    const button = screen.getByRole('button', { name: /sign in with a passkey/i });
    expect(button).toBeDisabled();
    expect(button.style.cursor).toBe('default');
    expect(button.style.opacity).toBe('0.7');

    fireEvent.click(button);
    expect(fixture.handlePasskeyLogin).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-WIRE-030: passkeys stay hidden during the MFA and password-change steps', () => {
    fixture.appConfig.passkey_login = true;
    fixture.appConfig.passkey_configured = true;
    fixture.mfaStep = true;
    renderPage();

    expect(screen.queryByRole('button', { name: /sign in with a passkey/i })).toBeNull();
  });

  it('FE-LOGIN-WIRE-031: the demo button lifts on hover and starts the demo login', () => {
    fixture.appConfig.demo_mode = true;
    renderPage();

    const button = screen.getByRole('button', { name: /try the demo/i });
    const { before, hovered, after } = hoverRoundTrip(button, 'transform');
    expect(hovered).toBe('translateY(-1px)');
    expect(before).toBe('');
    expect(after).toBe('translateY(0)');

    fireEvent.click(button);
    expect(fixture.handleDemoLogin).toHaveBeenCalled();
  });

  it('FE-LOGIN-WIRE-032: the demo button is inert while a login is running', () => {
    fixture.appConfig.demo_mode = true;
    fixture.isLoading = true;
    renderPage();

    const button = screen.getByRole('button', { name: /try the demo/i });
    expect(button).toBeDisabled();
    expect(button.style.cursor).toBe('default');
    expect(button.style.opacity).toBe('0.7');

    fireEvent.click(button);
    expect(fixture.handleDemoLogin).not.toHaveBeenCalled();
  });

  it('FE-LOGIN-WIRE-033: demo instances hide the register toggle', () => {
    fixture.appConfig.demo_mode = true;
    renderPage();

    expect(screen.queryByRole('button', { name: /^register$/i })).toBeNull();
  });
});
