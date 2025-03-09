#!/bin/bash
# filepath: /workspaces/app-v2/quick-fix.sh

set -e
echo "🔧 Running quick fix for build issues..."

# Fix vite.config.ts - make the function async
echo "Fixing vite.config.ts with async keyword..."
sed -i 's/export default defineConfig(({ command }) =>/export default defineConfig(async ({ command }) =>/' vite.config.ts

# Fix duplicate importPath in server/index.ts
echo "Removing duplicate importPath function in server/index.ts..."
sed -i '/const importPath = (relativePath) => {/,+4d' server/index.ts

# Make migrations script executable
echo "Making fix-migrations.sh executable..."
chmod +x scripts/fix-migrations.sh

# Clean build directory
echo "Cleaning build directory..."
rm -rf dist

# Run the build
echo "Building application..."
npm run build

echo "✅ Build fixed and completed!"
echo "🚀 You can now run the application with: npm run start"