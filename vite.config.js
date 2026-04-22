import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: './',
  server: { port: 3000, host: true },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    minify: 'esbuild',
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        // Split vendor (matter-js) into its own chunk for better caching
        manualChunks: {
          vendor: ['matter-js'],
        },
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
  },
});
