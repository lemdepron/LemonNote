import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Ignore the Rust folder, so the watcher does not lock its build files.
  server: { watch: { ignored: ['**/src-tauri/**'] } },
})