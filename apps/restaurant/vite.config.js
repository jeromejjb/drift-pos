import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(({ mode }) => {
    // Load env file based on `mode`
    const env = loadEnv(mode, process.cwd(), '');
    return {
        plugins: [
            react(),
            tailwindcss(),
        ],
        define: {
            'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'https://api.driftpos.com')
        },
        server: {
            port: 5174,
            host: true,
        },
        build: {
            outDir: 'dist',
            sourcemap: false,
            rollupOptions: {
                output: {
                    manualChunks: {
                        vendor: ['react', 'react-dom', 'react-router-dom'],
                        ui: ['lucide-react', 'framer-motion'],
                    },
                },
            },
        },
    };
});
