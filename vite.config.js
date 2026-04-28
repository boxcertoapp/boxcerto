import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Avisa apenas para chunks > 600 KB
    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        // Divide vendors em chunks separados para melhor cache
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core — menor chunk mais crítico
            if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router')) {
              return 'vendor-react'
            }
            // Lucide icons — pesado, separar
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            // Supabase — carregado apenas após login
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            // Stripe — carregado apenas na tela de assinatura
            if (id.includes('@stripe')) {
              return 'vendor-stripe'
            }
            // Demais deps
            return 'vendor-misc'
          }
        },
      },
    },
  },
})
