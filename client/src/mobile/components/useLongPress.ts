import { type MouseEvent, type TouchEvent, useEffect, useRef } from 'react';
import { pressHaptic } from '../../native/haptics';

/**
 * A long press on a card, as the phone knows it: hold still for a moment and
 * the card lifts, the phone bumps, and `onLongPress` opens its menu. A finger
 * that moves is scrolling and cancels it; the tap that ends a long press opens
 * nothing else. Android also reports the press as a contextmenu event, which
 * counts as the same press.
 *
 * Spread the returned props on the card. For the first moments it presses like
 * any tap; once the hold is clearly a hold the card gets data-pressing and lifts
 * (index.css), and the press dimming lets go of it.
 */

const LIFT_MS = 180;
const HOLD_MS = 450;
const SLOP_PX = 8;

export function useLongPress(onLongPress: (() => void) | undefined) {
  const timer = useRef<number | null>(null);
  const lift = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  // The click that ends a long press, swallowed.
  const fired = useRef(false);
  const target = useRef<HTMLElement | null>(null);
  const handler = useRef(onLongPress);
  useEffect(() => {
    handler.current = onLongPress;
  });
  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
      if (lift.current) window.clearTimeout(lift.current);
    },
    []
  );

  const settle = () => {
    if (timer.current) window.clearTimeout(timer.current);
    if (lift.current) window.clearTimeout(lift.current);
    timer.current = null;
    lift.current = null;
    start.current = null;
    target.current?.removeAttribute('data-pressing');
  };
  const fire = () => {
    settle();
    fired.current = true;
    pressHaptic();
    handler.current?.();
  };

  if (!onLongPress) return {};
  return {
    'data-long-press': '',
    onTouchStart: (e: TouchEvent<HTMLElement>) => {
      fired.current = false;
      if (e.touches.length !== 1) return;
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      const card = e.currentTarget;
      target.current = card;
      lift.current = window.setTimeout(() => card.setAttribute('data-pressing', ''), LIFT_MS);
      timer.current = window.setTimeout(fire, HOLD_MS);
    },
    onTouchMove: (e: TouchEvent<HTMLElement>) => {
      if (!start.current) return;
      const t = e.touches[0];
      if (Math.abs(t.clientX - start.current.x) > SLOP_PX || Math.abs(t.clientY - start.current.y) > SLOP_PX) settle();
    },
    onTouchEnd: settle,
    onTouchCancel: settle,
    onContextMenu: (e: MouseEvent<HTMLElement>) => {
      e.preventDefault();
      if (!fired.current) fire();
    },
    onClickCapture: (e: MouseEvent<HTMLElement>) => {
      if (!fired.current) return;
      fired.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}
