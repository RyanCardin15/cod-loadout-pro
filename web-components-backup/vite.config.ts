import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      name: 'CODLoadoutComponents',
      formats: ['umd'],
      fileName: () => `cod-loadout-components.umd.js`
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {}
      }
    }
  }
});