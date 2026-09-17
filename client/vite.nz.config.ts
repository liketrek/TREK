import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
export default defineConfig({
  base: process.env.NZ_BASE || '/',
  plugins: [react()],
  server: { host: '127.0.0.1', port: 5173, open: '/nz.html' },
  build: { outDir: 'dist-nz', rollupOptions: { input: 'nz.html' } },
});
