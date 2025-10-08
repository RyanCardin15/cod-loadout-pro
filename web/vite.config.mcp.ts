import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Vite config for building MCP widget components as UMD bundle
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/mcp-widgets/index.tsx'),
      name: 'CODLoadoutComponents',
      fileName: 'counterplay-components',
      formats: ['umd'],
    },
    rollupOptions: {
      external: [],
      output: {
        globals: {},
        // Inline React and ReactDOM into the bundle
        inlineDynamicImports: true,
      },
    },
    outDir: 'dist',
    emptyOutDir: false, // Don't clear dist to preserve Next.js build
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
