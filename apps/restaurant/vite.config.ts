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
      {
        name: 'copy-redirects',
        closeBundle: () => {
          const source = resolve(__dirname, 'public/_redirects');
          const dest = resolve(__dirname, 'dist/_redirects');
          if (existsSync(source)) {
            copyFileSync(source, dest);
            console.log('✅ _redirects copied to dist');
          }
        }
      }
    ],
    optimizeDeps: {
      include: [
        '@stripe/connect-js',
        '@stripe/react-connect-js',
        'framer-motion',
        'lucide-react',
        'react',
        'react-dom',
        'react-router-dom'
      ],
      force: true
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://drift-api-7vs7.onrender.com'),
      'import.meta.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL || 'https://drift-restaurant.onrender.com'),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY || '')
    },
    server: {
      port: 5174,
      host: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      },
      rollupOptions: {
        output: {
          manualChunks: {
            stripe: ['@stripe/connect-js', '@stripe/react-connect-js'],
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', 'lucide-react']
          }
        }
      }
    },
  }
})