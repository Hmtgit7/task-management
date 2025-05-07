'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
    CheckCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
    PlusCircleIcon
} from '@heroicons/react/24/outline';
import AppLayout from '@/components/layouts/AppLayout';
import TaskCard from '@/components/tasks/TaskCard';
import TaskStatusChart from '@/components/dashboard/TaskStatusChart';
import TaskPriorityChart from '@/components/dashboard/TaskPriorityChart';
import useAnalyticsStore from '@/store/analyticsStore';
import useTaskStore from '@/store/taskStore';
import useAuthStore from '@/store/authStore';
import Link from 'next/link';

const DashboardPage: React.FC = () => {
    const { dashboardStats, fetchDashboardStats, isLoading: isLoadingStats } = useAnalyticsStore();
    const { tasks, fetchTasksDueToday, isLoading: isLoadingTasks } = useTaskStore();
    const { user } = useAuthStore();

    // Fetch dashboard data
    useEffect(() => {
        // Use try-catch to avoid uncaught promise rejections
        const fetchData = async () => {
            try {
                await fetchDashboardStats();
                await fetchTasksDueToday();
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
                // Error is already handled in the store
            }
        };

        fetchData();
    }, [fetchDashboardStats, fetchTasksDueToday]);

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

    // Date formatting
    const today = new Date();
    const formattedDate = format(today, 'EEEE, MMMM d, yyyy');

    // Loading state
    if (isLoadingStats && !dashboardStats) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center h-full">
                    <ArrowPathIcon className="w-10 h-10 text-primary-500 animate-spin" />
                    <p className="mt-4 text-lg text-gray-600">Loading dashboard data...</p>
                </div>
            </AppLayout>
        );
    }

    // Initialize empty stats if they're undefined
    const stats = dashboardStats || {
        assignedTasksCount: 0,
        createdTasksCount: 0,
        overdueTasksCount: 0,
        tasksDueToday: 0,
        recentAssignedTasks: [],
        tasksByPriority: [],
        tasksByStatus: [],
        unreadNotifications: 0
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
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
                        <p className="mt-1 text-sm text-gray-500">{formattedDate}</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <p className="text-sm font-medium text-gray-600">
                            Welcome back, <span className="text-primary-600">{user?.name}</span>
                        </p>
                    </div>
                </motion.div>

                {/* Stats Cards */}
                <motion.div variants={itemVariants}>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Assigned Tasks Card */}
                        <div className="p-5 bg-white rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-primary-100">
                                    <CheckCircleIcon className="w-6 h-6 text-primary-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Assigned Tasks</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {stats.assignedTasksCount || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link href="/tasks/assigned" className="text-sm text-primary-600 hover:text-primary-800">
                                    View all assigned tasks &rarr;
                                </Link>
                            </div>
                        </div>

                        {/* Created Tasks Card */}
                        <div className="p-5 bg-white rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-100">
                                    <PlusCircleIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Created Tasks</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {stats.createdTasksCount || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link href="/tasks/created" className="text-sm text-primary-600 hover:text-primary-800">
                                    View all created tasks &rarr;
                                </Link>
                            </div>
                        </div>

                        {/* Overdue Tasks Card */}
                        <div className="p-5 bg-white rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-red-100">
                                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Overdue Tasks</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {stats.overdueTasksCount || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link href="/tasks/overdue" className="text-sm text-primary-600 hover:text-primary-800">
                                    View all overdue tasks &rarr;
                                </Link>
                            </div>
                        </div>

                        {/* Due Today Card */}
                        <div className="p-5 bg-white rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-yellow-100">
                                    <ClockIcon className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Due Today</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {stats.tasksDueToday || 0}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link href="/tasks/due-today" className="text-sm text-primary-600 hover:text-primary-800">
                                    View tasks due today &rarr;
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Charts Section */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                    {/* Task Status Chart */}
                    <div className="p-5 bg-white rounded-lg shadow">
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Tasks by Status</h2>
                        <div className="h-64">
                            <TaskStatusChart data={stats.tasksByStatus || []} />
                        </div>
                    </div>

                    {/* Task Priority Chart */}
                    <div className="p-5 bg-white rounded-lg shadow">
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Tasks by Priority</h2>
                        <div className="h-64">
                            <TaskPriorityChart data={stats.tasksByPriority || []} />
                        </div>
                    </div>
                </motion.div>

                {/* Tasks Due Today Section */}
                <motion.div variants={itemVariants}>
                    <div className="p-5 bg-white rounded-lg shadow">
                        <h2 className="mb-4 text-lg font-medium text-gray-900">Tasks Due Today</h2>
                        {isLoadingTasks ? (
                            <div className="flex items-center justify-center py-8">
                                <ArrowPathIcon className="w-6 h-6 mr-2 text-primary-500 animate-spin" />
                                <p className="text-gray-500">Loading tasks...</p>
                            </div>
                        ) : tasks.length === 0 ? (
                            <div className="py-8 text-center">
                                <CheckCircleIcon className="w-12 h-12 mx-auto text-green-500" />
                                <p className="mt-2 text-lg font-medium text-gray-900">All caught up!</p>
                                <p className="text-gray-500">You have no tasks due today.</p>
                                <Link
                                    href="/tasks/new"
                                    className="inline-flex items-center px-4 py-2 mt-4 text-sm btn-primary"
                                >
                                    <PlusCircleIcon className="w-5 h-5 mr-2" /> Create New Task
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {tasks.map((task) => (
                                    <TaskCard key={task._id} task={task} />
                                ))}
                                <div className="pt-2 mt-4 text-center border-t">
                                    <Link href="/tasks/due-today" className="text-sm text-primary-600 hover:text-primary-800">
                                        View all tasks due today &rarr;
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Recent Notifications Section */}
                <motion.div variants={itemVariants}>
                    <div className="p-5 bg-white rounded-lg shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
                            <Link href="/notifications" className="text-sm text-primary-600 hover:text-primary-800">
                                View all
                            </Link>
                        </div>
                        {dashboardStats?.recentAssignedTasks && dashboardStats.recentAssignedTasks.length > 0 ? (
                            <div className="space-y-4">
                                {dashboardStats.recentAssignedTasks.slice(0, 3).map((task) => (
                                    <div key={task._id} className="flex items-start p-3 border rounded-md">
                                        <div className="mr-3 text-primary-500">
                                            <CheckCircleIcon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <Link href={`/tasks/${task._id}`} className="font-medium text-gray-900 hover:text-primary-600">
                                                {task.title}
                                            </Link>
                                            <p className="text-sm text-gray-500">
                                                Assigned by {task.createdBy.name} on {format(new Date(task.createdAt), 'MMM d')}
                                            </p>
                                        </div>
                                        <div className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${task.priority === 'high' || task.priority === 'urgent'
                                                ? 'bg-red-100 text-red-800'
                                                : task.priority === 'medium'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-green-100 text-green-800'
                                            }
                    `}>
                                            {task.priority}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-4 text-center text-gray-500">
                                No recent activity to show.
                            </div>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AppLayout>
    );
};

export default DashboardPage;