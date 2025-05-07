'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    ArrowPathIcon,
    ChartBarIcon,
    ChartPieIcon,
    CalendarIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import AppLayout from '@/components/layouts/AppLayout';
import useAnalyticsStore from '@/store/analyticsStore';
import useAuthStore from '@/store/authStore';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const AnalyticsPage: React.FC = () => {
    const { user } = useAuthStore();
    const {
        taskCompletionAnalytics,
        userAnalytics,
        fetchUserAnalytics,
        fetchTaskCompletionAnalytics,
        isLoading
    } = useAnalyticsStore();

    const [timeRange, setTimeRange] = useState('month');
    const [groupBy, setGroupBy] = useState('day');

    // Fetch analytics data
    useEffect(() => {
        fetchUserAnalytics({ timeRange });

        if (user?.role === 'admin' || user?.role === 'manager') {
            fetchTaskCompletionAnalytics({ timeRange, groupBy });
        }
    }, [fetchUserAnalytics, fetchTaskCompletionAnalytics, timeRange, groupBy, user?.role]);

    // Prepare user analytics chart data
    const getUserCompletionRateData = () => {
        if (!userAnalytics) return null;

        return {
            labels: ['Completed on Time', 'Completed Late', 'Incomplete'],
            datasets: [
                {
                    data: [
                        userAnalytics.tasksCompletedOnTime,
                        userAnalytics.completedTasks - userAnalytics.tasksCompletedOnTime,
                        userAnalytics.assignedTasks - userAnalytics.completedTasks,
                    ],
                    backgroundColor: [
                        '#4ade80', // green - on time
                        '#fbbf24', // yellow - late
                        '#f87171', // red - incomplete
                    ],
                    borderColor: [
                        '#16a34a',
                        '#f59e0b',
                        '#ef4444',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    // Prepare completion analytics chart data
    const getTaskCompletionData = () => {
        if (!taskCompletionAnalytics?.completedTasks || taskCompletionAnalytics.completedTasks.length === 0) {
            return null;
        }

        // Process data based on groupBy
        const formatLabel = (item: any) => {
            if (groupBy === 'day') {
                return `${item._id.year}-${item._id.month}-${item._id.day}`;
            } else if (groupBy === 'week') {
                return `${item._id.year} W${item._id.week}`;
            } else {
                return `${item._id.year}-${item._id.month}`;
            }
        };

        return {
            labels: taskCompletionAnalytics.completedTasks.map(formatLabel),
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: taskCompletionAnalytics.completedTasks.map(item => item.count),
                    borderColor: '#0ea5e9',
                    backgroundColor: 'rgba(14, 165, 233, 0.2)',
                    tension: 0.3,
                    fill: true,
                },
            ],
        };
    };

    // Prepare user performance chart data
    const getUserPerformanceData = () => {
        if (!taskCompletionAnalytics?.userPerformance || taskCompletionAnalytics.userPerformance.length === 0) {
            return null;
        }

        // Sort by completed tasks
        const sortedData = [...taskCompletionAnalytics.userPerformance]
            .sort((a, b) => b.completedTasks - a.completedTasks)
            .slice(0, 5); // Top 5 users

        return {
            labels: sortedData.map(user => user.userName),
            datasets: [
                {
                    label: 'Completed Tasks',
                    data: sortedData.map(user => user.completedTasks),
                    backgroundColor: '#0ea5e9',
                },
                {
                    label: 'On-Time Completion',
                    data: sortedData.map(user => user.onTimeCount),
                    backgroundColor: '#4ade80',
                },
            ],
        };
    };

    // Chart options
    const pieOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    padding: 20,
                    usePointStyle: true,
                },
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const label = context.label || '';
                        const value = context.raw || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = Math.round((value / total) * 100);
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    const lineOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                },
            },
        },
        plugins: {
            legend: {
                position: 'top' as const,
            },
            tooltip: {
                mode: 'index' as const,
                intersect: false,
            },
        },
    };

    const barOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                },
            },
        },
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
    if (isLoading && !userAnalytics) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center py-12">
                    <ArrowPathIcon className="w-10 h-10 text-primary-500 animate-spin" />
                    <p className="mt-4 text-lg text-gray-600">Loading analytics data...</p>
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
                <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
                        <p className="mt-1 text-sm text-gray-500">Visualize your task management metrics</p>
                    </div>

                    {/* Time Range Filter */}
                    <div className="flex space-x-2">
                        <select
                            value={timeRange}
                            onChange={(e) => setTimeRange(e.target.value)}
                            className="input-field"
                            aria-label="Time range"
                        >
                            <option value="week">Last Week</option>
                            <option value="month">Last Month</option>
                            <option value="year">Last Year</option>
                        </select>

                        {(user?.role === 'admin' || user?.role === 'manager') && (
                            <select
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value)}
                                className="input-field"
                                aria-label="Group by"
                            >
                                <option value="day">Group by Day</option>
                                <option value="week">Group by Week</option>
                                <option value="month">Group by Month</option>
                            </select>
                        )}
                    </div>
                </motion.div>

                {/* Personal Statistics */}
                <motion.div variants={itemVariants}>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Your Statistics</h2>
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Assigned Tasks Card */}
                        <div className="p-5 bg-white rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-primary-100">
                                    <ChartBarIcon className="w-6 h-6 text-primary-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Assigned Tasks</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {userAnalytics?.assignedTasks || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Completed Tasks Card */}
                        <div className="p-5 bg-white rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-green-100">
                                    <ChartBarIcon className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {userAnalytics?.completedTasks || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Completion Rate Card */}
                        <div className="p-5 bg-white rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-blue-100">
                                    <ChartPieIcon className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {userAnalytics ? Math.round(userAnalytics.completionRate) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* On-Time Completion Card */}
                        <div className="p-5 bg-white rounded-lg shadow">
                            <div className="flex items-center">
                                <div className="p-3 rounded-full bg-indigo-100">
                                    <CalendarIcon className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-500">On-Time Rate</p>
                                    <p className="text-2xl font-semibold text-gray-900">
                                        {userAnalytics ? Math.round(userAnalytics.onTimeCompletionRate) : 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Personal Completion Rate Chart */}
                <motion.div variants={itemVariants} className="bg-white p-5 rounded-lg shadow">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Your Task Completion</h2>
                    <div className="h-64">
                        {getUserCompletionRateData() ? (
                            <Pie data={getUserCompletionRateData()!} options={pieOptions} />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">No completion data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Tasks by Status and Priority */}
                <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Tasks by Status */}
                    <div className="bg-white p-5 rounded-lg shadow">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Tasks by Status</h2>
                        <div className="h-64">
                            {userAnalytics?.tasksByStatus && userAnalytics.tasksByStatus.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: userAnalytics.tasksByStatus.map(item =>
                                            item._id === 'in-progress' ? 'In Progress' :
                                                item._id.charAt(0).toUpperCase() + item._id.slice(1)
                                        ),
                                        datasets: [
                                            {
                                                label: 'Number of Tasks',
                                                data: userAnalytics.tasksByStatus.map(item => item.count),
                                                backgroundColor: [
                                                    '#e2e8f0', // todo - gray
                                                    '#93c5fd', // in-progress - blue
                                                    '#c4b5fd', // review - purple
                                                    '#86efac', // completed - green
                                                ],
                                            },
                                        ],
                                    }}
                                    options={barOptions}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500">No status data available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tasks by Priority */}
                    <div className="bg-white p-5 rounded-lg shadow">
                        <h2 className="text-lg font-medium text-gray-900 mb-4">Your Tasks by Priority</h2>
                        <div className="h-64">
                            {userAnalytics?.tasksByPriority && userAnalytics.tasksByPriority.length > 0 ? (
                                <Bar
                                    data={{
                                        labels: userAnalytics.tasksByPriority.map(item =>
                                            item._id.charAt(0).toUpperCase() + item._id.slice(1)
                                        ),
                                        datasets: [
                                            {
                                                label: 'Number of Tasks',
                                                data: userAnalytics.tasksByPriority.map(item => item.count),
                                                backgroundColor: [
                                                    '#94a3b8', // low - gray
                                                    '#fbbf24', // medium - yellow
                                                    '#f97316', // high - orange
                                                    '#ef4444', // urgent - red
                                                ],
                                            },
                                        ],
                                    }}
                                    options={barOptions}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <p className="text-gray-500">No priority data available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Admin/Manager Only Charts */}
                {(user?.role === 'admin' || user?.role === 'manager') && (
                    <>
                        <motion.div variants={itemVariants} className="pt-6 border-t border-gray-200">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">Team Analytics</h2>
                        </motion.div>

                        {/* Task Completion Trend */}
                        <motion.div variants={itemVariants} className="bg-white p-5 rounded-lg shadow">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Task Completion Trend
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    (Grouped by {groupBy})
                                </span>
                            </h2>
                            <div className="h-64">
                                {getTaskCompletionData() ? (
                                    <Line data={getTaskCompletionData()!} options={lineOptions} />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-gray-500">No completion trend data available</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* User Performance Chart */}
                        <motion.div variants={itemVariants} className="bg-white p-5 rounded-lg shadow">
                            <h2 className="text-lg font-medium text-gray-900 mb-4">
                                Top 5 Users by Task Completion
                            </h2>
                            <div className="h-64">
                                {getUserPerformanceData() ? (
                                    <Bar data={getUserPerformanceData()!} options={barOptions} />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-gray-500">No user performance data available</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Status Distribution */}
                        <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Status Distribution */}
                            <div className="bg-white p-5 rounded-lg shadow">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Task Status Distribution</h2>
                                <div className="h-64">
                                    {taskCompletionAnalytics?.statusDistribution && taskCompletionAnalytics.statusDistribution.length > 0 ? (
                                        <Pie
                                            data={{
                                                labels: taskCompletionAnalytics.statusDistribution.map(item =>
                                                    item._id === 'in-progress' ? 'In Progress' :
                                                        item._id.charAt(0).toUpperCase() + item._id.slice(1)
                                                ),
                                                datasets: [
                                                    {
                                                        data: taskCompletionAnalytics.statusDistribution.map(item => item.count),
                                                        backgroundColor: [
                                                            '#e2e8f0', // todo - gray
                                                            '#93c5fd', // in-progress - blue
                                                            '#c4b5fd', // review - purple
                                                            '#86efac', // completed - green
                                                        ],
                                                        borderColor: [
                                                            '#cbd5e1',
                                                            '#60a5fa',
                                                            '#a78bfa',
                                                            '#4ade80',
                                                        ],
                                                        borderWidth: 1,
                                                    },
                                                ],
                                            }}
                                            options={pieOptions}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-gray-500">No status distribution data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Priority Distribution */}
                            <div className="bg-white p-5 rounded-lg shadow">
                                <h2 className="text-lg font-medium text-gray-900 mb-4">Task Priority Distribution</h2>
                                <div className="h-64">
                                    {taskCompletionAnalytics?.priorityDistribution && taskCompletionAnalytics.priorityDistribution.length > 0 ? (
                                        <Pie
                                            data={{
                                                labels: taskCompletionAnalytics.priorityDistribution.map(item =>
                                                    item._id.charAt(0).toUpperCase() + item._id.slice(1)
                                                ),
                                                datasets: [
                                                    {
                                                        data: taskCompletionAnalytics.priorityDistribution.map(item => item.count),
                                                        backgroundColor: [
                                                            '#94a3b8', // low - gray
                                                            '#fbbf24', // medium - yellow
                                                            '#f97316', // high - orange
                                                            '#ef4444', // urgent - red
                                                        ],
                                                        borderColor: [
                                                            '#64748b',
                                                            '#f59e0b',
                                                            '#ea580c',
                                                            '#dc2626',
                                                        ],
                                                        borderWidth: 1,
                                                    },
                                                ],
                                            }}
                                            options={pieOptions}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-gray-500">No priority distribution data available</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </motion.div>
        </AppLayout>
    );
};

export default AnalyticsPage;