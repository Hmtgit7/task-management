const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const { createServer } = require("http");
const socketIo = require("socket.io");
const connectDB = require("./config/database");
const { setupSocketIO } = require("./services/socketService");
const errorHandler = require("./utils/errorHandler");
const authRoutes = require("./routes/authRoutes");
const taskRoutes = require("./routes/taskRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const logger = require("./utils/logger");
const path = require("path");
require("dotenv").config();

// Initialize Express
const app = express();
const httpServer = createServer(app);
const io = socketIo(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Connect to MongoDB
connectDB();

// Set up Socket.IO
setupSocketIO(io);

// Middleware
app.use(helmet()); // Security headers
app.use(compression()); // Compress responses
app.use(morgan("dev")); // Logging
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files for PWA
app.use(express.static(path.join(__dirname, "public")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/analytics", analyticsRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "Server is running" });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err);
  // Close server & exit process
  httpServer.close(() => process.exit(1));
});

module.exports = { app, httpServer }; // Export for testing
