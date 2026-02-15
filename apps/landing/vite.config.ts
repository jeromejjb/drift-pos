import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync } from 'fs'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [
      react(),
      tailwindcss() as any,
      // Add this plugin to copy _redirects after build
      {
        name: 'copy-redirects',
        closeBundle: async () => {
          const source = resolve(__dirname, 'public/_redirects');
          const dest = resolve(__dirname, 'dist/_redirects');
          
          console.log('📁 Copying _redirects from:', source);
          
          if (existsSync(source)) {
            copyFileSync(source, dest);
            console.log('✅ _redirects copied to dist');
          } else {
            console.log('❌ _redirects not found in public folder');
          }
        }
      }
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