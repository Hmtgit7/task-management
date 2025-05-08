"use client";

import { io, Socket } from "socket.io-client";

// Socket.IO instance
let socket: Socket | null = null;

// Function to initialize the socket connection
export const initializeSocket = (token: string): Socket | null => {
  if (!token || token === "guest-token") {
    console.log("No valid token provided for socket connection");
    return null;
  }

  if (socket && socket.connected) {
    return socket;
  }

  // Create new socket instance with error handling
  try {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000, // Increase timeout for slower connections
    });

    // Event listeners
    socket.on("connect", () => {
      console.log("Socket connected successfully");
    });

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${reason}`);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    socket.on("reconnect", (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    socket.on("heartbeat", (data) => {
      // Received heartbeat from server
      console.log("Heartbeat received:", data);
    });

    return socket;
  } catch (error) {
    console.error("Error initializing socket:", error);
    return null;
  }
};

// Function to get the socket instance
export const getSocket = (): Socket | null => {
  return socket;
};

// Function to join a task room (for real-time updates)
export const joinTaskRoom = (taskId: string): void => {
  if (socket && socket.connected) {
    socket.emit("task:join", taskId);
    console.log(`Joined task room: ${taskId}`);
  } else {
    console.warn(`Failed to join task room ${taskId}: Socket not connected`);
  }
};

// Function to leave a task room
export const leaveTaskRoom = (taskId: string): void => {
  if (socket && socket.connected) {
    socket.emit("task:leave", taskId);
    console.log(`Left task room: ${taskId}`);
  }
};

// Function to emit task update event
export const emitTaskUpdate = (taskId: string): void => {
  if (socket && socket.connected) {
    socket.emit("task:update", taskId);
    console.log(`Emitted task update for: ${taskId}`);
  } else {
    console.warn(
      `Failed to emit task update for ${taskId}: Socket not connected`
    );
  }
};

// Function to disconnect socket
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log("Socket disconnected manually");
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
