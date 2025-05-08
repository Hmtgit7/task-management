import { toast } from "react-hot-toast";
import { create } from "zustand";
import { persist } from "zustand/middleware";

import { authAPI } from "@/services/apiService";
import { disconnectSocket, initializeSocket } from "@/services/socketService";

// Define User type
interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "user";
}

// Define Auth store state
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  guestLogin: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
  checkAuthState: () => Promise<boolean>;
}

// Create auth store with persistence
const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Login action
      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authAPI.login({ email, password });

          console.log(
            "Login successful, token received:",
            response.token ? "Yes" : "No"
          );

          // Store token in localStorage
          if (response.token) {
            localStorage.setItem("token", response.token);
            console.log("Token stored in localStorage");
          }

          // Set auth data
          set({
            isLoading: false,
            isAuthenticated: true,
            user: response.user,
            token: response.token,
          });

          // Initialize socket connection
          if (response.token) {
            initializeSocket(response.token);
          }

          toast.success("Login successful!");
        } catch (error: any) {
          const errorMessage = error.response?.data?.error || "Login failed";
          set({
            isLoading: false,
            error: errorMessage,
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      // Register action
      register: async (name: string, email: string, password: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await authAPI.register({ name, email, password });

          // Set auth data
          set({
            isLoading: false,
            isAuthenticated: true,
            user: response.user,
            token: response.token,
          });

          // Initialize socket connection
          if (response.token) {
            initializeSocket(response.token);
          }

          toast.success("Registration successful!");
        } catch (error: any) {
          const errorMessage =
            error.response?.data?.error || "Registration failed";
          set({
            isLoading: false,
            error: errorMessage,
          });
          toast.error(errorMessage);
          throw error;
        }
      },

      // Guest login action
      guestLogin: async () => {
        try {
          set({ isLoading: true, error: null });

          // Use the guestLogin function from authAPI
          const response = await authAPI.guestLogin();

          // Set auth data for guest
          set({
            isLoading: false,
            isAuthenticated: true,
            user: {
              _id: "guest-user",
              name: "Guest User",
              email: "guest@example.com",
              role: "user" as const, // Type assertion to match User type
            },
            token: "guest-token",
          });

          toast.success("Logged in as guest");
        } catch (error: any) {
          set({
            isLoading: false,
            error: "Guest login failed",
          });
          toast.error("Guest login failed");
          throw error;
        }
      },

      // Logout action
      logout: () => {
        // Disconnect socket
        disconnectSocket();

        // Clear auth data
        authAPI.logout();

        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });

        toast.success("Logged out successfully");
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Check if user is authenticated
      checkAuthState: async () => {
        const { token } = get();

        if (!token) {
          return false;
        }

        // For guest token, set authenticated but don't try to validate with server
        if (token === "guest-token") {
          const guestUser = localStorage.getItem("user");
          if (guestUser) {
            try {
              const userData = JSON.parse(guestUser);
              set({
                user: {
                  _id: userData._id,
                  name: userData.name,
                  email: userData.email,
                  role: userData.role as "user", // Type assertion to match User type
                },
                isAuthenticated: true,
              });
              return true;
            } catch (error) {
              console.error("Error parsing guest user data:", error);
            }
          }
          return false;
        }

        try {
          // Get current user
          const response = await authAPI.getCurrentUser();

          if (response.data) {
            set({
              user: response.data,
              isAuthenticated: true,
            });

            // Initialize socket connection
            initializeSocket(token);

            return true;
          }

          return false;
        } catch (error) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });

          return false;
        }
      },
    }),
    {
      name: "auth-storage", // unique name for localStorage
      partialize: (state) => ({ user: state.user, token: state.token }), // only persist these fields
    }
  )
);

export default useAuthStore;
