import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/portafolio_Cesar_Estrada/',
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        caso: fileURLToPath(new URL('./caso-de-estudio.html', import.meta.url)),
      },
    },
  },
})
