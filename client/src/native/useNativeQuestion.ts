import { useEffect, useRef, useState } from 'react';
import { askNatively, canAskNatively, type NativeQuestion } from './nativeDialogs';

/**
 * Asks `question` through the system once each time `open` turns true, and
 * hands the answer to `answer`. Returns whether the caller should draw its own
 * HTML dialog instead: always in a browser or an app without the plugins, and
 * when the system could not ask. A null question (one the system cannot show,
 * such as one with a list under it) is always asked in HTML.
 */
export function useNativeQuestion(
  open: boolean,
  question: NativeQuestion | null,
  answer: (yes: boolean) => void
): boolean {
  const native = question !== null && canAskNatively();
  const [failed, setFailed] = useState(false);
  // A closed question forgets that the system failed it, so the next one is asked natively again.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setFailed(false);
  }
  // Asked once per opening, also when StrictMode runs the effect twice.
  const asked = useRef(false);
  const latest = useRef({ question, answer });
  useEffect(() => {
    latest.current = { question, answer };
  });

  useEffect(() => {
    if (!open) {
      asked.current = false;
      return;
    }
    if (!native || asked.current || !latest.current.question) return;
    asked.current = true;
    void askNatively(latest.current.question).then((yes) => {
      if (yes === null) setFailed(true);
      else latest.current.answer(yes);
    });
  }, [open, native]);

  return !native || failed;
}
