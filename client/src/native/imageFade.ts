/**
 * Pictures that fade in once they are there, instead of building up line by
 * line or popping in late, the way a native app shows a cover or a photo.
 *
 * Only an image that is still loading when it reaches the page fades: it waits
 * at opacity 0 (data-fading), and as it loads or fails it is shown with a short
 * fade (data-faded, index.css). One that is already in the cache shows at once,
 * so nothing on a screen opened a second time flickers. A failed image is shown
 * too, so a picture never stays invisible. Map tiles fade by themselves and are
 * left alone, as is anything inside [data-no-fade]. Only the app calls this.
 */

const SKIP = '.leaflet-container, .maplibregl-map, [data-no-fade]';

function watch(img: HTMLImageElement): void {
  if (img.complete || img.hasAttribute('data-fading') || img.closest(SKIP)) return;
  img.setAttribute('data-fading', '');
  const show = () => {
    img.removeEventListener('load', show);
    img.removeEventListener('error', show);
    img.removeAttribute('data-fading');
    img.setAttribute('data-faded', '');
  };
  img.addEventListener('load', show);
  img.addEventListener('error', show);
}

function scan(node: Node): void {
  if (node instanceof HTMLImageElement) watch(node);
  else if (node instanceof Element) node.querySelectorAll('img').forEach(watch);
}

export function fadeInImages(root: Element = document.body): () => void {
  const observer = new MutationObserver((records) => {
    for (const record of records) record.addedNodes.forEach(scan);
  });
  observer.observe(root, { childList: true, subtree: true });
  return () => observer.disconnect();
}
