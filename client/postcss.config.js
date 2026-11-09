import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';
import touchHover from './postcss/touchHover.js';

export default {
  // touchHover last: it guards the :hover rules Tailwind has just written too.
  plugins: [tailwindcss(), autoprefixer(), touchHover()],
};
