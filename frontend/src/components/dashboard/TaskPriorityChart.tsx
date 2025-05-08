'use client';

import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

interface TaskPriorityChartProps {
    data: { _id: string; count: number }[];
}

const TaskPriorityChart: React.FC<TaskPriorityChartProps> = ({ data }) => {
    // Format priority labels for display
    const formatPriorityLabel = (priority: string) => {
        return priority ? priority.charAt(0).toUpperCase() + priority.slice(1) : 'Unknown';
    };

    // Use default data if no data is provided
    const chartData = data && data.length > 0 ? data : [
        { _id: 'medium', count: 0 }
    ];

    // Sort data by priority level
    const sortedData = [...chartData].sort((a, b) => {
        const priorityOrder = { 'low': 0, 'medium': 1, 'high': 2, 'urgent': 3 };
        const aPriority = a._id || 'low';
        const bPriority = b._id || 'low';
        return (priorityOrder[aPriority as keyof typeof priorityOrder] || 0) - (priorityOrder[bPriority as keyof typeof priorityOrder] || 0);
    });

    // Process data for chart
    const processedData = {
        labels: sortedData.map(item => formatPriorityLabel(item._id)),
        datasets: [
            {
                label: 'Number of Tasks',
                data: sortedData.map(item => item.count),
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
    };

    // Chart options
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                callbacks: {
                    label: function (context: any) {
                        const label = context.dataset.label || '';
                        const value = context.raw || 0;
                        return `${label}: ${value}`;
                    }
                }
            }
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

    // If no data or empty array
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500">No task priority data available</p>
            </div>
        );
    }

    return <Bar data={processedData} options={options} />;
};

export default TaskPriorityChart;