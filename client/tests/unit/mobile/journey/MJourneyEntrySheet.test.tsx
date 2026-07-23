import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mapsApi, weatherApi } from '../../../../src/api/client';
import MJourneyEntrySheet from '../../../../src/mobile/screens/journey/MJourneyEntrySheet';
import type { JourneyEntry } from '../../../../src/store/journeyStore';
import { fireEvent, render, screen, waitFor } from '../../../helpers/render';

const entry: JourneyEntry = {
  id: 0,
  journey_id: 7,
  author_id: 0,
  type: 'entry',
  entry_date: '2026-07-22',
  entry_time: '09:07',
  visibility: 'private',
  sort_order: 0,
  photos: [],
  created_at: 0,
  updated_at: 0,
};

function setup() {
  const props = {
    entry,
    galleryPhotos: [],
    quickCapture: true,
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(42),
    onUploadPhotos: vi.fn().mockResolvedValue({ succeeded: [], failed: [] }),
    onDone: vi.fn(),
  };
  const view = render(<MJourneyEntrySheet {...props} />);
  return { ...view, props };
}

describe('MJourneyEntrySheet quick capture', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((success) => success({ coords: { latitude: 1.3521, longitude: 103.8198 } })),
      },
    });
  });

  it('captures GPS, reverse-geocodes it, detects an editable weather category, and saves', async () => {
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: 'Singapore', address: 'Singapore' });
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({
      temp: 30,
      main: 'Rain',
      description: 'Rain',
      type: 'current',
    });
    const { props } = setup();

    await waitFor(() => expect(mapsApi.reverse).toHaveBeenCalledWith(1.3521, 103.8198));
    expect(weatherApi.getCurrent).toHaveBeenCalledWith(1.3521, 103.8198, 'en');
    await waitFor(() => expect(screen.getByDisplayValue('Singapore')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          entry_date: '2026-07-22',
          entry_time: '09:07',
          location_name: 'Singapore',
          location_lat: 1.3521,
          location_lng: 103.8198,
          weather: 'rainy',
        })
      )
    );
    expect(props.onDone).toHaveBeenCalled();
  });

  it('offers native camera and gallery inputs', () => {
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: null, address: null });
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({
      temp: 0,
      main: '',
      description: '',
      type: '',
      error: 'unavailable',
    });
    setup();

    expect(document.querySelector('input[type="file"][capture="environment"]')).toBeInTheDocument();
    expect(document.querySelector('input[type="file"][multiple]')).toBeInTheDocument();
    return waitFor(() => expect(mapsApi.reverse).toHaveBeenCalled());
  });

  it('can expand into the full editor before saving', async () => {
    vi.spyOn(mapsApi, 'reverse').mockResolvedValue({ name: null, address: null });
    vi.spyOn(weatherApi, 'getCurrent').mockResolvedValue({
      temp: 0,
      main: '',
      description: '',
      type: '',
      error: 'unavailable',
    });
    setup();

    expect(screen.queryByPlaceholderText('Give this moment a name...')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add details' }));
    expect(screen.getByPlaceholderText('Give this moment a name...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Write your story...')).toBeInTheDocument();
    await waitFor(() => expect(mapsApi.reverse).toHaveBeenCalled());
  });

  it('still saves when location permission is denied', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: vi.fn((_success, failure) => failure({ message: 'Permission denied' })),
      },
    });
    const { props } = setup();

    expect(await screen.findByText('Permission denied')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(props.onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          entry_date: '2026-07-22',
          entry_time: '09:07',
          location_lat: null,
          location_lng: null,
        })
      )
    );
    expect(props.onDone).toHaveBeenCalled();
  });
});
