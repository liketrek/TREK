// FE-NATIVE-DONATIONS-001 to FE-NATIVE-DONATIONS-005
// Inside the iOS and Android apps no screen links to a donation page: the store
// rules on payments (Apple 3.1.1, Google Play Payments) allow no outside payment
// link there. Every place that shows one is rendered here with the app mocked in.
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import GitHubPanel from '../../../src/components/Admin/GitHubPanel';
import AboutTab from '../../../src/components/Settings/AboutTab';
import { SystemNoticeHost } from '../../../src/components/SystemNotices/SystemNoticeHost';
import MAdminGitHubPanel from '../../../src/mobile/screens/admin/MAdminGitHubPanel';
import MSettingsAbout from '../../../src/mobile/screens/settings/MSettingsAbout';
import { useSystemNoticeStore, type SystemNoticeDTO } from '../../../src/store/systemNoticeStore';
import { server } from '../../helpers/msw/server';
import { render, screen, waitFor } from '../../helpers/render';
import { resetAllStores } from '../../helpers/store';

vi.mock('../../../src/native/platform', () => ({
  isNativeApp: () => true,
  isNativeIos: () => false,
  nativeServerHost: () => 'trek.example.com',
}));
vi.mock('../../../src/components/SystemNotices/SystemNoticeModal.js', () => ({
  ModalRenderer: ({ notices }: { notices: SystemNoticeDTO[] }) => (
    <div data-testid="modals">{notices.map((n) => n.id).join(',')}</div>
  ),
}));
vi.mock('../../../src/components/SystemNotices/SystemNoticeBanner.js', () => ({
  BannerRenderer: ({ notices }: { notices: SystemNoticeDTO[] }) => (
    <div data-testid="banners">{notices.map((n) => n.id).join(',')}</div>
  ),
  ToastRenderer: () => null,
}));

function donationLinks(): Element[] {
  return Array.from(document.querySelectorAll('a[href]')).filter((a) =>
    /ko-fi\.com|buymeacoffee\.com/.test(a.getAttribute('href') ?? '')
  );
}

beforeEach(() => {
  resetAllStores();
  server.use(http.get('/api/admin/github-releases', () => HttpResponse.json([])));
});

afterEach(() => {
  server.resetHandlers();
});

describe('donation links inside the native app', () => {
  it('FE-NATIVE-DONATIONS-001: the desktop About tab shows none, but keeps the community links', () => {
    render(<AboutTab appVersion="5.0.0" />);
    expect(donationLinks()).toEqual([]);
    expect(screen.getByText('Discord')).toBeInTheDocument();
  });

  it('FE-NATIVE-DONATIONS-002: the phone About section shows none', () => {
    render(<MSettingsAbout appVersion="5.0.0" />);
    expect(donationLinks()).toEqual([]);
    expect(screen.getByText('Wiki')).toBeInTheDocument();
  });

  it('FE-NATIVE-DONATIONS-003: the desktop admin GitHub panel shows none', async () => {
    render(<GitHubPanel />);
    await waitFor(() => expect(screen.getByText('Discord')).toBeInTheDocument());
    expect(donationLinks()).toEqual([]);
  });

  it('FE-NATIVE-DONATIONS-004: the phone admin GitHub panel shows none', async () => {
    render(<MAdminGitHubPanel />);
    await waitFor(() => expect(screen.getByText('Discord')).toBeInTheDocument());
    expect(donationLinks()).toEqual([]);
  });

  it('FE-NATIVE-DONATIONS-005: a system notice asking for a donation stays hidden, any other one shows', () => {
    const base = { display: 'banner', severity: 'info', titleKey: 'Title', bodyKey: 'Body', dismissible: true };
    useSystemNoticeStore.setState({
      loaded: true,
      fetching: false,
      notices: [
        {
          ...base,
          id: 'support',
          cta: { kind: 'link', labelKey: 'Coffee', href: 'https://buymeacoffee.com/mauriceboe' },
          secondaryCta: { kind: 'link', labelKey: 'Ko-fi', href: 'https://ko-fi.com/mauriceboe' },
        },
        { ...base, id: 'maintenance' },
      ] as unknown as SystemNoticeDTO[],
    });
    render(<SystemNoticeHost />);
    expect(screen.getByTestId('banners')).toHaveTextContent('maintenance');
    expect(screen.getByTestId('banners')).not.toHaveTextContent('support');
  });
});
