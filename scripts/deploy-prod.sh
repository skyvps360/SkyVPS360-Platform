#!/bin/bash
set -e

echo "🚀 Starting production deployment process..."

# Clean previous build
echo "🧹 Cleaning previous build..."
rm -rf dist
mkdir -p dist/migrations

# Fix schema issues
echo "🔧 Fixing schema imports and types..."
node scripts/fix-schema-imports.mjs
node scripts/fix-schema-types.mjs

# Build application
echo "🏗️ Building application..."
npm run build

# Copy migrations to dist
echo "📋 Copying migrations to dist folder..."
cp -r migrations/* dist/migrations/
cp .env* dist/

# Run database migrations
echo "🗃️ Running database migrations..."
cd dist && NODE_ENV=production node ../scripts/run-migrations.mjs

echo "✅ Production deployment ready!"
echo "🚀 You can now start the server with: cd dist && NODE_ENV=production node server/index.js"
