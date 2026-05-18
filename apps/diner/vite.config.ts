import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Load .env from repo root, then apps/diner (diner overrides). process.env wins.
export default defineConfig(({ mode }) => {
  const cwd = process.cwd()
  const rootDir = cwd.endsWith('apps/diner') ? path.resolve(cwd, '../..') : cwd
  const dinerDir = cwd.endsWith('apps/diner') ? cwd : path.resolve(cwd, 'apps/diner')
  const rootEnv = loadEnv(mode, rootDir, '')
  const dinerEnv = loadEnv(mode, dinerDir, '')
  const env = { ...rootEnv, ...dinerEnv, ...process.env }
  return {
  envDir: rootDir,
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    strictPort: true, // Do NOT fall back to another port; fail if 5173 is taken
    host: 'localhost', // Use localhost to avoid uv_interface_addresses errors in some environments
  },
  preview: {
    port: 5173,
    strictPort: true,
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
  define: {
    'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
    'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
    'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://api.driftpos.com'),
    'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY || ''),
  },
  }
})