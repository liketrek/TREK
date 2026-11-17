import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

// The address screen the native apps ship (native-shell/). Everything past it
// is the UI of the server the user picks, so this build stays tiny and apart
// from the main one: no PWA, no React, only the native strings of each locale.
export default defineConfig({
  root: fileURLToPath(new URL('./native-shell', import.meta.url)),
  base: './',
  publicDir: false,
  build: {
    outDir: fileURLToPath(new URL('./native-dist', import.meta.url)),
    emptyOutDir: true,
    target: ['es2020', 'safari15', 'chrome100'],
  },
})
