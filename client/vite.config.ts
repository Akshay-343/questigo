import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // Expose the dev server on the LAN (0.0.0.0) so other devices can open it
    // at e.g. http://192.168.0.188:5173.
    host: true,
    proxy: {
      // Forward API calls to the backend. The browser only ever talks to the
      // dev server's own origin (:5173), so this works identically from
      // localhost and from other devices on the network — and needs no CORS.
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
    },
  },
})
