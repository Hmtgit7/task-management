const mongoose = require("mongoose");

const NotificationPreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  email: {
    taskAssigned: { type: Boolean, default: true },
    taskUpdated: { type: Boolean, default: true },
    taskCompleted: { type: Boolean, default: true },
    taskOverdue: { type: Boolean, default: true },
    dailySummary: { type: Boolean, default: false },
  },
  inApp: {
    taskAssigned: { type: Boolean, default: true },
    taskUpdated: { type: Boolean, default: true },
    taskCompleted: { type: Boolean, default: true },
    taskOverdue: { type: Boolean, default: true },
    comments: { type: Boolean, default: true },
  },
  muteAll: {
    type: Boolean,
    default: false,
  },
  quietHoursStart: {
    type: String,
    default: "22:00",
  },
  quietHoursEnd: {
    type: String,
    default: "08:00",
  },
  timezone: {
    type: String,
    default: "UTC",
  },
});

module.exports = mongoose.model(
  "NotificationPreference",
  NotificationPreferenceSchema
);
