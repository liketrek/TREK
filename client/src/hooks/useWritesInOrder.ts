import { useRef } from 'react';

/**
 * Runs async writes one after another, in the order they were started.
 *
 * Two writes to the same record that leave close together, such as a field saved on
 * blur and a reset clicked right after it, otherwise race: the server may handle them
 * in either order, and whichever it handles last is what stays. A write that fails
 * does not hold up the ones queued behind it.
 */
export function useWritesInOrder(): (write: () => Promise<void>) => Promise<void> {
  const tail = useRef<Promise<void>>(Promise.resolve());
  return (write) => {
    const next = tail.current.then(write, write);
    tail.current = next;
    return next;
  };
}
