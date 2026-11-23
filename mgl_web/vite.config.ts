/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Same origin as production (where nginx proxies these), so the HttpOnly session cookie
    // works in dev too. Point VITE_API_URL at http://localhost:5173.
    proxy: {
      '/api': 'http://localhost:8000',
      '/files': 'http://localhost:8000',
    },
    // Lets tests read ../deploy/nginx (checks the nginx app-route list matches App.tsx).
    fs: { allow: ['.', '../deploy'] },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
})
