import { useEffect, useState } from 'react';

import { adminApi } from '../../../api/client';
import type { RegistryDetail } from './pluginModel';

/**
 * The registry detail of one plugin, behind both shells' detail views (the desktop modal
 * and the phone sheet). Fetched once per id; a response for an id the view has moved off
 * is dropped. `D` lets a shell read the detail under its own stricter shape.
 */
export function usePluginDetail<D = RegistryDetail>(id: string) {
  const [detail, setDetail] = useState<D | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    adminApi
      .pluginDetail(id)
      .then((d: D) => {
        if (alive) setDetail(d);
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [id]);

  return { detail, failed };
}
