import { render, screen, fireEvent, waitFor } from '../../../tests/helpers/render';
import userEvent from '@testing-library/user-event';
import { getCached, isLoading, fetchPhoto, onThumbReady } from '../../services/photoService';

// Mock photoService — PlaceAvatarUpload wraps PlaceAvatar, which pulls thumbnails.
vi.mock('../../services/photoService', () => ({
  getCached: vi.fn(() => null),
  isLoading: vi.fn(() => false),
  fetchPhoto: vi.fn(),
  onThumbReady: vi.fn(() => () => {}),
}));

// IntersectionObserver stub (PlaceAvatar observes visibility to lazy-load photos)
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
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
});

import PlaceAvatarUpload from './PlaceAvatarUpload';

const placeNoImage = {
  id: 1,
  name: 'Eiffel Tower',
  image_url: null,
  google_place_id: null,
  osm_id: null,
  lat: 48.8584,
  lng: 2.2945,
};

const placeWithImage = { ...placeNoImage, image_url: 'https://example.com/eiffel.jpg' };

describe('PlaceAvatarUpload', () => {
  it('FE-COMP-PLACEAVUPLOAD-001: renders the underlying avatar image when image_url is set', () => {
    render(<PlaceAvatarUpload place={placeWithImage} onUpload={vi.fn()} onRemove={vi.fn()} />);
    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toContain('eiffel.jpg');
  });

  it('FE-COMP-PLACEAVUPLOAD-002: clicking the avatar opens the hidden file picker', async () => {
    const user = userEvent.setup();
    const { container } = render(<PlaceAvatarUpload place={placeNoImage} onUpload={vi.fn()} onRemove={vi.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    await user.click(screen.getByRole('button', { name: 'Upload image' }));
    expect(clickSpy).toHaveBeenCalled();
  });

  it('FE-COMP-PLACEAVUPLOAD-003: choosing a file calls onUpload with the picked file', async () => {
    const onUpload = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<PlaceAvatarUpload place={placeNoImage} onUpload={onUpload} onRemove={vi.fn()} />);
    const input = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(input, { target: { files: [file] } });
    await waitFor(() => expect(onUpload).toHaveBeenCalledWith(file));
  });

  it('FE-COMP-PLACEAVUPLOAD-004: the remove button only appears when a custom image is set', () => {
    const { rerender } = render(<PlaceAvatarUpload place={placeNoImage} onUpload={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Remove image' })).toBeNull();
    rerender(<PlaceAvatarUpload place={placeWithImage} onUpload={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Remove image' })).toBeTruthy();
  });

  it('FE-COMP-PLACEAVUPLOAD-005: clicking remove calls onRemove', async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn().mockResolvedValue(undefined);
    render(<PlaceAvatarUpload place={placeWithImage} onUpload={vi.fn()} onRemove={onRemove} />);
    await user.click(screen.getByRole('button', { name: 'Remove image' }));
    expect(onRemove).toHaveBeenCalled();
  });

  it('FE-COMP-PLACEAVUPLOAD-006: the avatar aria-label reflects upload vs change from the places.* keys', () => {
    const { rerender } = render(<PlaceAvatarUpload place={placeNoImage} onUpload={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Upload image' })).toBeTruthy();
    rerender(<PlaceAvatarUpload place={placeWithImage} onUpload={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Change image' })).toBeTruthy();
  });
});
