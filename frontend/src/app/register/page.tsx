'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { EyeIcon, EyeSlashIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import useAuthStore from '@/store/authStore';

// Registration validation schema
const RegisterSchema = Yup.object().shape({
    name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be less than 50 characters'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password')
});

const RegisterPage: React.FC = () => {
    const router = useRouter();
    const { register, isLoading, error, clearError } = useAuthStore();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Clear error when component unmounts
    React.useEffect(() => {
        return () => {
            clearError();
        };
    }, [clearError]);

    // Handle registration submission
    const handleSubmit = async (values: { name: string; email: string; password: string }) => {
        try {
            await register(values.name, values.email, values.password);
            toast.success('Registration successful!');
            router.push('/dashboard');
        } catch (error) {
            // Error is handled by the auth store
            console.error('Registration failed:', error);
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
                        Create a new account
                    </h2>
                    <p className="mt-2 text-sm text-center text-gray-600">
                        Or{' '}
                        <Link href="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            sign in to your existing account
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
                        initialValues={{ name: '', email: '', password: '', confirmPassword: '' }}
                        validationSchema={RegisterSchema}
                        onSubmit={handleSubmit}
                    >
                        {({ errors, touched }) => (
                            <Form className="space-y-6">
                                <motion.div variants={itemVariants}>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                        Full name
                                    </label>
                                    <div className="mt-1">
                                        <Field
                                            id="name"
                                            name="name"
                                            type="text"
                                            autoComplete="name"
                                            className={`input-field ${errors.name && touched.name ? 'border-red-500' : ''
                                                }`}
                                        />
                                        <ErrorMessage
                                            name="name"
                                            component="p"
                                            className="mt-1 text-sm text-red-600"
                                        />
                                    </div>
                                </motion.div>

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
                                            autoComplete="new-password"
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

                                <motion.div variants={itemVariants}>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                                        Confirm password
                                    </label>
                                    <div className="relative mt-1">
                                        <Field
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            type={showConfirmPassword ? 'text' : 'password'}
                                            autoComplete="new-password"
                                            className={`input-field pr-10 ${errors.confirmPassword && touched.confirmPassword ? 'border-red-500' : ''
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-500"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            tabIndex={-1}
                                        >
                                            {showConfirmPassword ? (
                                                <EyeSlashIcon className="w-5 h-5" />
                                            ) : (
                                                <EyeIcon className="w-5 h-5" />
                                            )}
                                        </button>
                                        <ErrorMessage
                                            name="confirmPassword"
                                            component="p"
                                            className="mt-1 text-sm text-red-600"
                                        />
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
                                            <UserPlusIcon className="w-5 h-5 mr-2" />
                                        )}
                                        Register
                                    </button>
                                </motion.div>
                            </Form>
                        )}
                    </Formik>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;