'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import useAuthStore from '@/store/authStore';

// Login validation schema
const LoginSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters')
});

const LoginPage: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isLoading, error, clearError } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);

    // Check for session expired message
    const sessionExpired = searchParams.get('session') === 'expired';

    // Show session expired message
    React.useEffect(() => {
        if (sessionExpired) {
            toast.error('Your session has expired. Please log in again.');
        }
    }, [sessionExpired]);

    // Clear error when component unmounts
    React.useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    // Handle login submission
    const handleSubmit = async (values: { email: string; password: string }) => {
        try {
            await login(values.email, values.password);
            toast.success('Login successful!');
            router.push('/dashboard');
        } catch (error) {
            // Error is handled by the auth store
            console.error('Login failed:', error);
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

    return (
        <div className="flex flex-col justify-center min-h-screen py-12 bg-gray-50 sm:px-6 lg:px-8">
            <motion.div
                className="sm:mx-auto sm:w-full sm:max-w-md"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div variants={itemVariants}>
                    <h2 className="mt-6 text-3xl font-extrabold text-center text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-center text-gray-600">
                        Or{' '}
                        <Link href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                            create a new account
                        </Link>
                    </p>
                </motion.div>
            </motion.div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="px-4 py-8 bg-white shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <motion.div
                            className="p-3 mb-4 text-sm text-red-600 rounded-md bg-red-50"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <Formik
                        initialValues={{ email: '', password: '' }}
                        validationSchema={LoginSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched }) => (
                            <Form className="space-y-6">
                                <motion.div variants={itemVariants}>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email address
                                    </label>
                                    <div className="mt-1">
                                        <Field
                                            id="email"
                                            name="email"
                                            type="email"
                                            autoComplete="email"
                                            className={`input-field ${errors.email && touched.email ? 'border-red-500' : ''
                                                }`}
                                        />
                                        <ErrorMessage
                                            name="email"
                                            component="p"
                                            className="mt-1 text-sm text-red-600"
                                        />
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <div className="relative mt-1">
                                        <Field
                                            id="password"
                                            name="password"
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            className={`input-field pr-10 ${errors.password && touched.password ? 'border-red-500' : ''
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                                            onClick={() => setShowPassword(!showPassword)}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? (
                                                <EyeSlashIcon className="w-5 h-5" />
                                            ) : (
                                                <EyeIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                        <ErrorMessage
                                            name="password"
                                            component="p"
                                            className="mt-1 text-sm text-red-600"
                                        />
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants} className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <input
                                            id="remember-me"
                                            name="remember-me"
                                            type="checkbox"
                                            className="w-4 h-4 border-gray-300 rounded text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor="remember-me" className="block ml-2 text-sm text-gray-700">
                                            Remember me
                                        </label>
                                    </div>

                                    <div className="text-sm">
                                        <Link href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                                            Forgot your password?
                                        </Link>
                                    </div>
                                </motion.div>

                                <motion.div variants={itemVariants}>
                                    <button
                                        type="submit"
                                        className="flex justify-center w-full btn-primary"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <svg className="w-5 h-5 mr-3 -ml-1 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        ) : (
                                            <ArrowRightIcon className="w-5 h-5 mr-2" />
                                        )}
                                        Sign in
                                    </button>
                                </motion.div>
                            </Form>
                        )}
                    </Formik>

                    <motion.div
                        variants={itemVariants}
                        className="mt-6"
                    >
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 text-gray-500 bg-white">
                                    Or continue as guest
                                </span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => router.push('/dashboard')}
                                className="flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-transparent rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                            >
                                Continue as Guest
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;