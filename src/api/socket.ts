import { io, Socket } from 'socket.io-client';

export const socket: Socket = io('ws://localhost:5173', {
  transports: ['websocket'],
  autoConnect: false
});

// Patch for E2E testing: Bridge custom window events into socket.on
const originalOn = socket.on.bind(socket);
const originalOff = socket.off.bind(socket);
const eventListeners = new Map<any, any>();

(socket as any).on = (event: string, callback: any) => {
  if (!event || !callback) return originalOn(event as any, callback);
  const windowListener = (e: any) => callback(e.detail);
  eventListeners.set(callback, windowListener);
  window.addEventListener(`mock-socket:${event}`, windowListener);
  return originalOn(event as any, callback) as any;
};

(socket as any).off = (event: string, callback: any) => {
  if (!event || !callback) return originalOff(event as any, callback);
  const windowListener = eventListeners.get(callback);
  if (windowListener) {
    window.removeEventListener(`mock-socket:${event}`, windowListener);
    eventListeners.delete(callback);
  }
  return originalOff(event as any, callback) as any;
};

socket.on('connect', () => {
  console.log('[Socket] Conectado ao servidor.');
});

socket.on('disconnect', () => {
  console.log('[Socket] Desconectado.');
});

export const subscribeToEvents = (callbacks: {
  onNftUpdated?: (data: { nftId: string, price: string, available: number }) => void,
  onOrderUpdated?: (data: { orderId: string, status: string }) => void
}) => {
  if (callbacks.onNftUpdated) socket.on('nft.updated', callbacks.onNftUpdated);
  if (callbacks.onOrderUpdated) socket.on('order.updated', callbacks.onOrderUpdated);
  
  return () => {
    if (callbacks.onNftUpdated) socket.off('nft.updated', callbacks.onNftUpdated);
    if (callbacks.onOrderUpdated) socket.off('order.updated', callbacks.onOrderUpdated);
  };
};
