import { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";

export default function TerminalPage() {
  const { id } = useParams();
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminal = useRef<Terminal | null>(null);
  const fitAddon = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminal.current = new Terminal();
      fitAddon.current = new FitAddon();
      terminal.current.loadAddon(fitAddon.current);
      terminal.current.open(terminalRef.current);
      fitAddon.current.fit();

      const socket = new WebSocket(`wss://your-server-url/terminal/${id}`);

      socket.onopen = () => {
        terminal.current?.write("Connected to terminal\n");
      };

      socket.onmessage = (event) => {
        terminal.current?.write(event.data);
      };

      socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        terminal.current?.write("WebSocket error\n");
      };

      socket.onclose = () => {
        terminal.current?.write("Disconnected from terminal\n");
      };

      terminal.current.onData((data) => {
        socket.send(data);
      });

      return () => {
        socket.close();
        terminal.current?.dispose();
      };
    }
  }, [id]);

  return <div ref={terminalRef} style={{ height: "100vh", width: "100%" }} />;
}
