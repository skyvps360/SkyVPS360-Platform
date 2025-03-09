import { Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Client as SSHClient, ClientChannel, ConnectConfig } from 'ssh2';
import { storage } from './storage';
import { log } from './vite';
import { Request } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { cloudRackKeyManager } from './cloudrack-key-manager';

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
  // Add rootPassword property that may be present
  rootPassword?: string;
}

export function setupTerminalSocket(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
  
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
      
      // Connect to the server via SSH
      const sshClient = new SSHClient();
      let sshStream: ClientChannel | null = null;
      
      socket.emit('status', { status: 'connecting' });
      
      sshClient.on('ready', () => {
        // Log successful connection with password authentication
        log(`Connected to server ${server.id} using password authentication`, 'terminal');
        socket.emit('status', { 
          status: 'password_auth'
        });
          
        // Then emit the connected status after a short delay to ensure sequence
        setTimeout(() => {
          socket.emit('status', { 
            status: 'connected',
            message: 'Using password authentication (root password)'
          });
        }, 100);
        
        // Create a new shell session
        sshClient.shell((err: Error | undefined, stream: ClientChannel) => {
          if (err) {
            socket.emit('error', `Failed to create shell: ${err.message}`);
            socket.disconnect();
            return;
          }
          
          sshStream = stream;
          
          // Forward data from SSH to the client
          stream.on('data', (data: Buffer) => {
            socket.emit('data', data.toString('utf-8'));
          });
          
          stream.on('close', () => {
            socket.emit('status', { status: 'disconnected' });
            sshClient.end();
          });
          
          stream.stderr.on('data', (data: Buffer) => {
            socket.emit('data', data.toString('utf-8'));
          });
        });
      });
      
      sshClient.on('error', (err) => {
        log(`SSH connection error: ${err.message}`, 'terminal');
        
        // Provide more user-friendly error messages for common SSH errors
        let userMessage = `SSH connection error: ${err.message}`;
        
        if (err.message.includes('All configured authentication methods failed')) {
          userMessage = 'Authentication failed. Please ensure your root password is correct in server settings.';
          
          // Log detailed error information for debugging
          log(`Authentication failed for server ${server.id}:
            - Server IP: ${server.ipAddress}
            - Authentication method: Password
            - Error details: ${err.message}`, 'terminal');
            
        } else if (err.message.includes('connect ETIMEDOUT') || err.message.includes('Operation timed out')) {
          userMessage = 'Connection timed out. The server may be starting up or behind a firewall.';
        } else if (err.message.includes('connect ECONNREFUSED')) {
          userMessage = 'Connection refused. SSH service may not be running on the server.';
        } else if (err.message.includes('Host key verification failed')) {
          userMessage = 'Host key verification failed. The server\'s SSH fingerprint has changed.';
        }
        
        socket.emit('error', userMessage);
        socket.disconnect();
      });
      
      sshClient.on('close', () => {
        socket.emit('status', { status: 'disconnected' });
      });
      
      sshClient.on('end', () => {
        socket.emit('status', { status: 'disconnected' });
      });
      
      // Handle connection to the server
      const connectSSH = async () => {
        try {
          if (!server.ipAddress) {
            throw new Error('Server IP address is not available');
          }
          
          // Log connection attempt for debugging
          log(`Attempting SSH connection to ${server.ipAddress} for server ${server.id}`, 'terminal');
          
          // Verify that user has CloudRack key
          const hasKey = await cloudRackKeyManager.hasCloudRackKey(parseInt(userId));
          if (!hasKey) {
            throw new Error('CloudRack Terminal Key not found in your account. Please contact support.');
          }
          
          // Get the CloudRack SSH private key path
          const keyPath = cloudRackKeyManager.getCloudRackPrivateKeyPath();
          
          // Check if the CloudRack SSH private key exists
          if (!fs.existsSync(keyPath)) {
            throw new Error('CloudRack SSH key not found on server. Terminal functionality is disabled.');
          }
          
          // Read the CloudRack SSH private key
          let privateKey = fs.readFileSync(keyPath, 'utf8');
          
          // Check private key format
          if (!privateKey.includes('-----BEGIN RSA PRIVATE KEY-----') || !privateKey.includes('-----END RSA PRIVATE KEY-----')) {
            log('Invalid SSH private key format. Attempting to regenerate CloudRack keys.', 'terminal');
            
            // Force regeneration of keys - we need to access the private method
            try {
              await (cloudRackKeyManager as any).regenerateKeys();
              
              // Re-read the private key after regeneration
              if (fs.existsSync(keyPath)) {
                const newPrivateKey = fs.readFileSync(keyPath, 'utf8');
                if (newPrivateKey.includes('-----BEGIN RSA PRIVATE KEY-----')) {
                  log('Successfully regenerated CloudRack keys with correct format', 'terminal');
                  // Use the new key
                  privateKey = newPrivateKey;
                } else {
                  throw new Error('Failed to generate key in correct format after retry');
                }
              } else {
                throw new Error('Key file not found after regeneration attempt');
              }
            } catch (regenerationError) {
              log(`Failed to regenerate keys: ${regenerationError}`, 'terminal');
              throw new Error('Invalid SSH private key format. Terminal functionality is unavailable.');
            }
          }
          
          // Determine if we should use password or key-based authentication
          const connectionConfig: any = {
            host: server.ipAddress,
            port: 22,
            username: 'root',
            readyTimeout: 60000, // Extended timeout even further
            keepaliveInterval: 5000,
            // Limit retries to prevent too many auth failures
            retries: 1,
            retry_delay: 2000,
            // Set explicit algorithms for better compatibility with older servers
            algorithms: {
              kex: [
                'diffie-hellman-group-exchange-sha256',
                'diffie-hellman-group14-sha256',
                'diffie-hellman-group14-sha1',
                'diffie-hellman-group1-sha1'
              ],
              cipher: [
                'aes128-ctr',
                'aes192-ctr',
                'aes256-ctr',
                'aes128-gcm',
                'aes256-gcm',
                'aes128-cbc',
                'aes256-cbc'
              ],
              serverHostKey: [
                'ssh-rsa',
                'ssh-dss',
                'ecdsa-sha2-nistp256',
                'ecdsa-sha2-nistp384',
                'ecdsa-sha2-nistp521'
              ],
              hmac: [
                'hmac-sha2-256',
                'hmac-sha2-512',
                'hmac-sha1'
              ]
            },
            debug: (message: string) => {
              // Always log SSH debug messages for troubleshooting terminal issues
              log(`SSH Debug: ${message}`, 'terminal');
            }
          };
          
          // IMPROVED AUTHENTICATION APPROACH
          // First try password authentication if available, then fall back to SSH key
          
          // Configure connection options based on authentication method available
          if (server.rootPassword) {
            log(`Using password authentication for server ${server.id} (password length: ${server.rootPassword.length})`, 'terminal');
            socket.emit('status', { 
              status: 'connecting',
              message: 'Connecting with password authentication...'
            });
            
            // Configure for password auth - masked password for security in logs
            log(`Password set for authentication: ${server.rootPassword.substring(0, 2)}****`, 'terminal');
            connectionConfig.password = server.rootPassword;
            connectionConfig.tryKeyboard = true;     // Enable keyboard-interactive as backup
            
            // Add detailed debugging for connection
            log(`Connection config (password auth): host=${connectionConfig.host}, port=${connectionConfig.port}, username=${connectionConfig.username}`, 'terminal');
          } else {
            // If no password, attempt to use SSH key authentication with the CloudRack key
            log(`Using CloudRack key authentication for server ${server.id}`, 'terminal');
            socket.emit('status', { 
              status: 'connecting',
              message: 'Connecting with SSH key authentication...'
            });
            
            // Configure for SSH key auth
            connectionConfig.privateKey = privateKey;
            connectionConfig.tryKeyboard = true;     // Keep keyboard-interactive as backup
          }
          
          // Let SSH2 handle authentication with the available credentials
          connectionConfig.authHandler = undefined;
          
          // Handle keyboard-interactive challenges
          sshClient.on('keyboard-interactive', (name: string, instructions: string, instructionsLang: string, prompts: any[], finish: Function) => {
            log(`Received keyboard-interactive prompt: ${name}`, 'terminal');
            
            // If there are no prompts, just finish
            if (prompts.length === 0) {
              return finish([]);
            }
            
            // If we have a root password and the prompt is asking for a password, use it
            // Check if we have a root password and if any prompt is asking for a password
            // We now use a much broader check for password-related prompts in multiple languages
            if (server.rootPassword && (
              // Check for common password prompts in multiple languages
              prompts.some((p: any) => 
                p.prompt.toLowerCase().includes('password') || 
                p.prompt.toLowerCase().includes('senha') ||        // Portuguese 
                p.prompt.toLowerCase().includes('contraseña') ||   // Spanish
                p.prompt.toLowerCase().includes('mot de passe') || // French
                p.prompt.toLowerCase().includes('kennwort') ||     // German
                p.prompt.toLowerCase().includes('пароль') ||       // Russian 
                p.prompt.toLowerCase().includes('密码') ||          // Chinese
                p.prompt.toLowerCase().includes('パスワード') ||      // Japanese
                p.prompt.toLowerCase().includes('암호') ||         // Korean
                // Also look for password prompt indicators that don't use the word "password"
                p.echo === false ||                               // Hidden input is likely password
                p.prompt.includes('***')                          // Stars often indicate password
              )
            )) {
              // Log comprehensive debugging information
              log('Responding to password prompt with stored root password', 'terminal');
              socket.emit('status', { 
                status: 'auth_in_progress',
                message: 'Using stored root password for authentication'
              });
              
              // For password prompts, don't echo back to client
              // If any prompt is expecting hidden input (echo = false), it's most likely a password
              const isPasswordPrompt = prompts.some(p => p.echo === false);
              
              // Also check if there are any other clues this is a password prompt
              const promptTexts = prompts.map(p => p.prompt.toLowerCase());
              
              // Log the authentication attempt details with comprehensive debugging
              log(`Password authentication attempt for server ${server.id}:
                - Server IP: ${server.ipAddress}
                - Authentication method: Password
                - Username: root
                - Password length: ${server.rootPassword.length} characters
                - Is password prompt: ${isPasswordPrompt}
                - Prompt text: ${JSON.stringify(promptTexts)}`, 'terminal');
                
              // Use the stored root password
              finish([server.rootPassword]);
            } else {
              // Otherwise, we need to pass the prompt to the client
              log('Passing keyboard-interactive prompt to client', 'terminal');
              socket.emit('auth_request', { 
                prompt: prompts[0].prompt 
              });
              
              // Wait for client response (this will handle the first prompt only)
              const handleResponse = (data: string) => {
                socket.off('data', handleResponse);
                
                // Don't log the actual input as it might be sensitive
                log('Received response from client for interactive prompt', 'terminal');
                
                finish([data.trim()]);
              };
              
              socket.on('data', handleResponse);
            }
          });
          
          sshClient.connect(connectionConfig);
        } catch (error: any) {
          log(`SSH connection error: ${error.message}`, 'terminal');
          socket.emit('error', `Failed to connect: ${error.message}`);
        }
      }
      
      // Handle data from the client to the SSH server
      socket.on('data', (data) => {
        if (sshStream) {
          sshStream.write(data);
        }
      });
      
      // Handle resize events
      socket.on('resize', (data: { rows: number, cols: number }) => {
        if (sshStream) {
          try {
            // Use proper SSH window size parameters
            sshStream.setWindow(data.rows, data.cols, data.cols * 8, data.rows * 10);
          } catch (err) {
            log(`Terminal resize error: ${err}`, 'terminal');
          }
        }
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        if (sshClient) {
          sshClient.end();
        }
      });
      
      // Start connection process
      connectSSH().catch(err => {
        log(`Terminal connection failed: ${err.message}`, 'terminal');
        socket.emit('error', `Terminal connection failed: ${err.message}`);
        socket.disconnect();
      });
      
    } catch (error: any) {
      log(`Terminal error: ${error.message}`, 'terminal');
      socket.emit('error', `Terminal error: ${error.message}`);
      socket.disconnect();
    }
  });
  
  return io;
}