const express = require("express");
const router = express.Router();
const {
  getTaskCompletionAnalytics,
  getUserAnalytics,
  getDashboardStats,
} = require("../controllers/analyticsController");
const { protect, authorize } = require("../middleware/auth");

router.use(protect); // All analytics routes require authentication

// Dashboard stats (for all users)
router.get("/dashboard", getDashboardStats);

// User analytics (for all users - their own stats)
router.get("/user", getUserAnalytics);

// Task completion analytics (admin and manager only)
router.get(
  "/task-completion",
  authorize("admin", "manager"),
  getTaskCompletionAnalytics
);

module.exports = router;
