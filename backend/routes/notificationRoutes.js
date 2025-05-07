const express = require("express");
const router = express.Router();
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getPreferences,
  updatePreferences,
} = require("../controllers/notificationController");
const { protect } = require("../middleware/auth");
const { validateNotificationPreferences } = require("../middleware/validator");

router.use(protect); // All notification routes require authentication

router.route("/").get(getNotifications);

router.route("/:id/read").put(markAsRead);

router.route("/read-all").put(markAllAsRead);

router.route("/:id").delete(deleteNotification);

router
  .route("/preferences")
  .get(getPreferences)
  .put(validateNotificationPreferences, updatePreferences);

module.exports = router;
