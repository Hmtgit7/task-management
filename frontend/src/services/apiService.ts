// frontend/src/services/apiService.ts
import axios, { AxiosRequestConfig, AxiosError, AxiosResponse } from "axios";

// Create axios instance
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
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
        // Clear storage and redirect to login
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login?session=expired";
      }
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  register: async (userData: any) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  login: async (credentials: any) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  logout: async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// Tasks API
export const tasksAPI = {
  getAllTasks: async (params: any = {}) => {
    const response = await api.get("/tasks", { params });
    return response.data;
  },

  getTaskById: async (id: string) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  createTask: async (taskData: any) => {
    const response = await api.post("/tasks", taskData);
    return response.data;
  },

  updateTask: async (id: string, taskData: any) => {
    const response = await api.put(`/tasks/${id}`, taskData);
    return response.data;
  },

  deleteTask: async (id: string) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  getAssignedTasks: async (params: any = {}) => {
    const response = await api.get("/tasks/assigned", { params });
    return response.data;
  },

  getCreatedTasks: async (params: any = {}) => {
    const response = await api.get("/tasks/created", { params });
    return response.data;
  },

  getOverdueTasks: async (params: any = {}) => {
    const response = await api.get("/tasks/overdue", { params });
    return response.data;
  },

  getTasksDueToday: async (params: any = {}) => {
    const response = await api.get("/tasks/due-today", { params });
    return response.data;
  },
};

// Notifications API
export const notificationsAPI = {
  getNotifications: async (params: any = {}) => {
    const response = await api.get("/notifications", { params });
    return response.data;
  },

  markAsRead: async (id: string) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },

  deleteNotification: async (id: string) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  getPreferences: async () => {
    const response = await api.get("/notifications/preferences");
    return response.data;
  },

  updatePreferences: async (preferences: any) => {
    const response = await api.put("/notifications/preferences", preferences);
    return response.data;
  },
};

// Analytics API
export const analyticsAPI = {
  getDashboardStats: async () => {
    const response = await api.get("/analytics/dashboard");
    return response.data;
  },

  getUserAnalytics: async (params: any = {}) => {
    const response = await api.get("/analytics/user", { params });
    return response.data;
  },

  getTaskCompletionAnalytics: async (params: any = {}) => {
    const response = await api.get("/analytics/task-completion", { params });
    return response.data;
  },
};

export default api;
