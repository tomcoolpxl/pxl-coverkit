import { defineConfig } from 'vitest/config';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';

function mockPdfmakeVfsPlugin() {
  const virtualModuleId = 'virtual:pdfmake-vfs';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'pdfmake-vfs-mock',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        return 'export default {};';
      }
    },
  };
}

export default defineConfig({
  plugins: [vue(), mockPdfmakeVfsPlugin()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.test.ts'],
  },
});
