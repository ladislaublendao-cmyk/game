import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Assets estão agora em public/Player/ e public/cenario/
// Vite serve o conteúdo de public/ como raiz estática — sem middleware extra necessário

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174
  }
})
