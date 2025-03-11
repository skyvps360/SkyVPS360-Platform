#!/bin/bash

echo "Installing optional dependencies..."

if [ "$NODE_ENV" = "production" ]; then
  echo "Installing production build dependencies..."
  npm install --no-save @vitejs/plugin-react @replit/vite-plugin-cartographer @replit/vite-plugin-runtime-error-modal @replit/vite-plugin-shadcn-theme-json esbuild tailwindcss autoprefixer postcss terser
else
  echo "Installing terser for minification..."
  npm install --no-save terser
fi

echo "Optional dependencies check completed"
