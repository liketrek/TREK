import { afterEach, describe, expect, it } from 'vitest';
import { fadeInImages } from './imageFade';

let stop: (() => void) | null = null;

afterEach(() => {
  stop?.();
  stop = null;
  document.body.innerHTML = '';
});

/** Lets the MutationObserver deliver what was just added. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function loadingImage(): HTMLImageElement {
  const img = document.createElement('img');
  Object.defineProperty(img, 'complete', { value: false, configurable: true });
  return img;
}

describe('fadeInImages', () => {
  it('holds a loading picture back and fades it in once it has loaded', async () => {
    stop = fadeInImages();
    const img = loadingImage();
    document.body.appendChild(img);
    await settle();
    expect(img.hasAttribute('data-fading')).toBe(true);
    img.dispatchEvent(new Event('load'));
    expect(img.hasAttribute('data-fading')).toBe(false);
    expect(img.hasAttribute('data-faded')).toBe(true);
  });

  it('shows a picture that failed, so it never stays invisible', async () => {
    stop = fadeInImages();
    const img = loadingImage();
    document.body.appendChild(img);
    await settle();
    img.dispatchEvent(new Event('error'));
    expect(img.hasAttribute('data-fading')).toBe(false);
  });

  it('shows a picture from the cache at once, and finds pictures inside what was added', async () => {
    stop = fadeInImages();
    const wrap = document.createElement('div');
    const cached = document.createElement('img');
    Object.defineProperty(cached, 'complete', { value: true });
    const fresh = loadingImage();
    wrap.append(cached, fresh);
    document.body.appendChild(wrap);
    await settle();
    expect(cached.hasAttribute('data-fading')).toBe(false);
    expect(fresh.hasAttribute('data-fading')).toBe(true);
  });

  it('leaves map tiles and opted-out pictures alone', async () => {
    stop = fadeInImages();
    document.body.innerHTML = '<div class="leaflet-container"></div><div data-no-fade></div>';
    const tile = loadingImage();
    const own = loadingImage();
    document.body.children[0]?.appendChild(tile);
    document.body.children[1]?.appendChild(own);
    await settle();
    expect(tile.hasAttribute('data-fading')).toBe(false);
    expect(own.hasAttribute('data-fading')).toBe(false);
  });
});
