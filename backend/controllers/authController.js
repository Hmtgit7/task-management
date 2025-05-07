const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const NotificationPreference = require("../models/NotificationPreference");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const logger = require("../utils/logger");

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
  });

  // Create notification preferences
  await NotificationPreference.create({
    user: user._id,
  });

  // Log the action
  await AuditLog.create({
    user: user._id,
    action: "user_created",
    entity: "user",
    entityId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  // Send token response
  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse("Please provide an email and password", 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    // Log failed login attempt
    logger.warn(`Failed login attempt for email: ${email}`);

    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    // Log failed login attempt
    await AuditLog.create({
      user: user._id,
      action: "user_failed_login",
      entity: "user",
      entityId: user._id,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      details: { reason: "Invalid password" },
    });

    return next(new ErrorResponse("Invalid credentials", 401));
  }

  // Log successful login
  await AuditLog.create({
    user: user._id,
    action: "user_login",
    entity: "user",
    entityId: user._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
  });

  // Send token response
  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc    Log user out / clear cookie
// @route   GET /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  res.status(200).json({
    success: true,
    data: {},
  });
});

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = user.getSignedJwtToken();

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};
