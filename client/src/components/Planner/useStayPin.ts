import { useEffect, useRef, useState } from 'react';

import { usePlaceLanguage } from '../../hooks/usePlaceLanguage';
import { findOnMap, type MapMatch, stayQueries } from '../../repo/mapMatchRepo';
import { isEffectivelyOffline } from '../../sync/networkMode';

/**
 * Where an imported stay will sit on the map, as the review shows it: not asked
 * yet (or offline, where there is nothing to ask), being looked up, found, or
 * not found at all.
 */
export type StayPin =
  { status: 'idle' } | { status: 'searching' } | { status: 'found'; match: MapMatch } | { status: 'missing' };

/**
 * The map spot of a stay reviewed from an import, looked up before it is saved
 * so the review can say whether it will show on the map. A stay the search did
 * not find used to be saved without coordinates and simply never appeared.
 * A later lookup always wins over an earlier one still on its way.
 */
export function useStayPin() {
  const lang = usePlaceLanguage();
  const [pin, setPin] = useState<StayPin>({ status: 'idle' });
  const ticket = useRef(0);
  useEffect(
    () => () => {
      ticket.current++;
    },
    []
  );

  const lookUp = (name: string | null | undefined, address: string | null | undefined) => {
    const mine = ++ticket.current;
    const queries = stayQueries(name ?? '', address);
    if (isEffectivelyOffline()) {
      setPin({ status: 'idle' });
      return;
    }
    if (queries.length === 0) {
      setPin({ status: 'missing' });
      return;
    }
    setPin({ status: 'searching' });
    findOnMap(queries, lang).then(
      (match) => {
        if (mine === ticket.current) setPin(match ? { status: 'found', match } : { status: 'missing' });
      },
      () => {
        if (mine === ticket.current) setPin({ status: 'missing' });
      }
    );
  };

  return {
    pin,
    /** The spot to save the stay at, once one is known. */
    match: pin.status === 'found' ? pin.match : null,
    lookUp,
    /** A spot the reader picked by hand, which beats any lookup. */
    pick: (match: MapMatch) => {
      ticket.current++;
      setPin({ status: 'found', match });
    },
    reset: () => {
      ticket.current++;
      setPin({ status: 'idle' });
    },
  };
}
