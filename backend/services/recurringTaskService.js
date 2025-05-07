const schedule = require("node-schedule");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const logger = require("../utils/logger");
const socketService = require("./socketService");

// Store scheduled jobs by task ID
const scheduledJobs = new Map();

// Initialize recurring tasks scheduler
exports.initializeScheduler = async () => {
  try {
    // Find all recurring tasks
    const recurringTasks = await Task.find({
      isRecurring: true,
      recurringPattern: { $ne: "none" },
    });

    logger.info(`Initializing ${recurringTasks.length} recurring tasks`);

    // Schedule each task
    recurringTasks.forEach((task) => {
      exports.scheduleRecurringTask(task);
    });
  } catch (error) {
    logger.error(`Error initializing recurring tasks: ${error.message}`);
  }
};

// Schedule a recurring task
exports.scheduleRecurringTask = (task) => {
  if (!task.isRecurring || task.recurringPattern === "none") {
    return;
  }

  // Cancel existing job if it exists
  if (scheduledJobs.has(task._id.toString())) {
    scheduledJobs.get(task._id.toString()).cancel();
  }

  let scheduleRule;

  // Define schedule based on recurring pattern
  switch (task.recurringPattern) {
    case "daily":
      scheduleRule = new schedule.RecurrenceRule();
      scheduleRule.hour = 0;
      scheduleRule.minute = 0;
      break;

    case "weekly":
      scheduleRule = new schedule.RecurrenceRule();
      scheduleRule.dayOfWeek = 0; // Sunday
      scheduleRule.hour = 0;
      scheduleRule.minute = 0;
      break;

    case "monthly":
      scheduleRule = new schedule.RecurrenceRule();
      scheduleRule.date = 1; // First day of month
      scheduleRule.hour = 0;
      scheduleRule.minute = 0;
      break;

    default:
      return;
  }

  // Check if there's an end date and it's in the future
  const recurringEndDate = task.recurringEndDate
    ? new Date(task.recurringEndDate)
    : null;
  if (recurringEndDate && recurringEndDate < new Date()) {
    logger.info(
      `Task ${task._id} recurring end date has passed, not scheduling`
    );
    return;
  }

  // Schedule the job
  const job = schedule.scheduleJob(scheduleRule, async () => {
    try {
      // Check if task still exists and should recur
      const currentTask = await Task.findById(task._id);

      if (
        !currentTask ||
        !currentTask.isRecurring ||
        currentTask.recurringPattern === "none"
      ) {
        job.cancel();
        scheduledJobs.delete(task._id.toString());
        return;
      }

      // Check if we've passed the end date
      if (
        currentTask.recurringEndDate &&
        new Date(currentTask.recurringEndDate) < new Date()
      ) {
        job.cancel();
        scheduledJobs.delete(task._id.toString());
        return;
      }

      // Create a new task instance
      const newTaskData = {
        title: currentTask.title,
        description: currentTask.description,
        priority: currentTask.priority,
        status: "todo",
        dueDate: calculateNextDueDate(
          currentTask.dueDate,
          currentTask.recurringPattern
        ),
        createdBy: currentTask.createdBy,
        assignedTo: currentTask.assignedTo,
        isRecurring: false, // Individual instances aren't recurring
        tags: currentTask.tags,
      };

      // Create the new task
      const newTask = await Task.create(newTaskData);

      logger.info(
        `Created recurring task instance: ${newTask._id} from template ${task._id}`
      );

      // Create notification for assigned user
      if (newTask.assignedTo.toString() !== newTask.createdBy.toString()) {
        const notification = await Notification.create({
          recipient: newTask.assignedTo,
          sender: newTask.createdBy,
          title: "New Recurring Task",
          message: `A new recurring task has been created: ${newTask.title}`,
          type: "task_assigned",
          relatedTask: newTask._id,
        });

        // Send real-time notification
        socketService.emitToUser(
          newTask.assignedTo.toString(),
          "notification",
          notification
        );
      }
    } catch (error) {
      logger.error(`Error creating recurring task instance: ${error.message}`);
    }
  });

  // Store the job
  scheduledJobs.set(task._id.toString(), job);

  logger.info(
    `Scheduled recurring task: ${task._id}, pattern: ${task.recurringPattern}`
  );
};

// Update a recurring task schedule
exports.updateRecurringTask = (task) => {
  // Cancel existing job if it exists
  if (scheduledJobs.has(task._id.toString())) {
    scheduledJobs.get(task._id.toString()).cancel();
    scheduledJobs.delete(task._id.toString());
  }

  // Schedule new job if task is still recurring
  if (task.isRecurring && task.recurringPattern !== "none") {
    exports.scheduleRecurringTask(task);
  }
};

// Calculate the next due date based on the recurring pattern
function calculateNextDueDate(currentDueDate, pattern) {
  const nextDate = new Date(currentDueDate);

  switch (pattern) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;

    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;

    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }

  return nextDate;
}
