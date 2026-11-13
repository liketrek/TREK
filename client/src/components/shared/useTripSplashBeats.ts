import { useEffect, useState } from 'react';

/** The beats of the trip-open splash: packing, hitting the road, cruising in, dropping the pin. */
export const SPLASH_STEPS = [
  { scene: 'packing', key: 'trip.loadingSteps.pack' },
  { scene: 'transport', key: 'trip.loadingSteps.road' },
  { scene: 'dashboard', key: 'trip.loadingPhotos' },
  { scene: 'collections', key: 'trip.loadingSteps.arrive' },
] as const;

export const SPLASH_STEP_MS = 1400;
// Reduced motion parks on the paper-plane / "loading photos" beat.
export const SPLASH_STILL_INDEX = 2;
const REDUCE_MOTION = '(prefers-reduced-motion: reduce)';

interface TripSplashBeatsOptions {
  /**
   * Follow the OS reduced motion setting while the splash is up (the phone, whose splash can be
   * up long enough for the setting to be flipped under it). Off, the setting is read on each render.
   */
  liveReducedMotion: boolean;
}

/**
 * The beat cycle both trip-open splashes play: steps through SPLASH_STEPS every SPLASH_STEP_MS
 * and loops; under reduced motion it holds SPLASH_STILL_INDEX instead.
 */
export function useTripSplashBeats({ liveReducedMotion }: TripSplashBeatsOptions) {
  const [liveReduce, setLiveReduce] = useState(() =>
    liveReducedMotion ? (window.matchMedia?.(REDUCE_MOTION)?.matches ?? false) : false
  );
  useEffect(() => {
    if (!liveReducedMotion) return;
    const mq = window.matchMedia?.(REDUCE_MOTION);
    if (!mq) return;
    const sync = () => setLiveReduce(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, [liveReducedMotion]);

  const reduceMotion = liveReducedMotion
    ? liveReduce
    : typeof window !== 'undefined' && window.matchMedia?.(REDUCE_MOTION).matches;

  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
    const id = setInterval(() => setIndex((n) => (n + 1) % SPLASH_STEPS.length), SPLASH_STEP_MS);
    return () => clearInterval(id);
  }, [reduceMotion]);

  const activeIndex = reduceMotion ? SPLASH_STILL_INDEX : index;
  return { reduceMotion, activeIndex, step: SPLASH_STEPS[activeIndex], steps: SPLASH_STEPS };
}

/**
 * How long a trip may take to open before the splash comes up, on the phone and
 * the desktop alike. A trip that loads in that time opens straight away; a
 * slower one gets the splash right after, so a slow connection never sees the
 * app stand still.
 */
export const TRIP_SPLASH_AFTER_MS = 400
