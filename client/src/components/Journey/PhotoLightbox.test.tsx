// FE-COMP-LIGHTBOX-001 to FE-COMP-LIGHTBOX-017

// Plyr needs a real media pipeline, so the player is stubbed here.
vi.mock('./VideoPlayer', () => ({
  default: ({ src }: { src: string }) => <video data-testid="video-player" src={src} />,
}));

vi.mock('../../api/websocket', () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  getSocketId: vi.fn(() => null),
  setRefetchCallback: vi.fn(),
  setPreReconnectHook: vi.fn(),
  addListener: vi.fn(),
  removeListener: vi.fn(),
}));

import { render, screen, fireEvent } from '../../../tests/helpers/render';
import { resetAllStores } from '../../../tests/helpers/store';
import PhotoLightbox from './PhotoLightbox';

const samplePhotos = [
  { id: 'p1', src: '/photos/1.jpg', caption: 'Sunset at the beach' },
  { id: 'p2', src: '/photos/2.jpg', caption: 'Mountain trail' },
  { id: 'p3', src: '/photos/3.jpg', caption: null },
];

beforeEach(() => {
  resetAllStores();
});

describe('PhotoLightbox', () => {
  it('FE-COMP-LIGHTBOX-001: renders without crashing when open', () => {
    const onClose = vi.fn();
    render(<PhotoLightbox photos={samplePhotos} onClose={onClose} />);
    expect(document.body).toBeInTheDocument();
  });

  it('FE-COMP-LIGHTBOX-002: shows photo image', () => {
    const onClose = vi.fn();
    render(<PhotoLightbox photos={samplePhotos} onClose={onClose} />);
    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/photos/1.jpg');
  });

  it('FE-COMP-LIGHTBOX-003: shows close button', () => {
    const onClose = vi.fn();
    render(<PhotoLightbox photos={samplePhotos} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    // Close button exists (the X button in the top bar)
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('FE-COMP-LIGHTBOX-004: previous/next navigation works', () => {
    const onClose = vi.fn();
    render(<PhotoLightbox photos={samplePhotos} onClose={onClose} />);
    // Initially shows photo 1
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', '/photos/1.jpg');

    // Navigate to next photo via ArrowRight key
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/photos/2.jpg');

    // Navigate back via ArrowLeft key
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/photos/1.jpg');
  });

  it('FE-COMP-LIGHTBOX-005: keyboard Escape closes lightbox', () => {
    const onClose = vi.fn();
    render(<PhotoLightbox photos={samplePhotos} onClose={onClose} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('FE-COMP-LIGHTBOX-006: counter shows "1 / N"', () => {
    const onClose = vi.fn();
    render(<PhotoLightbox photos={samplePhotos} onClose={onClose} />);
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('FE-COMP-LIGHTBOX-007: does not render when photos array is empty', () => {
    const onClose = vi.fn();
    const { container } = render(<PhotoLightbox photos={[]} onClose={onClose} />);
    // Component returns null when photo is undefined (empty array, index 0 is undefined)
    expect(container.querySelector('img')).not.toBeInTheDocument();
  });

  it('FE-COMP-LIGHTBOX-008: calls onClose when close button clicked', () => {
    const onClose = vi.fn();
    render(<PhotoLightbox photos={samplePhotos} onClose={onClose} />);
    // The close button is in the top bar — find the button and click it
    const buttons = screen.getAllByRole('button');
    // The first button in the top bar is the close (X) button
    buttons[0].click();
    expect(onClose).toHaveBeenCalled();
  });

  it('FE-COMP-LIGHTBOX-009: opens at the requested start index', () => {
    const { container } = render(<PhotoLightbox photos={samplePhotos} startIndex={2} onClose={vi.fn()} />);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
    // The third photo has no caption, so its img is presentational.
    expect(container.querySelector('img')).toHaveAttribute('src', '/photos/3.jpg');
  });

  it('FE-COMP-LIGHTBOX-010: only offers the arrows that lead somewhere', () => {
    render(<PhotoLightbox photos={samplePhotos} onClose={vi.fn()} />);
    // First photo: close + next.
    expect(screen.getAllByRole('button')).toHaveLength(2);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getAllByRole('button')).toHaveLength(3);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    // Last photo: close + prev.
    expect(screen.getAllByRole('button')).toHaveLength(2);

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('FE-COMP-LIGHTBOX-011: navigates with the on-screen arrows', () => {
    render(<PhotoLightbox photos={samplePhotos} startIndex={1} onClose={vi.fn()} />);
    const [, prev, next] = screen.getAllByRole('button');

    fireEvent.click(next);
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button')[1]);
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
    expect(prev).toBeInTheDocument();
  });

  it('FE-COMP-LIGHTBOX-012: stays on the first photo when arrowing left', () => {
    render(<PhotoLightbox photos={samplePhotos} onClose={vi.fn()} />);
    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('FE-COMP-LIGHTBOX-013: renders the caption of the current photo only', () => {
    render(<PhotoLightbox photos={samplePhotos} onClose={vi.fn()} />);
    expect(screen.getByText('Sunset at the beach')).toBeInTheDocument();
    expect(screen.queryByText('Mountain trail')).not.toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(screen.getByText('Mountain trail')).toBeInTheDocument();
  });

  it('FE-COMP-LIGHTBOX-014: renders a video item through the player instead of an image', async () => {
    render(
      <PhotoLightbox
        photos={[{ id: 'v1', src: '/videos/1.mp4', caption: null, mediaType: 'video' }]}
        onClose={vi.fn()}
      />,
    );
    // The player loads on demand now — plyr no longer ships with the journal.
    expect(await screen.findByTestId('video-player')).toHaveAttribute('src', '/videos/1.mp4');
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('FE-COMP-LIGHTBOX-015: swipes horizontally to move between photos', () => {
    const { container } = render(<PhotoLightbox photos={samplePhotos} startIndex={1} onClose={vi.fn()} />);
    const surface = container.firstElementChild as HTMLElement;

    fireEvent.touchStart(surface, { touches: [{ clientX: 200, clientY: 200 }] });
    fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 100, clientY: 210 }] });
    expect(screen.getByText('3 / 3')).toBeInTheDocument();

    fireEvent.touchStart(surface, { touches: [{ clientX: 100, clientY: 200 }] });
    fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 200, clientY: 210 }] });
    expect(screen.getByText('2 / 3')).toBeInTheDocument();
  });

  it('FE-COMP-LIGHTBOX-016: swipes down to close', () => {
    const onClose = vi.fn();
    const { container } = render(<PhotoLightbox photos={samplePhotos} onClose={onClose} />);
    const surface = container.firstElementChild as HTMLElement;

    fireEvent.touchStart(surface, { touches: [{ clientX: 200, clientY: 100 }] });
    fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 210, clientY: 300 }] });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('FE-COMP-LIGHTBOX-017: ignores a touch end without a matching touch start', () => {
    const onClose = vi.fn();
    const { container } = render(<PhotoLightbox photos={samplePhotos} onClose={onClose} />);
    const surface = container.firstElementChild as HTMLElement;

    fireEvent.touchEnd(surface, { changedTouches: [{ clientX: 210, clientY: 300 }] });

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });
});
