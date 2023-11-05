/// <reference types="vitest" />
/// <reference types="vite/client" />
import path from 'path';
import solidPlugin from 'vite-plugin-solid';
import {defineConfig} from 'vite';

export default defineConfig({
  server: {
    port: 1234,
  },
  root: './test/visual',
  plugins: [solidPlugin()],
  // ssr: {noExternal: true},
  resolve: {
    alias: {
      '@floating-ui/utils/dom': path.resolve(
        __dirname,
        '../utils/dom/src/index.ts',
      ),
      '@floating-ui/react/utils': path.resolve(
        __dirname,
        '../react/utils/src/index.ts',
      ),
      '@floating-ui/utils': path.resolve(__dirname, '../utils/src/index.ts'),
      '@floating-ui/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@floating-ui/dom': path.resolve(__dirname, '../dom/src/index.ts'),
      '@floating-ui/react-dom': path.resolve(
        __dirname,
        '../react-dom/src/index.ts',
      ),
      '@floating-ui/react': path.resolve(__dirname, '../react/src/index.ts'),
      '@floating-ui/vue': path.resolve(__dirname, '../vue/src/index.ts'),
    },
  },

  define: {
    __DEV__: true,
  },
});
