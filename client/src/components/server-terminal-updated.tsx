import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { io } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { RefreshCw, Maximize2, Minimize2 } from 'lucide-react';
import 'xterm/css/xterm.css';

interface ServerTerminalProps {
  serverId: number;
  serverName: string;
  ipAddress: string;
}

export default function ServerTerminal({ serverId, serverName, ipAddress }: ServerTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const [terminal, setTerminal] = useState<Terminal | null>(null);
  const [fitAddon, setFitAddon] = useState<FitAddon | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const socketRef = useRef<any>(null);

  // Initialize terminal
  useEffect(() => {
    if (!terminalRef.current) return;

    // Clear any existing terminal
    terminalRef.current.innerHTML = '';

    // Initialize XTerm
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 14,
      theme: {
        background: '#1a1b26',
        foreground: '#a9b1d6',
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
  }, [serverId]);

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
      
      // Since we don't have a real backend socket connection yet, let's simulate one
      // In a real implementation, you would connect to a socket server like this:
      // const socket = io(`${window.location.origin}?serverId=${serverId}`);
      
      // For now, we'll simulate the terminal experience
      term.clear();
      term.writeln('\x1b[1;32mInitiating connection to server...\x1b[0m');
      term.writeln(`\x1b[1;34mConnecting to ${serverName} (${ipAddress})...\x1b[0m`);
      
      setTimeout(() => {
        term.writeln('\x1b[1;32mConnection established!\x1b[0m');
        term.writeln('');
        term.writeln('\x1b[1;37mWelcome to Ubuntu 22.04.3 LTS\x1b[0m');
        term.writeln(`Last login: ${new Date().toUTCString()}`);
        term.writeln(`System information as of ${new Date().toLocaleDateString()}`);
        term.writeln('');
        term.writeln('System load:  0.8              Users logged in:      1');
        term.writeln(`Usage of /:   25.1% of 24.06GB IPv4 address:         ${ipAddress}`);
        term.writeln('Memory usage: 18%              Swap usage:           0%');
        term.writeln('');
        term.writeln('\x1b[1;37mThis is a functional terminal with basic simulation.\x1b[0m');
        term.writeln('\x1b[1;37mYou can type commands and see some simulated responses.\x1b[0m');
        term.writeln('');
        
        // Show prompt
        term.write(`\x1b[1;32mroot@${serverName}:~#\x1b[0m `);
        
        setIsConnected(true);
        
        // Handle user input
        let currentLine = '';
        
        term.onData(data => {
          // Handle backspace
          if (data === '\u007f') {
            if (currentLine.length > 0) {
              currentLine = currentLine.slice(0, -1);
              term.write('\b \b');
            }
            return;
          }
          
          // Handle enter key
          if (data === '\r') {
            term.writeln('');
            
            // Process the command
            processCommand(term, currentLine);
            
            // Reset current line
            currentLine = '';
            return;
          }
          
          // Handle printable characters
          if (data >= ' ' && data <= '~') {
            currentLine += data;
            term.write(data);
          }
        });
        
      }, 1500);
      
    } catch (error) {
      console.error('Failed to connect to terminal server:', error);
      setConnectionError('Failed to connect to terminal server. Please try again.');
      setIsConnected(false);
    }
  };

  // Process simulated commands
  const processCommand = (term: Terminal, command: string) => {
    const cmd = command.trim().toLowerCase();
    
    if (cmd === '') {
      term.write(`\x1b[1;32mroot@${serverName}:~#\x1b[0m `);
      return;
    }
    
    // Handle common Linux commands
    if (cmd === 'ls') {
      term.writeln('Documents  Downloads  public_html  server.log  .ssh');
      
    } else if (cmd === 'pwd') {
      term.writeln('/root');
      
    } else if (cmd === 'whoami') {
      term.writeln('root');
      
    } else if (cmd === 'date') {
      term.writeln(new Date().toString());
      
    } else if (cmd === 'clear' || cmd === 'cls') {
      term.clear();
      
    } else if (cmd === 'uname' || cmd === 'uname -a') {
      term.writeln('Linux server-' + serverId + ' 5.15.0-56-generic #62-Ubuntu SMP x86_64 GNU/Linux');
      
    } else if (cmd.startsWith('cd ')) {
      term.writeln(`Changed directory to: ${cmd.substring(3)}`);
      
    } else if (cmd.startsWith('echo ')) {
      term.writeln(cmd.substring(5));
      
    } else if (cmd === 'ps' || cmd === 'ps aux') {
      term.writeln('USER        PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND');
      term.writeln('root          1  0.0  0.2 167284 11248 ?        Ss   00:00   0:02 /sbin/init');
      term.writeln('root          2  0.0  0.0      0     0 ?        S    00:00   0:00 [kthreadd]');
      term.writeln('www-data    743  0.0  0.6 235968 24616 ?        S    00:00   0:00 nginx: worker process');
      term.writeln('root       1021  0.0  1.2 1295384 49152 ?       Ssl  00:00   0:17 node server.js');
      
    } else if (cmd === 'df' || cmd === 'df -h') {
      term.writeln('Filesystem      Size  Used Avail Use% Mounted on');
      term.writeln('udev            1.9G     0  1.9G   0% /dev');
      term.writeln('tmpfs           394M  1.1M  393M   1% /run');
      term.writeln('/dev/vda1        25G  6.2G   18G  26% /');
      term.writeln('/dev/vdb1        50G   12G   38G  24% /mnt/volume-1');
      
    } else if (cmd === 'free' || cmd === 'free -h') {
      term.writeln('              total        used        free      shared  buff/cache   available');
      term.writeln('Mem:          3.9Gi       734Mi       2.2Gi       2.0Mi       967Mi       2.9Gi');
      term.writeln('Swap:            0B          0B          0B');
      
    } else if (cmd === 'top' || cmd === 'htop') {
      term.writeln('Simulated system monitor not available in this interface.');
      term.writeln('Please use real SSH connection for this functionality.');
      
    } else if (cmd === 'reboot' || cmd === 'shutdown' || cmd === 'shutdown -r now') {
      term.writeln('System reboot/shutdown commands are disabled in this simulation.');
      term.writeln('Please use the server control panel buttons instead.');
      
    } else if (cmd === 'help') {
      term.writeln('Available simulated commands:');
      term.writeln('  ls, pwd, whoami, date, clear, uname, cd, echo, ps, df, free');
      term.writeln('');
      term.writeln('Note: This is a basic simulation. For full functionality,');
      term.writeln('use SSH to connect directly to the server.');
      
    } else {
      term.writeln(`Command not found: ${command}`);
    }
    
    // Show prompt
    term.write(`\x1b[1;32mroot@${serverName}:~#\x1b[0m `);
  };

  // Reconnect terminal
  const handleReconnect = () => {
    if (terminal) {
      terminal.clear();
      connectToServer(terminal);
    }
  };

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className={`relative ${isFullScreen ? 'fixed inset-0 z-50 bg-background p-6' : ''}`}>
      {connectionError && (
        <div className="bg-red-500/10 text-red-500 p-3 rounded-md mb-4">
          {connectionError}
        </div>
      )}
      
      <div 
        className={`
          border rounded-md overflow-hidden
          ${isFullScreen ? 'h-[calc(100vh-100px)]' : 'h-[400px]'}
        `}
      >
        <div className="bg-gray-800 text-gray-300 p-2 flex justify-between items-center text-xs">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            {isConnected ? 'Connected' : 'Disconnected'} - {serverName} ({ipAddress})
          </div>
          <div className="flex space-x-2">
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
          className="h-full"
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