import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from "axios";

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

      // Log for debugging
      console.log(
        "Adding token to request:",
        `Bearer ${token.substring(0, 10)}...`
      );
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

    // Log the error for debugging
    console.error(
      "API Error:",
      error.response?.status,
      error.message,
      originalRequest?.url
    );

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
};

// Tasks API
export const tasksAPI = {
  getAllTasks: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks", { params });
      return response.data;
    } catch (error) {
      console.error("Get all tasks error:", error);
      throw error;
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
      const response = await api.post("/tasks", taskData);
      return response.data;
    } catch (error) {
      console.error("Create task error:", error);
      throw error;
    }
  },

  updateTask: async (id: string, taskData: any) => {
    try {
      const response = await api.put(`/tasks/${id}`, taskData);
      return response.data;
    } catch (error) {
      console.error(`Update task ${id} error:`, error);
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    try {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Delete task ${id} error:`, error);
      throw error;
    }
  },

  getAssignedTasks: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks/assigned", { params });
      return response.data;
    } catch (error) {
      console.error("Get assigned tasks error:", error);
      throw error;
    }
  },

  getCreatedTasks: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks/created", { params });
      return response.data;
    } catch (error) {
      console.error("Get created tasks error:", error);
      throw error;
    }
  },

  getOverdueTasks: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks/overdue", { params });
      return response.data;
    } catch (error) {
      console.error("Get overdue tasks error:", error);
      throw error;
    }
  },

  getTasksDueToday: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks/due-today", { params });
      return response.data;
    } catch (error) {
      console.error("Get tasks due today error:", error);
      throw error;
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
      throw error;
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
      throw error;
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
      throw error;
    }
  },

  getUserAnalytics: async (params: any = {}) => {
    try {
      const response = await api.get("/analytics/user", { params });
      return response.data;
    } catch (error) {
      console.error("Get user analytics error:", error);
      throw error;
    }
  },

  getTaskCompletionAnalytics: async (params: any = {}) => {
    try {
      const response = await api.get("/analytics/task-completion", { params });
      return response.data;
    } catch (error) {
      console.error("Get task completion analytics error:", error);
      throw error;
    }
  },
};

export default api;
