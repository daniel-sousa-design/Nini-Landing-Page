import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from /<repo>/; the deploy workflow sets BASE_PATH.
// Locally it stays at the root.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
});
