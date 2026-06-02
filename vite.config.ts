import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'node:url';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import fs from 'node:fs';
import path from 'node:path';

const base = process.env.VITE_BASE_PATH ?? '/';

function pdfmakeVfsPlugin() {
  const virtualModuleId = 'virtual:pdfmake-vfs';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;

  return {
    name: 'pdfmake-vfs',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const fontDir = path.resolve(__dirname, 'src/pdf/fonts');
        const files = [
          'Carlito-Regular.ttf',
          'Carlito-Bold.ttf',
          'Carlito-Italic.ttf',
          'Carlito-BoldItalic.ttf',
        ];
        const vfs: Record<string, string> = {};
        for (const file of files) {
          const filePath = path.join(fontDir, file);
          if (fs.existsSync(filePath)) {
            vfs[file] = fs.readFileSync(filePath, 'base64');
          }
        }
        return `export default ${JSON.stringify(vfs)};`;
      }
    },
  };
}

export default defineConfig({
  base,
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  plugins: [vue(), vuetify({ autoImport: true }), pdfmakeVfsPlugin()],
  optimizeDeps: {
    include: ['pdfmake/build/pdfmake', 'pdfmake/build/vfs_fonts'],
  },
  server: {
    port: 5173,
  },
});
