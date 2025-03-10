import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Clean, focused Vite configuration
export default defineConfig({
  plugins: [
    react({
      // Basic React configuration - no extra features that could cause conflicts
      include: "**/*.{jsx,tsx}",
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
      ],
    }),
    // Other plugins
    runtimeErrorOverlay(),
    themePlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      // Add aliases for common directories to ensure consistent resolution
      "@components": path.resolve(__dirname, "./client/src/components"),
      "@pages": path.resolve(__dirname, "./client/src/pages"),
      "@hooks": path.resolve(__dirname, "./client/src/hooks"),
      "@lib": path.resolve(__dirname, "./client/src/lib"),
      "@utils": path.resolve(__dirname, "./client/src/utils"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  // Use client directory as root
  root: 'client',
  build: {
    outDir: path.resolve(__dirname, "dist/client"),
    emptyOutDir: true,
    sourcemap: true,
    // Specify the HTML entry point explicitly
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'client/index.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'vendor-react';
            } else if (id.includes('@tanstack')) {
              return 'vendor-tanstack';
            } else {
              return 'vendor';
            }
          }
        }
      }
    },
    // Use a more compatible build target for wider browser support
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    // Change from terser to esbuild since terser is not installed
    minify: 'esbuild',
  },
  // Optimize dependency processing
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'wouter',
      '@tanstack/react-query'
    ],
    exclude: ['@shared/schema', '@shared/client-schema'],
  },
  // Ensure consistent environment variables
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'import.meta.env.BASE_URL': JSON.stringify('/'),
    'import.meta.env.VITE_DOMAIN': JSON.stringify(process.env.DOMAIN || 'https://skyvps360.xyz')
  },
  // Make sure it watches the right files
  watch: {
    usePolling: false,
    ignored: ['**/node_modules/**', '**/dist/**']
  },
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
      '/auth': 'http://localhost:5000'
    }
  },
  // Prevent caching issues
  cacheDir: path.resolve(__dirname, 'node_modules/.vite_clean'),
  clearScreen: false,
  // Enable detailed logging
  logLevel: 'info',
})
