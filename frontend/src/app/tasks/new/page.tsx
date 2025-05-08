'use client';

import {
    ArrowLeftIcon,
    ArrowPathIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline';
import { ErrorMessage,Field, Form, Formik } from 'formik';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import React, { useEffect,useState } from 'react';
import { toast } from 'react-hot-toast';
import * as Yup from 'yup';

import AppLayout from '@/components/layouts/AppLayout';

import useAuthStore from '@/store/authStore';
import useTaskStore from '@/store/taskStore';

// Task creation validation schema
const TaskCreationSchema = Yup.object().shape({
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
        .required('Due date is required'),
    assignedTo: Yup.string()
        .required('Assigned user is required'),
    tags: Yup.string()
});

const CreateTaskPage: React.FC = () => {
    const router = useRouter();
    const { createTask, isLoading, error } = useTaskStore();
    const { user } = useAuthStore();
    const [userOptions, setUserOptions] = useState<any[]>([]);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Fetch users for assignment
    useEffect(() => {
        const fetchUsers = async () => {
            setIsLoadingUsers(true);
            try {
                // In a real app, this would be a proper API call to your backend
                // For now, we'll simulate some users based on the current user
                // In reality, you would have a proper API endpoint to fetch users

                // Simulated delay
                await new Promise(resolve => setTimeout(resolve, 500));

                // Example users
                const mockUsers = [
                    { _id: user?._id, name: user?.name, email: user?.email },
                    { _id: 'user2', name: 'Jane Smith', email: 'jane@example.com' },
                    { _id: 'user3', name: 'Michael Johnson', email: 'michael@example.com' },
                ];

                setUserOptions(mockUsers);
            } catch (error) {
                console.error('Error fetching users:', error);
                toast.error('Failed to load users');
            } finally {
                setIsLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [user]);

    // Handle task creation
    const handleCreateTask = async (values: any) => {
        try {
            // Process tags if provided
            if (values.tags) {
                values.tags = values.tags.split(',').map((tag: string) => tag.trim());
            } else {
                values.tags = [];
            }

            await createTask(values);
            toast.success('Task created successfully');
            router.push('/tasks/assigned');
        } catch (error) {
            toast.error('Failed to create task');
        }
    };

    // Get tomorrow's date as default due date
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
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
                    <div className="flex items-center">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center mr-4 text-sm text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeftIcon className="w-4 h-4 mr-1" />
                            Back
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-900">Create New Task</h1>
                    </div>
                </motion.div>

                {/* Task Creation Form */}
                <motion.div variants={itemVariants} className="bg-white rounded-lg shadow-sm">
                    <div className="p-6">
                        <Formik
                            initialValues={{
                                title: '',
                                description: '',
                                status: 'todo',
                                priority: 'medium',
                                dueDate: getTomorrowDate(),
                                assignedTo: user?._id || '',
                                isRecurring: false,
                                recurringPattern: 'none',
                                recurringEndDate: '',
                                tags: ''
                            }}
                            validationSchema={TaskCreationSchema}
                            onSubmit={handleCreateTask}
                        >
                            {({ values, errors, touched, setFieldValue }) => (
                                <Form className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                                            Title
                                        </label>
                                        <Field
                                            id="title"
                                            name="title"
                                            type="text"
                                            placeholder="Enter task title"
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
                                            placeholder="Enter task description"
                                            className={`mt-1 input-field ${errors.description && touched.description ? 'border-red-500' : ''
                                                }`}
                                        />
                                        <ErrorMessage
                                            name="description"
                                            component="p"
                                            className="mt-1 text-sm text-red-600"
                                        />
                                    </div>

                                    {/* Status and Priority */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                                    </div>

                                    {/* Due Date and Assigned To */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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

                                        {/* Assigned To */}
                                        <div>
                                            <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">
                                                Assigned To
                                            </label>
                                            <div className="relative mt-1">
                                                {isLoadingUsers ? (
                                                    <div className="flex items-center input-field">
                                                        <ArrowPathIcon className="w-5 h-5 mr-2 text-gray-400 animate-spin" />
                                                        <span className="text-gray-500">Loading users...</span>
                                                    </div>
                                                ) : (
                                                    <Field
                                                        as="select"
                                                        id="assignedTo"
                                                        name="assignedTo"
                                                        className={`input-field ${errors.assignedTo && touched.assignedTo ? 'border-red-500' : ''
                                                            }`}
                                                    >
                                                        <option value="">Select a user</option>
                                                        {userOptions.map((user) => (
                                                            <option key={user._id} value={user._id}>
                                                                {user.name} ({user.email})
                                                            </option>
                                                        ))}
                                                    </Field>
                                                )}
                                                <ErrorMessage
                                                    name="assignedTo"
                                                    component="p"
                                                    className="mt-1 text-sm text-red-600"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Tags */}
                                    <div>
                                        <label htmlFor="tags" className="block text-sm font-medium text-gray-700">
                                            Tags (comma separated)
                                        </label>
                                        <Field
                                            id="tags"
                                            name="tags"
                                            type="text"
                                            placeholder="e.g. frontend, bug, documentation"
                                            className="mt-1 input-field"
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Enter tags separated by commas (optional)
                                        </p>
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
                                            <p className="mt-1 text-xs text-gray-500">
                                                Leave blank for no end date
                                            </p>
                                        </div>
                                    )}

                                    {/* Submit button */}
                                    <div className="flex justify-end pt-4 mt-6 border-t">
                                        <button
                                            type="submit"
                                            className="btn-primary"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? (
                                                <>
                                                    <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                <>
                                                    <PlusCircleIcon className="w-5 h-5 mr-2" />
                                                    Create Task
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </Form>
                            )}
                        </Formik>
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
};

export default CreateTaskPage;