import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { storage } from './storage';
import { log } from './vite';
import * as http from 'http';
import { db } from './db';
import { servers } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';

// Extend the Server type to include rootPassword
interface ExtendedServer {
  id: number;
  userId: number;
  name: string;
  dropletId: string;
  region: string;
  size: string;
  status: string;
  ipAddress: string | null;
  ipv6Address: string | null;
  specs: { memory: number; vcpus: number; disk: number; } | null;
  application: string | null;
  lastMonitored: Date | null;
  rootPassword?: string;
}

export function setupTerminalSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
  // Use default namespace for simpler client connection
  io.on('connection', async (socket) => {
    const serverId = socket.handshake.query.serverId as string;
    const userId = socket.handshake.query.userId as string;
    
    if (!serverId || !userId) {
      socket.emit('error', 'Missing server ID or user ID');
      socket.disconnect();
      return;
    }
    
    log(`Terminal connection request for server ${serverId} from user ${userId}`, 'terminal');
    
    try {
      // Verify server ownership
      const server = await storage.getServer(parseInt(serverId)) as unknown as ExtendedServer;
      if (!server) {
        socket.emit('error', 'Server not found');
        socket.disconnect();
        return;
      }
      
      if (server.userId !== parseInt(userId)) {
        socket.emit('error', 'Unauthorized access to server');
        socket.disconnect();
        return;
      }
      
      if (!server.ipAddress) {
        socket.emit('error', 'Server IP address not available');
        socket.disconnect();
        return;
      }
      
      // Get server details including root password directly from the database
      // Use raw SQL to ensure we're getting the password
      const rawResult = await db.execute(
        sql`SELECT * FROM servers WHERE id = ${parseInt(serverId)}`
      );
      
      // Extract the server details from the raw result
      const rawServerDetails = rawResult.rows[0];
      log(`Server ${serverId} raw details: ${JSON.stringify(rawServerDetails)}`, 'terminal');
      
      // Also try the regular query approach
      const serverDetails = await db.query.servers.findFirst({
        where: eq(servers.id, parseInt(serverId))
      });
      
      if (serverDetails) {
        log(`Server query from schema - rootPassword: ${serverDetails.rootPassword ? 'present' : 'missing'}`, 'terminal');
      }
      
      // Use raw SQL results as a fallback if regular query doesn't work
      const effectiveServerDetails = serverDetails?.rootPassword ? serverDetails : rawServerDetails;
      
      // Check if we have a password for this server
      // Since we have both raw SQL results (with snake_case) and schema results (with camelCase)
      // we need to check both formats
      const hasRootPassword = !!effectiveServerDetails?.rootPassword || 
                             !!(effectiveServerDetails as any)?.root_password;
      
      // Get the actual password value, preferring the schema version if available
      let rootPasswordValue = effectiveServerDetails?.rootPassword || 
                              (effectiveServerDetails as any)?.root_password;
                              
      // Try to clean the password - remove any unwanted characters or fix formatting
      if (rootPasswordValue) {
        // Trim any whitespace
        rootPasswordValue = rootPasswordValue.trim();
        
        // Log the cleaned password details
        log(`Original password: ${rootPasswordValue.substring(0, 3)}... (${rootPasswordValue.length} chars)`, 'terminal');
        
        // If the password looks like a hash (contains dots or $ signs) but is not properly formatted,
        // we need to handle it differently
        if (rootPasswordValue.includes('.') || (rootPasswordValue.includes('$') && !rootPasswordValue.startsWith('$'))) {
          log(`Password appears to be in a hashed format, will use with caution`, 'terminal');
        }
      }
      
      // Debug log the password length if it exists
      if (hasRootPassword) {
        log(`Server ${serverId} has root password with length: ${rootPasswordValue?.length}`, 'terminal');
        log(`First few characters of password: ${rootPasswordValue?.substring(0, 3)}...`, 'terminal');
      }
      
      log(`Server ${serverId} root password status: ${hasRootPassword ? 'Available' : 'Not available'}`, 'terminal');
      
      // Create a new SSH client
      const sshClient = new Client();
      let sshStream: ClientChannel | null = null;
      
      // Notify client of connection attempt
      socket.emit('status', { 
        status: 'connecting',
        message: `Connecting to ${server.name} (${server.ipAddress})...`
      });
      
      // Set up SSH client event handlers
      sshClient.on('ready', () => {
        log(`SSH connection established for server ${server.id}`, 'terminal');
        socket.emit('status', { 
          status: 'connected',
          message: 'Connected using password authentication'
        });
        
        // Create a shell session
        sshClient.shell((err, stream) => {
          if (err) {
            log(`Failed to create shell: ${err.message}`, 'terminal');
            socket.emit('error', `Failed to create shell: ${err.message}`);
            socket.disconnect();
            return;
          }
          
          sshStream = stream;
          socket.emit('ready');
          
          // Forward data from SSH to the client
          stream.on('data', (data: Buffer) => {
            socket.emit('data', data.toString('utf-8'));
          });
          
          stream.on('close', () => {
            log(`SSH stream closed for server ${server.id}`, 'terminal');
            socket.emit('status', { status: 'disconnected' });
            sshClient.end();
          });
          
          stream.stderr.on('data', (data: Buffer) => {
            socket.emit('data', data.toString('utf-8'));
          });
        });
      });
      
      sshClient.on('error', (err) => {
        log(`SSH error for server ${server.id}: ${err.message}`, 'terminal');
        
        // Create more user-friendly error messages
        let userMessage = `SSH error: ${err.message}`;
        
        if (err.message.includes('All configured authentication methods failed')) {
          userMessage = 'Authentication failed. Please check your password settings or reset your server password.';
        } else if (err.message.includes('connect ETIMEDOUT')) {
          userMessage = 'Connection timed out. Server may be starting up or behind a firewall.';
        } else if (err.message.includes('connect ECONNREFUSED')) {
          userMessage = 'Connection refused. SSH service may not be running on the server.';
        }
        
        socket.emit('error', userMessage);
        socket.disconnect();
      });
      
      sshClient.on('end', () => {
        log(`SSH connection ended for server ${server.id}`, 'terminal');
        socket.emit('status', { status: 'disconnected' });
      });
      
      sshClient.on('close', () => {
        log(`SSH connection closed for server ${server.id}`, 'terminal');
        socket.emit('status', { status: 'disconnected' });
      });
      
      // Handle keyboard-interactive authentication
      sshClient.on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
        log(`Keyboard-interactive auth initiated: name=${name}, prompts=${JSON.stringify(prompts)}`, 'terminal');
        
        // If it's a password prompt and we have the root password, use it
        if (prompts.length > 0 && hasRootPassword) {
          // Log detailed information about the prompt for debugging
          for (let i = 0; i < prompts.length; i++) {
            log(`Prompt ${i}: ${prompts[i].prompt}, echo: ${prompts[i].echo}`, 'terminal');
          }
          
          log(`Responding to keyboard-interactive with stored password (${rootPasswordValue?.substring(0, 3)}...)`, 'terminal');
          
          // Use the discovered password value from earlier
          finish([rootPasswordValue]);
          
          // Notify the client that we're trying keyboard-interactive authentication
          socket.emit('status', { 
            status: 'auth_in_progress',
            message: 'Attempting keyboard-interactive authentication'
          });
        } else {
          // Otherwise inform the user authentication failed
          log(`Keyboard-interactive auth failed - no password available or no prompts received`, 'terminal');
          log(`Prompts received: ${prompts.length}`, 'terminal');
          log(`Password available: ${hasRootPassword}`, 'terminal');
          socket.emit('error', 'Authentication failed - password required');
          sshClient.end();
        }
      });
      
      // Forward data from client to SSH
      socket.on('data', (data: string) => {
        if (sshStream) {
          sshStream.write(data);
        }
      });
      
      // Handle resize events
      socket.on('resize', (data: { rows: number, cols: number }) => {
        if (sshStream) {
          try {
            sshStream.setWindow(data.rows, data.cols, data.cols * 8, data.rows * 10);
          } catch (err) {
            log(`Terminal resize error: ${err}`, 'terminal');
          }
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        log(`Socket disconnected for server ${server.id}`, 'terminal');
        if (sshClient) {
          sshClient.end();
        }
      });
      
      // Connect to the SSH server using password authentication only
      try {
        const config: ConnectConfig = {
          host: server.ipAddress,
          port: 22,
          username: 'root',
          readyTimeout: 30000, // 30 seconds
          keepaliveInterval: 10000,
          tryKeyboard: true, // Enable keyboard-interactive auth
          debug: (message: string) => {
            log(`SSH Debug: ${message}`, 'terminal');
          }
        };
        
        // Check if we have a root password
        if (hasRootPassword) {
          // Set the password for direct authentication
          config.password = rootPasswordValue;
          
          // Debug log the password details
          log(`Connecting to SSH server at ${server.ipAddress} with password auth`, 'terminal');
          log(`Password being used for SSH auth: ${rootPasswordValue?.substring(0, 3)}... (length: ${rootPasswordValue?.length})`, 'terminal');
          
          socket.emit('status', { 
            status: 'auth_in_progress',
            message: 'Attempting password authentication'
          });
        } else {
          // No root password available - inform the user
          log(`No root password available for server ${server.id}`, 'terminal');
          socket.emit('error', 'No root password found for this server. Please reset your server password.');
          socket.disconnect();
          return;
        }
        
        // Add debug for hostname verification to avoid common SSH errors
        config.hostVerifier = () => true;
        
        // Connect to the SSH server
        sshClient.connect(config);
      } catch (error) {
        log(`SSH connection failed: ${(error as Error).message}`, 'terminal');
        socket.emit('error', `Failed to connect: ${(error as Error).message}`);
        socket.disconnect();
      }
    } catch (error) {
      log(`Terminal setup error: ${(error as Error).message}`, 'terminal');
      socket.emit('error', `Terminal error: ${(error as Error).message}`);
      socket.disconnect();
    }
  });
  
  return io;
}