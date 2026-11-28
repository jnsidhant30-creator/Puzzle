import tailwindcss from '@tailwindcss/vite';
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
        registerType: 'prompt',
        injectRegister: false,
        manifestFilename: 'manifest.json',
        includeAssets: ['favicon.svg', 'icons/*.png'],
        manifest: {
          id: '/',
          name: 'PuzzleVerse — Challenge Your Mind. Beat Your Best.',
          short_name: 'PuzzleVerse',
          description:
            'Play 16 handcrafted logic, word, memory, math, and spatial puzzles across desktop, mobile, and web.',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          background_color: '#142331',
          theme_color: '#142331',
          categories: ['games', 'puzzle', 'entertainment'],
          icons: [
            {
              src: '/icons/pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png',
            },
            {
              src: '/icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: '/icons/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
          globIgnores: ['**/icon-1024x1024.png'],
          cleanupOutdatedCaches: true,
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/__\/auth/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'puzzleverse-fonts',
                expiration: {
                  maxEntries: 16,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              {
                name: 'vendor-react',
                test: /[\\/]node_modules[\\/](react|react-dom|scheduler|zustand)[\\/]/,
                priority: 20,
              },
              {
                name: 'vendor-capacitor',
                test: /[\\/]node_modules[\\/]@capacitor[\\/]/,
                priority: 19,
              },
              {
                name: 'vendor-firestore',
                test: /[\\/]node_modules[\\/]@firebase[\\/]firestore[\\/]/,
                priority: 18,
              },
              {
                name: 'vendor-firebase',
                test: /[\\/]node_modules[\\/](@?firebase)[\\/]/,
                priority: 15,
              },
              {
                name: 'vendor-icons',
                test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
                priority: 10,
              },
            ],
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
