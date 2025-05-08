'use client';

import {
    ArrowPathIcon,
    BellIcon,
    ChatBubbleLeftEllipsisIcon,
    CheckCircleIcon,
    CheckIcon,
    ClockIcon,
    ExclamationCircleIcon,
    InformationCircleIcon,
    TrashIcon} from '@heroicons/react/24/outline';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';

import AppLayout from '@/components/layouts/AppLayout';

import useNotificationStore from '@/store/notificationStore';

const NotificationsPage: React.FC = () => {
    const {
        notifications,
        pagination,
        unreadCount,
        isLoading,
        error,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification
    } = useNotificationStore();

    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    // Fetch notifications on component mount
    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    // Handle notification click
    const handleNotificationClick = async (id: string) => {
        await markAsRead(id);
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        await markAllAsRead();
    };

    // Handle delete notification
    const handleDeleteNotification = async (id: string) => {
        await deleteNotification(id);
        setConfirmDelete(null);
    };

    // Handle pagination
    const handlePageChange = (page: number) => {
        fetchNotifications({ page });
    };

    // Get notification icon based on type
    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'task_assigned':
                return <CheckCircleIcon className="w-5 h-5 text-primary-500" />;
            case 'task_updated':
                return <ArrowPathIcon className="w-5 h-5 text-blue-500" />;
            case 'task_completed':
                return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
            case 'task_overdue':
                return <ExclamationCircleIcon className="w-5 h-5 text-red-500" />;
            case 'task_reminder':
                return <ClockIcon className="w-5 h-5 text-yellow-500" />;
            case 'comment':
                return <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-purple-500" />;
            default:
                return <InformationCircleIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    // Format relative time
    const getRelativeTime = (dateString: string) => {
        const date = new Date(dateString);
        return formatDistanceToNow(date, { addSuffix: true });
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { y: 10, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Notifications</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            {unreadCount > 0
                                ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                                : 'All caught up!'
                            }
                        </p>
                    </div>

                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAllAsRead}
                            className="flex items-center px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100"
                        >
                            <CheckIcon className="w-4 h-4 mr-2" />
                            Mark all as read
                        </button>
                    )}
                </div>

                {/* Notifications List */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <ArrowPathIcon className="w-10 h-10 text-primary-500 animate-spin" />
                            <p className="mt-4 text-gray-500">Loading notifications...</p>
                        </div>
                    ) : error ? (
                        <div className="p-4 text-center text-red-500 bg-red-50">
                            <p>Error loading notifications. Please try again.</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="flex items-center justify-center w-16 h-16 text-gray-300 bg-gray-100 rounded-full">
                                <BellIcon className="w-8 h-8" />
                            </div>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications yet</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Notifications about your assigned tasks will appear here
                            </p>
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="divide-y divide-gray-200"
                        >
                            {notifications.map((notification) => (
                                <motion.div
                                    key={notification._id}
                                    variants={itemVariants}
                                    className={`relative ${!notification.read ? 'bg-primary-50' : ''}`}
                                >
                                    <div className="flex px-6 py-4">
                                        <div className="flex-shrink-0 mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        <div className="flex-1 min-w-0 ml-4">
                                            <Link
                                                href={notification.relatedTask ? `/tasks/${notification.relatedTask}` : '#'}
                                                onClick={() => handleNotificationClick(notification._id)}
                                                className="block hover:bg-gray-50"
                                            >
                                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                                <p className="mt-1 text-sm text-gray-500">{notification.message}</p>
                                                <p className="mt-1 text-xs text-gray-400">
                                                    {getRelativeTime(notification.createdAt)} • {format(new Date(notification.createdAt), 'MMM d, yyyy h:mm a')}
                                                </p>
                                            </Link>
                                        </div>

                                        <div className="flex-shrink-0 flex ml-4">
                                            {!notification.read && (
                                                <button
                                                    onClick={() => handleNotificationClick(notification._id)}
                                                    className="p-1 text-primary-600 hover:text-primary-800"
                                                    title="Mark as read"
                                                >
                                                    <CheckIcon className="w-5 h-5" />
                                                </button>
                                            )}

                                            {confirmDelete === notification._id ? (
                                                <div className="flex items-center space-x-2">
                                                    <button
                                                        onClick={() => handleDeleteNotification(notification._id)}
                                                        className="p-1 text-red-600 hover:text-red-800"
                                                        title="Confirm delete"
                                                    >
                                                        <CheckIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(null)}
                                                        className="p-1 text-gray-600 hover:text-gray-800"
                                                        title="Cancel"
                                                    >
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDelete(notification._id)}
                                                    className="p-1 text-gray-400 hover:text-gray-600"
                                                    title="Delete notification"
                                                >
                                                    <TrashIcon className="w-5 h-5" />
                                                </button>
                                            )}
                                        </div>

                                        {!notification.read && (
                                            <div className="absolute top-4 right-4 h-2 w-2 bg-primary-500 rounded-full"></div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </div>

                {/* Pagination */}
                {!isLoading && notifications.length > 0 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                            {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
                            {pagination.total} notifications
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
};

export default NotificationsPage;