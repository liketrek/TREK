import { useEffect, useState } from 'react';
import { pluginsApi } from '../../api/client';
import { useTranslation } from '../../i18n';

export interface ActivityRow {
  ts: string;
  plugin_id: string;
  plugin_name: string | null;
  method: string;
  resource: string | null;
  code: string;
}

/**
 * The signed-in user's own plugin activity log behind the desktop panel and the
 * phone card: loaded on mount and on refresh, newest first. Fail-safe: a failed
 * load leaves an empty list, never an error.
 */
export function usePluginActivity() {
  const { locale } = useTranslation();
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    pluginsApi
      .myActivity()
      .then((r) => setRows(r.activity))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const fmtWhen = (ts: string): string => {
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? ts : d.toLocaleString(locale);
  };

  return { rows, loading, load, fmtWhen };
}
