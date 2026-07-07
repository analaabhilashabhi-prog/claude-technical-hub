//import { defineConfig } from 'vite'
//import react from '@vitejs/plugin-react'

//export default defineConfig({
//  plugins: [react()],
//})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  server: {
    host: '0.0.0.0',
    allowedHosts: ['claude.technicalhub.io'],
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
})