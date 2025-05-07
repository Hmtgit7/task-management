import { io, Socket } from 'socket.io-client';

// Socket.IO instance
let socket: Socket | null = null;

// Function to initialize the socket connection
export const initializeSocket = (token: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  // Create new socket instance
  socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  // Event listeners
  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('disconnect', (reason) => {
    console.log(`Socket disconnected: ${reason}`);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`Socket reconnected after ${attemptNumber} attempts`);
  });

  socket.on('heartbeat', (data) => {
    // Received heartbeat from server
    // Can be used to update online status or refresh connection
  });

  return socket;
};

// Function to get the socket instance
export const getSocket = (): Socket | null => {
  return socket;
};

// Function to join a task room (for real-time updates)
export const joinTaskRoom = (taskId: string): void => {
  if (socket && socket.connected) {
    socket.emit('task:join', taskId);
  }
};

// Function to leave a task room
export const leaveTaskRoom = (taskId: string): void => {
  if (socket && socket.connected) {
    socket.emit('task:leave', taskId);
  }
};

// Function to emit task update event
export const emitTaskUpdate = (taskId: string): void => {
  if (socket && socket.connected) {
    socket.emit('task:update', taskId);
  }
};

// Function to disconnect socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default {
  initializeSocket,
  getSocket,
  joinTaskRoom,
  leaveTaskRoom,
  emitTaskUpdate,
  disconnectSocket,
};