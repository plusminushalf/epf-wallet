import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';
import { ViteAliases } from 'vite-aliases';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        app: 'src/app/index.html',
      },
    },
  },
  define: {
    global: {},
  },
  plugins: [
    ViteAliases(),
    preact(),
    crx({
      manifest,
    }),
  ],
});
