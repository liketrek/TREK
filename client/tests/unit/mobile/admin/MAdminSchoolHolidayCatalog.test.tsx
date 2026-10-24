// FE-MOB-ASCH-001 to FE-MOB-ASCH-008: the school holiday catalog of the phone admin, drawn from a
// controlled useSchoolHolidayCatalog (the hook has its own test).
import type { SchoolHolidayRegionDetail } from '@trek/shared';
import { describe, expect, it, vi } from 'vitest';
import type { useSchoolHolidayCatalog } from '../../../../src/components/Admin/useSchoolHolidayCatalog';
import MAdminSchoolHolidayCatalog from '../../../../src/mobile/screens/admin/MAdminSchoolHolidayCatalog';
import { fireEvent, render, screen, waitFor, within } from '../../../helpers/render';

type Catalog = ReturnType<typeof useSchoolHolidayCatalog>;

const hook = vi.hoisted(() => ({ useSchoolHolidayCatalog: vi.fn<() => Catalog>() }));
vi.mock('../../../../src/components/Admin/useSchoolHolidayCatalog', () => ({
  useSchoolHolidayCatalog: hook.useSchoolHolidayCatalog,
}));

const REGION: SchoolHolidayRegionDetail = {
  id: 5,
  country: 'DE',
  name: 'Bayern',
  code: 'BY',
  revision: 2,
  holidays: [{ name: 'Herbstferien', startDate: '2026-11-02', endDate: '2026-11-06' }],
};

function show(overrides: Partial<Catalog> = {}) {
  const state = {
    catalog: {
      countries: [{ code: 'DE', name: 'Deutschland' }],
      regions: [{ id: 5, country: 'DE', name: 'Bayern', code: 'BY', revision: 2 }],
    },
    loading: false,
    busy: false,
    error: '',
    offline: false,
    editor: null,
    setEditor: vi.fn(),
    refresh: vi.fn(async () => true),
    createCountry: vi.fn(async () => true),
    deleteCountry: vi.fn(async () => true),
    openRegion: vi.fn(async () => true),
    saveRegion: vi.fn(async () => true),
    deleteRegion: vi.fn(async () => true),
    ...overrides,
  } as unknown as Catalog;
  hook.useSchoolHolidayCatalog.mockReturnValue(state);
  render(<MAdminSchoolHolidayCatalog />);
  return state;
}

describe('MAdminSchoolHolidayCatalog', () => {
  it('FE-MOB-ASCH-001: lists the regions of the chosen country and opens one', () => {
    const state = show();
    expect(screen.getByText('School holidays')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Bayern' }));
    expect(state.openRegion).toHaveBeenCalledWith(5);
  });

  it('FE-MOB-ASCH-002: a country with regions cannot be deleted, and says why', () => {
    show();
    expect(screen.getByRole('button', { name: 'Delete country' })).toBeDisabled();
    expect(screen.getByText('Remove regions first. Regions used by calendars cannot be deleted.')).toBeInTheDocument();
  });

  it('FE-MOB-ASCH-003: a region is deleted after the phone question', () => {
    const state = show();
    fireEvent.click(screen.getByRole('button', { name: 'Delete Bayern' }));
    const question = screen.getByRole('dialog', { name: 'Delete' });
    fireEvent.click(within(question).getByRole('button', { name: 'Delete' }));
    expect(state.deleteRegion).toHaveBeenCalledWith(5, 2);
  });

  it('FE-MOB-ASCH-004: an empty country says so and offers a new region', () => {
    const state = show({
      catalog: { countries: [{ code: 'AT', name: 'Österreich' }], regions: [] } as Catalog['catalog'],
    });
    expect(screen.getByText('No regions yet.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add region' }));
    expect(state.setEditor).toHaveBeenCalledWith(expect.objectContaining({ id: 0, country: 'AT', holidays: [] }));
  });

  it('FE-MOB-ASCH-005: a country is added in its own sheet, with a two-letter code', async () => {
    const state = show({ catalog: { countries: [], regions: [] } as Catalog['catalog'] });
    fireEvent.click(screen.getByRole('button', { name: 'Add country' }));
    const sheet = screen.getByRole('dialog', { name: 'Add country' });
    const save = within(sheet).getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    const [name, code] = within(sheet).getAllByRole('textbox');
    fireEvent.change(name, { target: { value: 'France' } });
    fireEvent.change(code, { target: { value: 'fr' } });
    expect(code).toHaveValue('FR');
    fireEvent.click(save);
    await waitFor(() => expect(state.createCountry).toHaveBeenCalledWith({ code: 'FR', name: 'France' }));
  });

  it('FE-MOB-ASCH-006: the region sheet saves its periods as the request the server takes', () => {
    const state = show({ editor: REGION });
    const sheet = screen.getByRole('dialog', { name: 'Bayern' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Add holiday period' }));
    expect(within(sheet).getAllByPlaceholderText('Holiday name')).toHaveLength(2);
    fireEvent.click(within(sheet).getByRole('button', { name: 'Delete 2' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Save' }));
    expect(state.saveRegion).toHaveBeenCalledWith('DE', 5, {
      name: 'Bayern',
      revision: 2,
      holidays: [{ name: 'Herbstferien', startDate: '2026-11-02', endDate: '2026-11-06' }],
    });
  });

  it('FE-MOB-ASCH-007: an incomplete period is refused before it is sent', () => {
    const state = show({ editor: REGION });
    const sheet = screen.getByRole('dialog', { name: 'Bayern' });
    fireEvent.click(within(sheet).getByRole('button', { name: 'Add holiday period' }));
    fireEvent.click(within(sheet).getByRole('button', { name: 'Save' }));
    expect(within(sheet).getByRole('alert')).toHaveTextContent('Check the names and dates.');
    expect(state.saveRegion).not.toHaveBeenCalled();
  });

  it('FE-MOB-ASCH-008: a failed read says so and can be tried again', () => {
    const state = show({ error: 'Server down' });
    expect(screen.getByRole('alert')).toHaveTextContent('Server down');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.refresh).toHaveBeenCalled();
  });
});
