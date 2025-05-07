'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    PlusCircleIcon,
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowPathIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/outline';
import AppLayout from '@/components/layouts/AppLayout';
import TaskCard from '@/components/tasks/TaskCard';
import useTaskStore from '@/store/taskStore';

const MyTasksPage: React.FC = () => {
    const {
        tasks,
        pagination,
        filters,
        isLoading,
        error,
        fetchAssignedTasks,
        setFilters,
        resetFilters
    } = useTaskStore();

    // Local state for filters
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Fetch tasks on component mount
    useEffect(() => {
        fetchAssignedTasks();
    }, [fetchAssignedTasks]);

    // Handle search submit
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setFilters({ search: searchTerm });
    };

    // Apply filters
    const applyFilters = () => {
        setFilters({
            status: statusFilter,
            priority: priorityFilter
        });
        setIsFilterOpen(false);
    };

    // Clear filters
    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('');
        setPriorityFilter('');
        resetFilters();
        setIsFilterOpen(false);
    };

    // Handle pagination
    const handlePageChange = (page: number) => {
        fetchAssignedTasks({ page });
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
                <motion.div variants={itemVariants} className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">My Tasks</h1>
                        <p className="mt-1 text-sm text-gray-500">Manage tasks assigned to you</p>
                    </div>
                    <Link
                        href="/tasks/new"
                        className="btn-primary"
                    >
                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                        New Task
                    </Link>
                </motion.div>

                {/* Filters and Search */}
                <motion.div variants={itemVariants} className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                    {/* Search */}
                    <div className="flex-1">
                        <form onSubmit={handleSearch} className="relative">
                            <input
                                type="text"
                                placeholder="Search tasks..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                            </div>
                            <button type="submit" className="hidden">Search</button>
                        </form>
                    </div>

                    {/* Filter Button */}
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className="flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                        <FunnelIcon className="w-5 h-5 mr-2 text-gray-500" />
                        {(statusFilter || priorityFilter) ? 'Filters Applied' : 'Filter'}
                    </button>
                </motion.div>

                {/* Filter Panel */}
                {isFilterOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 bg-white border rounded-md shadow-sm"
                    >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Status Filter */}
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="todo">To Do</option>
                                    <option value="in-progress">In Progress</option>
                                    <option value="review">In Review</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>

                            {/* Priority Filter */}
                            <div>
                                <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
                                    Priority
                                </label>
                                <select
                                    id="priority"
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="block w-full mt-1 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                                >
                                    <option value="">All Priorities</option>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                    <option value="urgent">Urgent</option>
                                </select>
                            </div>
                        </div>

                        {/* Filter Actions */}
                        <div className="flex justify-end mt-4 space-x-2">
                            <button
                                onClick={clearFilters}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Clear
                            </button>
                            <button
                                onClick={applyFilters}
                                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
                            >
                                Apply Filters
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Tasks List */}
                <motion.div variants={itemVariants} className="space-y-4">
                    {isLoading ? (
                        // Loading state
                        <div className="flex flex-col items-center justify-center py-12">
                            <ArrowPathIcon className="w-10 h-10 text-primary-500 animate-spin" />
                            <p className="mt-4 text-lg text-gray-600">Loading tasks...</p>
                        </div>
                    ) : error ? (
                        // Error state
                        <div className="p-4 text-center text-red-500 bg-red-50 rounded-md">
                            <p>Error loading tasks. Please try again.</p>
                        </div>
                    ) : tasks.length === 0 ? (
                        // Empty state
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-lg">
                            <svg
                                className="w-16 h-16 text-gray-300"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1}
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                                />
                            </svg>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                {searchTerm || statusFilter || priorityFilter ?
                                    'Try adjusting your filters or search term' :
                                    'Get started by creating a new task'
                                }
                            </p>
                            <div className="mt-6">
                                {searchTerm || statusFilter || priorityFilter ? (
                                    <button
                                        onClick={clearFilters}
                                        className="btn-secondary"
                                    >
                                        Clear Filters
                                    </button>
                                ) : (
                                    <Link href="/tasks/new" className="btn-primary">
                                        <PlusCircleIcon className="w-5 h-5 mr-2" />
                                        Create New Task
                                    </Link>
                                )}
                            </div>
                        </div>
                    ) : (
                        // Tasks list
                        <div className="space-y-4">
                            {tasks.map((task) => (
                                <TaskCard key={task._id} task={task} />
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Pagination */}
                {!isLoading && tasks.length > 0 && (
                    <motion.div variants={itemVariants} className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Showing {(pagination.currentPage - 1) * pagination.limit + 1} to{' '}
                            {Math.min(pagination.currentPage * pagination.limit, pagination.total)} of{' '}
                            {pagination.total} tasks
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => handlePageChange(pagination.currentPage - 1)}
                                disabled={pagination.currentPage === 1}
                                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => handlePageChange(pagination.currentPage + 1)}
                                disabled={pagination.currentPage === pagination.totalPages}
                                className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </motion.div>
        </AppLayout>
    );
};

export default MyTasksPage;