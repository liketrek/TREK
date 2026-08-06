import { AxiosError } from 'axios';
import { installGlobalErrorHandlers } from './globalErrorHandlers';

let teardown: () => void;
let consoleError: ReturnType<typeof vi.spyOn>;
let reload: ReturnType<typeof vi.fn>;

beforeEach(() => {
  sessionStorage.clear();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  reload = vi.fn();
  Object.defineProperty(window, 'location', { value: { ...window.location, reload }, writable: true });
  teardown = installGlobalErrorHandlers();
});

afterEach(() => {
  teardown();
  consoleError.mockRestore();
});

/** jsdom has no PromiseRejectionEvent, so build the shape the handler reads. */
function rejectWith(reason: unknown) {
  const event = new Event('unhandledrejection') as Event & { reason: unknown };
  event.reason = reason;
  window.dispatchEvent(event);
}

describe('global error handlers', () => {
  it('FE-UTIL-GLOBALERR-001: ignores axios rejections, which the app already reports itself', () => {
    // The interceptor rejects onward and there are 600+ toast.error call sites;
    // logging here as well would turn every handled 500 into a phantom crash.
    rejectWith(new AxiosError('Request failed with status code 500'));
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('FE-UTIL-GLOBALERR-002: logs a genuine unhandled rejection', () => {
    const reason = new Error('nobody caught me');
    rejectWith(reason);
    expect(consoleError).toHaveBeenCalledWith('[unhandledrejection]', reason);
  });

  it('FE-UTIL-GLOBALERR-003: reloads when a dynamic import rejects outside render', () => {
    // A lazy chunk can also be pulled in from an effect or a prefetch, where no
    // boundary is watching.
    rejectWith(new Error('Failed to fetch dynamically imported module: /assets/x-1.js'));
    expect(reload).toHaveBeenCalledTimes(1);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('FE-UTIL-GLOBALERR-004: logs an uncaught error from an event handler', () => {
    const error = new Error('thrown in onClick');
    window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));
    expect(consoleError).toHaveBeenCalledWith('[window.onerror]', error);
  });

  it('FE-UTIL-GLOBALERR-005: heals a chunk error arriving as a window error event', () => {
    window.dispatchEvent(
      new ErrorEvent('error', { error: new Error('Unable to preload CSS for /assets/x.css') }),
    );
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('FE-UTIL-GLOBALERR-006: teardown unsubscribes both listeners', () => {
    // Asserted through removeEventListener rather than by firing an event: an
    // ErrorEvent with nobody listening is an uncaught error, and vitest reports
    // that against the file even when every test passed.
    const remove = vi.spyOn(window, 'removeEventListener');
    teardown();
    expect(remove).toHaveBeenCalledWith('unhandledrejection', expect.any(Function));
    expect(remove).toHaveBeenCalledWith('error', expect.any(Function));

    // The rejection path has no such side effect, so it is safe to prove silence.
    rejectWith(new Error('after teardown'));
    expect(consoleError).not.toHaveBeenCalled();

    teardown = () => {};
  });
});
