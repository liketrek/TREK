import type { PublicConfig } from '@trek/shared';
import { useEffect, useState } from 'react';

import { configApi } from '../../api/client';

export function useLegalPage(): { config: PublicConfig | null } {
  const [config, setConfig] = useState<PublicConfig | null>(null);

  useEffect(() => {
    configApi
      .getPublicConfig()
      .then(setConfig)
      .catch(() => {});
  }, []);

  return { config };
}
