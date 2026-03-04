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
    
    // Add multiple entry points for different HTML files
    build: {
      outDir: 'dist',
      sourcemap: false,
      commonjsOptions: {
        include: [/node_modules/],
        transformMixedEsModules: true
      },
      rollupOptions: {
        // Define multiple entry points
        input: {
          main: resolve(__dirname, 'index.html'),
          onboarding: resolve(__dirname, 'onboarding.html'),
          welcome: resolve(__dirname, 'welcome.html'),
        },
        output: {
          manualChunks: {
            stripe: ['@stripe/connect-js', '@stripe/react-connect-js'],
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['framer-motion', 'lucide-react']
          }
        }
      }
    },
    
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@stripe/connect-js': resolve(__dirname, 'node_modules/@stripe/connect-js/dist/index.js'),
        '@stripe/react-connect-js': resolve(__dirname, 'node_modules/@stripe/react-connect-js/dist/index.js')
      },
      dedupe: ['react', 'react-dom']
    },
    
    optimizeDeps: {
      include: [
        '@stripe/connect-js',
        '@stripe/react-connect-js',
        'framer-motion',
        'lucide-react'
      ],
      force: true,
      esbuildOptions: {
        target: 'es2020'
      }
    },
    
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://api.driftpos.com')
      'import.meta.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL || 'https://restaurant.driftpos.com'),
      'import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY': JSON.stringify(env.VITE_STRIPE_PUBLISHABLE_KEY || '')
    },
    
    server: {
      port: 5174,
      host: true,
    }
  }
})