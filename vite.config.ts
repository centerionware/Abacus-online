import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: './index.tsx',
      name: 'InteractiveAbacus',
      fileName: (format) => `abacus.min.js`,
      formats: ['iife'] // Immediately Invoked Function Expression for direct browser use
    },
    rollupOptions: {
      output: {
        extend: true,
      },
    },
    minify: 'terser',
    sourcemap: false,
  }
});
