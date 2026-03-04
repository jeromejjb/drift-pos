import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load .env from apps/diner so you can edit apps/diner/.env and restart
// https://vitejs.dev/config/
export default defineConfig({
  envDir: __dirname,
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to next available port
    host: 'localhost', // Use localhost to avoid uv_interface_addresses errors in some environments
  },
  preview: {
    port: 5173,
    host: 'localhost',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          ui: ['lucide-react'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react'],
  },
})