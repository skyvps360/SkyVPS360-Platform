#!/bin/bash

# Ensure client files exist for development and production
echo "Ensuring client files exist..."

CLIENT_DIR="dist/client"
ASSETS_DIR="$CLIENT_DIR/assets"

# Make directories if they don't exist
mkdir -p $ASSETS_DIR

# Check if index.html exists
if [ ! -f "$CLIENT_DIR/index.html" ]; then
  echo "Creating fallback index.html..."
  cat > "$CLIENT_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SkyVPS360 Platform</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌐</text></svg>">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 0; }
    #root { display: flex; justify-content: center; align-items: center; height: 100vh; }
    .content { text-align: center; max-width: 400px; padding: 20px; }
    h1 { margin-bottom: 20px; }
    .spinner { border: 4px solid rgba(0, 0, 0, 0.1); border-top-color: #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 20px auto; }
    @keyframes spin { to { transform: rotate(360deg) } }
    .dark-mode { background: #121212; color: #e0e0e0; }
    .dark-mode .spinner { border: 4px solid rgba(255, 255, 255, 0.1); border-top-color: #3498db; }
  </style>
  <script>
    // Basic dark mode support
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark-mode');
    }
  </script>
</head>
<body>
  <div id="root">
    <div class="content">
      <h1>SkyVPS360 Platform</h1>
      <div class="spinner"></div>
      <p>Loading application...</p>
    </div>
  </div>
  
  <script>
    // Redirect to the login page if the app doesn't load
    setTimeout(() => {
      if (document.getElementById('app-loaded') === null) {
        console.log('App failed to load, redirecting to /auth');
        window.location.href = '/auth';
      }
    }, 5000);
  </script>
</body>
</html>
EOF
  echo "Fallback index.html created"
fi

# Create minimal CSS and JS files if they don't exist
if [ ! -f "$ASSETS_DIR/main.css" ]; then
  echo "Creating fallback CSS..."
  cat > "$ASSETS_DIR/main.css" << 'EOF'
body { font-family: system-ui, sans-serif; line-height: 1.5; }
EOF
fi

if [ ! -f "$ASSETS_DIR/main.js" ]; then
  echo "Creating fallback JS..."
  cat > "$ASSETS_DIR/main.js" << 'EOF'
console.log('Fallback script loaded');
document.getElementById('root').setAttribute('id', 'app-loaded');
EOF
fi

echo "Client files are ready"
