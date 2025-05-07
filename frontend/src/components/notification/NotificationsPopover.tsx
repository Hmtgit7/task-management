'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
    BellIcon,
    CheckCircleIcon,
    ClockIcon,
    ExclamationCircleIcon,
    ChatBubbleLeftEllipsisIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';
import useNotificationStore from '@/store/notificationStore';

interface NotificationsPopoverProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationsPopover: React.FC<NotificationsPopoverProps> = ({ isOpen, onClose }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const {
        notifications,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        isLoading
    } = useNotificationStore();

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Get icon based on notification type
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
                return <BellIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    // Handle notification click
    const handleNotificationClick = async (id: string) => {
        await markAsRead(id);
        onClose();
    };

    // Animation variants
    const popoverVariants = {
        hidden: { opacity: 0, y: -10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
    };

    return (
        <motion.div
            ref={popoverRef}
            variants={popoverVariants}
            initial="hidden"
            animate="visible"
            className="absolute right-0 z-10 w-80 mt-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5"
        >
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
                <button
                    onClick={() => markAllAsRead()}
                    className="text-xs text-primary-600 hover:text-primary-800"
                >
                    Mark all as read
                </button>
            </div>

            <div className="max-h-80 overflow-y-auto">
                {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                        <ArrowPathIcon className="w-5 h-5 mr-2 text-gray-400 animate-spin" />
                        <p className="text-sm text-gray-500">Loading notifications...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-6">
                        <BellIcon className="w-8 h-8 mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">No notifications yet</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {notifications.slice(0, 5).map((notification) => (
                            <li key={notification._id} className="relative">
                                <Link
                                    href={notification.relatedTask ? `/tasks/${notification.relatedTask}` : '#'}
                                    onClick={() => handleNotificationClick(notification._id)}
                                    className={`
                    block px-4 py-3 hover:bg-gray-50 transition-colors
                    ${!notification.read ? 'bg-primary-50' : ''}
                  `}
                                >
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="ml-3 w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-900">
                                                {notification.title}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-400">
                                                {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                                {!notification.read && (
                                    <div className="absolute top-3 right-4 h-2 w-2 bg-primary-500 rounded-full"></div>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="p-4 border-t border-gray-200">
                <Link
                    href="/notifications"
                    onClick={onClose}
                    className="block text-sm text-center text-primary-600 hover:text-primary-800"
                >
                    View all notifications
                </Link>
            </div>
        </motion.div>
    );
};

export default NotificationsPopover;