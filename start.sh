#!/bin/bash
set -e
echo "🚀 Starting SkyVPS360 Platform in production mode..."

# Set environment for production
export NODE_ENV=production

# Check if we're in the dist directory or need to navigate to it
if [ -f "./dist/server/index.js" ]; then
  echo "🗄️ Running from project root directory"
  # Copy migrations directory if needed
  if [ ! -d "./dist/migrations" ]; then
    echo "📁 Copying migrations directory..."
    cp -r ./migrations ./dist/
  fi
  
  # Start the application in production mode
  echo "🌐 Starting production server..."
  node ./dist/server/index.js
else
  echo "🌐 Starting production server..."
  # Already at the correct location (likely in DigitalOcean)
  node dist/server/index.js
fi
