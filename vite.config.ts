import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // IMPORTANT: the JSON "database" (data/db.json) and build output (dist/) live
      // inside this project folder and are rewritten by the Express server on almost
      // every API call (chat messages, quiz generation, uploads, etc). Without
      // excluding them here, Vite's file watcher treats those writes as source changes
      // and force-reloads the whole page mid-request -- this is what was kicking users
      // back to the Dashboard while a quiz was generating or a chat reply was in flight.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data/**', '**/dist/**', '**/node_modules/**', '**/.git/**'],
      },
    },
  };
});
