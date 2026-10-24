// FE-COMP-CREATEACTION-001 to -009: the context-aware "+" both bottom navs share.
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';

import { useJourneyStore } from '../../store/journeyStore';
import { isNavItemActive, useCreateAction } from './useCreateAction';

const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('../../i18n', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

function at(path: string, phone: boolean) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>
  );
  return renderHook(() => useCreateAction(phone), { wrapper }).result.current;
}

beforeEach(() => {
  mockNavigate.mockClear();
  sessionStorage.clear();
  useJourneyStore.setState({ mobileGalleryOpen: false });
});

describe('useCreateAction', () => {
  it('FE-COMP-CREATEACTION-001: creates a trip by default on both navs', () => {
    for (const phone of [false, true]) {
      const action = at('/dashboard', phone);
      expect(action.label).toBe('dashboard.newTrip');
      act(() => action.run());
      expect(mockNavigate).toHaveBeenLastCalledWith('/dashboard?create=1');
    }
  });

  it('FE-COMP-CREATEACTION-002: inside a trip it follows the remembered tab', () => {
    const cases: [string | null, string, string][] = [
      ['finanzplan', 'costs.addExpense', 'expense'],
      ['buchungen', 'reservations.addManual', 'reservation'],
      ['transports', 'transport.addManual', 'transport'],
      ['lists', 'places.addPlace', 'place'],
      [null, 'places.addPlace', 'place'],
    ];
    for (const [tab, label, create] of cases) {
      sessionStorage.clear();
      if (tab) sessionStorage.setItem('trip-tab-7', tab);
      const action = at('/trips/7', false);
      expect(action.label).toBe(label);
      act(() => action.run());
      expect(mockNavigate).toHaveBeenLastCalledWith(`/trips/7?create=${create}`);
    }
  });

  it('FE-COMP-CREATEACTION-003: inside a journey it adds an entry', () => {
    const action = at('/journey/3', true);
    expect(action).toMatchObject({ label: 'journey.detail.addEntry' });
    expect(action.upload).toBeUndefined();
    act(() => action.run());
    expect(mockNavigate).toHaveBeenLastCalledWith('/journey/3?create=entry');
  });

  it('FE-COMP-CREATEACTION-004: the phone uploads a photo while the journey gallery is open', () => {
    useJourneyStore.setState({ mobileGalleryOpen: true });
    const action = at('/journey/3', true);
    expect(action).toMatchObject({ label: 'common.upload', upload: true });
    act(() => action.run());
    expect(mockNavigate).toHaveBeenLastCalledWith('/journey/3?create=photo');
  });

  it('FE-COMP-CREATEACTION-005: the desktop nav ignores the open gallery', () => {
    useJourneyStore.setState({ mobileGalleryOpen: true });
    expect(at('/journey/3', false).label).toBe('journey.detail.addEntry');
  });

  it('FE-COMP-CREATEACTION-006: the journey list starts a journey', () => {
    const action = at('/journey', false);
    expect(action.label).toBe('journey.new');
    act(() => action.run());
    expect(mockNavigate).toHaveBeenLastCalledWith('/journey?create=1');
  });

  it('FE-COMP-CREATEACTION-007: the atlas opens the country search on the phone only', () => {
    const phone = at('/atlas', true);
    expect(phone.label).toBe('atlas.searchCountry');
    act(() => phone.run());
    expect(mockNavigate).toHaveBeenLastCalledWith('/atlas?search=1');
    expect(at('/atlas', false).label).toBe('dashboard.newTrip');
  });

  it('FE-COMP-CREATEACTION-008: collections add a place to the open list on the phone only', () => {
    const all = at('/collections', true);
    expect(all.label).toBe('collections.addPlace');
    act(() => all.run());
    expect(mockNavigate).toHaveBeenLastCalledWith('/collections?create=place');
    const one = at('/collections/12', true);
    act(() => one.run());
    expect(mockNavigate).toHaveBeenLastCalledWith('/collections/12?create=place');
    expect(at('/collections/12', false).label).toBe('dashboard.newTrip');
  });
});

describe('isNavItemActive', () => {
  it('FE-COMP-CREATEACTION-009: the dashboard matches exactly, other items by prefix', () => {
    expect(isNavItemActive('/dashboard', '/dashboard')).toBe(true);
    expect(isNavItemActive('/dashboard/x', '/dashboard')).toBe(false);
    expect(isNavItemActive('/vacay/2026', '/vacay')).toBe(true);
    expect(isNavItemActive('/atlas', '/vacay')).toBe(false);
  });
});
