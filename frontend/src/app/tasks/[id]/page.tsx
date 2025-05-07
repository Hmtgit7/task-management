'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format, isAfter } from 'date-fns';
import { motion } from 'framer-motion';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
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

// Task update validation schema
const TaskUpdateSchema = Yup.object().shape({
    title: Yup.string()
        .required('Title is required')
        .max(100, 'Title must be less than 100 characters'),
    description: Yup.string()
        .required('Description is required')
        .max(500, 'Description must be less than 500 characters'),
    status: Yup.string()
        .required('Status is required')
        .oneOf(['todo', 'in-progress', 'review', 'completed'], 'Invalid status'),
    priority: Yup.string()
        .required('Priority is required')
        .oneOf(['low', 'medium', 'high', 'urgent'], 'Invalid priority'),
    dueDate: Yup.date()
        .required('Due date is required')
});

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
            fetchTaskById(taskId);

            // Join socket room for real-time updates
            joinTaskRoom(taskId);

            // Leave room on unmount
            return () => {
                leaveTaskRoom(taskId);
            };
        }
    }, [taskId, fetchTaskById]);

    // Check if user can edit/delete the task
    const canEdit = user && task && (
        user.role === 'admin' ||
        user.role === 'manager' ||
        task.createdBy._id === user._id ||
        task.assignedTo._id === user._id
    );

    // Handle task update
    const handleUpdateTask = async (values: any) => {
        try {
            await updateTask(taskId, values);
            setIsEditing(false);
            toast.success('Task updated successfully');
        } catch (error) {
            toast.error('Failed to update task');
        }
    };

    // Handle task deletion
    const handleDeleteTask = async () => {
        try {
            await deleteTask(taskId);
            toast.success('Task deleted successfully');
            router.push('/tasks/assigned');
        } catch (error) {
            toast.error('Failed to delete task');
        }
    };

    // Format date for display
    const formatDate = (date: string) => {
        return format(new Date(date), 'MMM d, yyyy');
    };

    // Check if task is overdue
    const isOverdue = task && task.status !== 'completed' && isAfter(new Date(), new Date(task.dueDate));

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
                                <h1 className="text-2xl font-semibold text-gray-900">{task.title}</h1>
                                <div className="flex space-x-2">
                                    <span className={`status-badge ${task.status === 'completed' ? 'status-completed' :
                                            task.status === 'in-progress' ? 'status-in-progress' :
                                                task.status === 'review' ? 'status-review' :
                                                    isOverdue ? 'bg-red-100 text-red-800' : 'status-todo'
                                        }`}>
                                        {task.status === 'todo' && isOverdue ? 'Overdue' : task.status.replace('-', ' ')}
                                    </span>

                                    <span className={`priority-badge ${task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                                task.priority === 'medium' ? 'priority-medium' :
                                                    'priority-low'
                                        }`}>
                                        {task.priority}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-6">
                                <h2 className="text-sm font-medium text-gray-500">Description</h2>
                                <p className="mt-2 text-gray-700 whitespace-pre-line">{task.description}</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2">
                                <div>
                                    <h2 className="text-sm font-medium text-gray-500">Due Date</h2>
                                    <div className="flex items-center mt-2">
                                        <CalendarIcon className="w-5 h-5 mr-2 text-gray-400" />
                                        <p className={`${isOverdue ? 'text-red-600 font-medium' : 'text-gray-700'}`}>
                                            {formatDate(task.dueDate)}
                                            {isOverdue && ' (Overdue)'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-sm font-medium text-gray-500">Created At</h2>
                                    <div className="flex items-center mt-2">
                                        <ClockIcon className="w-5 h-5 mr-2 text-gray-400" />
                                        <p className="text-gray-700">{formatDate(task.createdAt)}</p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-sm font-medium text-gray-500">Assigned To</h2>
                                    <div className="flex items-center mt-2">
                                        <UserCircleIcon className="w-5 h-5 mr-2 text-gray-400" />
                                        <p className="text-gray-700">{task.assignedTo.name}</p>
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-sm font-medium text-gray-500">Created By</h2>
                                    <div className="flex items-center mt-2">
                                        <UserCircleIcon className="w-5 h-5 mr-2 text-gray-400" />
                                        <p className="text-gray-700">{task.createdBy.name}</p>
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
                                                {task.recurringPattern.charAt(0).toUpperCase() + task.recurringPattern.slice(1)}
                                                {task.recurringEndDate && ` (Until ${formatDate(task.recurringEndDate)})`}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {task.status !== 'completed' && canEdit && (
                                <div className="mt-8">
                                    <button
                                        onClick={() => handleUpdateTask({ ...task, status: 'completed' })}
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

                            <Formik
                                initialValues={{
                                    title: task.title,
                                    description: task.description,
                                    status: task.status,
                                    priority: task.priority,
                                    dueDate: task.dueDate.split('T')[0], // Format date for input
                                    isRecurring: task.isRecurring,
                                    recurringPattern: task.recurringPattern,
                                    recurringEndDate: task.recurringEndDate ? task.recurringEndDate.split('T')[0] : '',
                                    assignedTo: task.assignedTo._id
                                }}
                                validationSchema={TaskUpdateSchema}
                                onSubmit={handleUpdateTask}
                            >
                                {({ values, errors, touched, setFieldValue }) => (
                                    <Form className="mt-4 space-y-4">
                                        {/* Title */}
                                        <div>
                                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                                Title
                                            </label>
                                            <Field
                                                id="title"
                                                name="title"
                                                type="text"
                                                className={`mt-1 input-field ${errors.title && touched.title ? 'border-red-500' : ''
                                                    }`}
                                            />
                                            <ErrorMessage
                                                name="title"
                                                component="p"
                                                className="mt-1 text-sm text-red-600"
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                                Description
                                            </label>
                                            <Field
                                                as="textarea"
                                                id="description"
                                                name="description"
                                                rows={4}
                                                className={`mt-1 input-field ${errors.description && touched.description ? 'border-red-500' : ''
                                                    }`}
                                            />
                                            <ErrorMessage
                                                name="description"
                                                component="p"
                                                className="mt-1 text-sm text-red-600"
                                            />
                                        </div>

                                        {/* Status */}
                                        <div>
                                            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                                Status
                                            </label>
                                            <Field
                                                as="select"
                                                id="status"
                                                name="status"
                                                className={`mt-1 input-field ${errors.status && touched.status ? 'border-red-500' : ''
                                                    }`}
                                            >
                                                <option value="todo">To Do</option>
                                                <option value="in-progress">In Progress</option>
                                                <option value="review">In Review</option>
                                                <option value="completed">Completed</option>
                                            </Field>
                                            <ErrorMessage
                                                name="status"
                                                component="p"
                                                className="mt-1 text-sm text-red-600"
                                            />
                                        </div>

                                        {/* Priority */}
                                        <div>
                                            <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                                                Priority
                                            </label>
                                            <Field
                                                as="select"
                                                id="priority"
                                                name="priority"
                                                className={`mt-1 input-field ${errors.priority && touched.priority ? 'border-red-500' : ''
                                                    }`}
                                            >
                                                <option value="low">Low</option>
                                                <option value="medium">Medium</option>
                                                <option value="high">High</option>
                                                <option value="urgent">Urgent</option>
                                            </Field>
                                            <ErrorMessage
                                                name="priority"
                                                component="p"
                                                className="mt-1 text-sm text-red-600"
                                            />
                                        </div>

                                        {/* Due Date */}
                                        <div>
                                            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">
                                                Due Date
                                            </label>
                                            <Field
                                                id="dueDate"
                                                name="dueDate"
                                                type="date"
                                                className={`mt-1 input-field ${errors.dueDate && touched.dueDate ? 'border-red-500' : ''
                                                    }`}
                                            />
                                            <ErrorMessage
                                                name="dueDate"
                                                component="p"
                                                className="mt-1 text-sm text-red-600"
                                            />
                                        </div>

                                        {/* Is Recurring */}
                                        <div className="flex items-center">
                                            <Field
                                                id="isRecurring"
                                                name="isRecurring"
                                                type="checkbox"
                                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                            />
                                            <label htmlFor="isRecurring" className="block ml-2 text-sm text-gray-700">
                                                Recurring Task
                                            </label>
                                        </div>

                                        {/* Recurring Pattern (only if isRecurring is true) */}
                                        {values.isRecurring && (
                                            <div>
                                                <label htmlFor="recurringPattern" className="block text-sm font-medium text-gray-700">
                                                    Recurring Pattern
                                                </label>
                                                <Field
                                                    as="select"
                                                    id="recurringPattern"
                                                    name="recurringPattern"
                                                    className="mt-1 input-field"
                                                >
                                                    <option value="none">None</option>
                                                    <option value="daily">Daily</option>
                                                    <option value="weekly">Weekly</option>
                                                    <option value="monthly">Monthly</option>
                                                </Field>
                                            </div>
                                        )}

                                        {/* Recurring End Date (only if isRecurring is true and pattern is not none) */}
                                        {values.isRecurring && values.recurringPattern !== 'none' && (
                                            <div>
                                                <label htmlFor="recurringEndDate" className="block text-sm font-medium text-gray-700">
                                                    Recurring End Date (Optional)
                                                </label>
                                                <Field
                                                    id="recurringEndDate"
                                                    name="recurringEndDate"
                                                    type="date"
                                                    className="mt-1 input-field"
                                                />
                                            </div>
                                        )}

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
                                    </Form>
                                )}
                            </Formik>
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