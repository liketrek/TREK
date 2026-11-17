import { useEffect, useRef, useState } from 'react';
import { copyText } from '../utils/clipboard';

/**
 * Copy text and show "Copied" for two seconds, the timer restarting on every
 * copy. The timer is cleared on unmount, so a dialog closed right after a copy
 * sets no state on a component that is gone.
 */
export function useCopied(ms = 2000) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );
  const copy = async (text: string | null) => {
    if (!text || !(await copyText(text))) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), ms);
  };
  return { copied, copy };
}
