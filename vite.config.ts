import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',  // Use 8080 for Node.js, 8000 for Python
        changeOrigin: true,
      },
    },
  },
  build: {
    sourcemap: false, // disables source maps to avoid missing map warnings
  },
  esbuild: {
    sourcemap: false, // prevents esbuild from trying to load missing maps in dev
  },
});
