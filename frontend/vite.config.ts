import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'webform.js',
        chunkFileNames: 'webform.js',
        assetFileNames: 'webform.[ext]'
      }
    }
  }
});
