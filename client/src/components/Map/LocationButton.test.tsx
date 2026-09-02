// FE-MAP-LOCBTN-001 to FE-MAP-LOCBTN-004
import { render } from '@testing-library/react';
import LocationButton from './LocationButton';
import type { GeoWatchErrorCode } from '../../hooks/useGeolocation';

// useToast talks to the mounted ToastContainer through window.__addToast,
// so a spy there observes exactly what the user would get shown. Outside a
// TranslationProvider t(key) echoes the key, so assertions target the keys.
const addToast = vi.fn();

beforeEach(() => {
  addToast.mockClear();
  window.__addToast = addToast;
});

afterEach(() => {
  delete window.__addToast;
});

const noop = () => {};

function button(errorCode: GeoWatchErrorCode | null, error: string | null = errorCode && 'raw webkit text') {
  return <LocationButton mode="off" error={error} errorCode={errorCode} onClick={noop} />;
}

describe('LocationButton', () => {
  it('FE-MAP-LOCBTN-001: shows the mode title and stays quiet without an error', () => {
    const { getByRole } = render(button(null));

    expect(getByRole('button').getAttribute('title')).toBe('Show my location');
    expect(addToast).not.toHaveBeenCalled();
  });

  it('FE-MAP-LOCBTN-002: titles with the localized error text, not the raw browser string', () => {
    const { getByRole } = render(button('timeout'));

    expect(getByRole('button').getAttribute('title')).toBe('map.location.timeout');
    expect(getByRole('button').getAttribute('aria-label')).toBe('map.location.timeout');
  });

  it('FE-MAP-LOCBTN-003: fires exactly one error toast when a code appears', () => {
    const { rerender } = render(button(null));
    expect(addToast).not.toHaveBeenCalled();

    rerender(button('permission-denied'));
    expect(addToast).toHaveBeenCalledTimes(1);
    expect(addToast).toHaveBeenCalledWith('map.location.denied', 'error', 6000);

    // The same error sticking around must not re-announce itself.
    rerender(button('permission-denied'));
    expect(addToast).toHaveBeenCalledTimes(1);
  });

  it('FE-MAP-LOCBTN-004: only the transition from no error to an error toasts', () => {
    const { rerender } = render(button(null));
    rerender(button('permission-denied'));
    expect(addToast).toHaveBeenCalledTimes(1);

    // Code to code without recovering in between stays silent.
    rerender(button('timeout'));
    expect(addToast).toHaveBeenCalledTimes(1);

    // After a recovery a fresh failure announces itself again.
    rerender(button(null));
    rerender(button('timeout'));
    expect(addToast).toHaveBeenCalledTimes(2);
    expect(addToast).toHaveBeenLastCalledWith('map.location.timeout', 'error', 6000);
  });
});
