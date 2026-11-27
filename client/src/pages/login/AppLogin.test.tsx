// FE-LOGIN-APP-001 to FE-LOGIN-APP-011: the sign-in screen inside the iOS/Android app
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildAppConfig } from '../../../tests/helpers/factories';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import { nativeServerHost } from '../../native/platform';
import { TrekShell } from '../../native/trekShell';
import AppLogin from './AppLogin';
import type { useLogin } from './useLogin';

type Login = ReturnType<typeof useLogin>;

vi.mock('../../native/platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../native/platform')>()),
  nativeServerHost: vi.fn(),
}));
vi.mock('../../native/trekShell', () => ({ TrekShell: { resetServer: vi.fn() } }));
// The landscape is a WebGL loop, which jsdom cannot draw.
vi.mock('../../../native-shell/scenery', () => ({ startScenery: vi.fn(), cameraForPlan: () => [0, 0] }));

function buildLogin(overrides: Partial<Login> = {}): Login {
  const login = {
    navigate: vi.fn(),
    nativeApp: true,
    mode: 'login',
    setMode: vi.fn(),
    username: '',
    setUsername: vi.fn(),
    email: '',
    setEmail: vi.fn(),
    password: '',
    setPassword: vi.fn(),
    rememberMe: true,
    setRememberMe: vi.fn(),
    showPassword: false,
    setShowPassword: vi.fn(),
    isLoading: false,
    error: '',
    setError: vi.fn(),
    insecureCookie: false,
    appConfig: buildAppConfig({ has_users: true }),
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
    showRegisterOption: false,
    oidcOnly: false,
    redirectScreen: false,
    configWait: false,
    idpSlow: false,
    idpName: 'SSO',
    handleDemoLogin: vi.fn(),
    handleSubmit: vi.fn((e: React.FormEvent) => e.preventDefault()),
    handlePasskeyLogin: vi.fn(),
    handleSsoClick: vi.fn(),
    ...overrides,
  };
  return login as unknown as Login;
}

beforeEach(() => {
  resetAllStores();
  vi.mocked(nativeServerHost).mockReturnValue('trek.example.com');
  vi.mocked(TrekShell.resetServer).mockReset().mockResolvedValue();
});

describe('AppLogin', () => {
  it('FE-LOGIN-APP-001: shows the server it signs in to, no language menu, and leads back to the address screen', () => {
    render(<AppLogin login={buildLogin()} />);
    expect(screen.getByText('trek.example.com')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change language' })).not.toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Change server' }));
    expect(TrekShell.resetServer).toHaveBeenCalled();
  });

  it('FE-LOGIN-APP-002: signs in with email and password, with the fields password managers fill', () => {
    const login = buildLogin();
    render(<AppLogin login={login} />);

    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument();
    const email = screen.getByLabelText('Email');
    const password = screen.getByLabelText('Password');
    expect(email).toHaveAttribute('autocomplete', 'username');
    expect(password).toHaveAttribute('autocomplete', 'current-password');

    fireEvent.change(email, { target: { value: 'me@example.com' } });
    fireEvent.change(password, { target: { value: 'secret' } });
    expect(login.setEmail).toHaveBeenCalledWith('me@example.com');
    expect(login.setPassword).toHaveBeenCalledWith('secret');

    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    expect(login.handleSubmit).toHaveBeenCalled();
  });

  it('FE-LOGIN-APP-003: shows the password, remembers the login and keeps the way to a new password last', () => {
    const login = buildLogin();
    render(<AppLogin login={login} />);

    fireEvent.click(screen.getByRole('button', { name: 'Show password' }));
    expect(login.setShowPassword).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Remember me' }));
    expect(login.setRememberMe).toHaveBeenCalledWith(false);

    const forgot = screen.getByRole('button', { name: 'Forgot password?' });
    const buttons = screen.getAllByRole('button');
    expect(buttons[buttons.length - 1]).toBe(forgot);
    fireEvent.click(forgot);
    expect(login.navigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('FE-LOGIN-APP-004: offers SSO beside the password, carrying the remember-me choice', () => {
    const login = buildLogin({
      rememberMe: false,
      appConfig: buildAppConfig({
        has_users: true,
        oidc_configured: true,
        oidc_login: true,
        oidc_display_name: 'Pocket ID',
      }),
    });
    render(<AppLogin login={login} />);

    const sso = screen.getByRole('link', { name: 'Sign in with Pocket ID' });
    expect(sso).toHaveAttribute('href', '/api/auth/oidc/login?remember=0');
    fireEvent.click(sso);
    expect(login.handleSsoClick).toHaveBeenCalled();
  });

  it('FE-LOGIN-APP-005: offers only SSO on an OIDC-only install', () => {
    render(
      <AppLogin
        login={buildLogin({
          oidcOnly: true,
          inviteToken: 'abc',
          appConfig: buildAppConfig({ has_users: true, oidc_display_name: 'Authentik' }),
        })}
      />
    );
    expect(screen.getByRole('link', { name: 'Sign in with Authentik' })).toHaveAttribute(
      'href',
      '/api/auth/oidc/login?invite=abc&remember=1'
    );
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('FE-LOGIN-APP-006: offers a passkey where the server allows one', () => {
    const login = buildLogin({
      appConfig: buildAppConfig({ has_users: true, passkey_login: true, passkey_configured: true }),
    });
    render(<AppLogin login={login} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with a passkey' }));
    expect(login.handlePasskeyLogin).toHaveBeenCalled();
  });

  it('FE-LOGIN-APP-007: asks for the one-time code in the second step, with the way back', () => {
    const login = buildLogin({ mfaStep: true, email: 'me@example.com' });
    render(<AppLogin login={login} />);

    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    const code = document.getElementById('totp') as HTMLInputElement;
    expect(code).toHaveAttribute('autocomplete', 'one-time-code');
    fireEvent.change(code, { target: { value: 'ab12cd' } });
    expect(login.setMfaCode).toHaveBeenCalledWith('AB12CD');

    fireEvent.click(screen.getByRole('button', { name: '← Back to sign in' }));
    expect(login.setMfaStep).toHaveBeenCalledWith(false);
    expect(login.setMfaCode).toHaveBeenCalledWith('');
  });

  it('FE-LOGIN-APP-008: sets a new password when the account must change it', () => {
    const login = buildLogin({ passwordChangeStep: true });
    render(<AppLogin login={login} />);
    fireEvent.change(screen.getByLabelText('New password'), { target: { value: 'Abcdefgh1!' } });
    fireEvent.change(screen.getByLabelText('Confirm new password'), { target: { value: 'Abcdefgh1!' } });
    expect(login.setNewPassword).toHaveBeenCalledWith('Abcdefgh1!');
    expect(login.setConfirmPassword).toHaveBeenCalledWith('Abcdefgh1!');
    expect(screen.queryByRole('button', { name: 'Forgot password?' })).not.toBeInTheDocument();
  });

  it('FE-LOGIN-APP-009: switches to registering where the server allows it', () => {
    const login = buildLogin({ showRegisterOption: true });
    const { rerender } = render(<AppLogin login={login} />);
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(login.setMode).toHaveBeenCalled();

    rerender(<AppLogin login={buildLogin({ showRegisterOption: true, mode: 'register' })} />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password');
  });

  it('FE-LOGIN-APP-010: shows errors and waits in the address screen style', () => {
    const { rerender } = render(<AppLogin login={buildLogin({ error: 'Invalid credentials' })} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid credentials');

    rerender(<AppLogin login={buildLogin({ redirectScreen: true, idpSlow: true, idpName: 'Authentik' })} />);
    expect(screen.getByRole('status')).toHaveTextContent('Authentik');
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument();

    rerender(<AppLogin login={buildLogin({ configWait: true })} />);
    expect(screen.getByRole('status', { name: 'Loading...' })).toBeInTheDocument();
  });

  it('FE-LOGIN-APP-011: steps back once signed in instead of playing the takeoff', () => {
    const { container } = render(<AppLogin login={buildLogin({ showTakeoff: true })} />);
    expect(container.querySelector('.app-login')).toHaveClass('al-leaving');
    expect(container.querySelector('.takeoff-overlay')).not.toBeInTheDocument();
  });
});
