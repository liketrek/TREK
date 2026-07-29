// FE-PLANNER-SUBLINKS-001 to FE-PLANNER-SUBLINKS-009
import { render, screen, fireEvent, waitFor, within, act } from '../../../tests/helpers/render';
import { SubscribeLinks } from './SubscribeLinks';

const HTTPS = 'https://trek.example/api/trips/7/feed/abc.ics';
const WEBCAL = 'webcal://trek.example/api/trips/7/feed/abc.ics';

function stubClipboard(writeText: (t: string) => Promise<void>) {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value: { writeText } });
  Object.defineProperty(window, 'isSecureContext', { configurable: true, writable: true, value: true });
}

afterEach(() => {
  // Leave the globals clean for the test that exercises the insecure-context fallback.
  Object.defineProperty(navigator, 'clipboard', { configurable: true, writable: true, value: undefined });
  Object.defineProperty(window, 'isSecureContext', { configurable: true, writable: true, value: false });
});

describe('SubscribeLinks', () => {
  it('FE-PLANNER-SUBLINKS-001: Google deep link carries the webcal URL url-encoded in cid', () => {
    render(<SubscribeLinks httpsUrl={HTTPS} webcalUrl={WEBCAL} />);
    const google = screen.getByRole('link', { name: /Add to Google Calendar/i });
    expect(google).toHaveAttribute(
      'href',
      `https://www.google.com/calendar/render?cid=${encodeURIComponent(WEBCAL)}`,
    );
    expect(google).toHaveAttribute('target', '_blank');
    expect(google).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('FE-PLANNER-SUBLINKS-002: Apple/Outlook link points at the raw webcal URL', () => {
    render(<SubscribeLinks httpsUrl={HTTPS} webcalUrl={WEBCAL} />);
    expect(screen.getByRole('link', { name: /Add to Apple Calendar \/ Outlook/i })).toHaveAttribute('href', WEBCAL);
  });

  it('FE-PLANNER-SUBLINKS-003: the manual fallback lists both raw URLs', () => {
    render(<SubscribeLinks httpsUrl={HTTPS} webcalUrl={WEBCAL} />);
    expect(screen.getByText('Or copy a link manually')).toBeInTheDocument();
    expect(screen.getByText(HTTPS)).toBeInTheDocument();
    expect(screen.getByText(WEBCAL)).toBeInTheDocument();
    expect(screen.getByText(/paste into/)).toBeInTheDocument();
  });

  it('FE-PLANNER-SUBLINKS-004: copying the https row writes it to the clipboard', async () => {
    const writeText = vi.fn(async () => {});
    stubClipboard(writeText);
    render(<SubscribeLinks httpsUrl={HTTPS} webcalUrl={WEBCAL} />);
    fireEvent.click(screen.getAllByTitle('Copy')[0]);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(HTTPS));
  });

  it('FE-PLANNER-SUBLINKS-005: the copied row switches to the check icon and resets after 2s', async () => {
    const writeText = vi.fn(async () => {});
    stubClipboard(writeText);
    render(<SubscribeLinks httpsUrl={HTTPS} webcalUrl={WEBCAL} />);
    const httpsCopy = screen.getAllByTitle('Copy')[0];
    fireEvent.click(httpsCopy);
    // lucide puts the icon name on the svg class list.
    await waitFor(() => expect(httpsCopy.querySelector('.lucide-check')).not.toBeNull());

    vi.useFakeTimers();
    try {
      // The component already scheduled its 2s reset with the real clock; drive a
      // fresh copy under fake timers so the reset is deterministic.
      fireEvent.click(httpsCopy);
      await act(async () => { await Promise.resolve(); });
      act(() => { vi.advanceTimersByTime(2100); });
      expect(httpsCopy.querySelector('.lucide-check')).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it('FE-PLANNER-SUBLINKS-006: only the clicked row shows the copied state', async () => {
    const writeText = vi.fn(async () => {});
    stubClipboard(writeText);
    render(<SubscribeLinks httpsUrl={HTTPS} webcalUrl={WEBCAL} />);
    const buttons = screen.getAllByTitle('Copy');
    fireEvent.click(buttons[1]);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(WEBCAL));
    await waitFor(() => expect(buttons[1].querySelector('.lucide-check')).not.toBeNull());
    expect(buttons[0].querySelector('.lucide-check')).toBeNull();
  });

  it('FE-PLANNER-SUBLINKS-007: falls back to execCommand when the clipboard API is unavailable', async () => {
    const execCommand = vi.fn(() => true);
    Object.defineProperty(document, 'execCommand', { configurable: true, writable: true, value: execCommand });
    render(<SubscribeLinks httpsUrl={HTTPS} webcalUrl={WEBCAL} />);
    const httpsCopy = screen.getAllByTitle('Copy')[0];
    fireEvent.click(httpsCopy);
    await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'));
    // The temporary textarea is removed again.
    expect(document.querySelector('textarea')).toBeNull();
    await waitFor(() => expect(httpsCopy.querySelector('.lucide-check')).not.toBeNull());
  });

  it('FE-PLANNER-SUBLINKS-008: a rejected clipboard write leaves the row unmarked', async () => {
    stubClipboard(vi.fn(async () => { throw new Error('denied'); }));
    render(<SubscribeLinks httpsUrl={HTTPS} webcalUrl={WEBCAL} />);
    const httpsCopy = screen.getAllByTitle('Copy')[0];
    fireEvent.click(httpsCopy);
    await act(async () => { await Promise.resolve(); });
    expect(httpsCopy.querySelector('.lucide-check')).toBeNull();
  });

  it('FE-PLANNER-SUBLINKS-009: each URL row is labelled with its calendar target', () => {
    render(<SubscribeLinks httpsUrl={HTTPS} webcalUrl={WEBCAL} />);
    const details = screen.getByText('Or copy a link manually').closest('details') as HTMLElement;
    expect(within(details).getByText(/Google Calendar/)).toBeInTheDocument();
    expect(within(details).getByText(/Apple Calendar \/ Outlook/)).toBeInTheDocument();
  });
});
