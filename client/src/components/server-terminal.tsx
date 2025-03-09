import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2, Minimize2, Move, Type } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
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
  const { user } = useAuth();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);
  const [currentFont, setCurrentFont] = useState<string>(TERMINAL_FONTS[0].value);

  // Function to change terminal font
  const changeTerminalFont = (newFont: string) => {
    setCurrentFont(newFont);
    
    // If terminal exists, update its font
    if (terminal) {
      terminal.options.fontFamily = newFont;
      
      // Force a redraw by updating the terminal size
      if (fitAddon) {
        setTimeout(() => {
          fitAddon.fit();
        }, 50);
      }
    }
  };

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current || !user) return;

    // Clear any existing terminal
    terminalRef.current.innerHTML = '';

    // Initialize XTerm with improved settings for better visibility
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'block',
      fontFamily: currentFont, // Use the selected font from state
      fontSize: 15,
      lineHeight: 1.2,
      letterSpacing: 0.2,
      scrollback: 5000, // More scrollback history
      theme: {
        background: '#1a1b26',
        foreground: '#c4c9e3', // Brighter foreground for better readability
        cursor: '#ffffff',
        selectionBackground: 'rgba(128, 203, 196, 0.4)',
        black: '#32344a',
        red: '#f7768e',
        green: '#9ece6a',
        yellow: '#e0af68',
        blue: '#7aa2f7',
        magenta: '#ad8ee6',
        cyan: '#449dab',
        white: '#a0a8cd', // Brighter white
        brightBlack: '#444b6a',
        brightRed: '#ff7a93',
        brightGreen: '#b9f27c',
        brightYellow: '#ff9e64',
        brightBlue: '#7da6ff',
        brightMagenta: '#bb9af7',
        brightCyan: '#0db9d7',
        brightWhite: '#c4c9e3', // Brighter bright white
      }
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());

    // Open terminal in the container
    term.open(terminalRef.current);
    fit.fit();
    
    // Make sure to fit terminal after a small delay to allow the DOM to settle
    setTimeout(() => {
      fit.fit();
    }, 100);

    // Store references
    setTerminal(term);
    setFitAddon(fit);

    // Handle window resize
    const handleResize = () => {
      if (fit) fit.fit();
    };
    window.addEventListener('resize', handleResize);

    // Initial connection
    connectToServer(term);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [serverId, user, currentFont]); // Include currentFont in dependencies to recreate terminal when font changes

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
      
      // Clear terminal and show connecting message
      term.clear();
      term.writeln('\x1b[1;32mInitiating connection to server...\x1b[0m');
      term.writeln(`\x1b[1;34mConnecting to ${serverName} (${ipAddress})...\x1b[0m`);
      
      // Connect to real terminal socket server
      const socket = io({
        query: {
          serverId: serverId.toString(),
          userId: user?.id.toString() || ''
        }
      });
      socketRef.current = socket;
      
      // Handle successful connection
      socket.on('connect', () => {
        console.log('Connected to terminal socket server');
        term.writeln('\x1b[1;32mSocket connection established!\x1b[0m');
        setIsConnected(true);
      });
      
      // Handle connection error
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        term.writeln('\x1b[1;31mSocket connection error: ' + error.message + '\x1b[0m');
        setConnectionError(`Connection error: ${error.message}`);
        setIsConnected(false);
      });
      
      // Handle terminal data from server
      socket.on('data', (data) => {
        term.write(data);
      });
      
      // Handle status messages from server
      socket.on('status', (data) => {
        term.writeln(`\x1b[1;33m${data.message}\x1b[0m`);
      });
      
      // Handle server errors
      socket.on('error', (message) => {
        term.writeln(`\x1b[1;31mError: ${message}\x1b[0m`);
        setConnectionError(message);
      });
      
      // Handle ready event - terminal is ready to accept input
      socket.on('ready', () => {
        term.writeln('\x1b[1;32mTerminal ready!\x1b[0m');
        term.writeln('\x1b[1;34mYou can start typing commands now.\x1b[0m');
      });
      
      // Handle disconnect
      socket.on('disconnect', () => {
        console.log('Disconnected from terminal socket server');
        term.writeln('\x1b[1;31mDisconnected from server\x1b[0m');
        setIsConnected(false);
      });
      
      // Handle terminal input - send to server
      term.onData(data => {
        if (socket.connected) {
          socket.emit('data', data);
        }
      });
      
      // Handle window resize
      const resizeObserver = new ResizeObserver(() => {
        if (fitAddon) {
          fitAddon.fit();
          if (socket.connected) {
            const dims = term.rows && term.cols ? 
              { rows: term.rows, cols: term.cols } : 
              { rows: 24, cols: 80 };
            socket.emit('resize', dims);
          }
        }
      });
      
      if (terminalRef.current) {
        resizeObserver.observe(terminalRef.current);
      }
      
      // Return cleanup function
      return () => {
        if (terminalRef.current) {
          resizeObserver.unobserve(terminalRef.current);
        }
        socket.disconnect();
      };
      
    } catch (error) {
      console.error('Failed to connect to terminal server:', error);
      setConnectionError('Failed to connect to terminal server. Please try again.');
      setIsConnected(false);
    }
  };

  // No need for simulated command processing now that we're connecting to real server

  // Reconnect terminal
  const handleReconnect = () => {
    if (terminal) {
      terminal.clear();
      connectToServer(terminal);
    }
  };

  // Create ref for fullscreen container
  const fullscreenContainerRef = useRef<HTMLDivElement>(null);
  
  // Toggle full screen mode with browser's native fullscreen API
  const toggleFullScreen = () => {
    const newFullscreenState = !isFullScreen;
    setIsFullScreen(newFullscreenState);
    
    // Get the correct socket reference
    const socket = socketRef.current;
    
    if (newFullscreenState) {
      // Enter fullscreen
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      // Request browser fullscreen if supported
      const container = fullscreenContainerRef.current;
      if (container) {
        try {
          if (container.requestFullscreen) {
            container.requestFullscreen();
          } else if ((container as any).webkitRequestFullscreen) {
            (container as any).webkitRequestFullscreen();
          } else if ((container as any).msRequestFullscreen) {
            (container as any).msRequestFullscreen();
          }
        } catch (err) {
          console.log("Error attempting to enable fullscreen:", err);
        }
      }
    } else {
      // Exit fullscreen
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Exit browser fullscreen if active
      try {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement) {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
          }
        }
      } catch (err) {
        console.log("Error attempting to exit fullscreen:", err);
      }
    }
    
    // Give the DOM time to update, then resize the terminal to fill the new space
    setTimeout(() => {
      if (fitAddon) {
        fitAddon.fit();
        
        // Update terminal dimensions and emit resize event
        if (terminal && socket?.connected) {
          const dims = terminal.rows && terminal.cols ? 
            { rows: terminal.rows, cols: terminal.cols } : 
            { rows: 24, cols: 80 };
          socket.emit('resize', dims);
        }
        
        // Focus the terminal when entering fullscreen
        if (newFullscreenState && terminal) {
          terminal.focus();
        }
      }
    }, 100);
  };

  // Effect to handle fitting when fullscreen changes and handle browser fullscreen events
  useEffect(() => {
    if (fitAddon) {
      fitAddon.fit();
      
      if (isFullScreen) {
        // Add event listener for ESC key to exit fullscreen
        const handleEscKey = (e: KeyboardEvent) => {
          if (e.key === 'Escape' && isFullScreen) {
            // The browser's fullscreen API will handle this naturally,
            // but we need to update our state
            setIsFullScreen(false);
          }
        };
        
        // Add event listener for browser fullscreen change with vendor prefixes
        const handleFullscreenChange = () => {
          if (
            !document.fullscreenElement && 
            !(document as any).webkitFullscreenElement && 
            !(document as any).mozFullScreenElement && 
            !(document as any).msFullscreenElement && 
            isFullScreen
          ) {
            // User exited browser fullscreen, update our state
            setIsFullScreen(false);
            document.body.style.overflow = '';
            document.documentElement.style.overflow = '';
          }
        };
        
        window.addEventListener('keydown', handleEscKey);
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);
        
        return () => {
          window.removeEventListener('keydown', handleEscKey);
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
          document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
          document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
          document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
      }
    }
  }, [isFullScreen, fitAddon]);
  
  // Clean up when component unmounts - ensure we exit fullscreen
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Ensure we exit fullscreen on component unmount with vendor prefixes
      try {
        if (
          document.fullscreenElement || 
          (document as any).webkitFullscreenElement || 
          (document as any).mozFullScreenElement || 
          (document as any).msFullscreenElement
        ) {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          } else if ((document as any).mozCancelFullScreen) {
            (document as any).mozCancelFullScreen();
          } else if ((document as any).msExitFullscreen) {
            (document as any).msExitFullscreen();
          }
        }
      } catch (err) {
        console.log("Error attempting to exit fullscreen on unmount:", err);
      }
    };
  }, []);

  return (
    <div 
      ref={fullscreenContainerRef}
      className={`relative ${isFullScreen ? 'fixed inset-0 z-[100] bg-black' : ''}`}
    >
      {/* In fullscreen mode, we don't need an overlay as the terminal itself will take up the entire screen */}
      
      {connectionError && !isFullScreen && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-4">
          {connectionError}
        </div>
      )}
      
      <div 
        className={`
          ${isFullScreen 
            ? 'absolute inset-0 h-screen w-screen border-none' 
            : 'border rounded-md overflow-hidden relative h-[700px] group'}
        `}
      >
        {/* Large fullscreen button that appears when hovering (only in normal mode) */}
        {!isFullScreen && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
            <Button
              onClick={toggleFullScreen}
              variant="outline"
              className="bg-black/80 border-gray-700 text-white hover:bg-black/90"
            >
              <Maximize2 className="mr-2 h-4 w-4" />
              Enter Full Screen
            </Button>
          </div>
        )}
        {/* We removed the resize indicator since it's not needed in a true fullscreen experience */}
        {/* Terminal header bar */}
        <div className={`${isFullScreen ? 'bg-black text-gray-300' : 'bg-gray-800 text-gray-300'} p-2 flex justify-between items-center text-xs`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'Connected' : 'Disconnected'} - {serverName} ({ipAddress})
          </div>
          <div className="flex space-x-2 items-center">
            {/* Font selection dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={`h-6 w-6 ${isFullScreen ? 'hover:bg-gray-800' : ''}`}
                  title="Change Font"
                >
                  <Type className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {TERMINAL_FONTS.map((font) => (
                  <DropdownMenuItem 
                    key={font.name}
                    onClick={() => changeTerminalFont(font.value)}
                    className={currentFont === font.value ? 'bg-gray-100 dark:bg-gray-800' : ''}
                  >
                    <span style={{ fontFamily: font.value }}>{font.name}</span>
                    {currentFont === font.value && (
                      <span className="ml-auto text-green-500">✓</span>
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-6 w-6 ${isFullScreen ? 'hover:bg-gray-800' : ''}`}
              onClick={handleReconnect}
              title="Reconnect"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className={`h-6 w-6 ${isFullScreen ? 'hover:bg-gray-800' : ''}`}
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
          className="h-full"
          onClick={() => {
            if (isFullScreen && terminal) {
              terminal.focus();
            }
          }}
        />
      </div>
      
      {/* Remove the additional exit fullscreen button as it's already in the header */}
    </div>
  );
}