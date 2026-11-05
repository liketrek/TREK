import { PRIVACY_URL } from '../../native/links';
import { nativeServerHost } from '../../native/platform';
import { TrekShell } from '../../native/trekShell';

/**
 * The server section both settings views show inside the iOS and Android app:
 * the host the app is connected to (null in a browser, where the section stays
 * hidden), the way back to the address screen, and the privacy policy the store
 * listings name, which an app has to reach from inside itself.
 */
export function useNativeServer(): { host: string | null; changeServer: () => void; privacyUrl: string } {
  return {
    host: nativeServerHost(),
    privacyUrl: PRIVACY_URL,
    changeServer: () => {
      void TrekShell.resetServer();
    },
  };
}
