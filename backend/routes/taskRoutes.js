const express = require("express");
const router = express.Router();
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  getAssignedTasks,
  getCreatedTasks,
  getOverdueTasks,
  getTasksDueToday,
} = require("../controllers/taskController");
const { protect } = require("../middleware/auth");
const {
  validateCreateTask,
  validateUpdateTask,
} = require("../middleware/validator");

router.use(protect); // All task routes require authentication

// Special filter routes - these must come BEFORE the /:id route to avoid confusion
router.get("/assigned", getAssignedTasks);
router.get("/created", getCreatedTasks);
router.get("/overdue", getOverdueTasks);
router.get("/due-today", getTasksDueToday);

// Standard CRUD routes
router.route("/").get(getTasks).post(validateCreateTask, createTask);

router
  .route("/:id")
  .get(getTask)
  .put(validateUpdateTask, updateTask)
  .delete(deleteTask);

module.exports = router;
