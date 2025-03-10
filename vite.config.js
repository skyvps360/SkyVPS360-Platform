import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    // Allow all hosts explicitly including skyvps360.xyz
    allowedHosts: ['*', 'skyvps360.xyz'],
    cors: true,
    host: '0.0.0.0',
    hmr: {
      clientPort: 5000, // Force client port for proxied environments
      host: 'skyvps360.xyz' // Allow HMR connections from your domain
    }
  },
})
