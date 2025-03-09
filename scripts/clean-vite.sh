#!/bin/bash

echo "Cleaning Vite cache and build artifacts..."

# Remove Vite cache
rm -rf node_modules/.vite
rm -rf node_modules/.vite_clean
rm -rf node_modules/.cache

# Remove any potentially corrupt files
rm -f vite.config.js

# Clean TypeScript build info
rm -f ./node_modules/typescript/tsbuildinfo

echo "✅ Vite cache cleaned."
echo "Run 'npm run build' to create a fresh build."
