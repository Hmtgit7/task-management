'use client';

import { useEffect, createContext, useContext } from 'react';
import { Socket } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import { initializeSocket, getSocket } from '@/services/socketService';

// Create socket context
interface SocketContextType {
    socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
});

// Socket provider component
const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { isAuthenticated, token } = useAuthStore();
    const { initializeRealTimeNotifications } = useNotificationStore();

    // Initialize socket when user authenticates
    useEffect(() => {
        if (isAuthenticated && token) {
            // Initialize socket connection
            initializeSocket(token);

            // Set up notification handling
            initializeRealTimeNotifications();

            // Clean up on unmount
            return () => {
                const socket = getSocket();
                if (socket) {
                    socket.disconnect();
                }
            };
        }
    }, [isAuthenticated, token, initializeRealTimeNotifications]);

    // Handle service worker messages for offline sync
    useEffect(() => {
        if (typeof window !== 'undefined' && navigator.serviceWorker) {
            const handleServiceWorkerMessage = (event: MessageEvent) => {
                if (event.data && event.data.type === 'SYNC_COMPLETED') {
                    toast.success(`${event.data.synced} tasks synced successfully`);
                }
            };

            navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

            return () => {
                navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
            };
        }
    }, []);

    return (
        <SocketContext.Provider value={{ socket: getSocket() }}>
            {children}
        </SocketContext.Provider>
    );
};

// Custom hook to use socket context
export const useSocket = () => useContext(SocketContext);

export default SocketProvider;