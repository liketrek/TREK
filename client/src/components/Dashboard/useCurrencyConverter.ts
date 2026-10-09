import { useCallback, useEffect, useRef, useState } from 'react';

import { useSettingsStore } from '../../store/settingsStore';
import { CURRENCIES } from '../Budget/BudgetPanel.constants';

/**
 * The dashboard's currency converter: the pair lives in the user's settings, the
 * rates come from Frankfurter for the `from` currency.
 *
 * A request still in flight is aborted when a new one starts or the widget goes
 * away, so a late answer for an older `from` never overwrites a newer one and never
 * lands on a gone tree.
 */
export function useCurrencyConverter() {
  const isLoaded = useSettingsStore((s) => s.isLoaded);
  const updateSetting = useSettingsStore((s) => s.updateSetting);
  const from = useSettingsStore((s) => s.settings.dashboard_fx_from) || 'EUR';
  const to = useSettingsStore((s) => s.settings.dashboard_fx_to) || 'USD';
  const setFrom = (v: string) => {
    updateSetting('dashboard_fx_from', v).catch(() => {});
  };
  const setTo = (v: string) => {
    updateSetting('dashboard_fx_to', v).catch(() => {});
  };
  const [amount, setAmount] = useState('100');
  const [rates, setRates] = useState<Record<string, number> | null>(null);
  const inFlight = useRef<AbortController | null>(null);

  const fetchRates = useCallback(() => {
    inFlight.current?.abort();
    const controller = new AbortController();
    inFlight.current = controller;
    const { signal } = controller;
    fetch(`https://api.frankfurter.dev/v2/rates?base=${from}`, { signal })
      .then((r) => r.json())
      .then((d: Array<{ quote: string; rate: number }>) => {
        if (signal.aborted) return;
        if (!Array.isArray(d)) {
          setRates(null);
          return;
        }
        // Frankfurter omits the base's own self-rate; seed it so `from` stays selectable.
        const map: Record<string, number> = { [from]: 1 };
        for (const r of d) map[r.quote] = r.rate;
        setRates(map);
      })
      .catch(() => {
        // An abort is not a failure: it means nobody is waiting for the answer.
        if (!signal.aborted) setRates(null);
      });
  }, [from]);

  useEffect(() => {
    fetchRates();
    const pending = inFlight;
    return () => pending.current?.abort();
  }, [fetchRates]);

  // One-time migration of the pre-3.1.3 localStorage values into the user's settings,
  // so a (docker) upgrade no longer resets the widget (#1311).
  useEffect(() => {
    if (!isLoaded) return;
    const lf = localStorage.getItem('trek_fx_from');
    const lt = localStorage.getItem('trek_fx_to');
    if (!lf && !lt) return;
    const writes: Promise<void>[] = [];
    if (lf) writes.push(updateSetting('dashboard_fx_from', lf));
    if (lt) writes.push(updateSetting('dashboard_fx_to', lt));
    // Only drop the localStorage source once the server has durably stored the values, so a
    // failed write during a (docker) upgrade can't destroy the only copy (#1311). Retry next load.
    Promise.all(writes)
      .then(() => {
        localStorage.removeItem('trek_fx_from');
        localStorage.removeItem('trek_fx_to');
      })
      .catch(() => {
        /* keep localStorage; retry on next load */
      });
  }, [isLoaded, updateSetting]);

  const currencies: string[] = rates ? Object.keys(rates).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)) : CURRENCIES;
  const rate = rates?.[to] ?? null;
  const converted = rate != null ? (Number.parseFloat(amount.replace(',', '.')) || 0) * rate : null;
  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return { from, to, setFrom, setTo, amount, setAmount, currencies, rate, converted, swap, fetchRates };
}
