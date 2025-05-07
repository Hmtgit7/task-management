const { body, validationResult } = require("express-validator");
const ErrorResponse = require("../utils/errorResponse");

// Function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new ErrorResponse(errors.array()[0].msg, 400));
  }
  next();
};

// Validation rules for auth
exports.validateRegister = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password")
    .trim()
    .notEmpty()
    .withMessage("Password is required")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),

  handleValidationErrors,
];

exports.validateLogin = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email"),

  body("password").trim().notEmpty().withMessage("Password is required"),

  handleValidationErrors,
];

// Validation rules for tasks
exports.validateCreateTask = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 100 })
    .withMessage("Title cannot be more than 100 characters"),

  body("description")
    .trim()
    .notEmpty()
    .withMessage("Description is required")
    .isLength({ max: 500 })
    .withMessage("Description cannot be more than 500 characters"),

  body("dueDate")
    .notEmpty()
    .withMessage("Due date is required")
    .isISO8601()
    .withMessage("Please provide a valid date"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),

  body("status")
    .optional()
    .isIn(["todo", "in-progress", "review", "completed"])
    .withMessage("Status must be todo, in-progress, review, or completed"),

  body("assignedTo")
    .notEmpty()
    .withMessage("Assigned user is required")
    .isMongoId()
    .withMessage("Please provide a valid user ID"),

  body("isRecurring")
    .optional()
    .isBoolean()
    .withMessage("isRecurring must be true or false"),

  body("recurringPattern")
    .optional()
    .isIn(["daily", "weekly", "monthly", "none"])
    .withMessage("Recurring pattern must be daily, weekly, monthly, or none"),

  handleValidationErrors,
];

exports.validateUpdateTask = [
  body("title")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Title cannot be more than 100 characters"),

  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot be more than 500 characters"),

  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Please provide a valid date"),

  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),

  body("status")
    .optional()
    .isIn(["todo", "in-progress", "review", "completed"])
    .withMessage("Status must be todo, in-progress, review, or completed"),

  body("assignedTo")
    .optional()
    .isMongoId()
    .withMessage("Please provide a valid user ID"),

  body("isRecurring")
    .optional()
    .isBoolean()
    .withMessage("isRecurring must be true or false"),

  body("recurringPattern")
    .optional()
    .isIn(["daily", "weekly", "monthly", "none"])
    .withMessage("Recurring pattern must be daily, weekly, monthly, or none"),

  handleValidationErrors,
];

// Validation rules for notification preferences
exports.validateNotificationPreferences = [
  body("email")
    .optional()
    .isObject()
    .withMessage("Email preferences must be an object"),

  body("inApp")
    .optional()
    .isObject()
    .withMessage("In-app preferences must be an object"),

  body("muteAll")
    .optional()
    .isBoolean()
    .withMessage("muteAll must be true or false"),

  body("quietHoursStart")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Quiet hours start must be in format HH:MM (24-hour)"),

  body("quietHoursEnd")
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .withMessage("Quiet hours end must be in format HH:MM (24-hour)"),

  body("timezone")
    .optional()
    .isString()
    .withMessage("Timezone must be a string"),

  handleValidationErrors,
];
