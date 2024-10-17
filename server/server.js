import { WebSocketServer } from 'ws';
import pty from 'node-pty';
import stripAnsi from 'strip-ansi';
const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
    console.log('Client connected');
    let globalMessage;

    // Create a new pseudo-terminal session
    const shell = process.env.SHELL || 'sh';
    const terminal = pty.spawn(shell, [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env,
    });

    terminal.on('data', (data) => {
        let buffer = "";
        buffer += stripAnsi(data);
        let lines = buffer.split('\n');
        buffer = lines.pop(); // Keep the last partial line in the buffer

        lines = lines.filter(line => {
            return !line.startsWith('%') && !line.startsWith('') && line.trim() !== '' &&  line.trim() != globalMessage;
        });

        if (lines.length > 0) {
            ws.send(lines.join('\n'));
        }
    });

    ws.on('message', (message) => {
        console.log(`Received command: ${message}`);
        globalMessage = message;
        terminal.write(message + '\n');
        ws.send(`${message}`);
    });

    ws.on('close', () => {
        console.log('Client disconnected');
        terminal.kill();
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

console.log('WebSocket server started on ws://localhost:8080');
