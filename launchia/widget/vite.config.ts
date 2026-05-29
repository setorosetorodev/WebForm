import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'launchia-widget.js',
        chunkFileNames: 'launchia-widget.js',
        assetFileNames: 'launchia-widget.[ext]',
      },
    },
  },
})
