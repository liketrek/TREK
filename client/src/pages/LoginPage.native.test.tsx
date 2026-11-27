// FE-PAGE-LOGIN-NATIVE-001: LoginPage inside the iOS/Android app
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '../../tests/helpers/render';
import { resetAllStores } from '../../tests/helpers/store';
import LoginPage from './LoginPage';

vi.mock('../native/platform', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../native/platform')>()),
  isNativeApp: () => true,
  nativeServerHost: () => 'trek.example.com',
}));
vi.mock('../../native-shell/scenery', () => ({ startScenery: vi.fn(), cameraForPlan: () => [0, 0] }));

beforeEach(() => {
  resetAllStores();
});

describe('LoginPage in the app', () => {
  it('FE-PAGE-LOGIN-NATIVE-001: shows the app sign-in screen, without the language menu or the web layout', async () => {
    const { container } = render(<LoginPage />);
    await waitFor(() => expect(screen.getByLabelText('Email')).toBeInTheDocument());
    expect(container.querySelector('.app-login')).toBeInTheDocument();
    expect(screen.getByText('trek.example.com')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change language' })).not.toBeInTheDocument();
    expect(container.querySelector('.lg-panel')).not.toBeInTheDocument();
  });
});
