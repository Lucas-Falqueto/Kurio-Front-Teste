import { ws } from 'msw';

const socketLink = ws.link('ws://*');

// We'll keep a reference to connected clients to broadcast events from REST handlers
export const connectedClients: any[] = [];

export const socketHandlers = [
  socketLink.addEventListener('connection', ({ client }) => {
    connectedClients.push(client);
    
    // Engine.IO Handshake (0)
    client.send('0' + JSON.stringify({
      sid: 'mock-session-123',
      upgrades: [],
      pingInterval: 25000,
      pingTimeout: 5000
    }));
    
    client.addEventListener('message', (event) => {
      // Respond to Socket.IO namespace connection request
      if (typeof event.data === 'string' && event.data.startsWith('40')) {
        client.send('40' + JSON.stringify({ sid: 'mock-session-123' }));
      }
      
      // Respond to Engine.IO ping (2) with pong (3)
      if (event.data === '2') {
        client.send('3');
      }
    });
  }),
];

export function emitSocketEvent(event: string, data: any) {
  connectedClients.forEach(client => {
    // 4 = Engine.IO Message, 2 = Socket.IO Event
    const payload = `42${JSON.stringify([event, data])}`;
    client.send(payload);
  });
}
