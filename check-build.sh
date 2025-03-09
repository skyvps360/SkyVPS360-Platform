#!/bin/bash

echo "========================================="
echo "SkyVPS360 Platform Build Check"
echo "========================================="

# Check for Node.js
NODE_VERSION=$(node -v)
echo "Node.js version: $NODE_VERSION"

# Check environment
echo "Environment: ${NODE_ENV:-development}"

# Check for dist directory
if [ ! -d "./dist" ]; then
  echo "❌ ERROR: dist directory not found!"
  echo "Creating dist directory..."
  mkdir -p ./dist
fi

# Check for client directory
if [ ! -d "./dist/client" ]; then
  echo "❌ ERROR: dist/client directory not found!"
  echo "Creating dist/client directory..."
  mkdir -p ./dist/client
else
  echo "✅ Found dist/client directory"
fi

# Check for server directory
if [ ! -d "./dist/server" ]; then
  echo "❌ ERROR: dist/server directory not found!"
  echo "Creating dist/server directory..."
  mkdir -p ./dist/server
else
  echo "✅ Found dist/server directory"
fi

# Check for index.html
if [ ! -f "./dist/client/index.html" ]; then
  echo "❌ ERROR: index.html not found!"
  echo "Creating a basic index.html..."
  cat > ./dist/client/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SkyVPS360</title>
  <link rel="icon" href="data:,">
</head>
<body>
  <div id="root"></div>
  <script>
    document.getElementById('root').innerHTML = '<h1>SkyVPS360 Platform</h1><p>Loading application...</p>';
    setTimeout(() => {
      window.location.href = '/auth';
    }, 5000);
  </script>
</body>
</html>
EOL
  echo "✅ Created basic index.html"
else
  echo "✅ Found index.html"
fi

# Check server index.js
if [ ! -f "./dist/server/index.js" ]; then
  echo "❌ ERROR: Server build files missing!"
  echo "You need to run 'npm run build' first."
else
  echo "✅ Found server/index.js"
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

echo
echo "========================================="
echo "Asset Files Check"
echo "========================================="

# Check for assets directory
ASSETS_DIR="./dist/client/assets"
if [ ! -d "$ASSETS_DIR" ]; then
  echo "⚠️ Assets directory not found, creating it..."
  mkdir -p $ASSETS_DIR
else
  # Count assets files
  JS_COUNT=$(find $ASSETS_DIR -name "*.js" 2>/dev/null | wc -l)
  CSS_COUNT=$(find $ASSETS_DIR -name "*.css" 2>/dev/null | wc -l)
  
  echo "✅ Found $JS_COUNT JavaScript files"
  echo "✅ Found $CSS_COUNT CSS files"
fi

echo
echo "========================================="
echo "Environment Files Check"
echo "========================================="

# Copy environment files
if [ -f ".env" ] || [ -f ".env.production" ]; then
  echo "✅ Found .env files"
  echo "Copying .env files to dist/"
  cp .env* dist/ 2>/dev/null || true
else
  echo "⚠️ No .env files found!"
  echo "Creating a basic .env.production file..."
  cat > ./dist/.env.production << 'EOL'
NODE_ENV=production
PORT=8080
DOMAIN=skyvps360.xyz
COOKIE_DOMAIN=.skyvps360.xyz
DEBUG_STATIC=true
SPA_ROUTING=true
EOL
  echo "✅ Created basic .env.production file"
fi

echo
echo "Build check complete! You can now run: npm start"
echo "========================================="
