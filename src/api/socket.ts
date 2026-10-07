import { io, Socket } from 'socket.io-client';

// Disabilita a conexão real para evitar erros no console, 
// pois usaremos o próprio objeto do socket para emitir os eventos simulados
export const socket: Socket = io('/', {
  autoConnect: false,
  reconnection: false,
});

let simulationIntervals: ReturnType<typeof setInterval>[] = [];

socket.on('connect', () => {
  console.log('[Socket] Conectado. Iniciando simulação de eventos...');
  
  // Simula uma atualização de inventário de um NFT aleatório a cada 30 segundos
  simulationIntervals.push(
    setInterval(() => {
      const mockIds = ['1', '2', '3'];
      const randomId = mockIds[Math.floor(Math.random() * mockIds.length)];
      
      const evtData = {
        nftId: randomId,
        price: (Math.random() * 5 + 0.5).toFixed(2),
        available: Math.floor(Math.random() * 10)
      };
      console.log('[Socket Simulate] nft.updated', evtData);
      
      // Simulamos o recebimento injetando via callbacks internos (hack do socket.io-client)
      const listeners = (socket as any)._callbacks['$nft.updated'] || [];
      listeners.forEach((fn: Function) => fn(evtData));
    }, 30000)
  );

  // Simula a atualização de um pedido a cada 20 segundos
  simulationIntervals.push(
    setInterval(() => {
      const evtData = {
        orderId: 'mock-order-id', // Na prática, as rotas vão ouvir apenas as ordens delas
        status: ['confirmed', 'processing', 'completed', 'failed'][Math.floor(Math.random() * 4)]
      };
      console.log('[Socket Simulate] order.updated', evtData);
      
      const listeners = (socket as any)._callbacks['$order.updated'] || [];
      listeners.forEach((fn: Function) => fn(evtData));
    }, 20000)
  );
});

socket.on('disconnect', () => {
  console.log('[Socket] Desconectado. Parando simulações.');
  simulationIntervals.forEach(clearInterval);
  simulationIntervals = [];
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
