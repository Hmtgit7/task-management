'use client';

import React from 'react';
import Link from 'next/link';
import { format, isAfter, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import {
    ClockIcon,
    CheckIcon,
    ArrowPathIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Task } from '@/store/taskStore';

interface TaskCardProps {
    task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
    // Check if task is overdue - with proper error handling
    const isOverdue = () => {
        try {
            if (!task.dueDate) return false;
            return task.status !== 'completed' && isAfter(new Date(), parseISO(task.dueDate));
        } catch (error) {
            console.error('Error checking overdue status:', error);
            return false;
        }
    };

    // Format date safely
    const formatDate = (dateString: string | undefined | null) => {
        if (!dateString) return 'No date';
        try {
            return format(parseISO(dateString), 'MMM d, yyyy');
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Invalid date';
        }
    };

    // Get status icon
    const getStatusIcon = () => {
        switch (task.status) {
            case 'completed':
                return <CheckIcon className="w-5 h-5 text-green-500" />;
            case 'in-progress':
                return <ArrowPathIcon className="w-5 h-5 text-blue-500" />;
            case 'review':
                return <ClockIcon className="w-5 h-5 text-purple-500" />;
            default:
                return isOverdue()
                    ? <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                    : <ClockIcon className="w-5 h-5 text-gray-500" />;
        }
    };

    // Get status badge class
    const getStatusBadgeClass = () => {
        switch (task.status) {
            case 'completed':
                return 'status-badge status-completed';
            case 'in-progress':
                return 'status-badge status-in-progress';
            case 'review':
                return 'status-badge status-review';
            default:
                return `status-badge ${isOverdue() ? 'bg-red-100 text-red-800' : 'status-todo'}`;
        }
    };

    // Get priority badge class
    const getPriorityBadgeClass = () => {
        switch (task.priority) {
            case 'urgent':
                return 'priority-badge bg-red-100 text-red-800';
            case 'high':
                return 'priority-badge bg-orange-100 text-orange-800';
            case 'medium':
                return 'priority-badge priority-medium';
            default:
                return 'priority-badge priority-low';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start space-x-2">
                    <div className="mt-1 flex-shrink-0">
                        {getStatusIcon()}
                    </div>
                    <div>
                        <Link
                            href={`/tasks/${task._id}`}
                            className="text-lg font-medium text-gray-900 hover:text-primary-600"
                        >
                            {task.title || 'Untitled Task'}
                        </Link>
                        <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {task.description || 'No description provided'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center mt-3 sm:mt-0 gap-2">
                    <span className={getStatusBadgeClass()}>
                        {task.status === 'todo' && isOverdue() ? 'Overdue' :
                            task.status ? task.status.replace('-', ' ') : 'Todo'}
                    </span>
                    <span className={getPriorityBadgeClass()}>
                        {task.priority || 'Low'}
                    </span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 text-sm text-gray-500">
                <div className="flex items-center">
                    <ClockIcon className="w-4 h-4 mr-1" />
                    Due: {task.dueDate ? formatDate(task.dueDate) : 'Not set'}
                </div>

                <div className="mt-2 sm:mt-0 flex items-center">
                    <div className="flex-shrink-0 mr-1">
                        <div className="flex items-center justify-center w-5 h-5 text-xs rounded-full bg-primary-100 text-primary-800">
                            {task.assignedTo?.name ? task.assignedTo.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                    </div>
                    <span className="truncate">
                        Assigned to: {task.assignedTo?.name || 'Unassigned'}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default TaskCard;