/**
 * Hover styles only while a pointer drives the UI.
 *
 * A finger has no hover, yet WebKit and Chrome apply :hover to whatever was
 * tapped and keep it there until the next tap lands somewhere else. In the
 * iOS and Android app that left buttons and rows tinted after every tap, a
 * tell of a web page that no native app has. The app marks <html> with
 * data-touch-input while a finger is in use (src/native/touchInput.ts), and
 * this plugin makes every :hover rule, Tailwind's and our own, wait for that
 * mark to be gone. A browser never sets it, so nothing changes there, and an
 * iPad with a trackpad clears it on the first pointer move.
 *
 * The condition sits on the hovered element itself, wrapped in :where(), so a
 * rule keeps its specificity and still wins or loses where it did before. A
 * :hover after a pseudo-element (::-webkit-slider-thumb:hover) stays as it is:
 * nothing may follow it there, and a rule with an invalid selector is dropped
 * whole.
 */

export const TOUCH_INPUT_ATTR = 'data-touch-input';
const GUARD = `:where(:root:not([${TOUCH_INPUT_ATTR}]) *)`;
// :hover itself, not the escaped `hover\:` inside a Tailwind class name, and not :hover-something.
const HOVER = /(?<!\\):hover(?![\w-])/g;
const COMPOUND_START = /[\s>+~(,]/;

function compoundBefore(selector, index) {
  let i = index - 1;
  while (i >= 0 && !COMPOUND_START.test(selector[i])) i--;
  return selector.slice(i + 1, index);
}

export function guardHover(selector) {
  if (selector.includes(GUARD)) return selector;
  return selector.replace(HOVER, (match, offset) =>
    compoundBefore(selector, offset).includes('::') ? match : `${match}${GUARD}`
  );
}

export default function touchHover() {
  return {
    postcssPlugin: 'trek-touch-hover',
    Rule(rule) {
      if (!rule.selector.includes(':hover')) return;
      const next = rule.selectors.map(guardHover);
      if (next.some((s, i) => s !== rule.selectors[i])) rule.selectors = next;
    },
  };
}
touchHover.postcss = true;
