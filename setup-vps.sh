#!/bin/bash

# Exit on any error
set -e

# Prompt user for credentials
read -rp "Enter PostgreSQL password for 'cloudrack' user: " DB_PASSWORD
read -rp "Enter session secret: " SESSION_SECRET
read -rp "Enter PayPal Client ID: " PAYPAL_CLIENT_ID
read -rp "Enter PayPal Client Secret: " PAYPAL_CLIENT_SECRET
read -rp "Enter DigitalOcean API Key: " DIGITAL_OCEAN_API_KEY

# Update system and install dependencies
echo "Updating system and installing dependencies..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl postgresql postgresql-contrib

# Install Node.js 20.x
echo "Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# install node using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash 
source ~/.bashrc
nvm install 20.x
nvm use 20.x

# Install global npm dependencies
echo "Installing global npm dependencies..."
npm install -g ts-node typescript pm2 dotenv

# Configure PostgreSQL
echo "Configuring PostgreSQL..."
sudo -u postgres psql << EOF
DO $$
BEGIN
   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cloudrack') THEN
      CREATE USER cloudrack WITH PASSWORD '$DB_PASSWORD';
   END IF;
END$$;
CREATE DATABASE cloudrack OWNER cloudrack;
GRANT ALL PRIVILEGES ON DATABASE cloudrack TO cloudrack;
EOF

# Create .env file
echo "Creating environment file..."
cat > .env << EOF
NODE_ENV=production
DATABASE_URL=postgresql://cloudrack:$DB_PASSWORD@localhost:5432/cloudrack
SESSION_SECRET=$SESSION_SECRET
PAYPAL_CLIENT_ID=$PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=$PAYPAL_CLIENT_SECRET
PAYPAL_MODE=sandbox
DIGITAL_OCEAN_API_KEY=$DIGITAL_OCEAN_API_KEY
EOF

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Install project dependencies
echo "Installing project dependencies..."
npm install

# Initialize database
echo "Initializing database..."
NODE_ENV=development NODE_TLS_REJECT_UNAUTHORIZED=0 npm run db:push

# Reset environment to production
unset NODE_TLS_REJECT_UNAUTHORIZED
export NODE_ENV=production

echo "Setup complete! You can now start the application with:"
echo "node index.js"
echo "or for production:"
echo "pm2 start index.js --name \"cloudrack\""