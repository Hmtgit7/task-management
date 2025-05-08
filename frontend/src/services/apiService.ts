import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from "axios";
import { toast } from "react-hot-toast";

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 second timeout
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    // Get token from storage
    const token = localStorage.getItem("token");

    // If token exists, add to headers
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;

      // Log for debugging in development
      if (process.env.NODE_ENV === "development") {
        console.log(
          "Adding token to request:",
          `Bearer ${token.substring(0, 10)}...`
        );
      }
    } else {
      console.log("No token found in localStorage");
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config;

    // Handle unauthorized errors (401)
    if (error.response?.status === 401) {
      // Check if we're already on the login page to avoid redirect loops
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/login")
      ) {
        console.log("Unauthorized access, redirecting to login");
        // Clear storage and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login?session=expired";
      }
    }

    // Log the error for debugging in development
    if (process.env.NODE_ENV === "development") {
      console.error(
        "API Error:",
        error.response?.status,
        error.message,
        originalRequest?.url
      );
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (userData: any) => {
    try {
      const response = await api.post("/auth/register", userData);

      // Store token in localStorage upon successful registration
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  },

  login: async (credentials: any) => {
    try {
      const response = await api.post("/auth/login", credentials);

      // Store token in localStorage upon successful login
      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      console.error("Get current user error:", error);
      throw error;
    }
  },

  logout: async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Guest login function
  guestLogin: async () => {
    try {
      // Create a mock user and token for guest mode
      const guestUser = {
        _id: "guest-user",
        name: "Guest User",
        email: "guest@example.com",
        role: "user", // Ensure this matches the expected role type
      };

      const mockToken = "guest-token";

      // Store in localStorage
      localStorage.setItem("token", mockToken);
      localStorage.setItem("user", JSON.stringify(guestUser));

      return { user: guestUser, token: mockToken };
    } catch (error) {
      console.error("Guest login error:", error);
      throw error;
    }
  },
};

// Tasks API
export const tasksAPI = {
  getAllTasks: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks", { params });
      return response.data;
    } catch (error) {
      console.error("Get all tasks error:", error);
      // Return empty data structure to prevent UI errors
      return {
        success: false,
        count: 0,
        pagination: {},
        total: 0,
        data: [],
      };
    }
  },

  getTaskById: async (id: string) => {
    try {
      const response = await api.get(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Get task ${id} error:`, error);
      throw error;
    }
  },

  createTask: async (taskData: any) => {
    try {
      // Validate data before sending
      if (!taskData.title) {
        throw new Error("Title is required");
      }

      // Ensure date is in proper format
      if (taskData.dueDate) {
        const dueDateObj = new Date(taskData.dueDate);
        if (isNaN(dueDateObj.getTime())) {
          throw new Error("Invalid due date format");
        }
      }

      // Handle recurring task data properly
      if (taskData.isRecurring && taskData.recurringPattern === "none") {
        taskData.isRecurring = false;
      }

      // Send validated data
      const response = await api.post("/tasks", taskData);
      return response.data;
    } catch (error: any) {
      console.error("Create task error:", error);

      // Show user-friendly error message
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(error.message || "Failed to create task");
      }

      throw error;
    }
  },

  updateTask: async (id: string, taskData: any) => {
    try {
      // Validate data before sending
      if (taskData.title === "") {
        throw new Error("Title cannot be empty");
      }

      // Ensure date is in proper format
      if (taskData.dueDate) {
        const dueDateObj = new Date(taskData.dueDate);
        if (isNaN(dueDateObj.getTime())) {
          throw new Error("Invalid due date format");
        }
      }

      // Handle recurring task data properly
      if (taskData.isRecurring === false) {
        taskData.recurringPattern = "none";
      }

      // Clean undefined/null values to prevent validation errors
      Object.keys(taskData).forEach((key) => {
        if (taskData[key] === undefined || taskData[key] === null) {
          delete taskData[key];
        }
      });

      // Send validated data
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error: any) {
      console.error(`Update task ${id} error:`, error);

      // Show user-friendly error message
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(error.message || "Failed to update task");
      }

      throw error;
    }
  },

  deleteTask: async (id: string) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      toast.success("Task deleted successfully");
      return response.data;
    } catch (error: any) {
      console.error(`Delete task ${id} error:`, error);

      // Show user-friendly error message
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error(error.message || "Failed to delete task");
      }

      throw error;
    }
  },

  getAssignedTasks: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks/assigned", { params });
      return response.data;
    } catch (error) {
      console.error("Get assigned tasks error:", error);
      // Return empty data structure to prevent UI errors
      return {
        success: false,
        count: 0,
        pagination: {},
        total: 0,
        data: [],
      };
    }
  },

  getCreatedTasks: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks/created", { params });
      return response.data;
    } catch (error) {
      console.error("Get created tasks error:", error);
      // Return empty data structure to prevent UI errors
      return {
        success: false,
        count: 0,
        pagination: {},
        total: 0,
        data: [],
      };
    }
  },

  getOverdueTasks: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks/overdue", { params });
      return response.data;
    } catch (error) {
      console.error("Get overdue tasks error:", error);
      // Return empty data structure to prevent UI errors
      return {
        success: false,
        count: 0,
        pagination: {},
        total: 0,
        data: [],
      };
    }
  },

  getTasksDueToday: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks/due-today", { params });
      return response.data;
    } catch (error) {
      console.error("Get tasks due today error:", error);
      // Return empty data structure to prevent UI errors
      return {
        success: false,
        count: 0,
        pagination: {},
        total: 0,
        data: [],
      };
    }
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (params: any = {}) => {
    try {
      const response = await api.get("/notifications", { params });
      return response.data;
    } catch (error) {
      console.error("Get notifications error:", error);
      // Return empty data to prevent UI errors
      return {
        success: false,
        count: 0,
        pagination: {},
        total: 0,
        data: [],
      };
    }
  },

  markAsRead: async (id: string) => {
    try {
      const response = await api.put(`/notifications/${id}/read`);
      return response.data;
    } catch (error) {
      console.error(`Mark notification ${id} as read error:`, error);
      throw error;
    }
  },

  markAllAsRead: async () => {
    try {
      const response = await api.put("/notifications/read-all");
      return response.data;
    } catch (error) {
      console.error("Mark all notifications as read error:", error);
      throw error;
    }
  },

  deleteNotification: async (id: string) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Delete notification ${id} error:`, error);
      throw error;
    }
  },

  getPreferences: async () => {
    try {
      const response = await api.get("/notifications/preferences");
      return response.data;
    } catch (error) {
      console.error("Get notification preferences error:", error);
      // Return default preferences to prevent UI errors
      return {
        data: {
          email: {
            taskAssigned: true,
            taskUpdated: true,
            taskCompleted: true,
            taskOverdue: true,
            dailySummary: false,
          },
          inApp: {
            taskAssigned: true,
            taskUpdated: true,
            taskCompleted: true,
            taskOverdue: true,
            comments: true,
          },
          muteAll: false,
          quietHoursStart: "22:00",
          quietHoursEnd: "08:00",
          timezone: "UTC",
        },
      };
    }
  },

  updatePreferences: async (preferences: any) => {
    try {
      const response = await api.put("/notifications/preferences", preferences);
      return response.data;
    } catch (error) {
      console.error("Update notification preferences error:", error);
      throw error;
    }
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: async () => {
    try {
      const response = await api.get("/analytics/dashboard");
      return response.data;
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      // Return default data to prevent UI errors
      return {
        data: {
          assignedTasksCount: 0,
          createdTasksCount: 0,
          overdueTasksCount: 0,
          tasksDueToday: 0,
          recentAssignedTasks: [],
          tasksByPriority: [],
          tasksByStatus: [],
          unreadNotifications: 0,
        },
      };
    }
  },

  getUserAnalytics: async (params: any = {}) => {
    try {
      const response = await api.get("/analytics/user", { params });
      return response.data;
    } catch (error) {
      console.error("Get user analytics error:", error);
      // Return default data to prevent UI errors
      return {
        data: {
          assignedTasks: 0,
          createdTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          tasksCompletedOnTime: 0,
          completionRate: 0,
          onTimeCompletionRate: 0,
          tasksByPriority: [],
          tasksByStatus: [],
          recentCompletedTasks: [],
        },
      };
    }
  },

  getTaskCompletionAnalytics: async (params: any = {}) => {
    try {
      const response = await api.get("/analytics/task-completion", { params });
      return response.data;
    } catch (error) {
      console.error("Get task completion analytics error:", error);
      // Return default data to prevent UI errors
      return {
        data: {
          completedTasks: [],
          overdueTasks: 0,
          totalTasks: 0,
          completedTasksCount: 0,
          completionRate: 0,
          userPerformance: [],
          statusDistribution: [],
          priorityDistribution: [],
        },
      };
    }
  },
};

export default api;
