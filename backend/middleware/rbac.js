const ErrorResponse = require("../utils/errorResponse");

// Role-Based Access Control middleware
const rbac = {
  // Define permissions
  permissions: {
    admin: [
      "manage_users",
      "create_task",
      "update_any_task",
      "delete_any_task",
      "assign_any_task",
      "view_any_task",
      "view_analytics",
      "view_audit_logs",
      "manage_settings",
    ],
    manager: [
      "create_task",
      "update_any_task",
      "delete_own_task",
      "assign_any_task",
      "view_any_task",
      "view_analytics",
    ],
    user: [
      "create_task",
      "update_own_task",
      "delete_own_task",
      "assign_own_task",
      "view_own_task",
      "view_assigned_task",
    ],
  },

  // Check if user has permission
  hasPermission: (role, permission) => {
    return (
      rbac.permissions[role] && rbac.permissions[role].includes(permission)
    );
  },

  // Middleware to check permission
  checkPermission: (permission) => {
    return (req, res, next) => {
      // Get user role from authenticated user
      const userRole = req.user.role;

      // Check if user has permission
      if (!rbac.hasPermission(userRole, permission)) {
        return next(
          new ErrorResponse(`User does not have permission: ${permission}`, 403)
        );
      }

      next();
    };
  },

  // Helper function to check task ownership
  isTaskOwner: (userId, task) => {
    return task.createdBy.toString() === userId;
  },

  // Helper function to check if task is assigned to user
  isTaskAssigned: (userId, task) => {
    return task.assignedTo.toString() === userId;
  },

  // Middleware to enforce task ownership
  enforceTaskOwnership: (req, res, next) => {
    // This would be used after a task has been fetched
    const { task } = req;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Admins and managers can access any task
    if (userRole === "admin" || userRole === "manager") {
      return next();
    }

    // Regular users can only access tasks they created or are assigned to
    if (rbac.isTaskOwner(userId, task) || rbac.isTaskAssigned(userId, task)) {
      return next();
    }

    // Not authorized
    return next(new ErrorResponse("Not authorized to access this task", 403));
  },
};
