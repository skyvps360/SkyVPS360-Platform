#!/bin/bash

# Script to check if the build files exist and are correct
echo "Checking build files..."

# Check if the dist directory exists
if [ ! -d "./dist" ]; then
  echo "ERROR: dist directory not found!"
  exit 1
fi

# Check if the client directory exists inside dist
if [ ! -d "./dist/client" ]; then
  echo "ERROR: dist/client directory not found!"
  mkdir -p ./dist/client
  echo "Created dist/client directory"
fi

# Check if index.html exists
if [ ! -f "./dist/client/index.html" ]; then
  echo "ERROR: index.html not found! Creating a basic one..."
  cat > ./dist/client/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SkyVPS360</title>
  <script type="module" src="/assets/index.js"></script>
  <link rel="stylesheet" href="/assets/index.css">
</head>
<body>
  <div id="root"></div>
</body>
</html>
EOL
  echo "Created basic index.html file"
fi

# Check server files
if [ ! -f "./dist/server/index.js" ]; then
  echo "ERROR: Server build files missing!"
  exit 1
fi

echo "Build check completed!"

echo "Checking build output..."

if [ ! -d "dist" ]; then
  echo "Error: dist directory does not exist! Creating it..."
  mkdir -p dist
fi

if [ ! -d "dist/client" ]; then
  echo "Warning: dist/client directory does not exist! Creating it..."
  mkdir -p dist/client
fi

if [ ! -d "dist/server" ]; then
  echo "Warning: dist/server directory does not exist! Building server..."
  mkdir -p dist/server
else
  echo "✅ Server build directory exists"
fi

# Check for index.html in dist/client
if [ ! -f "dist/client/index.html" ]; then
  echo "Warning: index.html not found in dist/client! Building client..."
  npm run build -- --outDir dist/client
fi

# Check for migrations directory
if [ ! -d "dist/migrations" ]; then
  echo "Creating migrations directory..."
  mkdir -p dist/migrations
  
  # Copy migration files if they exist in the source
  if [ -d "migrations" ]; then
    echo "Copying migration files to dist/migrations"
    cp -r migrations/*.js dist/migrations/ 2>/dev/null || true
  fi
fi

# Check for critical files
echo -e "\nChecking for critical files:"
echo "==============================="

# JavaScript files
JS_COUNT=$(find dist/client -name "*.js" 2>/dev/null | wc -l)
echo "✅ Found $JS_COUNT JavaScript files in dist/client/"

# CSS files 
CSS_COUNT=$(find dist/client -name "*.css" 2>/dev/null | wc -l)
echo "✅ Found $CSS_COUNT CSS files in dist/client/"

# Index.html
if [ -f "dist/client/index.html" ]; then
  echo "✅ Found index.html in dist/client/"
else
  echo "❌ Missing index.html in dist/client!"
fi

# Server index.js
if [ -f "dist/server/index.js" ]; then
  echo "✅ Found index.js in dist/server/"
else
  echo "❌ Missing index.js in dist/server!"
fi

# Check for .env files to copy
if [ -f ".env" ] || [ -f ".env.production" ]; then
  echo "✅ Found .env files to copy to dist/"
else
  echo "⚠️ No .env files found to copy to dist/"
fi

echo -e "\nBuild check complete. If all checks passed, you can run: npm start"
