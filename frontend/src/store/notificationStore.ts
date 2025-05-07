import { create } from "zustand";
import { notificationsAPI } from "@/services/apiService";
import { getSocket } from "@/services/socketService";

// Define Notification type
export interface Notification {
  _id: string;
  recipient: string;
  sender?: {
    _id: string;
    name: string;
    email: string;
  };
  title: string;
  message: string;
  type:
    | "task_assigned"
    | "task_updated"
    | "task_completed"
    | "task_overdue"
    | "task_reminder"
    | "comment"
    | "system";
  relatedTask?: string;
  read: boolean;
  createdAt: string;
}

// Define NotificationPreference type
export interface NotificationPreference {
  _id: string;
  user: string;
  email: {
    taskAssigned: boolean;
    taskUpdated: boolean;
    taskCompleted: boolean;
    taskOverdue: boolean;
    dailySummary: boolean;
  };
  inApp: {
    taskAssigned: boolean;
    taskUpdated: boolean;
    taskCompleted: boolean;
    taskOverdue: boolean;
    comments: boolean;
  };
  muteAll: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  timezone: string;
}

// Define NotificationResponse type
interface NotificationResponse {
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
  data: Notification[];
}

// Define NotificationStore state
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreference | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    currentPage: number;
    totalPages: number;
    limit: number;
    total: number;
  };

  // Actions
  fetchNotifications: (params?: any) => Promise<NotificationResponse>;
  markAsRead: (id: string) => Promise<Notification>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  fetchPreferences: () => Promise<NotificationPreference>;
  updatePreferences: (
    preferences: Partial<NotificationPreference>
  ) => Promise<NotificationPreference>;
  addNotification: (notification: Notification) => void;
  initializeRealTimeNotifications: () => void;
  clearError: () => void;
}

// Create notification store
const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: null,
  isLoading: false,
  error: null,
  pagination: {
    currentPage: 1,
    totalPages: 1,
    limit: 10,
    total: 0,
  },

  // Fetch notifications
  fetchNotifications: async (params = {}) => {
    try {
      set({ isLoading: true, error: null });

      const queryParams = {
        ...params,
        page: params.page || get().pagination.currentPage,
        limit: params.limit || get().pagination.limit,
      };

      const response = await notificationsAPI.getNotifications(queryParams);

      // Count unread notifications
      const unreadCount = response.data.filter(
        (notification: Notification) => !notification.read
      ).length;

      set({
        notifications: response.data,
        unreadCount,
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
        error: error.response?.data?.error || "Failed to fetch notifications",
      });
      throw error;
    }
  },

  // Mark notification as read
  markAsRead: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      const response = await notificationsAPI.markAsRead(id);

      // Update notifications list
      set((state) => {
        const updatedNotifications = state.notifications.map((notification) =>
          notification._id === id
            ? { ...notification, read: true }
            : notification
        );

        // Recalculate unread count
        const unreadCount = updatedNotifications.filter(
          (notification) => !notification.read
        ).length;

        return {
          notifications: updatedNotifications,
          unreadCount,
          isLoading: false,
        };
      });

      return response.data;
    } catch (error: any) {
      set({
        isLoading: false,
        error:
          error.response?.data?.error || "Failed to mark notification as read",
      });
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    try {
      set({ isLoading: true, error: null });

      await notificationsAPI.markAllAsRead();

      // Update all notifications to read
      set((state) => ({
        notifications: state.notifications.map((notification) => ({
          ...notification,
          read: true,
        })),
        unreadCount: 0,
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        isLoading: false,
        error:
          error.response?.data?.error ||
          "Failed to mark all notifications as read",
      });
      throw error;
    }
  },

  // Delete notification
  deleteNotification: async (id: string) => {
    try {
      set({ isLoading: true, error: null });

      await notificationsAPI.deleteNotification(id);

      // Remove notification from list
      set((state) => {
        const updatedNotifications = state.notifications.filter(
          (notification) => notification._id !== id
        );

        // Recalculate unread count
        const unreadCount = updatedNotifications.filter(
          (notification) => !notification.read
        ).length;

        return {
          notifications: updatedNotifications,
          unreadCount,
          isLoading: false,
        };
      });
    } catch (error: any) {
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to delete notification",
      });
      throw error;
    }
  },

  // Fetch notification preferences
  fetchPreferences: async () => {
    try {
      set({ isLoading: true, error: null });

      const response = await notificationsAPI.getPreferences();

      set({
        preferences: response.data,
        isLoading: false,
      });

      return response.data;
    } catch (error: any) {
      set({
        isLoading: false,
        error:
          error.response?.data?.error ||
          "Failed to fetch notification preferences",
      });
      throw error;
    }
  },

  // Update notification preferences
  updatePreferences: async (preferences: Partial<NotificationPreference>) => {
    try {
      set({ isLoading: true, error: null });

      const response = await notificationsAPI.updatePreferences(preferences);

      set({
        preferences: response.data,
        isLoading: false,
      });

      return response.data;
    } catch (error: any) {
      set({
        isLoading: false,
        error:
          error.response?.data?.error ||
          "Failed to update notification preferences",
      });
      throw error;
    }
  },

  // Add real-time notification
  addNotification: (notification: Notification) => {
    set((state) => {
      // Check if notification already exists
      const exists = state.notifications.some(
        (n) => n._id === notification._id
      );

      if (exists) {
        return state;
      }

      // Add to beginning of list
      const updatedNotifications = [notification, ...state.notifications];

      // Recalculate unread count
      const unreadCount = updatedNotifications.filter((n) => !n.read).length;

      return {
        notifications: updatedNotifications,
        unreadCount,
      };
    });
  },

  // Initialize real-time notifications
  initializeRealTimeNotifications: () => {
    const socket = getSocket();

    if (!socket) {
      return;
    }

    // Listen for real-time notifications
    socket.on("notification", (notification: Notification) => {
      get().addNotification(notification);
    });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useNotificationStore;
