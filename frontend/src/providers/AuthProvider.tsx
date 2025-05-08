'use client';

import { useEffect, createContext, useContext, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import useAuthStore from '@/store/authStore';
import LoadingScreen from '@/components/common/LoadingScreen';

// Create auth context
interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    isGuestMode: boolean;
}

const AuthContext = createContext<AuthContextType>({
    isAuthenticated: false,
    isLoading: true,
    isGuestMode: false,
});

// Auth provider component
const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, isLoading, checkAuthState, user } = useAuthStore();
    const [isChecking, setIsChecking] = useState(true);

    // Check if in guest mode
    const isGuestMode = user?.email === 'guest@example.com';

    useEffect(() => {
        const checkAuth = async () => {
            await checkAuthState();
            setIsChecking(false);
        };

        checkAuth();
    }, [checkAuthState]);

    useEffect(() => {
        if (isChecking) return;

        // Public routes that don't require authentication
        const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
        const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));

        // Redirect logic
        if (!isAuthenticated && !isPublicRoute && pathname !== '/') {
            router.push('/login');
        } else if (isAuthenticated && (pathname === '/login' || pathname === '/register')) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, pathname, router, isChecking]);

    // Show loading screen while checking authentication
    if (isChecking) {
        return <LoadingScreen />;
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, isGuestMode }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

export default AuthProvider;