import { isNativeApp } from '../native/platform';

/**
 * A full page load to `url`. In the apps it waits for the first page to finish
 * loading: started earlier, it cancels that load, and the shell answers a
 * cancelled load with its "Server not reachable" page, which is where a
 * signed-out user opening the app for the first time ended up.
 */
export function hardNavigate(url: string): void {
  const go = () => {
    window.location.href = url;
  };
  if (isNativeApp() && document.readyState !== 'complete') window.addEventListener('load', go, { once: true });
  else go();
}
