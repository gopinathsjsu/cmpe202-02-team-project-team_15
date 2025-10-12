import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  define: {
    'process.env': process.env
  },
  optimizeDeps: {
    include: ['react-bootstrap', 'react', 'react-dom', 'axios']
  },
  resolve: {
    alias: {
      '@babel/runtime/helpers/esm/extends': '@babel/runtime/helpers/extends',
      '@babel/runtime/helpers/esm/objectWithoutPropertiesLoose': '@babel/runtime/helpers/objectWithoutPropertiesLoose',
      '@babel/runtime/helpers/esm/inheritsLoose': '@babel/runtime/helpers/inheritsLoose'
    }
  }
})
