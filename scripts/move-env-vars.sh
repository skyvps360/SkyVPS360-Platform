#!/bin/bash

# Check if .env.local exists
if [ -f .env.local ]; then
  echo "Found .env.local file"
  
  # Extract GitHub variables from .env.local
  GITHUB_CLIENT_ID=$(grep -o 'GITHUB_CLIENT_ID=.*' .env.local | cut -d= -f2- | tr -d '"')
  GITHUB_CLIENT_SECRET=$(grep -o 'GITHUB_CLIENT_SECRET=.*' .env.local | cut -d= -f2- | tr -d '"')
  GITHUB_REDIRECT_URI=$(grep -o 'GITHUB_REDIRECT_URI=.*' .env.local | cut -d= -f2- | tr -d '"')
  
  # Check if variables were found
  if [ -n "$GITHUB_CLIENT_ID" ] || [ -n "$GITHUB_CLIENT_SECRET" ] || [ -n "$GITHUB_REDIRECT_URI" ]; then
    echo "Found GitHub credentials in .env.local, migrating to .env"
    
    # Update .env file with these variables if they exist
    [ -n "$GITHUB_CLIENT_ID" ] && sed -i "/GITHUB_CLIENT_ID=/d" .env 2>/dev/null || true
    [ -n "$GITHUB_CLIENT_SECRET" ] && sed -i "/GITHUB_CLIENT_SECRET=/d" .env 2>/dev/null || true
    [ -n "$GITHUB_REDIRECT_URI" ] && sed -i "/GITHUB_REDIRECT_URI=/d" .env 2>/dev/null || true
    
    # Append GitHub variables to .env
    echo "" >> .env
    echo "# GitHub OAuth Configuration" >> .env
    [ -n "$GITHUB_CLIENT_ID" ] && echo "GITHUB_CLIENT_ID=\"$GITHUB_CLIENT_ID\"" >> .env
    [ -n "$GITHUB_CLIENT_SECRET" ] && echo "GITHUB_CLIENT_SECRET=\"$GITHUB_CLIENT_SECRET\"" >> .env
    [ -n "$GITHUB_REDIRECT_URI" ] && echo "GITHUB_REDIRECT_URI=\"$GITHUB_REDIRECT_URI\"" >> .env
    
    echo "Migration complete. You should now delete .env.local or remove GitHub credentials from it."
  else
    echo "No GitHub credentials found in .env.local"
  fi
else
  echo ".env.local file not found"
fi

echo "Done!"
