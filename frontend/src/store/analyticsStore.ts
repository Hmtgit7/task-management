import { create } from "zustand";
import { analyticsAPI } from "@/services/apiService";

// Dashboard Stats Types
export interface DashboardStats {
  assignedTasksCount: number;
  createdTasksCount: number;
  overdueTasksCount: number;
  tasksDueToday: number;
  recentAssignedTasks: any[];
  tasksByPriority: { _id: string; count: number }[];
  tasksByStatus: { _id: string; count: number }[];
  unreadNotifications: number;
}

// User Analytics Types
export interface UserAnalytics {
  assignedTasks: number;
  createdTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksCompletedOnTime: number;
  completionRate: number;
  onTimeCompletionRate: number;
  tasksByPriority: { _id: string; count: number }[];
  tasksByStatus: { _id: string; count: number }[];
  recentCompletedTasks: any[];
}

// Task Completion Analytics Types
export interface TaskCompletionAnalytics {
  completedTasks: { _id: any; count: number }[];
  overdueTasks: number;
  totalTasks: number;
  completedTasksCount: number;
  completionRate: number;
  userPerformance: {
    _id: string;
    userName: string;
    completedTasks: number;
    onTimeCount: number;
    onTimePercentage: number;
  }[];
  statusDistribution: { _id: string; count: number }[];
  priorityDistribution: { _id: string; count: number }[];
}

// Define AnalyticsStore state
interface AnalyticsState {
  dashboardStats: DashboardStats | null;
  userAnalytics: UserAnalytics | null;
  taskCompletionAnalytics: TaskCompletionAnalytics | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchDashboardStats: () => Promise<DashboardStats>;
  fetchUserAnalytics: (params?: any) => Promise<UserAnalytics>;
  fetchTaskCompletionAnalytics: (
    params?: any
  ) => Promise<TaskCompletionAnalytics>;
  clearError: () => void;
}

// Default values for dashboard stats
const defaultDashboardStats: DashboardStats = {
  assignedTasksCount: 0,
  createdTasksCount: 0,
  overdueTasksCount: 0,
  tasksDueToday: 0,
  recentAssignedTasks: [],
  tasksByPriority: [],
  tasksByStatus: [],
  unreadNotifications: 0,
};

// Create analytics store
const useAnalyticsStore = create<AnalyticsState>()((set) => ({
  dashboardStats: null,
  userAnalytics: null,
  taskCompletionAnalytics: null,
  isLoading: false,
  error: null,

  // Fetch dashboard statistics
  fetchDashboardStats: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await analyticsAPI.getDashboardStats();

      // If we get a successful response, update the store
      set({
        dashboardStats: response.data,
        isLoading: false,
      });

      return response.data;
    } catch (error: any) {
      console.error("Dashboard stats error:", error);

      // Set default values if the request fails
      set({
        dashboardStats: defaultDashboardStats,
        isLoading: false,
        error:
          error.response?.data?.error || "Failed to fetch dashboard statistics",
      });

      // Return default values instead of throwing
      return defaultDashboardStats;
    }
  },

  // Fetch user analytics
  fetchUserAnalytics: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      const response = await analyticsAPI.getUserAnalytics(params);

      set({
        userAnalytics: response.data,
        isLoading: false,
      });

      return response.data;
    } catch (error: any) {
      // Set a more friendly error message
      const errorMessage =
        error.response?.data?.error || "Failed to fetch user analytics";
      console.error(errorMessage, error);

      set({
        isLoading: false,
        error: errorMessage,
      });

      // Create a default response to avoid UI breaking
      const defaultAnalytics: UserAnalytics = {
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
      };

      return defaultAnalytics;
    }
  },

  // Fetch task completion analytics
  fetchTaskCompletionAnalytics: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      const response = await analyticsAPI.getTaskCompletionAnalytics(params);

      set({
        taskCompletionAnalytics: response.data,
        isLoading: false,
      });

      return response.data;
    } catch (error: any) {
      // Set a more friendly error message
      const errorMessage =
        error.response?.data?.error ||
        "Failed to fetch task completion analytics";
      console.error(errorMessage, error);

      set({
        isLoading: false,
        error: errorMessage,
      });

      // Create a default response
      const defaultAnalytics: TaskCompletionAnalytics = {
        completedTasks: [],
        overdueTasks: 0,
        totalTasks: 0,
        completedTasksCount: 0,
        completionRate: 0,
        userPerformance: [],
        statusDistribution: [],
        priorityDistribution: [],
      };

      return defaultAnalytics;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useAnalyticsStore;
