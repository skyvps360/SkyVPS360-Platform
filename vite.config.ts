import { defineConfig } from 'vite';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';

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
    // Add server configuration with allowedHosts
    server: {
      host: true, // Listen on all addresses
      allowedHosts: ['skyvps360.xyz'], // Add your domain here
      hmr: {
        overlay: false, // Disable the error overlay
      }
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
        "@components": path.resolve(__dirname, "./client/components"),
        "@pages": path.resolve(__dirname, "./client/pages"),
        "@hooks": path.resolve(__dirname, "./client/hooks"),
        "@lib": path.resolve(__dirname, "./client/lib"),
        "@utils": path.resolve(__dirname, "./client/utils"),
        "@servers": path.resolve(__dirname, "./client/servers"), // Fix the incorrect path
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    // Use client directory as root
    root: path.resolve(__dirname, 'client'),
    publicDir: path.resolve(__dirname, 'client/public'),
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
      // Exclude problematic dependencies
      exclude: [
        '@paypal/react-paypal-js',
        'lucide-react',
        '@shared/schema',
        '@shared/client-schema'
      ],
      include: [
        'react',
        'react-dom',
        'wouter',
        'react-router-dom',
        '@tanstack/react-query'
      ],
      esbuildOptions: {
        target: 'es2020'
      },
      force: true // Force optimization to address dependency issues
    },
    // Ensure consistent environment variables
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'import.meta.env.BASE_URL': JSON.stringify('/'),
      'import.meta.env.VITE_DOMAIN': JSON.stringify(process.env.DOMAIN || 'https://skyvps360.xyz/')
    },
  };
});
