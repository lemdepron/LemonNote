import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Makes imports like "@/components/..." point at the src folder.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
