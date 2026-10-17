/** Clip lookup and the 3D opt-out, kept apart from the component so Fast Refresh keeps working. */
export const CLIPS = import.meta.glob('./clips/*.mp4', { query: '?url', import: 'default', eager: true }) as Record<
  string,
  string
>;

function clipKey(scene: string, mood: string, sceneMood: string) {
  return mood === sceneMood ? scene : `${scene}--${mood}`;
}

export function findClip(scene: string, mood: string, sceneMood: string): string | null {
  const key = clipKey(scene, mood, sceneMood);
  return CLIPS[`./clips/${key}-light-loop.mp4`] ? key : null;
}

let webgl: boolean | null = null;
function hasWebgl(): boolean {
  if (webgl === null) {
    try {
      webgl = !!document.createElement('canvas').getContext('webgl');
    } catch {
      webgl = false;
    }
  }
  return webgl;
}

/** Opt-out for comparing against the SVG: localStorage `trek-mascot-3d` = `0`. */
export function mascot3dEnabled(): boolean {
  try {
    if (localStorage.getItem('trek-mascot-3d') === '0') return false;
  } catch {
    /* storage blocked: keep the default */
  }
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  return hasWebgl();
}
