import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      tailwindcss() as any,
    ],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com'),
      'import.meta.env.VITE_RESTAURANT_URL': JSON.stringify(env.VITE_RESTAURANT_URL || 'https://drift-restaurant.onrender.com')
    },
    server: {
      port: 5173,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})