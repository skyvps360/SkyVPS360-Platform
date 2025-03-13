import { defineConfig } from 'vite';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Function to safely import plugins
async function safeImport(modulePath: string) {
  try {
    return await import(modulePath);
  } catch (error) {
    console.warn(`Warning: Could not import ${modulePath}`, error);
    return { default: null };
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig(async () => {
  // Safely import plugins
  const reactPlugin = await safeImport('@vitejs/plugin-react');
  const cartographerPlugin = await safeImport('@replit/vite-plugin-cartographer');
  const errorModalPlugin = await safeImport('@replit/vite-plugin-runtime-error-modal');
  const shadcnThemePlugin = await safeImport('@replit/vite-plugin-shadcn-theme-json');

  // Collect all available plugins
  const plugins = [
    reactPlugin.default && reactPlugin.default({
      // Basic React configuration - no extra features that could cause conflicts
      include: "**/*.{jsx,tsx}",
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
      ],
    }),
    cartographerPlugin.default && cartographerPlugin.default(),
    errorModalPlugin.default && errorModalPlugin.default(),
    shadcnThemePlugin.default && shadcnThemePlugin.default()
  ].filter(Boolean);

  return {
    plugins,
    server: {
      host: true, // Listen on all addresses
      allowedHosts: ['skyvps360.xyz'], // Add your domain here
      hmr: {
        overlay: false, // Disable the error overlay
      },
      // Add middleware to handle SPA routing
      middlewareMode: 'html',
      fs: {
        strict: false,
        allow: ['..']
      }
    },
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
      target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      // Change from terser to esbuild since terser is not installed
      minify: 'esbuild',
      // Add SPA configuration
      assetsDir: 'assets',
      manifest: true
    },

    // Add base URL configuration
    base: '/',

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
      'import.meta.env.VITE_DOMAIN': JSON.stringify(process.env.DOMAIN || 'https://skyvps360.xyz/')
    },
    // Make sure it watches the right files
    watch: {
      usePolling: false,
      ignored: ['**/node_modules/**', '**/dist/**']
    }
  };
});
