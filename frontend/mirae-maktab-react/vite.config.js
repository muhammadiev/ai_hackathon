import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' keeps asset paths relative so the built `dist/` can be
// dropped into Django staticfiles and served from any sub-path.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, open: true },
});
