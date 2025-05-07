const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("../middleware/async");
const ErrorResponse = require("../utils/errorResponse");
const socketService = require("../services/socketService");
const recurringTaskService = require("../services/recurringTaskService");
const mongoose = require("mongoose");

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
exports.createTask = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  // Check if assigned user exists
  if (req.body.assignedTo) {
    const assignedUser = await User.findById(req.body.assignedTo);

    if (!assignedUser) {
      return next(
        new ErrorResponse(`User with ID ${req.body.assignedTo} not found`, 404)
      );
    }
  }

  // Create the task
  const task = await Task.create(req.body);

  // Handle recurring task setup if needed
  if (task.isRecurring && task.recurringPattern !== "none") {
    recurringTaskService.scheduleRecurringTask(task);
  }

  // Create notification for assigned user if it's not the creator
  if (task.assignedTo.toString() !== req.user.id) {
    const notification = await Notification.create({
      recipient: task.assignedTo,
      sender: req.user.id,
      title: "New Task Assigned",
      message: `You have been assigned a new task: ${task.title}`,
      type: "task_assigned",
      relatedTask: task._id,
    });

    // Send real-time notification
    socketService.emitToUser(
      task.assignedTo.toString(),
      "notification",
      notification
    );
  }

  // Log the action
  await AuditLog.create({
    user: req.user.id,
    action: "task_created",
    entity: "task",
    entityId: task._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    details: { taskId: task._id, title: task.title },
  });

  res.status(201).json({
    success: true,
    data: task,
  });
});

// @desc    Get all tasks with filtering, sorting, pagination
// @route   GET /api/tasks
// @access  Private
exports.getTasks = asyncHandler(async (req, res, next) => {
  // Copy req.query
  const reqQuery = { ...req.query };

  // Fields to exclude from matching
  const removeFields = ["select", "sort", "page", "limit", "search"];
  removeFields.forEach((param) => delete reqQuery[param]);

  // Handle search
  if (req.query.search) {
    reqQuery.$text = { $search: req.query.search };
  }

  // Handle role-based access
  if (req.user.role === "user") {
    // Regular users can only see tasks assigned to them or created by them
    reqQuery.$or = [{ assignedTo: req.user.id }, { createdBy: req.user.id }];
  } else if (req.user.role === "manager") {
    // Managers can see all tasks but filter if requested
    if (!reqQuery.assignedTo && !reqQuery.createdBy) {
      // No filter applied, so don't modify the query
    }
  }
  // Admins can see all tasks without restriction

  // Create query string
  let queryStr = JSON.stringify(reqQuery);

  // Create operators ($gt, $gte, etc)
  queryStr = queryStr.replace(
    /\b(gt|gte|lt|lte|in)\b/g,
    (match) => `$${match}`
  );

  // Finding resource
  let query = Task.find(JSON.parse(queryStr))
    .populate({
      path: "assignedTo",
      select: "name email",
    })
    .populate({
      path: "createdBy",
      select: "name email",
    });

  // Select fields
  if (req.query.select) {
    const fields = req.query.select.split(",").join(" ");
    query = query.select(fields);
  }

  // Sort
  if (req.query.sort) {
    const sortBy = req.query.sort.split(",").join(" ");
    query = query.sort(sortBy);
  } else {
    query = query.sort("-createdAt");
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const total = await Task.countDocuments(JSON.parse(queryStr));

  query = query.skip(startIndex).limit(limit);

  // Execute query
  const tasks = await query;

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
    count: tasks.length,
    pagination,
    total,
    data: tasks,
  });
});

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id)
    .populate({
      path: "assignedTo",
      select: "name email",
    })
    .populate({
      path: "createdBy",
      select: "name email",
    });

  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user has access to the task
  if (
    req.user.role === "user" &&
    task.assignedTo._id.toString() !== req.user.id &&
    task.createdBy._id.toString() !== req.user.id
  ) {
    return next(new ErrorResponse(`Not authorized to access this task`, 403));
  }

  res.status(200).json({
    success: true,
    data: task,
  });
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = asyncHandler(async (req, res, next) => {
  let task = await Task.findById(req.params.id);

  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is authorized to update
  if (
    req.user.role === "user" &&
    task.createdBy.toString() !== req.user.id &&
    task.assignedTo.toString() !== req.user.id
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this task`,
        403
      )
    );
  }

  // Check if status is being updated to completed
  const statusChanged = req.body.status && req.body.status !== task.status;
  const completedNow =
    req.body.status === "completed" && task.status !== "completed";

  if (completedNow) {
    req.body.completedAt = Date.now();
  }

  // Save previous assigned user to check if it's changing
  const previousAssignedTo = task.assignedTo.toString();
  const assigneeChanged =
    req.body.assignedTo && req.body.assignedTo !== previousAssignedTo;

  // Update task
  task = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  // Handle recurring task updates if needed
  if (
    task.isRecurring &&
    (req.body.recurringPattern !== task.recurringPattern ||
      req.body.recurringEndDate !== task.recurringEndDate)
  ) {
    recurringTaskService.updateRecurringTask(task);
  }

  // Create notification for status change
  if (statusChanged) {
    const notifyUserId =
      task.createdBy.toString() !== req.user.id
        ? task.createdBy
        : task.assignedTo;

    const notification = await Notification.create({
      recipient: notifyUserId,
      sender: req.user.id,
      title: `Task Status Updated`,
      message: `Task "${task.title}" has been marked as ${req.body.status}`,
      type: "task_updated",
      relatedTask: task._id,
    });

    // Send real-time notification
    socketService.emitToUser(
      notifyUserId.toString(),
      "notification",
      notification
    );
  }

  // Create notification for assignee change
  if (assigneeChanged) {
    // Notify new assignee
    const notification = await Notification.create({
      recipient: req.body.assignedTo,
      sender: req.user.id,
      title: "Task Assigned to You",
      message: `You have been assigned to task "${task.title}"`,
      type: "task_assigned",
      relatedTask: task._id,
    });

    // Send real-time notification
    socketService.emitToUser(
      req.body.assignedTo.toString(),
      "notification",
      notification
    );
  }

  // Log the action
  await AuditLog.create({
    user: req.user.id,
    action: "task_updated",
    entity: "task",
    entityId: task._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    details: {
      taskId: task._id,
      title: task.title,
      statusChanged,
      assigneeChanged,
      completedNow,
    },
  });

  res.status(200).json({
    success: true,
    data: task,
  });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = asyncHandler(async (req, res, next) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return next(
      new ErrorResponse(`Task not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is task creator or admin
  if (task.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this task`,
        403
      )
    );
  }

  // If task is recurring, remove the scheduled job
  if (task.isRecurring) {
    recurringTaskService.updateRecurringTask({
      ...task.toObject(),
      isRecurring: false,
    });
  }

  // Delete the task
  await task.remove();

  // Notify the assigned user if different from creator
  if (task.assignedTo.toString() !== req.user.id) {
    const notification = await Notification.create({
      recipient: task.assignedTo,
      sender: req.user.id,
      title: "Task Deleted",
      message: `The task "${task.title}" has been deleted`,
      type: "task_updated",
      relatedTask: task._id,
    });

    // Send real-time notification
    socketService.emitToUser(
      task.assignedTo.toString(),
      "notification",
      notification
    );
  }

  // Log the action
  await AuditLog.create({
    user: req.user.id,
    action: "task_deleted",
    entity: "task",
    entityId: task._id,
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    details: { taskId: task._id, title: task.title },
  });

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Get tasks assigned to current user
// @route   GET /api/tasks/assigned
// @access  Private
exports.getAssignedTasks = asyncHandler(async (req, res, next) => {
  // Add filter to request query
  req.query.assignedTo = req.user.id;

  // Call getTasks with modified request
  return exports.getTasks(req, res, next);
});

// @desc    Get tasks created by current user
// @route   GET /api/tasks/created
// @access  Private
exports.getCreatedTasks = asyncHandler(async (req, res, next) => {
  // Add filter to request query
  req.query.createdBy = req.user.id;

  // Call getTasks with modified request
  return exports.getTasks(req, res, next);
});

// @desc    Get overdue tasks for current user
// @route   GET /api/tasks/overdue
// @access  Private
exports.getOverdueTasks = asyncHandler(async (req, res, next) => {
  // Add filters to request query
  req.query.assignedTo = req.user.id;
  req.query.dueDate = { lt: new Date() };
  req.query.status = { ne: "completed" };

  // Call getTasks with modified request
  return exports.getTasks(req, res, next);
});

// @desc    Get tasks due today for current user
// @route   GET /api/tasks/due-today
// @access  Private
exports.getTasksDueToday = asyncHandler(async (req, res, next) => {
  // Create date range for today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);

  // Add filters to request query
  req.query.assignedTo = req.user.id;
  req.query.dueDate = {
    gte: startOfDay.toISOString(),
    lte: endOfDay.toISOString(),
  };
  req.query.status = { ne: "completed" };

  // Call getTasks with modified request
  return exports.getTasks(req, res, next);
});
