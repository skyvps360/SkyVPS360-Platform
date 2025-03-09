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

if [ ! -d "dist/client" ]; then
  echo "Error: dist/client directory does not exist! Did the build fail?"
  exit 1
fi

echo "Checking for index.html..."
if [ ! -f "dist/client/index.html" ]; then
  echo "Error: dist/client/index.html not found! This will cause the app to fail."
  exit 1
else
  echo "✅ Found index.html in dist/client/"
fi

echo "Checking for JavaScript assets..."
JS_COUNT=$(find dist/client -name "*.js" | wc -l)
echo "Found $JS_COUNT JavaScript files in dist/client/"

echo "Checking for CSS assets..."
CSS_COUNT=$(find dist/client -name "*.css" | wc -l)
echo "Found $CSS_COUNT CSS files in dist/client/"

echo "Checking file structure:"
find dist/client -type f | sort

echo "Build output looks good! You can now run: npm start"
