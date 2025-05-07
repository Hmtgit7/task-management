const mongoose = require("mongoose");

const AuditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
  },
  action: {
    type: String,
    enum: [
      "user_created",
      "user_login",
      "user_failed_login",
      "task_created",
      "task_updated",
      "task_deleted",
      "task_assigned",
      "task_completed",
      "setting_changed",
    ],
    required: true,
  },
  entity: {
    type: String,
    enum: ["user", "task", "notification", "setting"],
    required: true,
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  details: {
    type: Object,
  },
  ipAddress: {
    type: String,
  },
  userAgent: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Index for quick historical queries
AuditLogSchema.index({ timestamp: -1 });
AuditLogSchema.index({ user: 1, timestamp: -1 });
AuditLogSchema.index({ action: 1, timestamp: -1 });
AuditLogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model("AuditLog", AuditLogSchema);
