'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    HomeIcon,
    CheckCircleIcon,
    ClockIcon,
    PlusCircleIcon,
    BellIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    UserGroupIcon,
    ArrowLeftOnRectangleIcon,
    Bars3Icon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import useAuthStore from '@/store/authStore';
import useNotificationStore from '@/store/notificationStore';
import NotificationsPopover from '@/components/notification/NotificationsPopover';

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const pathname = usePathname();
    const { user, logout } = useAuthStore();
    const { unreadCount, fetchNotifications } = useNotificationStore();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

    // Fetch notifications when component mounts
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Close mobile menu when route changes
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    // Navigation items with access control
    const navigationItems = [
        { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['admin', 'manager', 'user'] },
        { name: 'My Tasks', href: '/tasks/assigned', icon: CheckCircleIcon, roles: ['admin', 'manager', 'user'] },
        { name: 'Created Tasks', href: '/tasks/created', icon: PlusCircleIcon, roles: ['admin', 'manager', 'user'] },
        { name: 'Overdue', href: '/tasks/overdue', icon: ClockIcon, roles: ['admin', 'manager', 'user'] },
        { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, roles: ['admin', 'manager'] },
        { name: 'Team', href: '/team', icon: UserGroupIcon, roles: ['admin', 'manager'] },
        { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['admin', 'manager', 'user'] },
    ];

    // Filter navigation items based on user role
    const filteredNavigation = navigationItems.filter(
        item => user && item.roles.includes(user.role)
    );

    // Handle logout
    const handleLogout = () => {
        logout();
    };

    // Mobile menu animation variants
    const menuVariants = {
        hidden: { x: '-100%', opacity: 0 },
        visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
        exit: { x: '-100%', opacity: 0, transition: { ease: 'easeInOut', duration: 0.3 } }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Mobile menu button */}
            <div className="fixed top-0 left-0 z-20 m-4 lg:hidden">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 text-gray-600 bg-white rounded-md shadow-sm hover:text-gray-800 focus:outline-none"
                >
                    <Bars3Icon className="w-6 h-6" />
                </button>
            </div>

            {/* Mobile Sidebar */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.5 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
                        />

                        {/* Sidebar */}
                        <motion.div
                            variants={menuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg lg:hidden"
                        >
                            <div className="flex items-center justify-between p-4 border-b">
                                <h1 className="text-xl font-semibold text-primary-600">Task Manager</h1>
                                <button onClick={() => setIsMobileMenuOpen(false)}>
                                    <XMarkIcon className="w-6 h-6 text-gray-600" />
                                </button>
                            </div>

                            <nav className="mt-4">
                                <div className="px-2 space-y-1">
                                    {filteredNavigation.map((item) => (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`
                        group flex items-center px-2 py-2 text-base font-medium rounded-md
                        ${pathname === item.href
                                                    ? 'bg-primary-100 text-primary-700'
                                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }
                      `}
                                        >
                                            <item.icon
                                                className={`
                          mr-4 h-6 w-6 flex-shrink-0
                          ${pathname === item.href
                                                        ? 'text-primary-600'
                                                        : 'text-gray-400 group-hover:text-gray-500'
                                                    }
                        `}
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            </nav>

                            {/* Mobile sidebar user section */}
                            <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200">
                                <div className="flex items-center px-4 py-3">
                                    <div className="flex-shrink-0">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600">
                                            {user?.name.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <div className="ml-3">
                                        <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                                        <p className="text-xs font-medium text-gray-500 capitalize">{user?.role}</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-1 ml-auto text-gray-400 rounded-full hover:text-gray-500"
                                    >
                                        <ArrowLeftOnRectangleIcon className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop Sidebar */}
            <div className="fixed inset-y-0 left-0 hidden w-64 border-r border-gray-200 bg-white lg:block">
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
                        <h1 className="text-xl font-semibold text-primary-600">Task Manager</h1>
                    </div>

                    <nav className="flex-1 px-4 mt-5 overflow-y-auto">
                        <div className="space-y-1">
                            {filteredNavigation.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`
                    group flex items-center px-2 py-2 text-sm font-medium rounded-md
                    ${pathname === item.href
                                            ? 'bg-primary-100 text-primary-700'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                  `}
                                >
                                    <item.icon
                                        className={`
                      mr-3 h-5 w-5 flex-shrink-0
                      ${pathname === item.href
                                                ? 'text-primary-600'
                                                : 'text-gray-400 group-hover:text-gray-500'
                                            }
                    `}
                                        aria-hidden="true"
                                    />
                                    {item.name}
                                </Link>
                            ))}
                        </div>
                    </nav>

                    {/* Desktop sidebar user section */}
                    <div className="px-4 py-4 border-t border-gray-200">
                        <div className="flex items-center">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary-100 text-primary-600">
                                    {user?.name.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                                <p className="text-xs font-medium text-gray-500 capitalize">{user?.role}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-1 ml-auto text-gray-400 rounded-full hover:text-gray-500"
                                title="Logout"
                            >
                                <ArrowLeftOnRectangleIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Top Navigation */}
                <header className="sticky top-0 z-10 flex items-center justify-end h-16 px-4 bg-white border-b border-gray-200 shadow-sm">
                    {/* Add task button */}
                    <Link
                        href="/tasks/new"
                        className="mr-4 btn-primary"
                    >
                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                        New Task
                    </Link>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                            className="p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none"
                            title="Notifications"
                        >
                            <BellIcon className="w-6 h-6" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs text-white bg-primary-600 rounded-full">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Notifications popover */}
                        {isNotificationsOpen && (
                            <NotificationsPopover
                                isOpen={isNotificationsOpen}
                                onClose={() => setIsNotificationsOpen(false)}
                            />
                        )}
                    </div>
                </header>

                {/* Page Content */}
                <main className="page-container">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AppLayout;