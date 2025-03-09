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

step "Starting Docker build process..."

# Ensure .env file exists
if [ ! -f .env ]; then
  step "Creating .env file from example"
  cp .env.example .env
  check_error "Failed to create .env file"
fi

# Build Docker image
step "Building Docker image"
docker build -t skyvps360:latest .
check_error "Docker build failed"

step "Docker image built successfully!"
echo -e "\033[1;32mYou can now run the Docker container with: docker-compose up -d\033[0m"
