# SkyVPS360 VPS Hosting Platform

SkyVPS360 is a comprehensive cloud VPS hosting provider platform with advanced server management, SSH terminal access, and intelligent billing systems. This platform allows users to quickly deploy virtual servers across multiple global regions with various configurations to suit different workloads and budgets.

## 🚀 Core Features

### Server Management
- **Instant Provisioning**: Deploy servers in seconds with pre-configured applications or clean OS distributions
- **Global Regions**: Choose from multiple datacenter locations worldwide
- **Multiple Server Plans**: Options ranging from 1GB RAM starter servers to 16GB high-performance instances
- **Custom Firewall Rules**: Configure inbound and outbound traffic rules with an intuitive interface
- **Block Storage Volumes**: Add expandable SSD storage volumes that can be attached/detached from servers

### Terminal & Access Management
- **Integrated SSH Terminal**: Direct server access through web-based terminal
- **Multiple Authentication Methods**: Support for password and SSH key authentication
- **SSH Key Management**: Create, store and manage SSH keys for secure access
- **Terminal Customization**: Adjustable font sizes and display settings

### Monitoring & Metrics
- **Real-time Server Metrics**: CPU, memory, disk, and network usage monitoring
- **Performance History**: View historical performance data with interactive charts
- **Network Usage Tracking**: Monitor bandwidth consumption with visual indicators
- **Automated Alerts**: Get notified when servers approach resource limits

### Billing & Account Management
- **Pay-as-you-Go Model**: Only pay for the resources you use
- **Hourly Billing**: Precise billing based on actual server usage
- **Transparent Pricing**: Clear breakdown of all costs
- **PayPal Integration**: Secure payment processing
- **Transaction History**: Comprehensive record of all account transactions
- **Downloadable Invoices**: Export transaction data as needed

### Network & Bandwidth
- **1TB Included Bandwidth**: Every server includes 1TB of outbound data transfer per month
- **Bandwidth Monitoring**: Track usage through an intuitive dashboard
- **Bandwidth Overage**: Automatic billing for usage beyond included limits at 0.5% of monthly server cost per GB
- **Network Traffic Visualization**: See inbound and outbound data transfer rates

### Security
- **Firewall Protection**: Custom firewall rules for each server
- **SSH Key Authentication**: Secure server access
- **IP Banning System**: Protection against abuse
- **Admin Security Tools**: Comprehensive security management for administrators

### Support System
- **Ticket Management**: Create and track support requests
- **Priority Levels**: Set urgency for faster resolution of critical issues
- **Server-Specific Support**: Attach tickets to specific servers for context
- **Message Threading**: Ongoing communication in a threaded format

## 📊 Server Plans & Pricing

### Standard VPS Plans
| Plan Name | Specs | Price (Hourly) | Price (Monthly Est.) |
|-----------|-------|----------------|---------------------|
| Starter   | 1GB RAM, 1 vCPU, 25GB SSD | $0.00704/hr | ~$5/month |
| Basic     | 2GB RAM, 1 vCPU, 50GB SSD | $0.01407/hr | ~$10/month |
| Standard  | 4GB RAM, 2 vCPU, 80GB SSD | $0.02814/hr | ~$20/month |

### High Performance VPS Plans
| Plan Name   | Specs | Price (Hourly) | Price (Monthly Est.) |
|-------------|-------|----------------|---------------------|
| Professional| 8GB RAM, 4 vCPU, 160GB SSD | $0.05632/hr | ~$40/month |
| Premium     | 16GB RAM, 8 vCPU, 320GB SSD | $0.11264/hr | ~$80/month |

### Additional Resources
- **Block Storage**: $0.000141/GB/hour (~$0.10/GB/month)
- **Bandwidth Overage**: $0.01005/GB for usage beyond the included 1TB
- **Bandwidth Billing Method**: Charged at 0.5% of monthly server cost per GB of overage

## 🛠️ Technical Architecture

### Frontend Technology Stack
- **React & TypeScript**: Modern, type-safe frontend development
- **TanStack Query**: Efficient data fetching and caching
- **Shadcn/UI & Tailwind CSS**: Beautiful, responsive design system
- **Socket.IO Client**: Real-time terminal communication
- **Recharts**: Interactive data visualization
- **React Hook Form**: Form management with validation
- **PayPal React Components**: Secure payment integration

### Backend Technology Stack
- **Node.js & Express**: Fast, scalable server architecture
- **Drizzle ORM**: Type-safe database operations
- **PostgreSQL**: Robust relational database
- **Socket.IO**: Websocket communication for terminal access
- **SSH2**: Secure shell protocol implementation
- **Passport.js**: Authentication framework
- **PayPal SDK**: Payment processing

### Database Schema
- **Users**: Account information and authentication
- **Servers**: VPS instance configurations and status
- **Volumes**: Block storage management
- **Billing Transactions**: Payment and charge records
- **Server Metrics**: Performance and usage data
- **Support System**: Tickets and messages
- **SSH Keys**: Secure access credentials
- **Security**: IP ban system and access controls

## 💻 Administration Features

### User Management
- View and search all registered users
- Adjust user account balances
- Toggle admin privileges
- Suspend problematic accounts
- View detailed user activity

### Server Administration
- Monitor all active servers across the platform
- Track resource usage and allocation
- Identify performance issues
- Force shutdown problematic instances

### Billing Oversight
- View all financial transactions
- Track revenue and usage patterns
- Generate financial reports
- Process manual adjustments when needed

### Support System
- Respond to customer tickets
- Prioritize urgent issues
- Track resolution times
- Internal notes and status tracking

### Security Controls
- IP banning for abuse prevention
- Monitor suspicious activity
- System credentials management
- Access logs and security monitoring

## 🔧 Setup & Installation

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- PayPal Developer Account (for payment processing)
- DigitalOcean API Key (for production deployment)
- ts-node
- TypeScript

### Database and Environment Setup

1. **Install Required Packages**
   ```bash
   # Install global dependencies
   npm install -g ts-node typescript pm2 dotenv

   # Install project dependencies
   npm install
   ```

2. **Configure Database**
   ```bash
   # Create database and user
   sudo -u postgres psql -c "CREATE USER skyvps360_user WITH PASSWORD 'your_secure_password';"
   sudo -u postgres psql -c "CREATE DATABASE skyvps360 OWNER skyvps360_user;"
   sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE skyvps360 TO skyvps360_user;"
   ```

3. **Setup Environment Variables**
   ```bash
   # Create .env file
   cat > .env << 'EOF'
   # Database Configuration
   DATABASE_URL=postgresql://skyvps360:your_secure_password@localhost:5432/skyvps360
   NODE_ENV=production  # Use 'development' for local development

   # Session Configuration
   SESSION_SECRET=your_session_secret

   # PayPal Configuration
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_MODE=sandbox  # Change to 'live' for production payments

   # DigitalOcean Configuration
   DIGITAL_OCEAN_API_KEY=your_digital_ocean_api_key
   EOF

   # Load environment variables
   set -a; source .env; set +a
   ```

4. **Initialize Database Schema**
   ```bash
   # For first-time setup only
   export NODE_ENV=development
   export NODE_TLS_REJECT_UNAUTHORIZED=0
   npm run db:push

   # After database is initialized, restore secure settings
   unset NODE_TLS_REJECT_UNAUTHORIZED
   export NODE_ENV=production
   ```

5. **Start the Application**
   ```bash
   # Run directly with Node.js
   node index.js

   # OR using PM2 (recommended for production)
   pm2 start index.js --name "skyvps360"
   ```

Note: Make sure to replace placeholder values (your_secure_password, your_session_secret, etc.) with your actual secure values.


### Getting Started with SkyVPS360
1. **Register an Account**: Create a new user account on the platform
2. **Add Funds**: Use PayPal to add credits to your account balance
3. **Create a Server**: 
   - Select a region from our global availability map
   - Choose a server size that meets your needs
   - Select an operating system or application
   - Set a secure root password
   - Deploy your server with one click
4. **Manage Your Server**:
   - Connect via the integrated terminal or SSH
   - Monitor performance and resource usage
   - Configure your firewall for security
   - Add block storage volumes as needed
5. **Track Usage and Billing**:
   - Monitor bandwidth consumption
   - Review transaction history
   - Keep your account funded for uninterrupted service

### Development Setup
1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up the database:
   ```
   npm run db:push
   ```
4. Start the development server:
   ```
   npm run dev
   ```
5. Access the application at http://localhost:5000

## 🚀 Quick Start on VPS

### Prerequisites
- Ubuntu 20.04 or later
- Root access or sudo privileges
- Git installed

### One-Command Setup
1. Clone the repository and run the setup script:
```bash
git clone https://github.com/skyvps360/app SkyVPS360
cd SkyVPS360
chmod +x setup-vps.sh
./setup-vps.sh
```

2. Edit the `.env` file with your actual credentials:
```bash
nano .env
```

3. Start the application:
```bash
# Development mode
node index.js

# Production mode (recommended)
pm2 start index.js --name "skyvps360"
```

### Manual Setup Steps
If you prefer to set up manually or the automatic script doesn't work for your environment, follow these steps:

1. **System Requirements**
   - Ubuntu 20.04 or later
   - Minimum 1GB RAM
   - 20GB SSD Storage
   - Root access or sudo privileges

2. **Install Node.js and Required Packages**
   ```bash
   # Update system and install build tools
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y build-essential git curl

   # Install Node.js 20.x
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs

   # Install global packages
   npm install -g ts-node typescript pm2 dotenv
   ```

3. **Install and Configure PostgreSQL**
   ```bash
   # Install PostgreSQL
   sudo apt install -y postgresql postgresql-contrib

   # Create database and user
   sudo -u postgres psql << EOF
   CREATE USER skyvps360_user WITH PASSWORD 'your_secure_password';
   CREATE DATABASE skyvps360 OWNER skyvps360_user;
   GRANT ALL PRIVILEGES ON DATABASE skyvps360 TO skyvps360_user;
   EOF
   ```

4. **Setup Environment**
   ```bash
   # Create and edit .env file
   cat > .env << 'EOF'
   NODE_ENV=production
   DATABASE_URL=postgresql://skyvps360:your_secure_password@localhost:5432/skyvps360
   SESSION_SECRET=your_session_secret_here
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_MODE=sandbox
   DIGITAL_OCEAN_API_KEY=your_digital_ocean_api_key
   EOF

   # Load variables
   set -a; source .env; set +a
   ```

5. **Initialize Application**
   ```bash
   # Install dependencies
   npm install

   # Initialize database (development mode)
   export NODE_ENV=development
   export NODE_TLS_REJECT_UNAUTHORIZED=0
   npm run db:push

   # Switch back to production
   unset NODE_TLS_REJECT_UNAUTHORIZED
   export NODE_ENV=production
   ```

6. **Start the Application**
   ```bash
   # Development mode
   node index.js

   # Production mode (recommended)
   pm2 start index.js --name "skyvps360"
   pm2 startup  # Enable PM2 on system startup
   pm2 save     # Save current process list
   ```

### Troubleshooting Common Issues

1. **Database Connection Errors**
   - Verify PostgreSQL is running: `sudo systemctl status postgresql`
   - Check database exists: `sudo -u postgres psql -l`
   - Ensure DATABASE_URL is correct in .env
   - For initial setup, use development mode with SSL verification disabled

2. **Node.js Errors**
   - Verify Node.js version: `node --version` (should be 20.x)
   - Clear npm cache: `npm cache clean --force`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

3. **Permission Issues**
   - Ensure proper ownership: `sudo chown -R $USER:$USER .`
   - Check PostgreSQL user permissions: `sudo -u postgres psql -c "\du"`

### Security Notes
1. Always change default passwords in production
2. Use strong SESSION_SECRET values
3. Keep your .env file secure and never commit it to version control
4. Consider setting up a firewall (UFW) and SSL/TLS


## 📚 API Documentation

SkyVPS360 provides a comprehensive API for programmatic management of all platform resources.

### Authentication
- API key-based authentication
- Endpoint: `/api/auth/token`
- Each user can generate personal API keys in account settings

### Server Management Endpoints
- GET `/api/servers` - List all servers
- POST `/api/servers` - Create a new server
- GET `/api/servers/:id` - Get server details
- DELETE `/api/servers/:id` - Delete a server
- GET `/api/servers/:id/metrics` - Get server metrics

### Billing Endpoints
- GET `/api/billing/transactions` - List billing transactions
- POST `/api/billing/deposit` - Add funds to account
- GET `/api/billing/transactions/:id/invoice` - Download invoice

### Full documentation available at `/api-docs` when in development mode

## 🔄 Bandwidth Billing System

SkyVPS360 includes a sophisticated bandwidth tracking and billing system:

### Bandwidth Monitoring
- **Real-time Tracking**: Monitor bandwidth usage as it happens
- **Usage Bar**: Visual indicator of consumption relative to your limit
- **Warning Thresholds**: Colored indicators when approaching limits
- **Adaptive Display Units**: Values automatically display in MB, GB, or TB based on size
- **Detailed Graphs**: View daily and hourly bandwidth patterns

### Billing Logic
- **Included Bandwidth**: Every server includes 1TB (1000GB) of outbound transfer per month
- **Server-specific Billing Periods**: Bandwidth is calculated from each server's creation date
- **Prorated Limits**: Bandwidth allocations are prorated for partial first months
- **Overage Rate**: Usage beyond the included amount is billed at 0.5% of monthly server cost per GB
- **Automated Processing**: Overages are automatically calculated and charged at the end of each billing period
- **Transparent Reporting**: All bandwidth charges clearly labeled in transaction history
- **One-click Access**: View detailed bandwidth statistics directly from server control panel

### Technical Implementation
- Bandwidth data collected hourly via server metrics
- Aggregated daily for efficient storage and reporting
- Intelligent calculation based on server-specific periods
- Automatic unit conversion for clear data presentation (MB/GB/TB)
- Enhanced error handling for more reliable monitoring

## ⚙️ System Administration

### Mock Mode for Development
The system can run in mock mode without actual DigitalOcean API calls:

- **FORCE_MOCK_FIREWALLS=true**: Use simulated firewall data
- **Missing API Key**: Automatically switches to full mock mode

### Database Migrations
- Schema changes managed through Drizzle migrations
- Automatic migration execution on startup
- Migration history tracked for rollback capability

### Error Monitoring
- Comprehensive error logging system
- Admin notification for critical errors
- Performance anomaly detection

## 🔒 Security Considerations

### Data Protection
- Passwords stored with bcrypt hashing
- Session management with secure cookies
- CSRF protection on all forms
- SQL injection prevention through ORM

### Server Access Security
- SSH keys for secure server access
- Firewall rules for traffic control
- Brute force prevention
- IP banning for security threats

### Payment Security
- PayPal handles all payment processing
- No credit card data stored on platform
- Secure WebHook validation

## 🤝 Contributing to SkyVPS360

We welcome contributions to improve SkyVPS360! To contribute:

1. Fork the repository
2. Create a feature branch
3. Implement your changes with appropriate tests
4. Submit a pull request with a clear description

Please follow our coding standards and include tests for new features.

## 🛠️ more fixes coming soon!


## 📝 License

SkyVPS360 is licensed under the MIT License. See the LICENSE file for details.
