'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, isAfter, parseISO } from 'date-fns';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
    ArrowPathIcon,
    ClockIcon,
    CheckIcon,
    ExclamationTriangleIcon,
    CalendarIcon,
    UserCircleIcon,
    TagIcon,
    TrashIcon,
    PencilIcon,
    ArrowLeftIcon,
    ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import AppLayout from '@/components/layouts/AppLayout';
import useTaskStore from '@/store/taskStore';
import useAuthStore from '@/store/authStore';
import { joinTaskRoom, leaveTaskRoom } from '@/services/socketService';

const TaskDetailPage: React.FC = () => {
    const params = useParams();
    const router = useRouter();
    const taskId = params.id as string;
    const { task, isLoading, error, fetchTaskById, updateTask, deleteTask } = useTaskStore();
    const { user } = useAuthStore();

    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Fetch task on component mount
    useEffect(() => {
        if (taskId) {
            fetchTaskById(taskId).catch(err => {
                console.error("Error fetching task:", err);
                toast.error("Failed to load task details");
            });

            // Join socket room for real-time updates
            joinTaskRoom(taskId);

            // Leave room on unmount
            return () => {
                leaveTaskRoom(taskId);
            };
        }
    }, [taskId, fetchTaskById]);

    // Check if user can edit/delete the task - with null checks to prevent errors
    const canEdit = user && task && (
        user.role === 'admin' ||
        user.role === 'manager' ||
        (task.createdBy && task.createdBy._id === user._id) ||
        (task.assignedTo && task.assignedTo._id === user._id)
    );

    // Handle task update
    const handleUpdateTask = async (values: any) => {
        try {
            // Clean values before sending to API// Clean values before sending to API
            const cleanedValues = { ...values };

            // Ensure dates are in the correct format
            if (cleanedValues.dueDate) {
                try {
                    // Validate the date format
                    const date = new Date(cleanedValues.dueDate);
                    if (isNaN(date.getTime())) {
                        throw new Error("Invalid due date format");
                    }
                } catch (error) {
                    toast.error("Invalid date format. Please use YYYY-MM-DD format.");
                    return;
                }
            }

            // Remove any undefined or null values
            Object.keys(cleanedValues).forEach(key => {
                if (cleanedValues[key] === undefined || cleanedValues[key] === null) {
                    delete cleanedValues[key];
                }
            });

            // If marking as completed, ensure we have the completed status
            if (cleanedValues.status === 'completed') {
                cleanedValues.completedAt = new Date().toISOString();
            }

            await updateTask(taskId, cleanedValues);
            setIsEditing(false);
            toast.success('Task updated successfully');
        } catch (error) {
            console.error("Error updating task:", error);
            toast.error('Failed to update task. Please try again.');
        }
    };

    // Handle task deletion
    const handleDeleteTask = async () => {
        try {
            await deleteTask(taskId);
            toast.success('Task deleted successfully');
            router.push('/tasks/assigned');
        } catch (error) {
            console.error("Error deleting task:", error);
            toast.error('Failed to delete task. Please try again.');
        }
    };

    // Format date for display with error handling
    const formatDate = (date: string | null | undefined) => {
        if (!date) return 'Not set';
        try {
            return format(parseISO(date), 'MMM d, yyyy');
        } catch (error) {
            console.error('Error formatting date:', date, error);
            return 'Invalid date';
        }
    };

    // Check if task is overdue - with null check to prevent errors
    const isOverdue = task &&
        task.status !== 'completed' &&
        task.dueDate &&
        isAfter(new Date(), parseISO(task.dueDate));

    // Handle mark as completed action
    const handleMarkAsCompleted = async () => {
        try {
            await updateTask(taskId, { status: 'completed', completedAt: new Date().toISOString() });
            toast.success('Task marked as completed');
        } catch (error) {
            console.error("Error marking task as completed:", error);
            toast.error('Failed to mark task as completed');
        }
    };

    // Animation variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                when: "beforeChildren",
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    // Loading state
    if (isLoading || !task) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center py-12">
                    <ArrowPathIcon className="w-10 h-10 text-primary-500 animate-spin" />
                    <p className="mt-4 text-lg text-gray-600">Loading task...</p>
                </div>
            </AppLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <AppLayout>
                <div className="p-4 text-center text-red-500 bg-red-50 rounded-md">
                    <ExclamationCircleIcon className="w-10 h-10 mx-auto mb-4" />
                    <p className="text-lg">Error loading task: {error}</p>
                    <button
                        onClick={() => router.back()}
                        className="mt-4 btn-primary"
                    >
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Go Back
                    </button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
            >
                {/* Header */}
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                    >
                        <ArrowLeftIcon className="w-4 h-4 mr-1" />
                        Back
                    </button>

                    {canEdit && (
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="btn-secondary"
                            >
                                <PencilIcon className="w-5 h-5 mr-2" />
                                {isEditing ? 'Cancel' : 'Edit'}
                            </button>

                            <button
                                onClick={() => setIsDeleting(true)}
                                className="btn-danger"
                            >
                                <TrashIcon className="w-5 h-5 mr-2" />
                                Delete
                            </button>
                        </div>
                    )}
                </motion.div>

                {/* Task Details */}
                {!isEditing ? (
                    // View Mode
                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm">
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <h1 className="text-2xl font-semibold text-gray-900">{task.title || 'Untitled Task'}</h1>
                                <div className="flex space-x-2">
                                    <span className={`status-badge ${task.status === 'completed' ? 'status-completed' :
                                        task.status === 'in-progress' ? 'status-in-progress' :
                                            task.status === 'review' ? 'status-review' :
                                                isOverdue ? 'bg-red-100 text-red-800' : 'status-todo'
                                        }`}>
                                        {task.status === 'todo' && isOverdue ? 'Overdue' : (task.status ? task.status.replace('-', ' ') : 'To Do')}
                                    </span>

                                    <span className={`priority-badge ${task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                        task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                            task.priority === 'medium' ? 'priority-medium' :
                                                'priority-low'
                                        }`}>
                                        {task.priority || 'Medium'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h2 className="text-sm font-medium text-gray-500">Description</h2>
                                <p className="mt-2 text-gray-700 whitespace-pre-line">{task.description || 'No description provided'}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2">
                                <div>
                                    <h2 className="text-sm font-medium text-gray-500">Due Date</h2>
                                    <div className="flex items-center mt-2">
                                        <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                                        <p className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                                            {task.dueDate ? formatDate(task.dueDate) : 'Not set'}
                                            {isOverdue && ' (Overdue)'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-sm font-medium text-gray-500">Created At</h2>
                                    <div className="flex items-center mt-2">
                                        <ClockIcon className="w-5 h-5 mr-2 text-gray-400" />
                                        <p className="text-gray-700">{task.createdAt ? formatDate(task.createdAt) : 'Not available'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-sm font-medium text-gray-500">Assigned To</h2>
                                    <div className="flex items-center mt-2">
                                        <UserCircleIcon className="w-5 h-5 mr-2 text-gray-400" />
                                        <p className="text-gray-700">{task.assignedTo?.name || 'Unassigned'}</p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-sm font-medium text-gray-500">Created By</h2>
                                    <div className="flex items-center mt-2">
                                        <UserCircleIcon className="w-5 h-5 mr-2 text-gray-400" />
                                        <p className="text-gray-700">{task.createdBy?.name || 'Unknown'}</p>
                                    </div>
                                </div>

                                {task.completedAt && (
                                    <div>
                                        <h2 className="text-sm font-medium text-gray-500">Completed At</h2>
                                        <div className="flex items-center mt-2">
                                            <CheckIcon className="w-5 h-5 mr-2 text-green-500" />
                                            <p className="text-gray-700">{formatDate(task.completedAt)}</p>
                                        </div>
                                    </div>
                                )}

                                {task.tags && task.tags.length > 0 && (
                                    <div>
                                        <h2 className="text-sm font-medium text-gray-500">Tags</h2>
                                        <div className="flex flex-wrap items-center mt-2 gap-2">
                                            <TagIcon className="w-5 h-5 text-gray-400" />
                                            {task.tags.map((tag, index) => (
                                                <span
                                                    key={index}
                                                    className="px-2 py-1 text-xs bg-gray-100 rounded-full text-gray-700"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {task.isRecurring && (
                                    <div>
                                        <h2 className="text-sm font-medium text-gray-500">Recurring Task</h2>
                                        <div className="flex items-center mt-2">
                                            <ArrowPathIcon className="w-5 h-5 mr-2 text-gray-400" />
                                            <p className="text-gray-700">
                                                {task.recurringPattern ?
                                                    task.recurringPattern.charAt(0).toUpperCase() + task.recurringPattern.slice(1) :
                                                    'Recurring'}
                                                {task.recurringEndDate && ` (Until ${formatDate(task.recurringEndDate)})`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {task.status !== 'completed' && canEdit && (
                                <div className="mt-8">
                                    <button
                                        onClick={handleMarkAsCompleted}
                                        className="btn-primary"
                                    >
                                        <CheckIcon className="w-5 h-5 mr-2" />
                                        Mark as Completed
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    // Edit Mode
                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900">Edit Task</h2>

                            <form className="mt-4 space-y-4" onSubmit={(e) => {
                                e.preventDefault();
                                const formData = new FormData(e.currentTarget);
                                const values: any = {
                                    title: formData.get('title') as string,
                                    description: formData.get('description') as string,
                                    status: formData.get('status') as string,
                                    priority: formData.get('priority') as string,
                                    dueDate: formData.get('dueDate') as string,
                                    isRecurring: formData.get('isRecurring') === 'on',
                                };

                                // Only add recurring pattern if isRecurring is true
                                if (values.isRecurring) {
                                    values.recurringPattern = formData.get('recurringPattern') as string;
                                    // Only add end date if a pattern is selected
                                    if (values.recurringPattern !== 'none') {
                                        const endDate = formData.get('recurringEndDate') as string;
                                        if (endDate) values.recurringEndDate = endDate;
                                    }
                                }

                                handleUpdateTask(values);
                            }}>
                                {/* Title */}
                                <div>
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                        Title
                                    </label>
                                    <input
                                        id="title"
                                        name="title"
                                        type="text"
                                        defaultValue={task.title || ''}
                                        required
                                        className="mt-1 input-field"
                                    />
                                </div>

                                {/* Description */}
                                <div>
                                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                        Description
                                    </label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        rows={4}
                                        defaultValue={task.description || ''}
                                        required
                                        className="mt-1 input-field"
                                    />
                                </div>

                                {/* Status */}
                                <div>
                                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <select
                                        id="status"
                                        name="status"
                                        defaultValue={task.status || 'todo'}
                                        className="mt-1 input-field"
                                    >
                                        <option value="todo">To Do</option>
                                        <option value="in-progress">In Progress</option>
                                        <option value="review">In Review</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                {/* Priority */}
                                <div>
                                    <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                                        Priority
                                    </label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        defaultValue={task.priority || 'medium'}
                                        className="mt-1 input-field"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                {/* Due Date */}
                                <div>
                                    <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                                        Due Date
                                    </label>
                                    <input
                                        id="dueDate"
                                        name="dueDate"
                                        type="date"
                                        defaultValue={task.dueDate ? task.dueDate.split('T')[0] : ''}
                                        required
                                        className="mt-1 input-field"
                                    />
                                </div>

                                {/* Is Recurring */}
                                <div className="flex items-center">
                                    <input
                                        id="isRecurring"
                                        name="isRecurring"
                                        type="checkbox"
                                        defaultChecked={task.isRecurring}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                    />
                                    <label htmlFor="isRecurring" className="block ml-2 text-sm text-gray-700">
                                        Recurring Task
                                    </label>
                                </div>

                                {/* Recurring Pattern (only if isRecurring is true) */}
                                <div>
                                    <label htmlFor="recurringPattern" className="block text-sm font-medium text-gray-700">
                                        Recurring Pattern
                                    </label>
                                    <select
                                        id="recurringPattern"
                                        name="recurringPattern"
                                        defaultValue={task.recurringPattern || 'none'}
                                        className="mt-1 input-field"
                                    >
                                        <option value="none">None</option>
                                        <option value="daily">Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="monthly">Monthly</option>
                                    </select>
                                </div>

                                {/* Recurring End Date */}
                                <div>
                                    <label htmlFor="recurringEndDate" className="block text-sm font-medium text-gray-700">
                                        Recurring End Date (Optional)
                                    </label>
                                    <input
                                        id="recurringEndDate"
                                        name="recurringEndDate"
                                        type="date"
                                        defaultValue={task.recurringEndDate ? task.recurringEndDate.split('T')[0] : ''}
                                        className="mt-1 input-field"
                                    />
                                </div>

                                {/* Submit buttons */}
                                <div className="flex justify-end pt-4 mt-6 space-x-2 border-t">
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(false)}
                                        className="btn-outline"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn-primary"
                                    >
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleting && (
                    <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="p-6 bg-white rounded-lg shadow-xl">
                            <h3 className="text-lg font-medium text-gray-900">Delete Task</h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Are you sure you want to delete this task? This action cannot be undone.
                            </p>
                            <div className="flex justify-end mt-4 space-x-2">
                                <button
                                    onClick={() => setIsDeleting(false)}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteTask}
                                    className="btn-danger"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </motion.div>
        </AppLayout>
    );
};

export default TaskDetailPage;