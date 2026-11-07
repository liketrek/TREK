import { useEffect, useEffectEvent } from 'react';
import { useSearchParams } from 'react-router';

import { EXPORT_PARAM, EXPORT_PDF } from '../utils/pdfSafariHandoff';

/**
 * Opens the trip's export when the address asks for it (`?export=pdf`), the way
 * the iOS Home Screen app hands a PDF over to Safari. The parameter is dropped
 * once read, so a reload or a copied link does not open the dialog again.
 */
export function useExportDeepLink(openExport: () => void): void {
  const [searchParams, setSearchParams] = useSearchParams();
  const requested = searchParams.get(EXPORT_PARAM) === EXPORT_PDF;
  // The shells pass a fresh closure on every render; the request is answered once.
  const open = useEffectEvent(openExport);

  useEffect(() => {
    if (!requested) return;
    open();
    setSearchParams(
      (p) => {
        p.delete(EXPORT_PARAM);
        return p;
      },
      { replace: true }
    );
  }, [requested, setSearchParams]);
}
