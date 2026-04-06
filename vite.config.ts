import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    target: 'node22',
    ssr: true,
    outDir: 'dist',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [],
    },
    minify: false,
    sourcemap: false,
    emptyOutDir: true,
  },
  ssr: {
    noExternal: [/./],
    target: 'node',
  },
})
