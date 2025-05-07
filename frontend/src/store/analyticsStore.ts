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

      set({
        dashboardStats: response.data,
        isLoading: false,
      });

      return response.data;
    } catch (error: any) {
      set({
        isLoading: false,
        error:
          error.response?.data?.error || "Failed to fetch dashboard statistics",
      });
      throw error;
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
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to fetch user analytics",
      });
      throw error;
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
      set({
        isLoading: false,
        error:
          error.response?.data?.error ||
          "Failed to fetch task completion analytics",
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useAnalyticsStore;
