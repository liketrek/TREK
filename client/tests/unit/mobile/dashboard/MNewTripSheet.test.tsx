import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '../../../helpers/render';
import MNewTripSheet from '../../../../src/mobile/screens/dashboard/MNewTripSheet';
import { tripsApi } from '../../../../src/api/client';
import { useAuthStore } from '../../../../src/store/authStore';
import { usePermissionsStore } from '../../../../src/store/permissionsStore';
import { useSettingsStore } from '../../../../src/store/settingsStore';
import { buildUser } from '../../../helpers/factories';
import type { DashboardTrip } from '../../../../src/pages/dashboard/dashboardModel';
import type { Trip, TripCreateRequest } from '@trek/shared';

interface CoverSearchPhoto {
  id: string
  url: string
  thumb: string
  description?: string | null
  photographer?: string | null
}

// FE-MOB-NTSH-001 onwards

vi.mock('../../../../src/utils/convertHeic', () => ({
  normalizeImageFile: (file: File) => Promise.resolve(file),
}));

// The real pickers own a lot of unrelated calendar/portal behaviour; plain
// controls keep this suite on the sheet's own logic.
vi.mock('../../../../src/components/shared/CustomDateTimePicker', () => ({
  CustomDatePicker: ({ value, onChange, placeholder }: {
    value: string; onChange: (v: string) => void; placeholder: string
  }) => <input aria-label={placeholder} value={value} onChange={e => onChange(e.target.value)} />,
}));

vi.mock('../../../../src/components/shared/CustomSelect', () => ({
  default: ({ value, onChange, disabled }: {
    value: string; onChange: (v: string) => void; disabled?: boolean
  }) => (
    <select aria-label="currency" value={value} disabled={disabled} onChange={e => onChange(e.target.value)}>
      <option value="EUR">EUR</option>
      <option value="USD">USD</option>
    </select>
  ),
}));

const origCreateObjectURL = URL.createObjectURL;
const origRevokeObjectURL = URL.revokeObjectURL;
const revokeSpy = vi.fn();

function buildDashTrip(over: Partial<DashboardTrip> = {}): DashboardTrip {
  return {
    id: 42, user_id: 1, title: 'Japan 2026', currency: 'EUR', is_archived: 0,
    start_date: '2026-05-01', end_date: '2026-05-08',
    description: 'cherry blossoms', cover_image: '/uploads/covers/a.jpg',
    ...over,
  } as unknown as DashboardTrip;
}

function fileInput(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement;
}

const png = () => new File(['x'], 'cover.png', { type: 'image/png' });

let toastCalls: Array<[string, string | undefined]>;

beforeEach(() => {
  toastCalls = [];
  window.__addToast = ((message: string, type?: string) => {
    toastCalls.push([message, type]);
    return 1;
  }) as unknown as typeof window.__addToast;
  URL.createObjectURL = (() => 'blob:preview') as unknown as typeof URL.createObjectURL;
  revokeSpy.mockClear();
  URL.revokeObjectURL = revokeSpy as unknown as typeof URL.revokeObjectURL;
  useAuthStore.setState({ isAuthenticated: true, user: buildUser({ id: 1, role: 'user' }) });
  usePermissionsStore.setState({ permissions: {} });
});

afterEach(() => {
  URL.createObjectURL = origCreateObjectURL;
  URL.revokeObjectURL = origRevokeObjectURL;
  delete window.__addToast;
  useSettingsStore.setState(s => ({ settings: { ...s.settings, default_currency: '' } }));
  vi.restoreAllMocks();
});

describe('MNewTripSheet', () => {
  it('FE-MOB-NTSH-001: create mode shows the empty form plus the no-date hint', () => {
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);

    expect(screen.getByRole('dialog', { name: 'Create New Trip' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Summer in Japan')).toHaveValue('');
    expect(screen.getByText(/7 default days will be created/)).toBeInTheDocument();
    expect(screen.getByText('Add cover image')).toBeInTheDocument();
  });

  it('FE-MOB-NTSH-001b: create mode defaults the currency to the user\'s default_currency (#1784)', () => {
    useSettingsStore.setState(s => ({ settings: { ...s.settings, default_currency: 'USD' } }));
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);

    expect(screen.getByLabelText('currency')).toHaveValue('USD');
  });

  it('FE-MOB-NTSH-002: edit mode preloads the trip and hides the no-date hint', () => {
    render(<MNewTripSheet open trip={buildDashTrip()} onClose={() => {}} onSave={() => {}} />);

    expect(screen.getByRole('dialog', { name: 'Edit Trip' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g. Summer in Japan')).toHaveValue('Japan 2026');
    expect(screen.getByPlaceholderText('What is this trip about?')).toHaveValue('cherry blossoms');
    expect(screen.getByLabelText('Start Date')).toHaveValue('2026-05-01');
    expect(screen.queryByText(/7 default days will be created/)).not.toBeInTheDocument();
  });

  it('FE-MOB-NTSH-003: an empty title blocks the save', () => {
    const onSave = vi.fn(async () => undefined);
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={onSave} />);

    fireEvent.click(screen.getByRole('button', { name: 'Create New Trip' }));

    expect(screen.getByText('Title is required')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('FE-MOB-NTSH-004: an end date before the start blocks the save', () => {
    const onSave = vi.fn(async () => undefined);
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={onSave} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Summer in Japan'), { target: { value: 'Iceland' } });
    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-06-10' } });
    fireEvent.change(screen.getByLabelText('End Date'), { target: { value: '2026-06-01' } });

    fireEvent.click(screen.getByRole('button', { name: 'Create New Trip' }));

    expect(screen.getByText('End date must be after start date')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('FE-MOB-NTSH-005: a dateless create asks for the 7 default days and closes', async () => {
    const onSave = vi.fn(async (_data: TripCreateRequest) => undefined);
    const onClose = vi.fn();
    render(<MNewTripSheet open trip={null} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Summer in Japan'), { target: { value: '  Iceland  ' } });
    fireEvent.change(screen.getByPlaceholderText('What is this trip about?'), { target: { value: ' ring road ' } });
    fireEvent.change(screen.getByLabelText('currency'), { target: { value: 'USD' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create New Trip' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith({
      title: 'Iceland',
      description: 'ring road',
      start_date: null,
      end_date: null,
      currency: 'USD',
      day_count: 7,
    }));
    expect(onClose).toHaveBeenCalled();
  });

  it('FE-MOB-NTSH-006: moving the start keeps the trip length', () => {
    render(<MNewTripSheet open trip={buildDashTrip()} onClose={() => {}} onSave={() => {}} />);

    // 01.–08.05. is a 7-day span; shifting the start by a month keeps it.
    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-06-01' } });

    expect(screen.getByLabelText('End Date')).toHaveValue('2026-06-08');
  });

  it('FE-MOB-NTSH-007: a start without an end pulls the end date along', () => {
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(screen.getByLabelText('Start Date'), { target: { value: '2026-06-01' } });

    expect(screen.getByLabelText('End Date')).toHaveValue('2026-06-01');
  });

  it('FE-MOB-NTSH-008: a rejected save surfaces the error and keeps the sheet open', async () => {
    const onSave = vi.fn(async () => { throw new Error('Title already used'); });
    const onClose = vi.fn();
    render(<MNewTripSheet open trip={null} onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Summer in Japan'), { target: { value: 'Iceland' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create New Trip' }));

    expect(await screen.findByText('Title already used')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('FE-MOB-NTSH-009: create mode holds the picked file back until the trip exists', async () => {
    const upload = vi.spyOn(tripsApi, 'uploadCover').mockResolvedValue({ cover_image: '/uploads/covers/new.jpg' });
    const onCoverUpdate = vi.fn();
    const onSave = vi.fn(async () => ({ trip: { id: 77 } as Trip }));
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={onSave} onCoverUpdate={onCoverUpdate} />);

    fireEvent.change(fileInput(), { target: { files: [png()] } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument());
    // Nothing is uploaded before the trip is created.
    expect(upload).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText('e.g. Summer in Japan'), { target: { value: 'Iceland' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create New Trip' }));

    await waitFor(() => expect(upload).toHaveBeenCalledWith(77, expect.any(FormData)));
    expect(onCoverUpdate).toHaveBeenCalledWith(77, '/uploads/covers/new.jpg');
  });

  it('FE-MOB-NTSH-010: a failed post-create cover upload only toasts', async () => {
    vi.spyOn(tripsApi, 'uploadCover').mockRejectedValue(new Error('nope'));
    const onClose = vi.fn();
    render(<MNewTripSheet open trip={null} onClose={onClose} onSave={async () => ({ trip: { id: 77 } as Trip })} />);

    fireEvent.change(fileInput(), { target: { files: [png()] } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('e.g. Summer in Japan'), { target: { value: 'Iceland' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create New Trip' }));

    await waitFor(() => expect(toastCalls).toContainEqual(['Failed to upload', 'error']));
    expect(onClose).toHaveBeenCalled();
  });

  it('FE-MOB-NTSH-011: an ignored file change is a no-op', async () => {
    const upload = vi.spyOn(tripsApi, 'uploadCover');
    render(<MNewTripSheet open trip={buildDashTrip({ cover_image: null })} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(fileInput(), { target: { files: [] } });

    await waitFor(() => expect(upload).not.toHaveBeenCalled());
    expect(screen.getByText('Add cover image')).toBeInTheDocument();
  });

  it('FE-MOB-NTSH-012: edit mode uploads the cover straight away', async () => {
    const upload = vi.spyOn(tripsApi, 'uploadCover').mockResolvedValue({ cover_image: '/uploads/covers/next.jpg' });
    const onCoverUpdate = vi.fn();
    render(<MNewTripSheet open trip={buildDashTrip()} onClose={() => {}} onSave={() => {}} onCoverUpdate={onCoverUpdate} />);

    fireEvent.change(fileInput(), { target: { files: [png()] } });

    await waitFor(() => expect(upload).toHaveBeenCalledWith(42, expect.any(FormData)));
    expect(onCoverUpdate).toHaveBeenCalledWith(42, '/uploads/covers/next.jpg');
    expect(toastCalls).toContainEqual(['Cover image saved', 'success']);
  });

  it('FE-MOB-NTSH-013: a failed edit-mode upload toasts and keeps the old cover', async () => {
    vi.spyOn(tripsApi, 'uploadCover').mockRejectedValue(new Error('boom'));
    render(<MNewTripSheet open trip={buildDashTrip()} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(fileInput(), { target: { files: [png()] } });

    await waitFor(() => expect(toastCalls).toContainEqual(['Failed to upload', 'error']));
    expect(document.querySelector('img[src="/uploads/covers/a.jpg"]')).toBeInTheDocument();
  });

  it('FE-MOB-NTSH-014: searching with neither a query nor a title asks for a term', async () => {
    const search = vi.spyOn(tripsApi, 'searchCoverImages');
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);

    fireEvent.keyDown(screen.getByPlaceholderText('Search destination photos'), { key: 'Enter' });

    expect(await screen.findByText('Enter a search term')).toBeInTheDocument();
    expect(search).not.toHaveBeenCalled();
  });

  it('FE-MOB-NTSH-015: an empty result set is reported as "no images"', async () => {
    vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValue({ photos: [] });
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Search destination photos'), { target: { value: 'reykjavik' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search Unsplash' }));

    expect(await screen.findByText('No images found')).toBeInTheDocument();
    expect(tripsApi.searchCoverImages).toHaveBeenCalledWith('reykjavik');
  });

  it('FE-MOB-NTSH-016: a failing search shows the API error message', async () => {
    vi.spyOn(tripsApi, 'searchCoverImages').mockRejectedValue({ response: { data: { error: 'Unsplash key missing' } } });
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Summer in Japan'), { target: { value: 'Iceland' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search Unsplash' }));

    expect(await screen.findByText('Unsplash key missing')).toBeInTheDocument();
  });

  it('FE-MOB-NTSH-017: create mode previews the picked Unsplash photo without a request', async () => {
    vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValue({
      photos: [{ id: 'p1', url: 'https://img/full.jpg', thumb: 'https://img/thumb.jpg', photographer: 'Ada' }],
    });
    const update = vi.spyOn(tripsApi, 'update');
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Search destination photos'), { target: { value: 'iceland' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search Unsplash' }));

    const pick = await screen.findByRole('button', { name: 'Use Unsplash photo by Ada' });
    expect(screen.getByText('Ada')).toBeInTheDocument();
    fireEvent.click(pick);

    await waitFor(() => expect(document.querySelector('img[src="https://img/full.jpg"]')).toBeInTheDocument());
    expect(update).not.toHaveBeenCalled();
  });

  it('FE-MOB-NTSH-018: a pending Unsplash pick is written to the freshly created trip', async () => {
    vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValue({
      photos: [{ id: 'p1', url: 'https://img/full.jpg', thumb: 'https://img/thumb.jpg', photographer: null }],
    });
    const update = vi.spyOn(tripsApi, 'update').mockResolvedValue({ trip: { id: 77 } as Trip });
    const onCoverUpdate = vi.fn();
    render(
      <MNewTripSheet
        open
        trip={null}
        onClose={() => {}}
        onSave={async () => ({ trip: { id: 77 } as Trip })}
        onCoverUpdate={onCoverUpdate}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText('e.g. Summer in Japan'), { target: { value: 'Iceland' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search Unsplash' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Use Unsplash photo by Unsplash' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create New Trip' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(77, { cover_image: 'https://img/full.jpg' }));
    expect(onCoverUpdate).toHaveBeenCalledWith(77, 'https://img/full.jpg');
  });

  it('FE-MOB-NTSH-019: a failed cover write after create only toasts', async () => {
    vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValue({
      photos: [{ id: 'p1', url: 'https://img/full.jpg', thumb: 'https://img/thumb.jpg', photographer: null }],
    });
    vi.spyOn(tripsApi, 'update').mockRejectedValue(new Error('offline'));
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={async () => ({ trip: { id: 77 } as Trip })} />);

    fireEvent.change(screen.getByPlaceholderText('e.g. Summer in Japan'), { target: { value: 'Iceland' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search Unsplash' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Use Unsplash photo by Unsplash' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create New Trip' }));

    await waitFor(() => expect(toastCalls).toContainEqual(['Failed to save cover image', 'error']));
  });

  it('FE-MOB-NTSH-020: edit mode persists an Unsplash pick immediately', async () => {
    vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValue({
      photos: [{ id: 'p1', url: 'https://img/full.jpg', thumb: 'https://img/thumb.jpg', photographer: 'Ada' }],
    });
    const update = vi.spyOn(tripsApi, 'update').mockResolvedValue({ trip: { id: 42 } as Trip });
    render(<MNewTripSheet open trip={buildDashTrip()} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Search destination photos'), { target: { value: 'iceland' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search Unsplash' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Use Unsplash photo by Ada' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(42, { cover_image: 'https://img/full.jpg' }));
    expect(toastCalls).toContainEqual(['Cover image saved', 'success']);
  });

  it('FE-MOB-NTSH-021: a failed edit-mode Unsplash pick toasts the API error', async () => {
    vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValue({
      photos: [{ id: 'p1', url: 'https://img/full.jpg', thumb: 'https://img/thumb.jpg', photographer: 'Ada' }],
    });
    vi.spyOn(tripsApi, 'update').mockRejectedValue({ response: { data: { error: 'Storage full' } } });
    render(<MNewTripSheet open trip={buildDashTrip()} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Search destination photos'), { target: { value: 'iceland' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search Unsplash' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Use Unsplash photo by Ada' }));

    await waitFor(() => expect(toastCalls).toContainEqual(['Storage full', 'error']));
  });

  it('FE-MOB-NTSH-022: removing a pending cover needs no request', async () => {
    const update = vi.spyOn(tripsApi, 'update');
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(fileInput(), { target: { files: [png()] } });
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(screen.getByText('Add cover image')).toBeInTheDocument());
    expect(update).not.toHaveBeenCalled();
  });

  // The preview holds the whole picked file in memory until the url is released.
  it('FE-MOB-NTSH-034: a replaced or dropped file preview releases its blob url', async () => {
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(fileInput(), { target: { files: [png()] } });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument());
    expect(revokeSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(revokeSpy).toHaveBeenCalledWith('blob:preview'));
  });

  it('FE-MOB-NTSH-035: a stored cover url is never handed to revokeObjectURL', async () => {
    const { unmount } = render(
      <MNewTripSheet open trip={buildDashTrip()} onClose={() => {}} onSave={() => {}} />,
    );

    await waitFor(() =>
      expect(document.querySelector('img[src="/uploads/covers/a.jpg"]')).toBeInTheDocument(),
    );
    unmount();
    expect(revokeSpy).not.toHaveBeenCalled();
  });

  it('FE-MOB-NTSH-023: removing a stored cover clears it on the server', async () => {
    const update = vi.spyOn(tripsApi, 'update').mockResolvedValue({ trip: { id: 42 } as Trip });
    const onCoverUpdate = vi.fn();
    render(<MNewTripSheet open trip={buildDashTrip()} onClose={() => {}} onSave={() => {}} onCoverUpdate={onCoverUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(update).toHaveBeenCalledWith(42, { cover_image: null }));
    expect(onCoverUpdate).toHaveBeenCalledWith(42, null);
  });

  it('FE-MOB-NTSH-024: a failed cover removal toasts and keeps the image', async () => {
    vi.spyOn(tripsApi, 'update').mockRejectedValue(new Error('nope'));
    render(<MNewTripSheet open trip={buildDashTrip()} onClose={() => {}} onSave={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(toastCalls).toContainEqual(['Failed to remove', 'error']));
    expect(document.querySelector('img[src="/uploads/covers/a.jpg"]')).toBeInTheDocument();
  });

  it('FE-MOB-NTSH-025: archiving from the edit sheet runs the action and closes', () => {
    const onArchive = vi.fn();
    const onClose = vi.fn();
    render(<MNewTripSheet open trip={buildDashTrip()} onClose={onClose} onSave={() => {}} onArchive={onArchive} />);

    fireEvent.click(screen.getByText('Archive'));

    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-MOB-NTSH-026: an archived trip offers restore instead of archive', () => {
    render(
      <MNewTripSheet open trip={buildDashTrip({ is_archived: 1 })} onClose={() => {}} onSave={() => {}} onArchive={() => {}} />,
    );

    expect(screen.getByText('Restore')).toBeInTheDocument();
    expect(screen.queryByText('Archive')).not.toBeInTheDocument();
  });

  it('FE-MOB-NTSH-027: without trip_edit the text fields are read-only', () => {
    usePermissionsStore.setState({ permissions: { trip_edit: 'trip_owner' } });
    render(<MNewTripSheet open trip={buildDashTrip({ user_id: 999 })} onClose={() => {}} onSave={() => {}} />);

    const title = screen.getByPlaceholderText('e.g. Summer in Japan');
    expect(title).toHaveAttribute('readonly');
    fireEvent.change(title, { target: { value: 'hijacked' } });
    expect(title).toHaveValue('Japan 2026');
    expect(screen.getByLabelText('currency')).toBeDisabled();
  });

  it('FE-MOB-NTSH-028: without trip_cover_upload the whole cover block is hidden', () => {
    usePermissionsStore.setState({ permissions: { trip_cover_upload: 'trip_owner' } });
    render(<MNewTripSheet open trip={buildDashTrip({ user_id: 999 })} onClose={() => {}} onSave={() => {}} />);

    expect(screen.queryByPlaceholderText('Search destination photos')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search Unsplash' })).not.toBeInTheDocument();
  });

  it('FE-MOB-NTSH-030: only the newest search may apply its result', async () => {
    let resolveFirst: (v: { photos: CoverSearchPhoto[] }) => void = () => {};
    const search = vi.spyOn(tripsApi, 'searchCoverImages')
      .mockImplementationOnce(() => new Promise(res => { resolveFirst = res; }))
      .mockResolvedValueOnce({ photos: [{ id: 'b', url: 'u2', thumb: 't2', photographer: 'Second' }] });
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);
    const button = screen.getByRole('button', { name: 'Search Unsplash' });

    const field = screen.getByPlaceholderText('Search destination photos');
    fireEvent.change(field, { target: { value: 'a' } });
    fireEvent.click(button);
    // The button disables itself while a search runs; Enter still starts the next one.
    fireEvent.keyDown(field, { key: 'Enter' });
    await screen.findByRole('button', { name: 'Use Unsplash photo by Second' });

    // The stale first response must not replace the newer results.
    await act(async () => { resolveFirst({ photos: [{ id: 'a', url: 'u1', thumb: 't1', photographer: 'First' }] }); });

    expect(screen.queryByRole('button', { name: 'Use Unsplash photo by First' })).not.toBeInTheDocument();
    expect(search).toHaveBeenCalledTimes(2);
  });

  it('FE-MOB-NTSH-031: a stale search failure does not overwrite the newer results', async () => {
    let rejectFirst: (e: unknown) => void = () => {};
    vi.spyOn(tripsApi, 'searchCoverImages')
      .mockImplementationOnce(() => new Promise((_res, rej) => { rejectFirst = rej; }))
      .mockResolvedValueOnce({ photos: [{ id: 'b', url: 'u2', thumb: 't2', photographer: 'Second' }] });
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);
    const button = screen.getByRole('button', { name: 'Search Unsplash' });

    const field = screen.getByPlaceholderText('Search destination photos');
    fireEvent.change(field, { target: { value: 'a' } });
    fireEvent.click(button);
    fireEvent.keyDown(field, { key: 'Enter' });
    await screen.findByRole('button', { name: 'Use Unsplash photo by Second' });

    await act(async () => { rejectFirst(new Error('too late')); });

    expect(screen.queryByText('too late')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Use Unsplash photo by Second' })).toBeInTheDocument();
  });

  it('FE-MOB-NTSH-032: a result without a full-size url cannot be picked', async () => {
    vi.spyOn(tripsApi, 'searchCoverImages').mockResolvedValue({
      photos: [{ id: 'p1', url: '', thumb: 'https://img/thumb.jpg', photographer: 'Ada' }],
    });
    const update = vi.spyOn(tripsApi, 'update');
    render(<MNewTripSheet open trip={buildDashTrip({ cover_image: null })} onClose={() => {}} onSave={() => {}} />);

    fireEvent.change(screen.getByPlaceholderText('Search destination photos'), { target: { value: 'iceland' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search Unsplash' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Use Unsplash photo by Ada' }));

    await waitFor(() => expect(update).not.toHaveBeenCalled());
    expect(screen.getByText('Add cover image')).toBeInTheDocument();
  });

  it('FE-MOB-NTSH-033: the cover buttons open the device file picker', async () => {
    const click = vi.spyOn(HTMLInputElement.prototype, 'click').mockImplementation(() => {});
    render(<MNewTripSheet open trip={null} onClose={() => {}} onSave={() => {}} />);

    fireEvent.click(screen.getByText('Add cover image'));
    expect(click).toHaveBeenCalledTimes(1);

    fireEvent.change(fileInput(), { target: { files: [png()] } });
    fireEvent.click(await screen.findByText('Change'));
    expect(click).toHaveBeenCalledTimes(2);
  });

  it('FE-MOB-NTSH-029: the cancel actions close without saving', () => {
    const onClose = vi.fn();
    const onSave = vi.fn(async () => undefined);
    render(<MNewTripSheet open trip={null} onClose={onClose} onSave={onSave} />);

    // Both the header X and the footer button carry the cancel label.
    const cancels = screen.getAllByRole('button', { name: 'Cancel' });
    expect(cancels).toHaveLength(2);
    cancels.forEach(btn => fireEvent.click(btn));

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(onSave).not.toHaveBeenCalled();
  });
});
