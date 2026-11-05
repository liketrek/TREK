// FE-SETTINGS-NATIVE-SERVER-001 to FE-SETTINGS-NATIVE-SERVER-008
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '../../../tests/helpers/render';
import MSettingsServer from '../../mobile/screens/settings/MSettingsServer';
import { nativeServerHost } from '../../native/platform';
import { TrekShell } from '../../native/trekShell';
import NativeServerLink from '../../pages/login/NativeServerLink';
import NativeServerSection from './NativeServerSection';

vi.mock('../../native/platform', () => ({ nativeServerHost: vi.fn() }));
vi.mock('../../native/trekShell', () => ({ TrekShell: { resetServer: vi.fn() } }));

beforeEach(() => {
  vi.mocked(TrekShell.resetServer).mockReset().mockResolvedValue();
});

describe.each([
  ['desktop', NativeServerSection],
  ['mobile', MSettingsServer],
])('the %s server section', (_shell, Section) => {
  it('renders nothing in a browser', () => {
    vi.mocked(nativeServerHost).mockReturnValue(null);
    const { container } = render(<Section />);
    expect(container).toBeEmptyDOMElement();
  });

  it('names the server and leads back to the address screen', () => {
    vi.mocked(nativeServerHost).mockReturnValue('trek.example.com');
    render(<Section />);
    expect(screen.getByText('This app is connected to trek.example.com.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Change server' }));
    expect(TrekShell.resetServer).toHaveBeenCalled();
  });

  it('links to the privacy policy, opened outside the app', () => {
    vi.mocked(nativeServerHost).mockReturnValue('trek.example.com');
    render(<Section />);
    const link = screen.getByRole('link', { name: 'Privacy policy' });
    expect(link).toHaveAttribute('href', 'https://liketrek.com/privacy');
    expect(link).toHaveAttribute('target', '_blank');
  });
});

describe('the sign-in screen link', () => {
  it('renders nothing in a browser', () => {
    vi.mocked(nativeServerHost).mockReturnValue(null);
    const { container } = render(<NativeServerLink />);
    expect(container).toBeEmptyDOMElement();
  });

  it('leads back to the address screen in the app', () => {
    vi.mocked(nativeServerHost).mockReturnValue('trek.example.com');
    render(<NativeServerLink />);
    fireEvent.click(screen.getByRole('button', { name: 'Change server' }));
    expect(TrekShell.resetServer).toHaveBeenCalled();
  });
});
