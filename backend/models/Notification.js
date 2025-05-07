const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  sender: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: [
      "task_assigned",
      "task_updated",
      "task_completed",
      "task_overdue",
      "task_reminder",
      "comment",
      "system",
    ],
    required: true,
  },
  relatedTask: {
    type: mongoose.Schema.ObjectId,
    ref: "Task",
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for fast queries based on recipient and read status
NotificationSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model("Notification", NotificationSchema);
