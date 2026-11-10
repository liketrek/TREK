// The chunk group that holds the lucide icons the app loads at startup (vite.config.js).
//
// Every lucide icon is a module of its own, and the plugin icon lookup
// (src/components/shared/PluginIcon.tsx) reaches all of them by name, from the navigation
// every page renders. Left to itself the bundler puts each icon that some other chunk
// also uses into a chunk of its own, so that neither side holds a copy: 187 files of a few
// hundred bytes each, every one a request of its own on a first visit and an entry of its
// own in the service worker's precache. In one group they are one file, whose hash changes
// only when lucide-react does.
//
// `tags: ['$initial']` for the reason the other groups carry it: without it the group would
// also take icons that today sit behind a lazy route and make them part of the first load.
export const ICON_CHUNK = {
  name: 'vendor-icons',
  priority: 20,
  tags: ['$initial'],
  test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
};
