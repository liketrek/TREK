import { render, screen, fireEvent, act } from '../../../tests/helpers/render';
import { getCached, isLoading, fetchPhoto, onThumbReady, onPhotoLoaded } from '../../services/photoService';

// Mock photoService — all functions are no-ops / return null
vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
  onPhotoLoaded: vi.fn(() => () => {}),
}));

// Mock IntersectionObserver as a class constructor
const mockDisconnect = vi.fn();
const mockObserve = vi.fn();
let observerInstance: MockIntersectionObserver | null = null;

class MockIntersectionObserver {
  callback: (entries: Partial<IntersectionObserverEntry>[]) => void;
  constructor(callback: (entries: Partial<IntersectionObserverEntry>[]) => void) {
    this.callback = callback;
    observerInstance = this;
  }
  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = vi.fn();
}

beforeAll(() => {
  (globalThis as any).IntersectionObserver = MockIntersectionObserver;
});

beforeEach(() => {
  vi.mocked(getCached).mockReturnValue(null);
  vi.mocked(isLoading).mockReturnValue(false);
  vi.mocked(fetchPhoto).mockReset();
  vi.mocked(onThumbReady).mockReturnValue(() => {});
  vi.mocked(onPhotoLoaded).mockReset().mockReturnValue(() => {});
});

afterEach(() => {
  mockDisconnect.mockClear();
  mockObserve.mockClear();
  observerInstance = null;
});

import PlaceAvatar from './PlaceAvatar';

const basePlaceNoImage = {
  id: 1,
  name: 'Eiffel Tower',
  image_url: null,
  google_place_id: null,
  osm_id: null,
  lat: 48.8584,
  lng: 2.2945,
};

const basePlaceWithImage = {
  ...basePlaceNoImage,
  image_url: 'https://example.com/eiffel.jpg',
};

describe('PlaceAvatar', () => {
  it('FE-COMP-AVATAR-001: renders an image when image_url is provided', () => {
    render(<PlaceAvatar place={basePlaceWithImage} />);
    const img = screen.getByRole('img');
    expect(img).toBeTruthy();
    expect((img as HTMLImageElement).src).toContain('eiffel.jpg');
  });

  it('FE-COMP-AVATAR-002: image has correct alt text equal to place.name', () => {
    render(<PlaceAvatar place={basePlaceWithImage} />);
    const img = screen.getByAltText('Eiffel Tower');
    expect(img).toBeTruthy();
  });

  it('FE-COMP-AVATAR-003: renders an icon (no img) when no image_url', () => {
    render(<PlaceAvatar place={basePlaceNoImage} />);
    expect(screen.queryByRole('img')).toBeNull();
    // The wrapper div should still be present
    const { container } = render(<PlaceAvatar place={basePlaceNoImage} />);
    expect(container.querySelector('div')).toBeTruthy();
  });

  it('FE-COMP-AVATAR-004: uses category color as background color', () => {
    const { container } = render(
      <PlaceAvatar place={basePlaceWithImage} category={{ color: '#ff5733', icon: 'MapPin' }} />
    );
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.backgroundColor).toBe('rgb(255, 87, 51)');
  });

  it('FE-COMP-AVATAR-005: uses default indigo color when no category provided', () => {
    const { container } = render(<PlaceAvatar place={basePlaceWithImage} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.backgroundColor).toBe('rgb(99, 102, 241)');
  });

  it('FE-COMP-AVATAR-006: falls back to icon when image fails to load', () => {
    render(<PlaceAvatar place={basePlaceWithImage} />);
    const img = screen.getByRole('img');
    // Simulate image load error
    act(() => {
      fireEvent.error(img);
    });
    // After error, img is removed and icon takes over
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('FE-COMP-AVATAR-007: respects the size prop for container dimensions', () => {
    const { container } = render(<PlaceAvatar place={basePlaceWithImage} size={64} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.width).toBe('64px');
    expect(wrapper.style.height).toBe('64px');
  });

  it('FE-COMP-AVATAR-008: default size is 32px when size prop is omitted', () => {
    const { container } = render(<PlaceAvatar place={basePlaceWithImage} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.width).toBe('32px');
    expect(wrapper.style.height).toBe('32px');
  });

  it('FE-COMP-AVATAR-009: uses category icon (SVG) when no category provided', () => {
    const { container } = render(<PlaceAvatar place={basePlaceNoImage} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('FE-COMP-AVATAR-010: uses category-specific icon when category.icon is set', () => {
    const { container } = render(
      <PlaceAvatar place={basePlaceNoImage} category={{ icon: 'MapPin', color: '#ff0000' }} />
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('FE-COMP-AVATAR-011: calls fetchPhoto when visible and no image_url, no cache', () => {
    render(<PlaceAvatar place={basePlaceNoImage} />);

    act(() => {
      observerInstance?.callback([{ isIntersecting: true }]);
    });

    expect(vi.mocked(fetchPhoto)).toHaveBeenCalled();
  });

  it('FE-COMP-AVATAR-012: sets photoSrc from cached thumbnail when cache hit', () => {
    vi.mocked(getCached).mockReturnValue({ thumbDataUrl: 'data:image/jpeg;base64,abc', photoUrl: null } as any);

    const { container } = render(
      <PlaceAvatar place={{ ...basePlaceNoImage, google_place_id: 'gid123' }} />
    );

    const img = container.querySelector('img') as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain('data:image/jpeg;base64,abc');
  });

  it('FE-COMP-AVATAR-013: registers onThumbReady callback when photo is loading', () => {
    vi.mocked(getCached).mockReturnValue(null);
    vi.mocked(isLoading).mockReturnValue(true);

    render(<PlaceAvatar place={{ ...basePlaceNoImage, google_place_id: 'gid456' }} />);

    act(() => {
      observerInstance?.callback([{ isIntersecting: true }]);
    });

    expect(vi.mocked(onThumbReady)).toHaveBeenCalledWith('gid456', expect.any(Function));
  });

  it('FE-COMP-AVATAR-014: does not call fetchPhoto when image_url is set', () => {
    render(<PlaceAvatar place={basePlaceWithImage} />);
    expect(vi.mocked(fetchPhoto)).not.toHaveBeenCalled();
  });

  it('FE-COMP-AVATAR-015: IntersectionObserver disconnected on unmount', () => {
    const { unmount } = render(<PlaceAvatar place={basePlaceNoImage} />);
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
  });

  it('FE-COMP-AVATAR-016: does not set up IntersectionObserver when image_url present', () => {
    render(<PlaceAvatar place={basePlaceWithImage} />);
    expect(mockObserve).not.toHaveBeenCalled();
  });

  /** The callback the self-heal handed to fetchPhoto. */
  function photoCallback() {
    const callback = vi.mocked(fetchPhoto).mock.calls[0]?.[5];
    if (!callback) throw new Error('fetchPhoto was called without a callback');
    return callback;
  }

  // A proxy image_url whose cached file is gone answers 204; the refetch then
  // hands back the very same URL once the server has the photo again.
  const proxyPlace = {
    ...basePlaceNoImage,
    google_place_id: 'G1',
    image_url: '/api/maps/place-photo/G1/bytes',
  };

  it('FE-COMP-AVATAR-017: loads the image again when the self-heal returns the same proxy URL', () => {
    const { container } = render(<PlaceAvatar place={proxyPlace} />);
    const before = container.querySelector('img') as HTMLImageElement;
    fireEvent.error(before);

    expect(vi.mocked(fetchPhoto)).toHaveBeenCalledWith('refetch:G1', 'G1', proxyPlace.lat, proxyPlace.lng, proxyPlace.name, expect.any(Function));
    const callback = photoCallback();
    act(() => callback({ photoUrl: proxyPlace.image_url, thumbDataUrl: null }));

    const after = container.querySelector('img') as HTMLImageElement;
    expect(after).not.toBe(before);
    expect(after.getAttribute('src')).toBe(proxyPlace.image_url);
  });

  it('FE-COMP-AVATAR-018: ends on the category icon when the reloaded image fails too', () => {
    const { container } = render(<PlaceAvatar place={proxyPlace} />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    const callback = photoCallback();
    act(() => callback({ photoUrl: proxyPlace.image_url, thumbDataUrl: null }));
    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('svg')).toBeTruthy();
    expect(vi.mocked(fetchPhoto)).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-AVATAR-019: ends on the category icon when the self-heal finds no photo', () => {
    const { container } = render(<PlaceAvatar place={proxyPlace} />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);
    const callback = photoCallback();
    act(() => callback({ photoUrl: null, thumbDataUrl: null }));

    expect(container.querySelector('img')).toBeNull();
  });

  it('FE-COMP-AVATAR-020: a reused avatar gets the self-heal again for the next place', () => {
    const { container, rerender } = render(<PlaceAvatar place={proxyPlace} />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    const next = { ...proxyPlace, id: 2, google_place_id: 'G2', image_url: '/api/maps/place-photo/G2/bytes' };
    rerender(<PlaceAvatar place={next} />);
    fireEvent.error(container.querySelector('img') as HTMLImageElement);

    expect(vi.mocked(fetchPhoto)).toHaveBeenLastCalledWith('refetch:G2', 'G2', next.lat, next.lng, next.name, expect.any(Function));
  });

  it('FE-COMP-AVATAR-021: takes the photo of a fetch another view started, even without a thumb', () => {
    vi.mocked(isLoading).mockReturnValue(true);
    const { container } = render(<PlaceAvatar place={{ ...basePlaceNoImage, google_place_id: 'G3' }} />);
    act(() => {
      observerInstance?.callback([{ isIntersecting: true }]);
    });

    expect(vi.mocked(onPhotoLoaded)).toHaveBeenCalledWith('G3', expect.any(Function));
    const listener = vi.mocked(onPhotoLoaded).mock.calls[0][1];
    act(() => listener({ photoUrl: '/photo/G3.jpg', thumbDataUrl: null }));

    expect((container.querySelector('img') as HTMLImageElement).getAttribute('src')).toBe('/photo/G3.jpg');
  });
});
