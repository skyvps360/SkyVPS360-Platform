import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2, Minimize2, Lock, Key, Type, ChevronDown, TextCursorInput } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import 'xterm/css/xterm.css';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ServerTerminalProps {
  serverId: number;
  serverName: string;
  ipAddress: string;
}

// Available terminal fonts
const TERMINAL_FONTS = [
  { 
    name: "Default Monospace", 
    value: 'Menlo, Monaco, "Courier New", "DejaVu Sans Mono", "Lucida Console", monospace'
  },
  { name: "Courier New", value: '"Courier New", monospace' },
  { name: "DejaVu Sans Mono", value: '"DejaVu Sans Mono", monospace' },
  { name: "Fira Code", value: '"Fira Code", monospace' },
  { name: "Inconsolata", value: '"Inconsolata", monospace' },
  { name: "JetBrains Mono", value: '"JetBrains Mono", monospace' },
  { name: "Source Code Pro", value: '"Source Code Pro", monospace' },
  { name: "Ubuntu Mono", value: '"Ubuntu Mono", monospace' },
];

export default function ServerTerminal({ serverId, serverName, ipAddress }: ServerTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('Disconnected');
  const socketRef = useRef<any>(null);
  const { user } = useAuth();
  const [currentFont, setCurrentFont] = useState<string>(TERMINAL_FONTS[0].value);
  const [fontSize, setFontSize] = useState<number>(14); // Default font size
  
  // Function to change terminal font
  const changeTerminalFont = (newFont: string) => {
    // First disconnect any existing connection to prevent errors
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Set new font
    setCurrentFont(newFont);
    
    // Force complete recreation of the terminal
    if (terminal) {
      // Dispose the existing terminal immediately
      terminal.dispose();
      setTerminal(null); 
      
      // Clean references
      setFitAddon(null);
      terminalRef.current!.innerHTML = '';
      
      // Show message directly in the container since terminal is gone
      const msgDiv = document.createElement('div');
      msgDiv.className = 'p-4 text-yellow-400 bg-gray-900 h-full';
      msgDiv.innerHTML = 'Changing terminal font... Please wait.';
      terminalRef.current!.appendChild(msgDiv);
      
      // Status updates
      setIsConnected(false);
      setConnectionStatus('Updating font...');
    }
  };
  
  // Function to change terminal font size
  const changeFontSize = (newSize: number) => {
    // First disconnect any existing connection to prevent errors
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Set new size
    setFontSize(newSize);
    
    // Force complete recreation of the terminal
    if (terminal) {
      // Dispose the existing terminal immediately
      terminal.dispose();
      setTerminal(null);
      
      // Clean references
      setFitAddon(null);
      terminalRef.current!.innerHTML = '';
      
      // Show message directly in the container since terminal is gone
      const msgDiv = document.createElement('div');
      msgDiv.className = 'p-4 text-yellow-400 bg-gray-900 h-full';
      msgDiv.innerHTML = 'Changing font size... Please wait.';
      terminalRef.current!.appendChild(msgDiv);
      
      // Status updates
      setIsConnected(false);
      setConnectionStatus('Updating size...');
    }
  };
  
  // Get the server's root password from the API
  const { data: serverDetails } = useQuery<{ rootPassword?: string, id: number }>({
    queryKey: [`/api/servers/${serverId}/details`],
    enabled: !isNaN(serverId) && !!user,
    // Add some stale time to avoid too many refreshes
    staleTime: 10000,
    // Add a refetchInterval to ensure we always have the latest password
    refetchInterval: 30000,
    retry: 3,
  });
  
  // Log password availability for debugging
  useEffect(() => {
    if (serverDetails) {
      console.log(`[Terminal Debug] Server ${serverId} password status:`, {
        hasPassword: !!serverDetails.rootPassword,
        passwordLength: serverDetails.rootPassword?.length || 0
      });
    }
  }, [serverDetails, serverId]);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || !user) return;

    // Clear any existing terminal
    terminalRef.current.innerHTML = '';
    
    console.log("Terminal initializing, root password available:", !!serverDetails?.rootPassword);

    // Initialize XTerm with a nice theme
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: currentFont, // Use the selected font from state
      fontSize: fontSize, // Use the font size from state
      letterSpacing: 0.2,
      theme: {
        background: '#1a1b26',
        foreground: '#c0caf5',
        cursor: '#f7f7f7',
        selectionBackground: 'rgba(128, 203, 196, 0.3)',
        black: '#32344a',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#ad8ee6',
        cyan: '#449dab',
        white: '#787c99',
        brightBlack: '#444b6a',
        brightRed: '#ff7a93',
        brightGreen: '#b9f27c',
        brightYellow: '#ff9e64',
        brightBlue: '#7da6ff',
        brightMagenta: '#bb9af7',
        brightCyan: '#0db9d7',
        brightWhite: '#acb0d0',
      }
    });

    // Add fit addon for proper resizing
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());

    // Open terminal in the container
    term.open(terminalRef.current);
    fit.fit();

    // Store references
    setTerminal(term);
    setFitAddon(fit);

    // Handle window resize
    const handleResize = () => {
      if (fit) fit.fit();
    };
    window.addEventListener('resize', handleResize);

    // Initial connection attempt
    connectToServer(term);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [serverId, user, serverDetails, currentFont, fontSize]); // Include all display settings dependencies

  // Handle full screen mode changes
  useEffect(() => {
    if (fitAddon) {
      setTimeout(() => {
        fitAddon.fit();
      }, 100);
    }
  }, [isFullScreen, fitAddon]);

  // Connect to WebSocket server
  const connectToServer = (term: Terminal) => {
    try {
      setConnectionError(null);
      setConnectionStatus('Connecting...');
      
      // Clear the terminal and add connection information
      term.clear();
      term.writeln('\x1b[1;32mInitiating connection to server...\x1b[0m');
      term.writeln(`\x1b[1;34mConnecting to ${serverName} (${ipAddress})...\x1b[0m`);
      term.writeln('\x1b[1;33mNote: Connection may take up to 30 seconds for new servers\x1b[0m');
      
      // Create a socket.io connection to the server with query parameters
      const socket = io(`${window.location.origin}`, {
        query: {
          serverId: serverId.toString(),
          userId: user?.id.toString()
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 30000, // Longer timeout for slower connections
        forceNew: true  // Force a new connection to avoid socket reuse issues
      });
      
      socketRef.current = socket;
      
      // Handle socket events
      socket.on('connect', () => {
        console.log('Socket connected to backend');
        term.writeln('\x1b[1;32mEstablished connection to SkyVPS360...\x1b[0m');
        setConnectionStatus('Connected to WebSocket');
      });
      
      // Handle status updates from the server
      socket.on('status', (data: { status: string, message?: string }) => {
        console.log('[Terminal] Status update:', data.status, data.message);
        
        // Update status based on the message from the server
        if (data.status === 'connecting') {
          setConnectionStatus('Establishing SSH connection...');
          term.writeln(`\x1b[1;33m${data.message || 'Establishing secure connection...'}\x1b[0m`);
        } 
        else if (data.status === 'auth_in_progress') {
          setConnectionStatus('Authenticating...');
          term.writeln(`\x1b[1;33m${data.message || 'Authenticating...'}\x1b[0m`);
        }
        else if (data.status === 'connected') {
          setIsConnected(true);
          setConnectionStatus('Connected');
          term.writeln('\x1b[1;32mSecure connection established!\x1b[0m');
          term.writeln('\x1b[1;32m-----------------------------------------\x1b[0m');
          term.writeln('\x1b[1;32mWelcome to SkyVPS360 Web Terminal Access\x1b[0m');
          term.writeln('\x1b[1;32m-----------------------------------------\x1b[0m');
          
          // Display authentication method used
          if (data.message) {
            term.writeln(`\x1b[1;34m${data.message}\x1b[0m`);
          }
        } 
        else if (data.status === 'disconnected') {
          setIsConnected(false);
          setConnectionStatus('Disconnected');
          term.writeln('\x1b[1;31mConnection closed.\x1b[0m');
        }
        // Any other status message with additional info
        else if (data.message) {
          term.writeln(`\x1b[1;36m${data.message}\x1b[0m`);
        }
      });
      
      // Handle data received from the server
      socket.on('data', (data: string) => {
        term.write(data);
      });
      
      // Handle errors from the server
      socket.on('error', (error: string) => {
        console.error('Terminal error:', error);
        setConnectionError(error);
        setIsConnected(false);
        setConnectionStatus('Error');
        
        // Display the error in the terminal with helpful troubleshooting
        term.writeln(`\x1b[1;31mError: ${error}\x1b[0m`);
        
        // Provide helpful troubleshooting information
        if (error.includes('timeout') || error.includes('Connection refused') || error.includes('ECONNREFUSED')) {
          term.writeln('\x1b[1;33m---------- CONNECTION TROUBLESHOOTING ----------\x1b[0m');
          term.writeln('\x1b[1;33m• New servers may take up to 5 minutes to complete setup\x1b[0m');
          term.writeln('\x1b[1;33m• The server may be rebooting or initializing\x1b[0m');
          term.writeln('\x1b[1;33m• Server firewall may be blocking connections\x1b[0m');
          term.writeln('\x1b[1;33m----------------------------------------------\x1b[0m');
          term.writeln('\x1b[1;32mRecommendation: Wait a few minutes and try reconnecting\x1b[0m');
        } 
        else if (error.includes('Authentication failed') || error.includes('auth fail') || error.includes('permission denied')) {
          term.writeln('\x1b[1;33m---------- AUTHENTICATION TROUBLESHOOTING ----------\x1b[0m');
          term.writeln('\x1b[1;33m• Root password authentication failed\x1b[0m');
          term.writeln('\x1b[1;33m• Try setting a new root password using the "Set Root Password" button\x1b[0m');
          term.writeln('\x1b[1;33m--------------------------------------------------\x1b[0m');
        } 
        else {
          term.writeln('\x1b[1;33m---------- GENERAL TROUBLESHOOTING ----------\x1b[0m');
          term.writeln('\x1b[1;33m• The connection encountered an unexpected error\x1b[0m');
          term.writeln('\x1b[1;33m• Try rebooting the server if the issue persists\x1b[0m');
          term.writeln('\x1b[1;33m-------------------------------------------\x1b[0m');
        }
        
        term.writeln('\x1b[1;36mClick "Reconnect" to try connecting again\x1b[0m');
      });
      
      // Handle disconnection
      socket.on('disconnect', () => {
        setIsConnected(false);
        setConnectionStatus('Disconnected');
        term.writeln('\x1b[1;31mDisconnected from server.\x1b[0m');
        term.writeln('\x1b[1;33mClick "Reconnect" to try connecting again.\x1b[0m');
      });
      
      // "Ready" event indicates the shell is ready
      socket.on('ready', () => {
        setIsConnected(true);
        setConnectionStatus('Ready');
        
        // Emit terminal size when ready
        if (terminal) {
          socket.emit('resize', {
            cols: terminal.cols,
            rows: terminal.rows
          });
        }
      });
      
      // Handle user input in the terminal and send to server
      term.onData((data) => {
        if (socket && socket.connected) {
          socket.emit('data', data);
        }
      });
      
      // Handle terminal resize
      const handleTerminalResize = () => {
        if (socket && socket.connected) {
          socket.emit('resize', {
            cols: term.cols,
            rows: term.rows
          });
        }
      };
      
      // Set up resize handler
      if (fitAddon) {
        // Store the original fit function
        const originalFit = fitAddon.fit;
        
        // Override the fit function to emit a resize event after fitting
        fitAddon.fit = function() {
          originalFit.call(fitAddon);
          handleTerminalResize();
        };
      }
      
    } catch (error: any) {
      console.error('Failed to connect to terminal server:', error);
      setConnectionError('Failed to connect to terminal server. Please try again.');
      setIsConnected(false);
      setConnectionStatus('Error');
    }
  };

  // Reconnect terminal
  const handleReconnect = () => {
    if (terminal) {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      terminal.clear();
      connectToServer(terminal);
    }
  };

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className={`relative w-full ${isFullScreen ? 'fixed inset-0 z-50 bg-background p-6' : ''}`}>
      {connectionError && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-4 flex items-center">
          <span className="mr-2">Connection error: {connectionError}</span>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleReconnect} 
            className="ml-auto"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reconnect
          </Button>
        </div>
      )}
      
      <div 
        className={`
          border rounded-md overflow-hidden w-full mx-auto
          ${isFullScreen ? 'h-[calc(100vh-100px)]' : 'h-[700px]'}
        `}
      >
        <div className="bg-gray-800 text-gray-300 p-2 flex justify-between items-center text-xs">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <div className="flex flex-col">
              <span>{connectionStatus} - {serverName} ({ipAddress})</span>
              {serverDetails?.rootPassword ? (
                <span className="text-xs text-green-400 flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Password authentication enabled
                </span>
              ) : (
                <span className="text-xs text-blue-400 flex items-center gap-1">
                  <Key className="h-3 w-3" /> SkyVPS360 Terminal Key authentication
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            {/* Font selector dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Change Font"
                >
                  <Type className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                {TERMINAL_FONTS.map((font) => (
                  <DropdownMenuItem
                    key={font.name}
                    onClick={() => changeTerminalFont(font.value)}
                    className={currentFont === font.value ? "bg-muted" : ""}
                  >
                    <span 
                      className="truncate" 
                      style={{ fontFamily: font.value }}
                    >
                      {font.name}
                    </span>
                    {currentFont === font.value && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Font size dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  title="Font Size"
                >
                  <TextCursorInput className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[160px]">
                {[8, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24].map((size) => (
                  <DropdownMenuItem
                    key={size}
                    onClick={() => changeFontSize(size)}
                    className={fontSize === size ? "bg-muted" : ""}
                  >
                    <span className="flex items-center">
                      <span className="mr-2" style={{ fontSize: `${size}px` }}>A</span>
                      {size}px
                    </span>
                    {fontSize === size && (
                      <span className="ml-auto text-primary">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={handleReconnect}
              title="Reconnect"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={toggleFullScreen}
              title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              {isFullScreen ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
        <div 
          ref={terminalRef} 
          className="h-full w-full"
        />
      </div>
      
      {isFullScreen && (
        <div className="absolute bottom-6 right-6">
          <Button 
            variant="secondary" 
            onClick={toggleFullScreen}
          >
            <Minimize2 className="h-4 w-4 mr-2" />
            Exit Full Screen
          </Button>
        </div>
      )}
    </div>
  );
}