const fs = require('fs');
const viteConfig = `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\\/\\/firestore\\.googleapis\\.com\\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firebase-firestore-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },
        manifest: {
          name: 'Threads & Style POS',
          short_name: 'T&S POS',
          description: 'Offline-capable POS system for Threads & Style',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/1043/1043423.png',
              type: 'image/png',
              sizes: '512x512'
            }
          ]
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
`;
fs.writeFileSync('vite.config.ts', viteConfig);

let mainContent = fs.readFileSync('src/main.tsx', 'utf-8');
if (!mainContent.includes('registerSW')) {
  mainContent = mainContent.replace(
    "import App from './App.tsx';",
    "import App from './App.tsx';\nimport { registerSW } from 'virtual:pwa-register';\n\nregisterSW({ immediate: true });"
  );
  fs.writeFileSync('src/main.tsx', mainContent);
}
