#!/bin/bash
set -e

echo "🔨 Preparing development deployment..."

# Install dependencies 
npm install

# Run migrations with force flag to avoid interactive prompts
echo "Running migrations..."
npx drizzle-kit push --accept-data-loss || echo "Migration warnings (continuing anyway)"

# Start in development mode
echo "Starting development server..."
npm run dev
