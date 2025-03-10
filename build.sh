#!/bin/bash
set -e

echo "🔨 Starting build process..."

# Install dependencies
npm ci --only=production

# Build the app
echo "📦 Building application..."
NODE_ENV=production npm run build

# Create required directories
mkdir -p dist/migrations

# Copy migration files
echo "📋 Copying migrations..."
cp -r migrations/*.js dist/migrations/

echo "✅ Build completed successfully!"
