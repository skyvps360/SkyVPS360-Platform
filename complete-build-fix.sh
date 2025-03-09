#!/bin/bash
# filepath: /workspaces/app-v2/complete-build-fix.sh

set -e
echo "🔧 Starting complete build fix process..."

# Make the migrations fix script executable
chmod +x scripts/fix-migrations.sh 2>/dev/null || :

# Fix vite.config.ts - make the function async
echo "Fixing vite.config.ts - adding async keyword..."
sed -i 's/export default defineConfig(({ command }) =>/export default defineConfig(async ({ command }) =>/' vite.config.ts

# Fix dashboard.tsx imports
echo "Fixing dashboard.tsx imports..."
sed -i 's/import { GitHubBanner } from "@\/components\/github-banner";/import GitHubBanner from "@\/components\/github-banner";/' client/src/pages/dashboard.tsx

# Fix missing return in calculatePasswordStrength
echo "Fixing calculatePasswordStrength function..."
sed -i 's/if (!password)/if (!password) return 0;/' client/src/pages/dashboard.tsx

# Clean dist directory
echo "Cleaning dist directory..."
rm -rf dist

# Run the build
echo "Building the application..."
npm run build

# Fix migrations after build
echo "Running migration fix..."
bash scripts/fix-migrations.sh

echo "✅ Build completed successfully!"
echo "🚀 You can now start the application with: npm run start"