#!/bin/bash
# Script for building on DigitalOcean Apps Platform

echo "Starting DigitalOcean Apps build process..."

# Ensure all build dependencies are available (even if pruned during deployment)
echo "Installing build dependencies..."
npm install --no-save @vitejs/plugin-react@^4.3.2 @replit/vite-plugin-runtime-error-modal@^0.0.3 @replit/vite-plugin-shadcn-theme-json@^0.0.4 esbuild@^0.25.0 tailwindcss@^3.4.14 autoprefixer@^10.4.20 postcss@^8.4.47 terser@^5.39.0

# Run the build
echo "Running build process..."
npm run build

# Check if build succeeded
if [ $? -eq 0 ]; then
  echo "✅ Build completed successfully"
else
  echo "❌ Build failed"
  exit 1
fi