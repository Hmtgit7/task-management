const Notification = require("../models/Notification");
const NotificationPreference = require("../models/NotificationPreference");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = asyncHandler(async (req, res, next) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Query with pagination
  const total = await Notification.countDocuments({ recipient: req.user.id });

  const notifications = await Notification.find({ recipient: req.user.id })
    .populate({
      path: "sender",
      select: "name email",
    })
    .populate({
      path: "relatedTask",
      select: "title status priority",
    })
    .sort("-createdAt")
    .skip(startIndex)
    .limit(limit);

  // Pagination result
  const pagination = {};

  if (endIndex < total) {
    pagination.next = {
      page: page + 1,
      limit,
    };
  }

  if (startIndex > 0) {
    pagination.prev = {
      page: page - 1,
      limit,
    };
  }

  res.status(200).json({
    success: true,
    count: notifications.length,
    pagination,
    total,
    data: notifications,
  });
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  let notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(
        `Notification not found with id of ${req.params.id}`,
        404
      )
    );
  }

  // Check if user owns this notification
  if (notification.recipient.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User not authorized to update this notification`, 403)
    );
  }

  notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { read: true },
    { new: true }
  );

  res.status(200).json({
    success: true,
    data: notification,
  });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res, next) => {
  await Notification.updateMany(
    { recipient: req.user.id, read: false },
    { read: true }
  );

  res.status(200).json({
    success: true,
    message: "All notifications marked as read",
  });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return next(
      new ErrorResponse(
        `Notification not found with id of ${req.params.id}`,
        404
      )
    );
  }

  // Check if user owns this notification
  if (notification.recipient.toString() !== req.user.id) {
    return next(
      new ErrorResponse(`User not authorized to delete this notification`, 403)
    );
  }

  await notification.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
exports.getPreferences = asyncHandler(async (req, res, next) => {
  let preferences = await NotificationPreference.findOne({ user: req.user.id });

  // If preferences don't exist, create default
  if (!preferences) {
    preferences = await NotificationPreference.create({
      user: req.user.id,
    });
  }

  res.status(200).json({
    success: true,
    data: preferences,
  });
});

// @desc    Update notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
exports.updatePreferences = asyncHandler(async (req, res, next) => {
  let preferences = await NotificationPreference.findOne({ user: req.user.id });

  // If preferences don't exist, create new
  if (!preferences) {
    preferences = await NotificationPreference.create({
      user: req.user.id,
      ...req.body,
    });
  } else {
    // Update existing preferences
    preferences = await NotificationPreference.findOneAndUpdate(
      { user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
  }

  res.status(200).json({
    success: true,
    data: preferences,
  });
});
