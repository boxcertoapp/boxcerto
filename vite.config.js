import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  build: {
    // Alvo moderno: elimina polyfills ES5/ES6 desnecessários (~47 KB)
    target: 'es2020',

    chunkSizeWarningLimit: 600,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          // ── React + Router ── compartilhado, carregado na primeira visita
          if (
            id.includes('react-dom') ||
            id.includes('react/') ||
            id.includes('react-router') ||
            id.includes('@remix-run')
          ) return 'vendor-react'

          // ── Supabase ── carregado via dynamic import; NÃO aparece no preload
          //   do HTML de landing pages (AuthContext usa import() dinâmico)
          if (id.includes('@supabase')) return 'vendor-supabase'

          // ── Lucide ── ícones compartilhados entre vários chunks
          if (id.includes('lucide-react')) return 'vendor-icons'

          // ── Libs pesadas usadas APENAS em páginas lazy ──
          // Não agregar aqui: ficam co-localizadas com o chunk do componente que
          // as usa (AdminPanel, Assinar, etc.) e só carregam quando necessário.
          if (
            id.includes('jspdf') ||     // PDF gerado só no admin/receita (~500 KB)
            id.includes('fflate') ||    // dependência do jspdf (~100 KB)
            id.includes('nodemailer') ||
            id.includes('@stripe') ||
            id.includes('stripe/')
          ) return undefined            // co-localiza com o consumer

          // ── Demais utilidades compartilhadas ── (pequenas após as exclusões)
          return 'vendor-misc'
        },
      },
    },
  },
})
