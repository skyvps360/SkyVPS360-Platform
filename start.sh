#!/bin/bash
set -e

echo "🚀 Starting SkyVPS360 Platform in development mode..."

# Run database migrations with --accept-data-loss flag to prevent interactive prompts
echo "🗄️ Running database migrations..."
NODE_ENV=development npx drizzle-kit push --accept-data-loss || echo "⚠️ Migration warnings (continuing anyway)"

# Start the application in development mode
echo "🌐 Starting development server..."
npm run dev
