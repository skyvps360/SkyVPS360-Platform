import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { log } from './vite';
import * as fs from 'fs';
import * as path from 'path';
import { cloudRackKeyManager } from './cloudrack-key-manager';

// Function to test SSH connection with a server
export async function testSSHConnection(
  host: string,
  username: string = 'root',
  password: string | null = null,
  privateKeyPath: string | null = null,
  options: {
    detailedLogs?: boolean;
    useKeyboardInteractive?: boolean;
    timeoutMs?: number;
  } = {}
): Promise<string> {
  // Set default options
  const defaultOptions = {
    detailedLogs: true,
    useKeyboardInteractive: true,
    timeoutMs: 30000, // 30 second timeout
  };
  
  const opts = { ...defaultOptions, ...options };
  
  return new Promise((resolve, reject) => {
    // Detailed log function that respects the detailed logging option
    const detailLog = (message: string) => {
      if (opts.detailedLogs) {
        log(`SSH Debug: ${message}`, 'test-ssh');
      }
    };
    
    const sshClient = new Client();
    
    // Normalize password - remove leading/trailing whitespace
    if (password) {
      password = password.trim();
      
      // Intelligent password sanitizing for common issues
      // For example, sometimes passwords might have special characters escaped incorrectly when passed
      const sanitizedPassword = password
        .replace(/\\n/g, '') // Remove any newlines
        .replace(/^["']|["']$/g, ''); // Remove any surrounding quotes
      
      if (sanitizedPassword !== password) {
        detailLog('Password was sanitized to remove potential encoding issues');
        password = sanitizedPassword;
      }
    }
    
    // Configure connection
    const config: ConnectConfig = {
      host,
      port: 22,
      username,
      readyTimeout: opts.timeoutMs,
      tryKeyboard: opts.useKeyboardInteractive,
      debug: opts.detailedLogs ? (message: string) => detailLog(message) : undefined,
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
      }
    };
    
    // Add authentication methods
    if (password) {
      config.password = password;
      detailLog(`Using password authentication (${password.substring(0, 2)}****)`);
    }
    
    if (privateKeyPath) {
      // Check if explicit key path was provided
      if (fs.existsSync(privateKeyPath)) {
        try {
          const keyData = fs.readFileSync(privateKeyPath, 'utf8');
          config.privateKey = keyData;
          detailLog(`Using private key authentication from ${privateKeyPath}`);
        } catch (err) {
          detailLog(`Error reading private key file: ${err}`);
        }
      } else {
        detailLog(`Private key file not found at ${privateKeyPath}`);
      }
    } 
    // If no explicit key path but also no password, try to use CloudRack key
    else if (!password) {
      try {
        const cloudRackKeyPath = cloudRackKeyManager.getCloudRackPrivateKeyPath();
        if (fs.existsSync(cloudRackKeyPath)) {
          const keyData = fs.readFileSync(cloudRackKeyPath, 'utf8');
          config.privateKey = keyData;
          detailLog(`Using CloudRack Terminal Key for authentication`);
        }
      } catch (err) {
        detailLog(`Error getting CloudRack key: ${err}`);
      }
    }
    
    if (!password && !config.privateKey) {
      reject('No authentication method provided');
      return;
    }
    
    // Set up event handlers
    sshClient.on('ready', () => {
      log(`Connection successful to ${host}`, 'test-ssh');
      
      // Try to execute a simple command
      sshClient.exec('whoami', (err, stream) => {
        if (err) {
          sshClient.end();
          reject(`Command execution failed: ${err.message}`);
          return;
        }
        
        let output = '';
        
        stream.on('data', (data: Buffer) => {
          output += data.toString('utf8');
        });
        
        stream.stderr.on('data', (data: Buffer) => {
          log(`STDERR: ${data.toString('utf8')}`, 'test-ssh');
        });
        
        stream.on('close', () => {
          sshClient.end();
          resolve(`Authentication successful. Command output: ${output.trim()}`);
        });
      });
    });
    
    sshClient.on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
      log(`Keyboard-interactive auth initiated: ${JSON.stringify(prompts)}`, 'test-ssh');
      
      if (prompts.length > 0 && password) {
        log(`Responding to keyboard-interactive with password`, 'test-ssh');
        finish([password]);
      } else {
        log(`No password available for keyboard-interactive auth`, 'test-ssh');
        finish([]);
      }
    });
    
    sshClient.on('error', (err) => {
      log(`SSH error: ${err.message}`, 'test-ssh');
      reject(`Connection failed: ${err.message}`);
    });
    
    // Connect to the server
    log(`Connecting to ${host} as ${username}...`, 'test-ssh');
    sshClient.connect(config);
  });
}

// Export a function to run the test with command line arguments
export function runSSHTest() {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node test-ssh.js <host> [username] [password] [private-key-path]');
    return;
  }
  
  const host = args[0];
  const username = args[1] || 'root';
  const password = args[2] || null;
  const privateKeyPath = args[3] || null;
  
  console.log(`Testing SSH connection to ${host} as ${username}`);
  console.log(`Password: ${password ? '****' : 'Not provided'}`);
  console.log(`Private key: ${privateKeyPath || 'Not provided'}`);
  
  testSSHConnection(host, username, password, privateKeyPath)
    .then(result => {
      console.log('SUCCESS:', result);
    })
    .catch(error => {
      console.error('FAILED:', error);
    });
}

// If this file is executed directly, run the test
if (require.main === module) {
  runSSHTest();
}