const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
      maxlength: [500, "Description cannot be more than 500 characters"],
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["todo", "in-progress", "review", "completed"],
      default: "todo",
    },
    dueDate: {
      type: Date,
      required: [true, "Please add a due date"],
    },
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.ObjectId,
      ref: "User",
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringPattern: {
      type: String,
      enum: ["daily", "weekly", "monthly", "none"],
      default: "none",
    },
    recurringEndDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    tags: [String],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Set updatedAt on save
TaskSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Index for searching and filtering
TaskSchema.index({ title: "text", description: "text" });
TaskSchema.index({
  status: 1,
  priority: 1,
  dueDate: 1,
  assignedTo: 1,
  createdBy: 1,
});

// Virtual field to determine if task is overdue
TaskSchema.virtual("isOverdue").get(function () {
  return !this.completedAt && new Date(this.dueDate) < new Date();
});

module.exports = mongoose.model("Task", TaskSchema);
