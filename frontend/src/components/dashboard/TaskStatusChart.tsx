'use client';

import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale
);

interface TaskStatusChartProps {
    data: { _id: string; count: number }[];
}

const TaskStatusChart: React.FC<TaskStatusChartProps> = ({ data }) => {
    // Format status labels for display
    const formatStatusLabel = (status: string) => {
        switch (status) {
            case 'todo':
                return 'To Do';
            case 'in-progress':
                return 'In Progress';
            case 'review':
                return 'In Review';
            case 'completed':
                return 'Completed';
            default:
                return status || 'Unknown';
        }
    };

    // Use default data if no data is provided
    const chartData = data && data.length > 0 ? data : [
        { _id: 'todo', count: 0 }
    ];

    // Process data for chart
    const processedData = {
        labels: chartData.map(item => formatStatusLabel(item._id)),
        datasets: [
            {
                data: chartData.map(item => item.count),
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
    };

    // Chart options
    const options = {
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
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                    }
                }
            }
        },
    };

    // If no data or empty array, show a default message
    if (!data || data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500">No task status data available</p>
            </div>
        );
    }

    return <Pie data={processedData} options={options} />;
};

export default TaskStatusChart;