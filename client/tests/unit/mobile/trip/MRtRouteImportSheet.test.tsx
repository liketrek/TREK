import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { _pinSizeClass, type SizeClass } from '../../../../src/hooks/sizeClass';
import MRtRouteImport from '../../../../src/mobile/screens/trip/roadtrip/MRtRouteImportSheet';
import { googleRouteRepo } from '../../../../src/repo/googleRouteRepo';
import { useTripStore } from '../../../../src/store/tripStore';
import { fireEvent, render, screen, waitFor } from '../../../helpers/render';
import { resetAllStores, seedStore } from '../../../helpers/store';

// FE-MOB-RTIMPORT-001 to FE-MOB-RTIMPORT-005
//
// A Google Maps route appended to a day, as the stage card's offer on an iPad or
// an unfolded Duo, over the same useGoogleRouteImport as the desktop dialog.

vi.mock('../../../../src/repo/googleRouteRepo', () => ({ googleRouteRepo: { preview: vi.fn(), append: vi.fn() } }));

const loadTrip = vi.fn(async () => {});

function renderImport(size: SizeClass = 'wide', canEdit = true) {
  _pinSizeClass(size);
  return render(<MRtRouteImport tripId={1} dayId={3} canEdit={canEdit} />);
}

async function previewRoute() {
  fireEvent.click(screen.getByRole('button', { name: 'Import Google Maps route' }));
  fireEvent.change(screen.getByRole('textbox', { name: 'Google Maps URL' }), {
    target: { value: 'https://google.com/maps/dir/A/B' },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
  await screen.findByText('Munich');
}

describe('MRtRouteImport', () => {
  beforeEach(() => {
    resetAllStores();
    vi.clearAllMocks();
    seedStore(useTripStore, {
      days: [
        { id: 3, day_number: 1, title: 'First day' },
        { id: 4, day_number: 2, title: null },
      ] as never,
      loadTrip,
    });
  });

  afterEach(() => {
    _pinSizeClass(null);
  });

  it('FE-MOB-RTIMPORT-001: is absent on the phone and for a reader', () => {
    const phone = renderImport('compact');
    expect(phone.container).toBeEmptyDOMElement();
    phone.unmount();
    const reader = renderImport('split', false);
    expect(reader.container).toBeEmptyDOMElement();
  });

  it('FE-MOB-RTIMPORT-002: previews the stops in order and says which did not resolve', async () => {
    vi.mocked(googleRouteRepo.preview).mockResolvedValue({
      stops: [
        { name: 'Munich', lat: 48, lng: 11 },
        { name: 'Unknown', lat: null, lng: null },
        { name: 'Rome', lat: 41, lng: 12 },
      ],
    });
    renderImport();
    await previewRoute();
    const items = screen.getAllByRole('listitem').map((item) => item.textContent);
    expect(items).toEqual([
      expect.stringContaining('Munich'),
      expect.stringContaining('Unknown'),
      expect.stringContaining('Rome'),
    ]);
    expect(screen.getByText('Location unresolved; this stop will be skipped.')).toBeInTheDocument();
    expect(googleRouteRepo.append).not.toHaveBeenCalled();
  });

  it('FE-MOB-RTIMPORT-003: appends only the resolved stops to the day picked', async () => {
    vi.mocked(googleRouteRepo.preview).mockResolvedValue({
      stops: [
        { name: 'Munich', lat: 48, lng: 11 },
        { name: 'Unknown', lat: null, lng: null },
        { name: 'Rome', lat: 41, lng: 12 },
      ],
    });
    vi.mocked(googleRouteRepo.append).mockResolvedValue(undefined);
    renderImport();
    await previewRoute();
    fireEvent.change(screen.getByRole('combobox', { name: 'Day' }), { target: { value: '4' } });
    expect(screen.getByRole('option', { name: 'Day 2' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Import' }));
    await waitFor(() => expect(loadTrip).toHaveBeenCalledWith(1));
    expect(googleRouteRepo.append).toHaveBeenCalledWith(
      1,
      {
        dayId: 4,
        stops: [
          { name: 'Munich', lat: 48, lng: 11 },
          { name: 'Rome', lat: 41, lng: 12 },
        ],
      },
      expect.any(String)
    );
  });

  it('FE-MOB-RTIMPORT-004: holds the import while fewer than two stops resolve', async () => {
    vi.mocked(googleRouteRepo.preview).mockResolvedValue({
      stops: [
        { name: 'Munich', lat: 48, lng: 11 },
        { name: 'Unknown', lat: null, lng: null },
      ],
    });
    renderImport();
    await previewRoute();
    expect(screen.getByRole('button', { name: 'Import' })).toBeDisabled();
  });

  it('FE-MOB-RTIMPORT-005: a link that cannot be read is an alert, and the preview waits for a link', async () => {
    vi.mocked(googleRouteRepo.preview).mockRejectedValue(new Error('Not a Google Maps route'));
    renderImport();
    fireEvent.click(screen.getByRole('button', { name: 'Import Google Maps route' }));
    expect(screen.getByRole('button', { name: 'Preview' })).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Google Maps URL' }), { target: { value: 'nonsense' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  });
});
