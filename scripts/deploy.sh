#!/bin/bash
set -e

# Display step information
function step() {
  echo -e "\n\033[1;36m>> $1\033[0m"
}

# Check for errors
function check_error() {
  if [ $? -ne 0 ]; then
    echo -e "\n\033[1;31mError: $1\033[0m"
    exit 1
  fi
}

step "Starting deployment process..."

# Ensure all schema imports are fixed
step "Fixing schema imports in client code"
npm run fix-schema-imports
check_error "Failed to fix schema imports"

# Ensure client schema is complete
step "Ensuring client schema is complete"
npm run ensure-client-schema
check_error "Failed to ensure client schema completeness"

# Clean previous builds
step "Cleaning previous build artifacts"
rm -rf dist
check_error "Failed to clean build directory"

# Build for production 
step "Building for production"
NODE_ENV=production npm run build
check_error "Build failed"

# Run database migrations
step "Running database migrations"
NODE_ENV=production npm run db:migrate
check_error "Database migration failed"

step "Deployment preparation complete!"
echo -e "\033[1;32mYou can now start the server with: npm run start\033[0m"
