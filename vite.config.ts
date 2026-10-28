import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Keep every image a separate, cached file; inlining the small art (hair masks etc.) added 359 KB to the JS.
  build: { assetsInlineLimit: 0 },
})
