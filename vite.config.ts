import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@core': resolve(__dirname, './core'),
      '@extension': resolve(__dirname, './extension'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'extension/popup/popup.html'),
        background: resolve(__dirname, 'extension/background/background.ts'),
        contentScript: resolve(__dirname, 'extension/content/contentScript.ts'),
        pageBridge: resolve(__dirname, 'extension/content/pageBridge.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') return 'background/background.js';
          if (chunkInfo.name === 'contentScript') return 'content/contentScript.js';
          if (chunkInfo.name === 'pageBridge') return 'content/pageBridge.js';
          return '[name]/[name].js';
        },
        chunkFileNames: 'shared/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
});
