'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Switch } from '@headlessui/react';
import {
    Cog6ToothIcon,
    BellIcon,
    MoonIcon,
    EnvelopeIcon,
    ClockIcon,
    ArrowPathIcon,
    CheckIcon
} from '@heroicons/react/24/outline';
import AppLayout from '@/components/layouts/AppLayout';
import useNotificationStore from '@/store/notificationStore';

const SettingsPage: React.FC = () => {
    const { preferences, fetchPreferences, updatePreferences, isLoading, error } = useNotificationStore();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [timezones, setTimezones] = useState<string[]>([]);

    // Local state for form values
    const [formValues, setFormValues] = useState({
        email: {
            taskAssigned: true,
            taskUpdated: true,
            taskCompleted: true,
            taskOverdue: true,
            dailySummary: false
        },
        inApp: {
            taskAssigned: true,
            taskUpdated: true,
            taskCompleted: true,
            taskOverdue: true,
            comments: true
        },
        muteAll: false,
        quietHoursStart: '22:00',
        quietHoursEnd: '08:00',
        timezone: 'UTC'
    });

    // Fetch notification preferences
    useEffect(() => {
        fetchPreferences();
    }, [fetchPreferences]);

    // Update form values when preferences are loaded
    useEffect(() => {
        if (preferences) {
            setFormValues({
                email: preferences.email,
                inApp: preferences.inApp,
                muteAll: preferences.muteAll,
                quietHoursStart: preferences.quietHoursStart,
                quietHoursEnd: preferences.quietHoursEnd,
                timezone: preferences.timezone
            });
        }
    }, [preferences]);

    // Fetch timezones (simulated)
    useEffect(() => {
        // In a real app, you might fetch this from an API
        // For now, let's use a simplified list
        const timezoneList = [
            'UTC',
            'America/New_York',
            'America/Chicago',
            'America/Denver',
            'America/Los_Angeles',
            'Europe/London',
            'Europe/Paris',
            'Europe/Berlin',
            'Asia/Tokyo',
            'Asia/Shanghai',
            'Asia/Kolkata',
            'Australia/Sydney'
        ];

        setTimezones(timezoneList);
    }, []);

    // Handle form changes
    const handleChange = (section: string, field: string, value: boolean) => {
        setFormValues(prev => ({
            ...prev,
            [section]: {
                ...prev[section as keyof typeof prev],
                [field]: value
            }
        }));
    };

    // Handle time changes
    const handleTimeChange = (field: string, value: string) => {
        setFormValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle timezone change
    const handleTimezoneChange = (timezone: string) => {
        setFormValues(prev => ({
            ...prev,
            timezone
        }));
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await updatePreferences(formValues);
            toast.success('Settings saved successfully');
        } catch (error) {
            toast.error('Failed to save settings');
        } finally {
            setIsSubmitting(false);
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

    // Toggle component
    const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange: (value: boolean) => void }) => {
        return (
            <Switch
                checked={enabled}
                onChange={onChange}
                className={`${enabled ? 'bg-primary-600' : 'bg-gray-200'
                    } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`}
            >
                <span
                    className={`${enabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
            </Switch>
        );
    };

    // Loading state
    if (isLoading && !preferences) {
        return (
            <AppLayout>
                <div className="flex flex-col items-center justify-center py-12">
                    <ArrowPathIcon className="w-10 h-10 text-primary-500 animate-spin" />
                    <p className="mt-4 text-lg text-gray-600">Loading settings...</p>
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
                <motion.div variants={itemVariants}>
                    <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your notification preferences and other settings
                    </p>
                </motion.div>

                {/* Settings Form */}
                <form onSubmit={handleSubmit}>
                    <motion.div variants={itemVariants} className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Email Notifications */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center">
                                <EnvelopeIcon className="w-6 h-6 text-gray-400" />
                                <h2 className="ml-3 text-lg font-medium text-gray-900">Email Notifications</h2>
                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                                Configure which email notifications you want to receive
                            </p>

                            <div className="mt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Task assigned to you
                                    </label>
                                    <Toggle
                                        enabled={formValues.email.taskAssigned}
                                        onChange={(value) => handleChange('email', 'taskAssigned', value)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Task status updated
                                    </label>
                                    <Toggle
                                        enabled={formValues.email.taskUpdated}
                                        onChange={(value) => handleChange('email', 'taskUpdated', value)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Task completed
                                    </label>
                                    <Toggle
                                        enabled={formValues.email.taskCompleted}
                                        onChange={(value) => handleChange('email', 'taskCompleted', value)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Task overdue reminder
                                    </label>
                                    <Toggle
                                        enabled={formValues.email.taskOverdue}
                                        onChange={(value) => handleChange('email', 'taskOverdue', value)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Daily task summary
                                    </label>
                                    <Toggle
                                        enabled={formValues.email.dailySummary}
                                        onChange={(value) => handleChange('email', 'dailySummary', value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* In-App Notifications */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center">
                                <BellIcon className="w-6 h-6 text-gray-400" />
                                <h2 className="ml-3 text-lg font-medium text-gray-900">In-App Notifications</h2>
                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                                Configure which in-app notifications you want to receive
                            </p>

                            <div className="mt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Task assigned to you
                                    </label>
                                    <Toggle
                                        enabled={formValues.inApp.taskAssigned}
                                        onChange={(value) => handleChange('inApp', 'taskAssigned', value)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Task status updated
                                    </label>
                                    <Toggle
                                        enabled={formValues.inApp.taskUpdated}
                                        onChange={(value) => handleChange('inApp', 'taskUpdated', value)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Task completed
                                    </label>
                                    <Toggle
                                        enabled={formValues.inApp.taskCompleted}
                                        onChange={(value) => handleChange('inApp', 'taskCompleted', value)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Task overdue reminder
                                    </label>
                                    <Toggle
                                        enabled={formValues.inApp.taskOverdue}
                                        onChange={(value) => handleChange('inApp', 'taskOverdue', value)}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Comments on tasks
                                    </label>
                                    <Toggle
                                        enabled={formValues.inApp.comments}
                                        onChange={(value) => handleChange('inApp', 'comments', value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Quiet Hours */}
                        <div className="p-6 border-b border-gray-200">
                            <div className="flex items-center">
                                <MoonIcon className="w-6 h-6 text-gray-400" />
                                <h2 className="ml-3 text-lg font-medium text-gray-900">Quiet Hours</h2>
                            </div>

                            <p className="mt-1 text-sm text-gray-500">
                                Set a time period when you don't want to receive notifications
                            </p>

                            <div className="mt-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm text-gray-700">
                                        Mute all notifications
                                    </label>
                                    <Toggle
                                        enabled={formValues.muteAll}
                                        onChange={(value) => setFormValues(prev => ({ ...prev, muteAll: value }))}
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="quietHoursStart" className="block text-sm font-medium text-gray-700">
                                            Quiet hours start
                                        </label>
                                        <input
                                            type="time"
                                            id="quietHoursStart"
                                            value={formValues.quietHoursStart}
                                            onChange={(e) => handleTimeChange('quietHoursStart', e.target.value)}
                                            className="mt-1 input-field"
                                        />
                                    </div>

                                    <div>
                                        <label htmlFor="quietHoursEnd" className="block text-sm font-medium text-gray-700">
                                            Quiet hours end
                                        </label>
                                        <input
                                            type="time"
                                            id="quietHoursEnd"
                                            value={formValues.quietHoursEnd}
                                            onChange={(e) => handleTimeChange('quietHoursEnd', e.target.value)}
                                            className="mt-1 input-field"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">
                                        Timezone
                                    </label>
                                    <select
                                        id="timezone"
                                        value={formValues.timezone}
                                        onChange={(e) => handleTimezoneChange(e.target.value)}
                                        className="mt-1 input-field"
                                    >
                                        {timezones.map((tz) => (
                                            <option key={tz} value={tz}>
                                                {tz}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="p-6 flex justify-end">
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <ArrowPathIcon className="w-5 h-5 mr-2 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <CheckIcon className="w-5 h-5 mr-2" />
                                        Save Settings
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </form>
            </motion.div>
        </AppLayout>
    );
};

export default SettingsPage;