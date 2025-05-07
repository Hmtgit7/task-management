const jwt = require("jsonwebtoken");
const User = require("../models/User");
const config = require("../config/config");
const logger = require("../utils/logger");

// Map to store active connections
const activeConnections = new Map();

// Initialize Socket.IO
exports.setupSocketIO = (io) => {
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;

      if (!token) {
        return next(new Error("Authentication error: Token not provided"));
      }

      // Verify token
      const decoded = jwt.verify(token, config.jwtSecret);

      // Find user
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error("Authentication error: User not found"));
      }

      // Attach user to socket
      socket.user = {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
      };

      next();
    } catch (error) {
      logger.error(`Socket authentication error: ${error.message}`);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;

    logger.info(`User connected: ${userId}`);

    // Store connection
    if (!activeConnections.has(userId)) {
      activeConnections.set(userId, new Set());
    }
    activeConnections.get(userId).add(socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on("disconnect", () => {
      logger.info(`User disconnected: ${userId}`);

      // Remove from active connections
      if (activeConnections.has(userId)) {
        activeConnections.get(userId).delete(socket.id);

        // If no more connections for this user, remove the entry
        if (activeConnections.get(userId).size === 0) {
          activeConnections.delete(userId);
        }
      }
    });

    // Handle task updates
    socket.on("task:update", (taskId) => {
      // Broadcast to all interested parties
      socket.broadcast.to(`task:${taskId}`).emit("task:updated", { taskId });
    });

    // Join task room when viewing task
    socket.on("task:join", (taskId) => {
      socket.join(`task:${taskId}`);
    });

    // Leave task room
    socket.on("task:leave", (taskId) => {
      socket.leave(`task:${taskId}`);
    });
  });

  // Send heartbeat every 30 seconds to keep connections alive
  setInterval(() => {
    io.emit("heartbeat", { timestamp: new Date().toISOString() });
  }, 30000);
};

// Emit event to specific user
exports.emitToUser = (userId, event, data) => {
  if (global.io) {
    global.io.to(`user:${userId}`).emit(event, data);
  }
};

// Check if a user is online
exports.isUserOnline = (userId) => {
  return activeConnections.has(userId);
};

// Get count of online users
exports.getOnlineUsersCount = () => {
  return activeConnections.size;
};

// Get list of online user IDs
exports.getOnlineUsers = () => {
  return Array.from(activeConnections.keys());
};
