import dotenv from 'dotenv';

// Load environment variables from .env file (not .env.local)
dotenv.config();

// Export configuration values
export const config = {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    redirectUri: process.env.GITHUB_REDIRECT_URI
  },
  // Add other configuration sections as needed
};
