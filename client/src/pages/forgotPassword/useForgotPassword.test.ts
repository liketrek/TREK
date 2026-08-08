// FE-PAGE-FORGOT-001 to FE-PAGE-FORGOT-008
import { act, renderHook, waitFor } from '@testing-library/react';
import type { FormEvent } from 'react';
import { authApi } from '../../api/client';
import { useForgotPassword } from './useForgotPassword';

const navigate = vi.fn();
vi.mock('react-router', () => ({ useNavigate: () => navigate }));

const submitEvent = () => ({ preventDefault: vi.fn() }) as unknown as FormEvent;

beforeEach(() => {
  navigate.mockClear();
  vi.spyOn(authApi, 'getAppConfig').mockResolvedValue({ available_channels: { email: true } } as never);
  vi.spyOn(authApi, 'forgotPassword').mockResolvedValue({} as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useForgotPassword', () => {
  it('FE-PAGE-FORGOT-001: starts with an empty, unsubmitted form', async () => {
    const { result } = renderHook(() => useForgotPassword());

    expect(result.current.email).toBe('');
    expect(result.current.submitted).toBe(false);
    expect(result.current.isLoading).toBe(false);
    await waitFor(() => expect(result.current.smtpConfigured).toBe(true));
  });

  it('FE-PAGE-FORGOT-002: reports SMTP as unconfigured when the server has no email channel', async () => {
    vi.mocked(authApi.getAppConfig).mockResolvedValue({ available_channels: { email: false } } as never);
    const { result } = renderHook(() => useForgotPassword());

    await waitFor(() => expect(result.current.smtpConfigured).toBe(false));
  });

  it('FE-PAGE-FORGOT-003: treats a missing config payload as unconfigured', async () => {
    vi.mocked(authApi.getAppConfig).mockResolvedValue(null as never);
    const { result } = renderHook(() => useForgotPassword());

    await waitFor(() => expect(result.current.smtpConfigured).toBe(false));
  });

  it('FE-PAGE-FORGOT-004: leaves the hint hidden when the probe fails', async () => {
    vi.mocked(authApi.getAppConfig).mockRejectedValue(new Error('offline'));
    const { result } = renderHook(() => useForgotPassword());

    await waitFor(() => expect(authApi.getAppConfig).toHaveBeenCalled());
    expect(result.current.smtpConfigured).toBeNull();
  });

  it('FE-PAGE-FORGOT-005: submits the trimmed address and switches to the sent state', async () => {
    const { result } = renderHook(() => useForgotPassword());
    act(() => result.current.setEmail('  maurice@trek.app  '));

    const event = submitEvent();
    await act(() => result.current.handleSubmit(event));

    expect(event.preventDefault).toHaveBeenCalled();
    expect(authApi.forgotPassword).toHaveBeenCalledWith({ email: 'maurice@trek.app' });
    expect(result.current.submitted).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it('FE-PAGE-FORGOT-006: shows the same success state when the server rejects — no account enumeration', async () => {
    vi.mocked(authApi.forgotPassword).mockRejectedValue(new Error('no such user'));
    const { result } = renderHook(() => useForgotPassword());
    act(() => result.current.setEmail('ghost@trek.app'));

    await act(() => result.current.handleSubmit(submitEvent()));

    expect(result.current.submitted).toBe(true);
  });

  it('FE-PAGE-FORGOT-007: ignores a second submit while the first is in flight', async () => {
    let release: (() => void) | undefined;
    vi.mocked(authApi.forgotPassword).mockReturnValue(new Promise(res => { release = () => res({} as never); }) as never);

    const { result } = renderHook(() => useForgotPassword());
    act(() => result.current.setEmail('maurice@trek.app'));

    let first: Promise<void>;
    act(() => { first = result.current.handleSubmit(submitEvent()) as Promise<void>; });
    expect(result.current.isLoading).toBe(true);

    await act(() => result.current.handleSubmit(submitEvent()));
    expect(authApi.forgotPassword).toHaveBeenCalledTimes(1);

    await act(async () => { release!(); await first; });
    expect(result.current.submitted).toBe(true);
  });

  it('FE-PAGE-FORGOT-008: hands the router navigate through to the page', async () => {
    const { result } = renderHook(() => useForgotPassword());
    expect(result.current.navigate).toBe(navigate);
    await waitFor(() => expect(result.current.smtpConfigured).toBe(true));
  });
});
