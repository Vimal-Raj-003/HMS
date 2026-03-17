import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  
  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Only include proxy in development mode
    ...(isDevelopment && {
      server: {
        port: 3000,
        proxy: {
          '/api': {
            target: 'http://localhost:5000',
            changeOrigin: true,
          },
        },
      },
    }),
    // Production build configuration
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            ui: ['recharts', 'lucide-react'],
          },
        },
      },
    },
  };
});
