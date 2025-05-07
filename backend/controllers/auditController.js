const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get audit logs
// @route   GET /api/audit-logs
// @access  Private (Admin only)
exports.getAuditLogs = asyncHandler(async (req, res, next) => {
  // Make sure user is admin
  if (req.user.role !== "admin") {
    return next(new ErrorResponse("Not authorized to access audit logs", 403));
  }

  // Get query parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Build query
  let query = {};

  // Filter by date range
  if (req.query.startDate && req.query.endDate) {
    query.timestamp = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  } else if (req.query.startDate) {
    query.timestamp = { $gte: new Date(req.query.startDate) };
  } else if (req.query.endDate) {
    query.timestamp = { $lte: new Date(req.query.endDate) };
  }

  // Filter by user
  if (req.query.userId) {
    query.user = req.query.userId;
  }

  // Filter by action
  if (req.query.action) {
    query.action = req.query.action;
  }

  // Filter by entity
  if (req.query.entity) {
    query.entity = req.query.entity;
  }

  // Filter by entity ID
  if (req.query.entityId) {
    query.entityId = req.query.entityId;
  }

  // Count total documents
  const total = await AuditLog.countDocuments(query);

  // Get audit logs with pagination
  const auditLogs = await AuditLog.find(query)
    .populate({
      path: "user",
      select: "name email role",
    })
    .sort({ timestamp: -1 })
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

  // Get action types for filtering
  const actionTypes = await AuditLog.distinct("action");

  // Get entity types for filtering
  const entityTypes = await AuditLog.distinct("entity");

  res.status(200).json({
    success: true,
    count: auditLogs.length,
    pagination,
    total,
    actionTypes,
    entityTypes,
    data: auditLogs,
  });
});

// @desc    Get user activity
// @route   GET /api/audit-logs/user/:userId
// @access  Private (Admin or own user)
exports.getUserActivity = asyncHandler(async (req, res, next) => {
  // Check if user is admin or requesting their own logs
  if (req.user.role !== "admin" && req.params.userId !== req.user.id) {
    return next(
      new ErrorResponse("Not authorized to access this user's activities", 403)
    );
  }

  // Get query parameters
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // Build query
  const query = { user: req.params.userId };

  // Filter by date range
  if (req.query.startDate && req.query.endDate) {
    query.timestamp = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  // Filter by action
  if (req.query.action) {
    query.action = req.query.action;
  }

  // Count total documents
  const total = await AuditLog.countDocuments(query);

  // Get audit logs with pagination
  const auditLogs = await AuditLog.find(query)
    .sort({ timestamp: -1 })
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
    count: auditLogs.length,
    pagination,
    total,
    data: auditLogs,
  });
});

// @desc    Get entity history (e.g., task history)
// @route   GET /api/audit-logs/entity/:entityType/:entityId
// @access  Private (Admin, Manager, or Owner)
exports.getEntityHistory = asyncHandler(async (req, res, next) => {
  // Get entity history
  const auditLogs = await AuditLog.find({
    entity: req.params.entityType,
    entityId: req.params.entityId,
  })
    .populate({
      path: "user",
      select: "name email role",
    })
    .sort({ timestamp: -1 });

  // If no logs are found
  if (auditLogs.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: [],
    });
  }

  res.status(200).json({
    success: true,
    count: auditLogs.length,
    data: auditLogs,
  });
});
