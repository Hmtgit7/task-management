import { create } from "zustand";
import { notificationsAPI } from "@/services/apiService";
import { getSocket } from "@/services/socketService";
import { toast } from "react-hot-toast";

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

// Create notification store with improved error handling
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

  // Fetch notifications with better error handling
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
      const unreadCount = response.data
        ? response.data.filter(
            (notification: Notification) => !notification.read
          ).length
        : 0;

      set({
        notifications: response.data || [], // Ensure we never set undefined
        unreadCount,
        isLoading: false,
        pagination: {
          currentPage: queryParams.page,
          limit: queryParams.limit,
          totalPages: Math.ceil((response.total || 0) / queryParams.limit),
          total: response.total || 0,
        },
      });

      return response;
    } catch (error: any) {
      console.error("Error fetching notifications:", error);

      // Set more user-friendly error
      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to fetch notifications",
        notifications: [], // Ensure we have an empty array not undefined
      });

      // Show toast notification for user feedback in development, not in production to avoid annoying users
      if (process.env.NODE_ENV !== "production") {
        toast.error("Failed to load notifications. Please try again later.");
      }

      // Return empty data to prevent app crashes
      return {
        success: false,
        count: 0,
        pagination: {},
        total: 0,
        data: [],
      };
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
      console.error(`Error marking notification ${id} as read:`, error);

      set({
        isLoading: false,
        error:
          error.response?.data?.error || "Failed to mark notification as read",
      });

      // Return the original notification to prevent UI issues
      const notification = get().notifications.find((n) => n._id === id);
      return notification || ({ _id: id } as Notification);
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

      return Promise.resolve();
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);

      set({
        isLoading: false,
        error:
          error.response?.data?.error ||
          "Failed to mark all notifications as read",
      });

      return Promise.reject(error);
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

      return Promise.resolve();
    } catch (error: any) {
      console.error(`Error deleting notification ${id}:`, error);

      set({
        isLoading: false,
        error: error.response?.data?.error || "Failed to delete notification",
      });

      return Promise.reject(error);
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
      console.error("Error fetching notification preferences:", error);

      // Set default preferences to avoid UI issues
      const defaultPreferences = {
        _id: "default",
        user: "default",
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
      };

      set({
        isLoading: false,
        error:
          error.response?.data?.error ||
          "Failed to fetch notification preferences",
        preferences: defaultPreferences as NotificationPreference,
      });

      return defaultPreferences as NotificationPreference;
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
      console.error("Error updating notification preferences:", error);

      set({
        isLoading: false,
        error:
          error.response?.data?.error ||
          "Failed to update notification preferences",
      });

      const currentPreferences = get().preferences;
      return currentPreferences as NotificationPreference;
    }
  },

  // Add real-time notification
  addNotification: (notification: Notification) => {
    if (!notification) return;

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
      console.warn("Socket connection not available for notifications");
      return;
    }

    try {
      // Remove existing listener if any to prevent duplicates
      socket.off("notification");

      // Listen for real-time notifications
      socket.on("notification", (notification: Notification) => {
        if (!notification) return;

        // Add notification to store
        get().addNotification(notification);

        // Show toast notification for real-time feedback
        toast.success(`New notification: ${notification.title}`);
      });

      console.log("Real-time notifications initialized");
    } catch (error) {
      console.error("Error setting up real-time notifications:", error);
    }
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));

export default useNotificationStore;
