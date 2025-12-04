import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    // Proxy API calls to backend during local development
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    'process.env': process.env
  },
  optimizeDeps: {
    include: ['lucide-react','react-bootstrap', 'react', 'react-dom', 'axios']
  },
  resolve: {
    alias: {
      '@babel/runtime/helpers/esm/extends': '@babel/runtime/helpers/extends',
      '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose': '@babel/runtime/helpers/objectWithoutPropertiesLoose',
      '@babel/runtime/helpers/esm/inheritsLoose': '@babel/runtime/helpers/inheritsLoose'
    }
  }
})
