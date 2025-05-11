import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import * as monacoEditorPluginModule from 'vite-plugin-monaco-editor';
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'

import viteImagemin from 'vite-plugin-imagemin';
import { cloudflare } from "@cloudflare/vite-plugin"

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		vue(),
		vueDevTools(),
		cloudflare(),
		(monacoEditorPluginModule.default || monacoEditorPluginModule)({
			// Monaco Editor-spezifische Optionen
			customDistPath: (filepath) => {
				return filepath.replace('/monaco-editor/min/vs', '/monaco/vs')
			}
		}),
		// PWA-Plugin für Service Worker und Offline-Unterstützung
		VitePWA({
			registerType: 'autoUpdate',
			includeAssets: ['favicon.ico', '**/*.{png,svg,jpg,ico}'],
			manifest: {
				name: 'Python Turtle im Browser',
				short_name: 'Turtle',
				description: 'Python Turtle-Programmierung direkt im Browser',
				theme_color: '#ffffff',
				icons: [
					{
						src: 'favicon.ico',
						sizes: '32x32',
						type: 'image/x-icon'
					}
				]
			},
			workbox: {
				// Caching-Strategien für verschiedene Assets
				runtimeCaching: [
					{
						urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/pyodide\//,
						handler: 'CacheFirst',
						options: {
							cacheName: 'pyodide-cache',
							expiration: {
								maxEntries: 50, // Erhöht für bessere Pyodide Asset Abdeckung
								maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Tage
							}
						}
					}
				]
			}
		}),
		// Visualizer für Build-Analyse (nur im Entwicklungsmodus)
		process.env.ANALYZE === 'true' ? visualizer({ open: true }) : null,
		viteImagemin({
			gifsicle: {
				optimizationLevel: 7,
				interlaced: false,
			},
			optipng: {
				optimizationLevel: 7,
			},
			mozjpeg: {
				quality: 75,
			},
			pngquant: {
				quality: [0.65, 0.9],
				speed: 4,
			},
			svgo: {
				plugins: [
					{
						name: 'removeViewBox',
					},
					{
						name: 'removeEmptyAttrs',
						active: false,
					},
				],
			},
		}),
	].filter(Boolean),
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		},
	},
	build: {
		// Code-Splitting-Optimierungen
		rollupOptions: {
			output: {
				manualChunks: {
					'monaco-editor': ['monaco-editor'],
					'pyodide': ['pyodide'],
					'vue-vendor': ['vue', 'vue-router'],
				}
			}
		},
		// Asset-Optimierungen
		assetsInlineLimit: 4096, // Dateien kleiner als 4kb werden inline eingefügt
		minify: 'terser', // Nutzt Terser für besser Minimierung
		terserOptions: {
			compress: {
				drop_console: true, // Entfernt console.log im Production Build
				drop_debugger: true
			}
		},
		// Sourcemap für die Produktion deaktivieren
		sourcemap: false,
		// Chunks für besseres Caching in CDNs
		chunkSizeWarningLimit: 1000 // Warnt bei Chunks größer als 1MB
	},
	// Optimierungen für die Entwicklung
	optimizeDeps: {
		include: ['vue', 'vue-router', 'monaco-editor']
	},
	// Cache-Strategie für den Entwicklungsmodus
	cacheDir: 'node_modules/.vite'
})
