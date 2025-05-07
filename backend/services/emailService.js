const nodemailer = require("nodemailer");
const config = require("../config/config");
const NotificationPreference = require("../models/NotificationPreference");
const logger = require("../utils/logger");

// Create a transporter
let transporter;

// Initialize email service
exports.initializeEmailService = () => {
  try {
    transporter = nodemailer.createTransport({
      host: config.emailService.host,
      port: config.emailService.port,
      secure: config.emailService.port === 465, // true for 465, false for other ports
      auth: {
        user: config.emailService.user,
        pass: config.emailService.pass,
      },
    });

    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        logger.error(`Email service setup failed: ${error.message}`);
      } else {
        logger.info("Email service is ready to send messages");
      }
    });
  } catch (error) {
    logger.error(`Email service initialization error: ${error.message}`);
  }
};

// Send email notification
exports.sendEmailNotification = async (user, subject, text, html) => {
  try {
    // Check if user has opted out of email notifications
    const preferences = await NotificationPreference.findOne({
      user: user._id,
    });

    if (preferences && preferences.muteAll) {
      logger.info(`Email not sent to ${user.email} - notifications muted`);
      return;
    }

    // Check quiet hours if applicable
    if (preferences && isInQuietHours(preferences)) {
      logger.info(`Email not sent to ${user.email} - quiet hours active`);
      return;
    }

    const mailOptions = {
      from: `"Task Manager" <${config.emailService.from}>`,
      to: user.email,
      subject,
      text,
      html: html || text,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${user.email}: ${info.messageId}`);

    return info;
  } catch (error) {
    logger.error(`Error sending email to ${user.email}: ${error.message}`);
    throw error;
  }
};

// Send task assigned notification
exports.sendTaskAssignedEmail = async (user, task, assignedBy) => {
  // Check if user has opted out of this specific notification type
  const preferences = await NotificationPreference.findOne({ user: user._id });

  if (preferences && !preferences.email.taskAssigned) {
    logger.info(`Task assigned email not sent to ${user.email} - opted out`);
    return;
  }

  const subject = `New Task Assigned: ${task.title}`;

  const text = `
    Hello ${user.name},
    
    You have been assigned a new task by ${assignedBy.name}:
    
    Title: ${task.title}
    Priority: ${task.priority}
    Due Date: ${new Date(task.dueDate).toLocaleDateString()}
    
    Description:
    ${task.description}
    
    Click here to view the task: ${config.frontendUrl}/tasks/${task._id}
    
    Thank you,
    Task Manager
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${user.name},</h2>
      
      <p>You have been assigned a new task by <strong>${
        assignedBy.name
      }</strong>:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${task.title}</h3>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p><strong>Due Date:</strong> ${new Date(
          task.dueDate
        ).toLocaleDateString()}</p>
        <p><strong>Description:</strong></p>
        <p>${task.description}</p>
      </div>
      
      <p>
        <a href="${config.frontendUrl}/tasks/${
    task._id
  }" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Task
        </a>
      </p>
      
      <p>Thank you,<br>Task Manager</p>
    </div>
  `;

  return await exports.sendEmailNotification(user, subject, text, html);
};

// Send task updated notification
exports.sendTaskUpdatedEmail = async (user, task, updatedBy, changes) => {
  // Check if user has opted out of this specific notification type
  const preferences = await NotificationPreference.findOne({ user: user._id });

  if (preferences && !preferences.email.taskUpdated) {
    logger.info(`Task updated email not sent to ${user.email} - opted out`);
    return;
  }

  const subject = `Task Updated: ${task.title}`;

  const text = `
    Hello ${user.name},
    
    A task has been updated by ${updatedBy.name}:
    
    Title: ${task.title}
    Priority: ${task.priority}
    Status: ${task.status}
    Due Date: ${new Date(task.dueDate).toLocaleDateString()}
    
    Changes:
    ${formatChanges(changes)}
    
    Click here to view the task: ${config.frontendUrl}/tasks/${task._id}
    
    Thank you,
    Task Manager
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${user.name},</h2>
      
      <p>A task has been updated by <strong>${updatedBy.name}</strong>:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">${task.title}</h3>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p><strong>Status:</strong> ${task.status}</p>
        <p><strong>Due Date:</strong> ${new Date(
          task.dueDate
        ).toLocaleDateString()}</p>
        
        <p><strong>Changes:</strong></p>
        <ul>
          ${formatChangesHtml(changes)}
        </ul>
      </div>
      
      <p>
        <a href="${config.frontendUrl}/tasks/${
    task._id
  }" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Task
        </a>
      </p>
      
      <p>Thank you,<br>Task Manager</p>
    </div>
  `;

  return await exports.sendEmailNotification(user, subject, text, html);
};

// Send overdue task notification
exports.sendTaskOverdueEmail = async (user, task) => {
  // Check if user has opted out of this specific notification type
  const preferences = await NotificationPreference.findOne({ user: user._id });

  if (preferences && !preferences.email.taskOverdue) {
    logger.info(`Task overdue email not sent to ${user.email} - opted out`);
    return;
  }

  const subject = `Task Overdue: ${task.title}`;

  const text = `
    Hello ${user.name},
    
    This is a reminder that you have an overdue task:
    
    Title: ${task.title}
    Priority: ${task.priority}
    Due Date: ${new Date(task.dueDate).toLocaleDateString()}
    Days Overdue: ${Math.floor(
      (new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)
    )}
    
    Please update the status of this task or request an extension if needed.
    
    Click here to view the task: ${config.frontendUrl}/tasks/${task._id}
    
    Thank you,
    Task Manager
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${user.name},</h2>
      
      <p>This is a reminder that you have an <strong style="color: #f44336;">overdue task</strong>:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
        <h3 style="margin-top: 0;">${task.title}</h3>
        <p><strong>Priority:</strong> ${task.priority}</p>
        <p><strong>Due Date:</strong> ${new Date(
          task.dueDate
        ).toLocaleDateString()}</p>
        <p><strong>Days Overdue:</strong> ${Math.floor(
          (new Date() - new Date(task.dueDate)) / (1000 * 60 * 60 * 24)
        )}</p>
      </div>
      
      <p>Please update the status of this task or request an extension if needed.</p>
      
      <p>
        <a href="${config.frontendUrl}/tasks/${
    task._id
  }" style="background-color: #f44336; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Task
        </a>
      </p>
      
      <p>Thank you,<br>Task Manager</p>
    </div>
  `;

  return await exports.sendEmailNotification(user, subject, text, html);
};

// Send daily summary email
exports.sendDailySummaryEmail = async (user, tasks) => {
  // Check if user has opted out of this specific notification type
  const preferences = await NotificationPreference.findOne({ user: user._id });

  if (preferences && !preferences.email.dailySummary) {
    logger.info(`Daily summary email not sent to ${user.email} - opted out`);
    return;
  }

  const today = new Date();
  const subject = `Daily Task Summary - ${today.toLocaleDateString()}`;

  // Group tasks by status
  const todoTasks = tasks.filter((task) => task.status === "todo");
  const inProgressTasks = tasks.filter((task) => task.status === "in-progress");
  const reviewTasks = tasks.filter((task) => task.status === "review");
  const completedTasks = tasks.filter((task) => task.status === "completed");

  // Format tasks for text email
  const formatTasksText = (taskList) => {
    if (taskList.length === 0) {
      return "None";
    }

    return taskList
      .map(
        (task) =>
          `- ${task.title} (Due: ${new Date(
            task.dueDate
          ).toLocaleDateString()}, Priority: ${task.priority})`
      )
      .join("\n");
  };

  // Format tasks for HTML email
  const formatTasksHtml = (taskList) => {
    if (taskList.length === 0) {
      return "<p>None</p>";
    }

    const items = taskList
      .map(
        (task) =>
          `<li>
        <a href="${config.frontendUrl}/tasks/${task._id}">${task.title}</a>
        (Due: ${new Date(task.dueDate).toLocaleDateString()}, Priority: ${
            task.priority
          })
      </li>`
      )
      .join("");

    return `<ul>${items}</ul>`;
  };

  const text = `
    Hello ${user.name},
    
    Here is your daily task summary for ${today.toLocaleDateString()}:
    
    To Do:
    ${formatTasksText(todoTasks)}
    
    In Progress:
    ${formatTasksText(inProgressTasks)}
    
    In Review:
    ${formatTasksText(reviewTasks)}
    
    Completed Today:
    ${formatTasksText(completedTasks)}
    
    Click here to view all your tasks: ${config.frontendUrl}/dashboard
    
    Thank you,
    Task Manager
  `;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Hello ${user.name},</h2>
      
      <p>Here is your daily task summary for <strong>${today.toLocaleDateString()}</strong>:</p>
      
      <div style="margin: 20px 0;">
        <h3 style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #2196F3;">To Do</h3>
        ${formatTasksHtml(todoTasks)}
        
        <h3 style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #FF9800;">In Progress</h3>
        ${formatTasksHtml(inProgressTasks)}
        
        <h3 style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #9C27B0;">In Review</h3>
        ${formatTasksHtml(reviewTasks)}
        
        <h3 style="background-color: #f5f5f5; padding: 10px; border-left: 4px solid #4CAF50;">Completed Today</h3>
        ${formatTasksHtml(completedTasks)}
      </div>
      
      <p>
        <a href="${
          config.frontendUrl
        }/dashboard" style="background-color: #2196F3; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View All Tasks
        </a>
      </p>
      
      <p>Thank you,<br>Task Manager</p>
    </div>
  `;

  return await exports.sendEmailNotification(user, subject, text, html);
};

// Helper functions

// Check if current time is in quiet hours
function isInQuietHours(preferences) {
  if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
    return false;
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Parse quiet hours
  const [startHour, startMinute] = preferences.quietHoursStart
    .split(":")
    .map(Number);
  const [endHour, endMinute] = preferences.quietHoursEnd.split(":").map(Number);

  // Convert to minutes for easier comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;

  // Check if current time is in quiet hours
  if (startTimeInMinutes < endTimeInMinutes) {
    // Simple case: start time is before end time (e.g., 22:00 to 06:00)
    return (
      currentTimeInMinutes >= startTimeInMinutes &&
      currentTimeInMinutes <= endTimeInMinutes
    );
  } else {
    // Complex case: start time is after end time (e.g., 22:00 to 06:00)
    return (
      currentTimeInMinutes >= startTimeInMinutes ||
      currentTimeInMinutes <= endTimeInMinutes
    );
  }
}

// Format changes for text email
function formatChanges(changes) {
  if (!changes || Object.keys(changes).length === 0) {
    return "No specific changes recorded.";
  }

  return Object.entries(changes)
    .map(([key, value]) => `- ${key}: ${value}`)
    .join("\n");
}

// Format changes for HTML email
function formatChangesHtml(changes) {
  if (!changes || Object.keys(changes).length === 0) {
    return "<li>No specific changes recorded.</li>";
  }

  return Object.entries(changes)
    .map(([key, value]) => `<li><strong>${key}</strong>: ${value}</li>`)
    .join("");
}
