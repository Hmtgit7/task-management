const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const asyncHandler = require("../middleware/async");
const mongoose = require("mongoose");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get task completion analytics
// @route   GET /api/analytics/task-completion
// @access  Private (Admin, Manager)
exports.getTaskCompletionAnalytics = asyncHandler(async (req, res, next) => {
  // Check for admin or manager role
  if (req.user.role !== "admin" && req.user.role !== "manager") {
    return next(new ErrorResponse("Not authorized to access analytics", 403));
  }

  // Get query parameters
  const timeRange = req.query.timeRange || "week"; // day, week, month, year
  const groupBy = req.query.groupBy || "day"; // day, week, month

  // Set date range based on timeRange
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case "day":
      startDate = new Date(now.setDate(now.getDate() - 1));
      break;
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setDate(now.getDate() - 7));
  }

  // Determine group by date format
  let groupByFormat;

  switch (groupBy) {
    case "day":
      groupByFormat = {
        year: { $year: "$completedAt" },
        month: { $month: "$completedAt" },
        day: { $dayOfMonth: "$completedAt" },
      };
      break;
    case "week":
      groupByFormat = {
        year: { $year: "$completedAt" },
        week: { $week: "$completedAt" },
      };
      break;
    case "month":
      groupByFormat = {
        year: { $year: "$completedAt" },
        month: { $month: "$completedAt" },
      };
      break;
    default:
      groupByFormat = {
        year: { $year: "$completedAt" },
        month: { $month: "$completedAt" },
        day: { $dayOfMonth: "$completedAt" },
      };
  }

  // Aggregate tasks
  const completedTasks = await Task.aggregate([
    {
      $match: {
        completedAt: { $exists: true, $ne: null, $gte: startDate },
      },
    },
    {
      $group: {
        _id: groupByFormat,
        count: { $sum: 1 },
      },
    },
    {
      $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1, "_id.week": 1 },
    },
  ]);

  const overdueTasks = await Task.countDocuments({
    dueDate: { $lt: new Date() },
    status: { $ne: "completed" },
  });

  // Count total tasks and completion rate
  const totalTasks = await Task.countDocuments();
  const completedTasksCount = await Task.countDocuments({
    completedAt: { $exists: true, $ne: null },
  });

  const completionRate =
    totalTasks > 0 ? (completedTasksCount / totalTasks) * 100 : 0;

  // Get user performance (for managers/admins)
  const userPerformance = await Task.aggregate([
    {
      $match: {
        completedAt: { $exists: true, $ne: null, $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$assignedTo",
        completedTasks: { $sum: 1 },
        onTimeCount: {
          $sum: {
            $cond: [{ $lte: ["$completedAt", "$dueDate"] }, 1, 0],
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        _id: 1,
        userName: "$user.name",
        completedTasks: 1,
        onTimeCount: 1,
        onTimePercentage: {
          $multiply: [{ $divide: ["$onTimeCount", "$completedTasks"] }, 100],
        },
      },
    },
    {
      $sort: { completedTasks: -1 },
    },
  ]);

  // Status distribution
  const statusDistribution = await Task.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Priority distribution
  const priorityDistribution = await Task.aggregate([
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      completedTasks,
      overdueTasks,
      totalTasks,
      completedTasksCount,
      completionRate,
      userPerformance,
      statusDistribution,
      priorityDistribution,
    },
  });
});

// @desc    Get user analytics
// @route   GET /api/analytics/user
// @access  Private
exports.getUserAnalytics = asyncHandler(async (req, res, next) => {
  // For regular users, show only their own stats
  const userId = req.user.id;

  // Get query parameters
  const timeRange = req.query.timeRange || "month"; // day, week, month, year

  // Set date range based on timeRange
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case "day":
      startDate = new Date(now.setDate(now.getDate() - 1));
      break;
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  // Tasks assigned to the user
  const assignedTasks = await Task.countDocuments({ assignedTo: userId });

  // Tasks created by the user
  const createdTasks = await Task.countDocuments({ createdBy: userId });

  // Completed tasks by the user
  const completedTasks = await Task.countDocuments({
    assignedTo: userId,
    status: "completed",
  });

  // Overdue tasks assigned to the user
  const overdueTasks = await Task.countDocuments({
    assignedTo: userId,
    dueDate: { $lt: new Date() },
    status: { $ne: "completed" },
  });

  // Tasks completed on time
  const tasksCompletedOnTime = await Task.countDocuments({
    assignedTo: userId,
    status: "completed",
    completedAt: { $exists: true },
    $expr: { $lte: ["$completedAt", "$dueDate"] },
  });

  // Completion rate
  const completionRate =
    assignedTasks > 0 ? (completedTasks / assignedTasks) * 100 : 0;

  // On-time completion rate
  const onTimeCompletionRate =
    completedTasks > 0 ? (tasksCompletedOnTime / completedTasks) * 100 : 0;

  // Tasks by priority
  const tasksByPriority = await Task.aggregate([
    {
      $match: { assignedTo: mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: "$priority",
        count: { $sum: 1 },
      },
    },
  ]);

  // Tasks by status
  const tasksByStatus = await Task.aggregate([
    {
      $match: { assignedTo: mongoose.Types.ObjectId(userId) },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Recent activity - tasks completed in time range
  const recentCompletedTasks = await Task.aggregate([
    {
      $match: {
        assignedTo: mongoose.Types.ObjectId(userId),
        completedAt: { $exists: true, $ne: null, $gte: startDate },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        completedAt: 1,
        dueDate: 1,
        priority: 1,
        onTime: { $lte: ["$completedAt", "$dueDate"] },
      },
    },
    {
      $sort: { completedAt: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  res.status(200).json({
    success: true,
    data: {
      assignedTasks,
      createdTasks,
      completedTasks,
      overdueTasks,
      tasksCompletedOnTime,
      completionRate,
      onTimeCompletionRate,
      tasksByPriority,
      tasksByStatus,
      recentCompletedTasks,
    },
  });
});

// @desc    Get dashboard statistics (for all users)
// @route   GET /api/analytics/dashboard
// @access  Private
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  try {
    // Task counts for the user
    const assignedTasksCount = await Task.countDocuments({
      assignedTo: userId,
    });
    const createdTasksCount = await Task.countDocuments({ createdBy: userId });
    const overdueTasksCount = await Task.countDocuments({
      assignedTo: userId,
      dueDate: { $lt: new Date() },
      status: { $ne: "completed" },
    });

    // Tasks due today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const tasksDueToday = await Task.countDocuments({
      assignedTo: userId,
      dueDate: { $gte: today, $lt: tomorrow },
      status: { $ne: "completed" },
    });

    // Recent assigned tasks
    const recentAssignedTasks = await Task.find({ assignedTo: userId })
      .sort("-createdAt")
      .limit(5)
      .populate({
        path: "createdBy",
        select: "name",
      });

    // Tasks by priority
    const tasksByPriority = await Task.aggregate([
      {
        $match: { assignedTo: mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);

    // Tasks by status
    const tasksByStatus = await Task.aggregate([
      {
        $match: { assignedTo: mongoose.Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Unread notifications count
    let unreadNotifications = 0;
    try {
      unreadNotifications = await Notification.countDocuments({
        recipient: userId,
        read: false,
      });
    } catch (error) {
      console.error("Error counting notifications:", error);
    }

    res.status(200).json({
      success: true,
      data: {
        assignedTasksCount,
        createdTasksCount,
        overdueTasksCount,
        tasksDueToday,
        recentAssignedTasks,
        tasksByPriority,
        tasksByStatus,
        unreadNotifications,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return next(
      new ErrorResponse("Error retrieving dashboard statistics", 500)
    );
  }
});
