// frontend/src/store/TaskStore

import { create } from "zustand";
import { tasksAPI } from "@/services/apiService";
import { emitTaskUpdate } from "@/services/socketService";

// Define Task type
export interface Task {
  _id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in-progress" | "review" | "completed";
  dueDate: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  assignedTo: {
    _id: string;
    name: string;
    email: string;
  };
  isRecurring: boolean;
  recurringPattern: "daily" | "weekly" | "monthly" | "none";
  recurringEndDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  isOverdue?: boolean;
}

// Define TaskResponse type
interface TaskResponse {
  success: boolean;
  count: number;
  pagination: {
    next?: {
      page: number;
      limit: number;
    };
    prev?: {
      page: number;
      limit: number;
    };
  };
  total: number;
  data: Task[];
}

// Define TaskStore state
interface TaskState {
  tasks: Task[];
  task: Task | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
    total: number;
  };
  filters: {
    search: string;
    status: string;
    priority: string;
    assignedTo: string;
    sort: string;
  };

  // Actions
  fetchTasks: (params?: any) => Promise<TaskResponse>;
  fetchTaskById: (id: string) => Promise<Task>;
  createTask: (taskData: any) => Promise<Task>;
  updateTask: (id: string, taskData: any) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  fetchAssignedTasks: (params?: any) => Promise<TaskResponse>;
  fetchCreatedTasks: (params?: any) => Promise<TaskResponse>;
  fetchOverdueTasks: (params?: any) => Promise<TaskResponse>;
  fetchTasksDueToday: (params?: any) => Promise<TaskResponse>;
  setFilters: (filters: Partial<TaskState["filters"]>) => void;
  resetFilters: () => void;
  clearError: () => void;
}

// Create task store
const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  task: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    total: 0,
  },
  filters: {
    search: "",
    status: "",
    priority: "",
    assignedTo: "",
    sort: "-createdAt", // Default sort by creation date (newest first)
  },

  // Fetch all tasks with optional filters
  fetchTasks: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      // Merge state filters with params
      const queryParams = {
        ...get().filters,
        ...params,
        page: params.page || get().pagination.currentPage,
        limit: params.limit || get().pagination.limit,
      };

      // Remove empty filters
      Object.keys(queryParams).forEach((key) => {
        if (queryParams[key] === "") {
          delete queryParams[key];
        }
      });

      const response = await tasksAPI.getAllTasks(queryParams);

      // Update state
      set({
        tasks: response.data,
        isLoading: false,
        pagination: {
          currentPage: queryParams.page,
          limit: queryParams.limit,
          totalPages: Math.ceil(response.total / queryParams.limit),
          total: response.total,
        },
      });

      return response;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to fetch tasks",
      });
      throw error;
    }
  },

  // Fetch a single task by ID
  fetchTaskById: async (id: string) => {
    try {
      set({ isLoading: true, error: null, task: null });

      const response = await tasksAPI.getTaskById(id);

      set({
        task: response.data,
        isLoading: false,
      });

      return response.data;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to fetch task",
      });
      throw error;
    }
  },

  // Create a new task
  createTask: async (taskData: any) => {
    try {
      set({ isLoading: true, error: null });

      const response = await tasksAPI.createTask(taskData);

      // Refresh tasks list
      get().fetchTasks();

      set({ isLoading: false });

      return response.data;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to create task",
      });
      throw error;
    }
  },

  // Update an existing task
  updateTask: async (id: string, taskData: any) => {
    try {
      set({ isLoading: true, error: null });

      const response = await tasksAPI.updateTask(id, taskData);

      // Update state if the current task is being viewed
      if (get().task && get().task._id === id) {
        set({ task: response.data });
      }

      // Refresh tasks list
      get().fetchTasks();

      // Emit socket event for real-time updates
      emitTaskUpdate(id);

      set({ isLoading: false });

      return response.data;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to update task",
      });
      throw error;
    }
  },

  // Delete a task
  deleteTask: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      await tasksAPI.deleteTask(id);

      // Refresh tasks list
      get().fetchTasks();

      // Clear current task if it's the deleted one
      if (get().task && get().task._id === id) {
        set({ task: null });
      }

      set({ isLoading: false });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to delete task",
      });
      throw error;
    }
  },

  // Fetch tasks assigned to current user
  fetchAssignedTasks: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      // Include current filters
      const queryParams = {
        ...get().filters,
        ...params,
        page: params.page || get().pagination.currentPage,
        limit: params.limit || get().pagination.limit,
      };

      const response = await tasksAPI.getAssignedTasks(queryParams);

      set({
        tasks: response.data,
        isLoading: false,
        pagination: {
          currentPage: queryParams.page,
          limit: queryParams.limit,
          totalPages: Math.ceil(response.total / queryParams.limit),
          total: response.total,
        },
      });

      return response;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to fetch assigned tasks",
      });
      throw error;
    }
  },

  // Fetch tasks created by current user
  fetchCreatedTasks: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      // Include current filters
      const queryParams = {
        ...get().filters,
        ...params,
        page: params.page || get().pagination.currentPage,
        limit: params.limit || get().pagination.limit,
      };

      const response = await tasksAPI.getCreatedTasks(queryParams);

      set({
        tasks: response.data,
        isLoading: false,
        pagination: {
          currentPage: queryParams.page,
          limit: queryParams.limit,
          totalPages: Math.ceil(response.total / queryParams.limit),
          total: response.total,
        },
      });

      return response;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to fetch created tasks",
      });
      throw error;
    }
  },

  // Fetch overdue tasks
  fetchOverdueTasks: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      // Include current filters
      const queryParams = {
        ...get().filters,
        ...params,
        page: params.page || get().pagination.currentPage,
        limit: params.limit || get().pagination.limit,
      };

      const response = await tasksAPI.getOverdueTasks(queryParams);

      set({
        tasks: response.data,
        isLoading: false,
        pagination: {
          currentPage: queryParams.page,
          limit: queryParams.limit,
          totalPages: Math.ceil(response.total / queryParams.limit),
          total: response.total,
        },
      });

      return response;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to fetch overdue tasks",
      });
      throw error;
    }
  },

  // Fetch tasks due today
  fetchTasksDueToday: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      // Include current filters
      const queryParams = {
        ...get().filters,
        ...params,
        page: params.page || get().pagination.currentPage,
        limit: params.limit || get().pagination.limit,
      };

      const response = await tasksAPI.getTasksDueToday(queryParams);

      set({
        tasks: response.data,
        isLoading: false,
        pagination: {
          currentPage: queryParams.page,
          limit: queryParams.limit,
          totalPages: Math.ceil(response.total / queryParams.limit),
          total: response.total,
        },
      });

      return response;
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to fetch tasks due today",
      });
      throw error;
    }
  },

  // Set filters
  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
      pagination: { ...state.pagination, currentPage: 1 }, // Reset to first page when filters change
    }));
  },

  // Reset filters
  resetFilters: () => {
    set({
      filters: {
        search: "",
        status: "",
        priority: "",
        assignedTo: "",
        sort: "-createdAt",
      },
      pagination: { ...get().pagination, currentPage: 1 },
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useTaskStore;
