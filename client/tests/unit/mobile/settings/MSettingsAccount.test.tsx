// FE-MOB-SETACC-001 to FE-MOB-SETACC-070
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { startRegistration } from '@simplewebauthn/browser';
import { render, screen, fireEvent, waitFor, within } from '../../../helpers/render';
import { server } from '../../../helpers/msw/server';
import { resetAllStores, seedStore } from '../../../helpers/store';
import { buildUser, buildAppConfig } from '../../../helpers/factories';
import { useAuthStore } from '../../../../src/store/authStore';
import { ToastContainer } from '../../../../src/components/shared/Toast';
import type { PasskeyCredential } from '../../../../src/api/client';
import type { UserWithOidc } from '../../../../src/types';
import MSettingsAccount from '../../../../src/mobile/screens/settings/MSettingsAccount';

const navigateMock = vi.fn();

vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@simplewebauthn/browser', () => ({ startRegistration: vi.fn() }));

const webauthn = startRegistration as unknown as ReturnType<typeof vi.fn>;

const BACKUP_KEY = 'trek_mfa_backup_codes_pending';

function appConfig(extra: Record<string, unknown> = {}) {
  return http.get('/api/auth/app-config', () => HttpResponse.json({ ...buildAppConfig(), ...extra }));
}

function passkeyList(credentials: PasskeyCredential[] = []) {
  return http.get('/api/auth/passkey/credentials', () => HttpResponse.json({ credentials }));
}

function buildCredential(overrides: Partial<PasskeyCredential> = {}): PasskeyCredential {
  return {
    id: 1,
    name: 'iPhone',
    device_type: 'platform',
    backed_up: true,
    created_at: '2025-03-04 10:00:00',
    last_used_at: null,
    ...overrides,
  };
}

function renderAccount(initialEntries: string[] = ['/settings']) {
  return render(
    <>
      <ToastContainer />
      <MSettingsAccount />
    </>,
    { initialEntries },
  );
}

function fileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

function passwordInputs(): HTMLInputElement[] {
  return Array.from(document.querySelectorAll<HTMLInputElement>('input[type="password"]'));
}

beforeEach(() => {
  resetAllStores();
  navigateMock.mockReset();
  webauthn.mockReset();
  server.use(appConfig(), passkeyList());
  seedStore(useAuthStore, {
    isAuthenticated: true,
    user: buildUser({ username: 'maurice', email: 'maurice@example.com', role: 'user' }),
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Profile & identity ───────────────────────────────────────────────────────

describe('MSettingsAccount – profile', () => {
  it('FE-MOB-SETACC-001: prefills username and email from the signed-in user', () => {
    renderAccount();

    expect(screen.getByDisplayValue('maurice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('maurice@example.com')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-002: an admin account is labelled Administrator', () => {
    seedStore(useAuthStore, { user: buildUser({ username: 'root', role: 'admin' }) });
    renderAccount();

    expect(screen.getByText('Administrator')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-003: an OIDC-linked account shows the SSO badge and the stripped issuer', () => {
    seedStore(useAuthStore, {
      user: buildUser({ username: 'sso', oidc_issuer: 'https://auth.example.com/' } as Partial<UserWithOidc>),
    });
    renderAccount();

    expect(screen.getByText('SSO')).toBeInTheDocument();
    expect(screen.getByText(/Linked with auth\.example\.com$/)).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-004: without an avatar the initial is shown and there is no remove button', () => {
    renderAccount();

    expect(screen.getByText('M')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Remove Profile Picture' })).not.toBeInTheDocument();
  });

  it('FE-MOB-SETACC-005: an existing avatar renders as an image with a remove button', () => {
    seedStore(useAuthStore, {
      user: buildUser({ username: 'maurice', avatar_url: 'https://cdn.example.com/a.jpg' }),
    });
    renderAccount();

    const img = document.querySelector('img') as HTMLImageElement;
    expect(img.src).toBe('https://cdn.example.com/a.jpg');
    expect(screen.getByRole('button', { name: 'Remove Profile Picture' })).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-006: the camera button opens the hidden file input', async () => {
    const user = userEvent.setup();
    const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Upload Profile Picture' }));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it('FE-MOB-SETACC-007: picking a file uploads it and toasts success', async () => {
    const uploadAvatar = vi.fn().mockResolvedValue({ avatar_url: '/uploads/a.jpg' });
    seedStore(useAuthStore, { uploadAvatar });
    renderAccount();

    const file = new File(['x'], 'avatar.png', { type: 'image/png' });
    fireEvent.change(fileInput(), { target: { files: [file] } });

    await screen.findByText('Profile picture updated');
    expect(uploadAvatar).toHaveBeenCalledWith(file);
  });

  it('FE-MOB-SETACC-008: a failing upload toasts the upload error', async () => {
    seedStore(useAuthStore, { uploadAvatar: vi.fn().mockRejectedValue(new Error('too large')) });
    renderAccount();

    fireEvent.change(fileInput(), { target: { files: [new File(['x'], 'a.png', { type: 'image/png' })] } });

    await screen.findByText('Upload failed');
  });

  it('FE-MOB-SETACC-009: a change event without a file is ignored', () => {
    const uploadAvatar = vi.fn();
    seedStore(useAuthStore, { uploadAvatar });
    renderAccount();

    fireEvent.change(fileInput(), { target: { files: [] } });

    expect(uploadAvatar).not.toHaveBeenCalled();
  });

  it('FE-MOB-SETACC-010: the remove button deletes the avatar and toasts', async () => {
    const user = userEvent.setup();
    const deleteAvatar = vi.fn().mockResolvedValue(undefined);
    seedStore(useAuthStore, {
      user: buildUser({ username: 'maurice', avatar_url: '/uploads/a.jpg' }),
      deleteAvatar,
    });
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Remove Profile Picture' }));

    expect(deleteAvatar).toHaveBeenCalled();
    await screen.findByText('Profile picture removed');
  });

  it('FE-MOB-SETACC-011: a failing avatar removal toasts the error', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, {
      user: buildUser({ username: 'maurice', avatar_url: '/uploads/a.jpg' }),
      deleteAvatar: vi.fn().mockRejectedValue(new Error('nope')),
    });
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Remove Profile Picture' }));

    await screen.findByText('Removal failed');
  });

  it('FE-MOB-SETACC-012: Save sends the edited fields through updateProfile', async () => {
    const user = userEvent.setup();
    const updateProfile = vi.fn().mockResolvedValue(undefined);
    seedStore(useAuthStore, { updateProfile });
    renderAccount();

    const username = screen.getByDisplayValue('maurice');
    await user.clear(username);
    await user.type(username, 'mo');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateProfile).toHaveBeenCalledWith({ username: 'mo', email: 'maurice@example.com' });
    await screen.findByText('Profile saved');
  });

  it('FE-MOB-SETACC-013a: the email field is editable and reaches updateProfile', async () => {
    const user = userEvent.setup();
    const updateProfile = vi.fn().mockResolvedValue(undefined);
    seedStore(useAuthStore, { updateProfile });
    renderAccount();

    const email = screen.getByDisplayValue('maurice@example.com');
    await user.clear(email);
    await user.type(email, 'mo@example.com');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(updateProfile).toHaveBeenCalledWith({ username: 'maurice', email: 'mo@example.com' });
  });

  it('FE-MOB-SETACC-013b: a rejection that is not an Error falls back to the generic message', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { updateProfile: vi.fn().mockRejectedValue('boom') });
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Error');
  });

  it('FE-MOB-SETACC-013c: without a signed-in user both profile fields start empty', () => {
    seedStore(useAuthStore, { user: null });
    renderAccount();

    const username = document.querySelector('input:not([type])') as HTMLInputElement;
    const email = document.querySelector('input[type="email"]') as HTMLInputElement;
    expect(username.value).toBe('');
    expect(email.value).toBe('');
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-013: a rejected profile save surfaces the error message', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { updateProfile: vi.fn().mockRejectedValue(new Error('Email already taken')) });
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Email already taken');
  });

  it('FE-MOB-SETACC-014: Save is disabled while the request is in flight', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { updateProfile: vi.fn().mockReturnValue(new Promise(() => {})) });
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });
});

// ── Password ─────────────────────────────────────────────────────────────────

describe('MSettingsAccount – password', () => {
  it('FE-MOB-SETACC-015: the card is hidden when the instance runs OIDC-only', async () => {
    server.use(appConfig({ oidc_only_mode: true }));
    renderAccount();

    await waitFor(() => expect(screen.queryByText('Change Password')).not.toBeInTheDocument());
  });

  it('FE-MOB-SETACC-016: a failing app-config request leaves the card in place', async () => {
    server.use(http.get('/api/auth/app-config', () => HttpResponse.json({ error: 'down' }, { status: 500 })));
    renderAccount();

    // Both app-config consumers swallow the error: the passkey card settles to
    // "off" and the password card stays visible.
    await waitFor(() => expect(screen.queryByText('Passkeys')).not.toBeInTheDocument());
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-017: an empty current password is rejected', async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await screen.findByText('Current password is required');
  });

  it('FE-MOB-SETACC-018: an empty new password is rejected', async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.type(screen.getByPlaceholderText('Current password'), 'old-secret');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await screen.findByText('Please enter current and new password');
  });

  it('FE-MOB-SETACC-019: a new password below eight characters is rejected', async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.type(screen.getByPlaceholderText('Current password'), 'old-secret');
    await user.type(screen.getByPlaceholderText('New password'), 'short');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'short');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await screen.findByText('Password must be at least 8 characters');
  });

  it('FE-MOB-SETACC-020: a mismatching confirmation is rejected', async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.type(screen.getByPlaceholderText('Current password'), 'old-secret');
    await user.type(screen.getByPlaceholderText('New password'), 'NewPassword1!');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'NewPassword2!');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await screen.findByText('Passwords do not match');
  });

  it('FE-MOB-SETACC-021: a valid change hits the API and clears the three fields', async () => {
    const user = userEvent.setup();
    let payload: { current_password?: string; new_password?: string } | null = null;
    server.use(
      http.put('/api/auth/me/password', async ({ request }) => {
        payload = (await request.json()) as { current_password?: string; new_password?: string };
        return HttpResponse.json({ success: true });
      }),
    );
    renderAccount();

    await user.type(screen.getByPlaceholderText('Current password'), 'old-secret');
    await user.type(screen.getByPlaceholderText('New password'), 'NewPassword1!');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'NewPassword1!');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await screen.findByText('Password changed successfully');
    expect(payload).toEqual({ current_password: 'old-secret', new_password: 'NewPassword1!' });
    await waitFor(() => expect(passwordInputs().every((i) => i.value === '')).toBe(true));
  });

  it('FE-MOB-SETACC-022: a rejected change shows the server message', async () => {
    const user = userEvent.setup();
    server.use(
      http.put('/api/auth/me/password', () => HttpResponse.json({ error: 'Wrong password' }, { status: 400 })),
    );
    renderAccount();

    await user.type(screen.getByPlaceholderText('Current password'), 'nope');
    await user.type(screen.getByPlaceholderText('New password'), 'NewPassword1!');
    await user.type(screen.getByPlaceholderText('Confirm new password'), 'NewPassword1!');
    await user.click(screen.getByRole('button', { name: 'Update password' }));

    await screen.findByText('Wrong password');
  });
});

// ── Two-factor authentication ────────────────────────────────────────────────

describe('MSettingsAccount – MFA', () => {
  const mfaSetupHandler = http.post('/api/auth/mfa/setup', () =>
    HttpResponse.json({ qr_svg: '<svg data-qr="1"></svg>', secret: 'JBSWY3DPEHPK3PXP' }),
  );

  async function openSetup(user: ReturnType<typeof userEvent.setup>) {
    server.use(mfaSetupHandler);
    renderAccount();
    await user.click(screen.getByRole('button', { name: 'Set up authenticator' }));
    await screen.findByText('JBSWY3DPEHPK3PXP');
  }

  it('FE-MOB-SETACC-023: demo mode replaces the controls with the demo notice', () => {
    seedStore(useAuthStore, { demoMode: true });
    renderAccount();

    expect(screen.getByText('Not available in demo mode')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Set up authenticator' })).not.toBeInTheDocument();
  });

  it('FE-MOB-SETACC-024: the ?mfa=required entry shows the policy banner', () => {
    renderAccount(['/settings?mfa=required']);

    expect(screen.getByText(/requires two-factor authentication/i)).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-025: an instance-wide MFA requirement shows the same banner', () => {
    seedStore(useAuthStore, { appRequireMfa: true });
    renderAccount();

    expect(screen.getByText(/requires two-factor authentication/i)).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-026: the banner stays hidden once 2FA is on', () => {
    seedStore(useAuthStore, { appRequireMfa: true, user: buildUser({ username: 'maurice', mfa_enabled: true }) });
    renderAccount();

    expect(screen.queryByText(/requires two-factor authentication/i)).not.toBeInTheDocument();
    expect(screen.getByText('2FA is enabled on your account.')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-027: setup fetches the QR code and the manual secret', async () => {
    const user = userEvent.setup();
    await openSetup(user);

    expect(document.querySelector('svg[data-qr="1"]')).not.toBeNull();
    expect(screen.getByPlaceholderText('6-digit code')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-028: the code field drops non-digits and caps at eight', async () => {
    const user = userEvent.setup();
    await openSetup(user);

    const code = screen.getByPlaceholderText('6-digit code') as HTMLInputElement;
    await user.type(code, 'ab123456789');
    expect(code.value).toBe('12345678');
  });

  it('FE-MOB-SETACC-029: Enable stays disabled below six digits', async () => {
    const user = userEvent.setup();
    await openSetup(user);

    await user.type(screen.getByPlaceholderText('6-digit code'), '12345');
    expect(screen.getByRole('button', { name: 'Enable 2FA' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('6-digit code'), '6');
    expect(screen.getByRole('button', { name: 'Enable 2FA' })).toBeEnabled();
  });

  it('FE-MOB-SETACC-030: cancelling setup returns to the setup button', async () => {
    const user = userEvent.setup();
    await openSetup(user);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText('JBSWY3DPEHPK3PXP')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set up authenticator' })).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-031: a failing setup shows the server message', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/auth/mfa/setup', () => HttpResponse.json({ error: 'MFA is off' }, { status: 400 })));
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Set up authenticator' }));

    await screen.findByText('MFA is off');
  });

  it('FE-MOB-SETACC-032: enabling stores the backup codes and renders them', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/auth/mfa/enable', () => HttpResponse.json({ backup_codes: ['AAAA-1111', 'BBBB-2222'] })),
      http.get('/api/auth/me', () => HttpResponse.json({ user: buildUser({ username: 'maurice', mfa_enabled: true }) })),
    );
    await openSetup(user);

    await user.type(screen.getByPlaceholderText('6-digit code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Enable 2FA' }));

    await screen.findByText('Two-factor authentication enabled');
    expect(screen.getByText(/AAAA-1111/)).toBeInTheDocument();
    expect(JSON.parse(sessionStorage.getItem(BACKUP_KEY) || '[]')).toEqual(['AAAA-1111', 'BBBB-2222']);
  });

  it('FE-MOB-SETACC-033: enabling without backup codes leaves nothing stored', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/auth/mfa/enable', () => HttpResponse.json({ success: true })));
    await openSetup(user);

    await user.type(screen.getByPlaceholderText('6-digit code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Enable 2FA' }));

    await screen.findByText('Two-factor authentication enabled');
    expect(sessionStorage.getItem(BACKUP_KEY)).toBeNull();
    expect(screen.queryByText('Backup codes')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETACC-034: a rejected enable shows the server message', async () => {
    const user = userEvent.setup();
    server.use(http.post('/api/auth/mfa/enable', () => HttpResponse.json({ error: 'Invalid code' }, { status: 400 })));
    await openSetup(user);

    await user.type(screen.getByPlaceholderText('6-digit code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Enable 2FA' }));

    await screen.findByText('Invalid code');
  });

  it('FE-MOB-SETACC-035: the disable form needs both a password and a six-digit code', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { user: buildUser({ username: 'maurice', mfa_enabled: true }) });
    renderAccount();

    expect(screen.getByRole('button', { name: 'Disable 2FA' })).toBeDisabled();

    const mfaPassword = passwordInputs()[passwordInputs().length - 1];
    await user.type(mfaPassword, 'my-password');
    await user.type(screen.getByPlaceholderText('6-digit code'), '12345');
    expect(screen.getByRole('button', { name: 'Disable 2FA' })).toBeDisabled();

    await user.type(screen.getByPlaceholderText('6-digit code'), '6');
    expect(screen.getByRole('button', { name: 'Disable 2FA' })).toBeEnabled();
  });

  it('FE-MOB-SETACC-036: disabling calls the API and drops the stored backup codes', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(['AAAA-1111']));
    seedStore(useAuthStore, { user: buildUser({ username: 'maurice', mfa_enabled: true }) });
    let payload: { password?: string; code?: string } | null = null;
    server.use(
      http.post('/api/auth/mfa/disable', async ({ request }) => {
        payload = (await request.json()) as { password?: string; code?: string };
        return HttpResponse.json({ success: true });
      }),
    );
    renderAccount();

    await screen.findByText(/AAAA-1111/);
    await user.type(passwordInputs()[passwordInputs().length - 1], 'my-password');
    await user.type(screen.getByPlaceholderText('6-digit code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Disable 2FA' }));

    await screen.findByText('Two-factor authentication disabled');
    expect(payload).toEqual({ password: 'my-password', code: '123456' });
    expect(sessionStorage.getItem(BACKUP_KEY)).toBeNull();
  });

  it('FE-MOB-SETACC-037: a rejected disable shows the server message', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { user: buildUser({ username: 'maurice', mfa_enabled: true }) });
    server.use(
      http.post('/api/auth/mfa/disable', () => HttpResponse.json({ error: 'Code expired' }, { status: 400 })),
    );
    renderAccount();

    await user.type(passwordInputs()[passwordInputs().length - 1], 'my-password');
    await user.type(screen.getByPlaceholderText('6-digit code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Disable 2FA' }));

    await screen.findByText('Code expired');
  });
});

// ── Backup codes ─────────────────────────────────────────────────────────────

describe('MSettingsAccount – backup codes', () => {
  beforeEach(() => {
    seedStore(useAuthStore, { user: buildUser({ username: 'maurice', mfa_enabled: true }) });
  });

  it('FE-MOB-SETACC-038: pending codes are restored from sessionStorage', async () => {
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(['AAAA-1111', 'BBBB-2222']));
    renderAccount();

    expect(await screen.findByText('Backup codes')).toBeInTheDocument();
    expect(screen.getByText(/AAAA-1111\s+BBBB-2222/)).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-039: a corrupt payload is dropped from sessionStorage', () => {
    sessionStorage.setItem(BACKUP_KEY, '{not json');
    renderAccount();

    expect(sessionStorage.getItem(BACKUP_KEY)).toBeNull();
    expect(screen.queryByText('Backup codes')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETACC-040: a payload that is not a list of strings is ignored but kept', () => {
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify([1, 2]));
    renderAccount();

    expect(screen.queryByText('Backup codes')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(BACKUP_KEY)).toBe('[1,2]');
  });

  it('FE-MOB-SETACC-041: an empty list is ignored', () => {
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify([]));
    renderAccount();

    expect(screen.queryByText('Backup codes')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETACC-042: Copy codes writes the joined list to the clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, writable: true, configurable: true });
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(['AAAA-1111', 'BBBB-2222']));
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'Copy codes' }));

    expect(writeText).toHaveBeenCalledWith('AAAA-1111\nBBBB-2222');
    await screen.findByText('Backup codes copied');
  });

  it('FE-MOB-SETACC-043: a blocked clipboard toasts an error', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
      writable: true,
      configurable: true,
    });
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(['AAAA-1111']));
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'Copy codes' }));

    await screen.findByText('Error');
  });

  it('FE-MOB-SETACC-044: Download TXT builds a blob and revokes the object URL', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:codes');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    let downloadName = '';
    const anchorClick = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(function (this: HTMLAnchorElement) {
        downloadName = this.download;
      });
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(['AAAA-1111']));
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'Download TXT' }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(downloadName).toBe('trek-mfa-backup-codes.txt');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:codes');
    expect(document.querySelector('a[download]')).toBeNull();

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    anchorClick.mockRestore();
  });

  it('FE-MOB-SETACC-045: Print writes the codes into the popup and triggers print', async () => {
    const user = userEvent.setup();
    const written: string[] = [];
    const print = vi.fn();
    const popup = {
      document: { open: vi.fn(), write: (html: string) => written.push(html), close: vi.fn() },
      focus: vi.fn(),
      print,
    };
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(popup as unknown as Window);
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(['AAAA-1111']));
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'Print / PDF' }));

    expect(openSpy).toHaveBeenCalledWith('', '_blank', 'width=900,height=700');
    expect(written.join('')).toContain('AAAA-1111');
    expect(print).toHaveBeenCalled();
    openSpy.mockRestore();
  });

  it('FE-MOB-SETACC-046: a blocked popup leaves printing a no-op', async () => {
    const user = userEvent.setup();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(['AAAA-1111']));
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'Print / PDF' }));

    expect(openSpy).toHaveBeenCalled();
    expect(screen.getByText('Backup codes')).toBeInTheDocument();
    openSpy.mockRestore();
  });

  it('FE-MOB-SETACC-047: OK dismisses the codes and clears sessionStorage', async () => {
    const user = userEvent.setup();
    sessionStorage.setItem(BACKUP_KEY, JSON.stringify(['AAAA-1111']));
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'OK' }));

    expect(screen.queryByText('Backup codes')).not.toBeInTheDocument();
    expect(sessionStorage.getItem(BACKUP_KEY)).toBeNull();
  });
});

// ── Account deletion ─────────────────────────────────────────────────────────

describe('MSettingsAccount – deletion', () => {
  it('FE-MOB-SETACC-048: a regular user gets the confirmation sheet', async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Delete your account?')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-049: cancelling closes the sheet again', async () => {
    const user = userEvent.setup();
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByText('Delete your account?');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByText('Delete your account?')).not.toBeInTheDocument());
  });

  it('FE-MOB-SETACC-050: confirming deletes the account, logs out and returns to the login', async () => {
    const user = userEvent.setup();
    const logout = vi.fn();
    seedStore(useAuthStore, { logout });
    let deleted = false;
    server.use(
      http.delete('/api/auth/me', () => {
        deleted = true;
        return HttpResponse.json({ success: true });
      }),
    );
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByText('Delete your account?');
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    await waitFor(() => expect(deleted).toBe(true));
    expect(logout).toHaveBeenCalled();
    expect(navigateMock).toHaveBeenCalledWith('/login', { state: { noRedirect: true } });
  });

  it('FE-MOB-SETACC-051: a failing deletion toasts and closes the sheet', async () => {
    const user = userEvent.setup();
    server.use(http.delete('/api/auth/me', () => HttpResponse.json({ error: 'Still an owner' }, { status: 409 })));
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByText('Delete your account?');
    await user.click(screen.getByRole('button', { name: 'Delete permanently' }));

    await screen.findByText('Still an owner');
    await waitFor(() => expect(screen.queryByText('Delete your account?')).not.toBeInTheDocument());
  });

  it('FE-MOB-SETACC-052: the last remaining admin is blocked', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { user: buildUser({ username: 'root', role: 'admin' }) });
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Deletion not possible')).toBeInTheDocument();
    expect(screen.queryByText('Delete your account?')).not.toBeInTheDocument();
  });

  it('FE-MOB-SETACC-053: the blocked sheet closes on OK', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { user: buildUser({ username: 'root', role: 'admin' }) });
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await screen.findByText('Deletion not possible');
    await user.click(screen.getByRole('button', { name: 'OK' }));

    await waitFor(() => expect(screen.queryByText('Deletion not possible')).not.toBeInTheDocument());
  });

  it('FE-MOB-SETACC-054: an admin with a second admin gets the normal confirmation', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { user: buildUser({ username: 'root', role: 'admin' }) });
    server.use(
      http.get('/api/admin/users', () =>
        HttpResponse.json({ users: [buildUser({ role: 'admin' }), buildUser({ role: 'admin' })] }),
      ),
    );
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Delete your account?')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-055: a failing admin lookup falls through to the normal confirmation', async () => {
    const user = userEvent.setup();
    seedStore(useAuthStore, { user: buildUser({ username: 'root', role: 'admin' }) });
    server.use(http.get('/api/admin/stats', () => HttpResponse.json({ error: 'nope' }, { status: 500 })));
    renderAccount();

    await user.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Delete your account?')).toBeInTheDocument();
  });
});

// ── Passkeys ─────────────────────────────────────────────────────────────────

describe('MSettingsAccount – passkeys', () => {
  const onCard = () => appConfig({ passkey_login: true, passkey_configured: true });

  it('FE-MOB-SETACC-056: the card is not rendered in demo mode', async () => {
    seedStore(useAuthStore, { demoMode: true });
    server.use(onCard());
    renderAccount();

    await waitFor(() => expect(screen.queryByText('Passkeys')).not.toBeInTheDocument());
  });

  it('FE-MOB-SETACC-057: the card disappears when the feature is off and there is no credential', async () => {
    renderAccount();

    await waitFor(() => expect(screen.queryByText('Passkeys')).not.toBeInTheDocument());
  });

  it('FE-MOB-SETACC-058: a failing credential list still settles the card', async () => {
    server.use(
      http.get('/api/auth/passkey/credentials', () => HttpResponse.json({ error: 'boom' }, { status: 500 })),
    );
    renderAccount();

    await waitFor(() => expect(screen.queryByText('Passkeys')).not.toBeInTheDocument());
  });

  it('FE-MOB-SETACC-059: existing credentials keep the card even with the feature off', async () => {
    server.use(passkeyList([buildCredential({ name: 'Old key' })]));
    renderAccount();

    expect(await screen.findByText('Old key')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
  });

  it('FE-MOB-SETACC-060: enabled but unconfigured shows the server hint and no add button', async () => {
    server.use(appConfig({ passkey_login: true, passkey_configured: false }));
    renderAccount();

    expect(await screen.findByText(/not fully configured on this server/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add a passkey' })).not.toBeInTheDocument();
  });

  it('FE-MOB-SETACC-061: credentials render with their sync state and dates', async () => {
    server.use(
      onCard(),
      passkeyList([
        buildCredential({ id: 1, name: 'iPhone', backed_up: true, last_used_at: '2025-04-05 08:00:00' }),
        buildCredential({ id: 2, name: null, backed_up: false, created_at: 'not-a-date', last_used_at: null }),
        buildCredential({ id: 3, name: 'Yubikey', created_at: '', last_used_at: null }),
        buildCredential({ id: 4, name: 'Tablet', created_at: '2025-05-06T09:00:00Z', last_used_at: null }),
      ]),
    );
    renderAccount();

    const first = (await screen.findByText('iPhone')).closest('li') as HTMLElement;
    expect(within(first).getByText('Synced')).toBeInTheDocument();
    expect(first.textContent).toContain('Added: 3/4/2025');
    expect(first.textContent).toContain('Last used: 4/5/2025');

    const second = screen.getByText('Passkey').closest('li') as HTMLElement;
    expect(within(second).getByText('This device')).toBeInTheDocument();
    expect(second.textContent).toContain('Added: — · Never used');

    // Empty timestamp and a full ISO timestamp both go through fmtDate.
    expect((screen.getByText('Yubikey').closest('li') as HTMLElement).textContent).toContain('Added: —');
    expect((screen.getByText('Tablet').closest('li') as HTMLElement).textContent).toContain('Added: 5/6/2025');
  });

  it('FE-MOB-SETACC-061a: renaming an unnamed credential starts from an empty field', async () => {
    const user = userEvent.setup();
    server.use(onCard(), passkeyList([buildCredential({ name: null })]));
    renderAccount();

    const row = (await screen.findByText('Passkey')).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Rename' }));

    expect((within(row).getByRole('textbox') as HTMLInputElement).value).toBe('');
  });

  it('FE-MOB-SETACC-062: renaming a credential patches the new name and refreshes', async () => {
    const user = userEvent.setup();
    let payload: { name?: string } | null = null;
    let renamedId = '';
    server.use(
      onCard(),
      passkeyList([buildCredential({ name: 'iPhone' })]),
      http.patch('/api/auth/passkey/credentials/:id', async ({ request, params }) => {
        payload = (await request.json()) as { name?: string };
        renamedId = String(params.id);
        server.use(passkeyList([buildCredential({ name: 'Work key' })]));
        return HttpResponse.json({ success: true });
      }),
    );
    renderAccount();

    const row = (await screen.findByText('iPhone')).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Rename' }));
    const editor = within(row).getByDisplayValue('iPhone');
    await user.clear(editor);
    await user.type(editor, 'Work key');
    await user.click(within(row).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(payload).toEqual({ name: 'Work key' }));
    expect(renamedId).toBe('1');
    expect(await screen.findByText('Work key')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-063: Enter commits the rename', async () => {
    const user = userEvent.setup();
    let patched = false;
    server.use(
      onCard(),
      passkeyList([buildCredential({ name: 'iPhone' })]),
      http.patch('/api/auth/passkey/credentials/:id', () => {
        patched = true;
        return HttpResponse.json({ success: true });
      }),
    );
    renderAccount();

    const row = (await screen.findByText('iPhone')).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Rename' }));
    await user.type(within(row).getByDisplayValue('iPhone'), '{Enter}');

    await waitFor(() => expect(patched).toBe(true));
  });

  it('FE-MOB-SETACC-064: Escape aborts the rename without a request', async () => {
    const user = userEvent.setup();
    let patched = false;
    server.use(
      onCard(),
      passkeyList([buildCredential({ name: 'iPhone' })]),
      http.patch('/api/auth/passkey/credentials/:id', () => {
        patched = true;
        return HttpResponse.json({ success: true });
      }),
    );
    renderAccount();

    const row = (await screen.findByText('iPhone')).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Rename' }));
    await user.type(within(row).getByDisplayValue('iPhone'), '{Escape}');

    expect(screen.queryByDisplayValue('iPhone')).not.toBeInTheDocument();
    expect(screen.getByText('iPhone')).toBeInTheDocument();
    expect(patched).toBe(false);
  });

  it('FE-MOB-SETACC-065: the X button leaves the rename editor', async () => {
    const user = userEvent.setup();
    server.use(onCard(), passkeyList([buildCredential({ name: 'iPhone' })]));
    renderAccount();

    const row = (await screen.findByText('iPhone')).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Rename' }));
    await user.click(within(row).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByDisplayValue('iPhone')).not.toBeInTheDocument();
    expect(screen.getByText('iPhone')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-066: an emptied name closes the editor without a request', async () => {
    const user = userEvent.setup();
    let patched = false;
    server.use(
      onCard(),
      passkeyList([buildCredential({ name: 'iPhone' })]),
      http.patch('/api/auth/passkey/credentials/:id', () => {
        patched = true;
        return HttpResponse.json({ success: true });
      }),
    );
    renderAccount();

    const row = (await screen.findByText('iPhone')).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Rename' }));
    await user.clear(within(row).getByDisplayValue('iPhone'));
    await user.click(within(row).getByRole('button', { name: 'Save' }));

    expect(patched).toBe(false);
    expect(screen.getByText('iPhone')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-067: a rejected rename shows the server message', async () => {
    const user = userEvent.setup();
    server.use(
      onCard(),
      passkeyList([buildCredential({ name: 'iPhone' })]),
      http.patch('/api/auth/passkey/credentials/:id', () =>
        HttpResponse.json({ error: 'Name taken' }, { status: 400 }),
      ),
    );
    renderAccount();

    const row = (await screen.findByText('iPhone')).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Rename' }));
    await user.type(within(row).getByDisplayValue('iPhone'), '2');
    await user.click(within(row).getByRole('button', { name: 'Save' }));

    await screen.findByText('Name taken');
  });

  it('FE-MOB-SETACC-068: deleting asks for the password and removes the credential', async () => {
    const user = userEvent.setup();
    let payload: { password?: string } | null = null;
    server.use(
      onCard(),
      passkeyList([buildCredential({ name: 'iPhone' })]),
      http.delete('/api/auth/passkey/credentials/:id', async ({ request }) => {
        payload = (await request.json()) as { password?: string };
        server.use(passkeyList([]));
        return HttpResponse.json({ success: true });
      }),
    );
    renderAccount();

    const row = (await screen.findByText('iPhone')).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Delete' }));

    const box = screen.getByText(/Remove this passkey/).parentElement as HTMLElement;
    expect(within(box).getByRole('button', { name: 'Delete' })).toBeDisabled();
    await user.type(within(box).getByPlaceholderText('Current password'), 'my-password');
    await user.click(within(box).getByRole('button', { name: 'Delete' }));

    await screen.findByText('Passkey removed');
    expect(payload).toEqual({ password: 'my-password' });
    await waitFor(() => expect(screen.queryByText('iPhone')).not.toBeInTheDocument());
  });

  it('FE-MOB-SETACC-069: a rejected delete shows the server message', async () => {
    const user = userEvent.setup();
    server.use(
      onCard(),
      passkeyList([buildCredential({ name: 'iPhone' })]),
      http.delete('/api/auth/passkey/credentials/:id', () =>
        HttpResponse.json({ error: 'Wrong password' }, { status: 403 }),
      ),
    );
    renderAccount();

    const row = (await screen.findByText('iPhone')).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Delete' }));

    const box = screen.getByText(/Remove this passkey/).parentElement as HTMLElement;
    await user.type(within(box).getByPlaceholderText('Current password'), 'nope');
    await user.click(within(box).getByRole('button', { name: 'Delete' }));

    await screen.findByText('Wrong password');
  });

  it('FE-MOB-SETACC-070: cancelling the delete step-up closes the box', async () => {
    const user = userEvent.setup();
    server.use(onCard(), passkeyList([buildCredential({ name: 'iPhone' })]));
    renderAccount();

    const row = (await screen.findByText('iPhone')).closest('li') as HTMLElement;
    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    const box = screen.getByText(/Remove this passkey/).parentElement as HTMLElement;
    await user.click(within(box).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByText(/Remove this passkey/)).not.toBeInTheDocument();
  });

  it('FE-MOB-SETACC-071: adding runs the WebAuthn ceremony and refreshes the list', async () => {
    const user = userEvent.setup();
    webauthn.mockResolvedValue({ id: 'new-credential' });
    let verifyPayload: { name?: string } | null = null;
    server.use(
      onCard(),
      passkeyList([]),
      http.post('/api/auth/passkey/register/options', () => HttpResponse.json({ challenge: 'abc' })),
      http.post('/api/auth/passkey/register/verify', async ({ request }) => {
        verifyPayload = (await request.json()) as { name?: string };
        server.use(passkeyList([buildCredential({ name: 'Work Laptop' })]));
        return HttpResponse.json({ success: true });
      }),
    );
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'Add a passkey' }));
    const form = screen.getByText('Add a passkey', { selector: 'p' }).parentElement as HTMLElement;
    expect(within(form).getByRole('button', { name: 'Add a passkey' })).toBeDisabled();
    await user.type(within(form).getByPlaceholderText('Current password'), 'my-password');
    await user.type(within(form).getByPlaceholderText(/Name \(optional/), 'Work Laptop');
    await user.click(within(form).getByRole('button', { name: 'Add a passkey' }));

    await screen.findByText('Passkey added');
    expect(webauthn).toHaveBeenCalledWith({ optionsJSON: { challenge: 'abc' } });
    expect(verifyPayload).toEqual({ attestationResponse: { id: 'new-credential' }, name: 'Work Laptop' });
    expect(await screen.findByText('Work Laptop')).toBeInTheDocument();
  });

  it('FE-MOB-SETACC-071a: adding without a name leaves the name out of the payload', async () => {
    const user = userEvent.setup();
    webauthn.mockResolvedValue({ id: 'new-credential' });
    let verifyPayload: { name?: string } | null = null;
    server.use(
      onCard(),
      http.post('/api/auth/passkey/register/options', () => HttpResponse.json({ challenge: 'abc' })),
      http.post('/api/auth/passkey/register/verify', async ({ request }) => {
        verifyPayload = (await request.json()) as { name?: string };
        return HttpResponse.json({ success: true });
      }),
    );
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'Add a passkey' }));
    const form = screen.getByText('Add a passkey', { selector: 'p' }).parentElement as HTMLElement;
    await user.type(within(form).getByPlaceholderText('Current password'), 'my-password');
    await user.type(within(form).getByPlaceholderText(/Name \(optional/), '   ');
    await user.click(within(form).getByRole('button', { name: 'Add a passkey' }));

    await screen.findByText('Passkey added');
    expect(verifyPayload).toEqual({ attestationResponse: { id: 'new-credential' } });
  });

  it('FE-MOB-SETACC-072: a cancelled ceremony toasts the cancellation', async () => {
    const user = userEvent.setup();
    webauthn.mockRejectedValue(Object.assign(new Error('aborted'), { name: 'NotAllowedError' }));
    server.use(
      onCard(),
      http.post('/api/auth/passkey/register/options', () => HttpResponse.json({ challenge: 'abc' })),
    );
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'Add a passkey' }));
    const form = screen.getByText('Add a passkey', { selector: 'p' }).parentElement as HTMLElement;
    await user.type(within(form).getByPlaceholderText('Current password'), 'my-password');
    await user.click(within(form).getByRole('button', { name: 'Add a passkey' }));

    await screen.findByText('Passkey setup cancelled');
  });

  it('FE-MOB-SETACC-073: a rejected password step-up shows the server message', async () => {
    const user = userEvent.setup();
    server.use(
      onCard(),
      http.post('/api/auth/passkey/register/options', () =>
        HttpResponse.json({ error: 'Invalid password' }, { status: 401 }),
      ),
    );
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'Add a passkey' }));
    const form = screen.getByText('Add a passkey', { selector: 'p' }).parentElement as HTMLElement;
    await user.type(within(form).getByPlaceholderText('Current password'), 'nope');
    await user.click(within(form).getByRole('button', { name: 'Add a passkey' }));

    await screen.findByText('Invalid password');
    expect(webauthn).not.toHaveBeenCalled();
  });

  it('FE-MOB-SETACC-074: cancelling the add form returns to the button', async () => {
    const user = userEvent.setup();
    server.use(onCard());
    renderAccount();

    await user.click(await screen.findByRole('button', { name: 'Add a passkey' }));
    await user.type(screen.getByPlaceholderText(/Name \(optional/), 'draft');
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByPlaceholderText(/Name \(optional/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Add a passkey' })).toBeInTheDocument();
  });
});
