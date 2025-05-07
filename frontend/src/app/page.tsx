'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRightIcon, CheckCircleIcon, UserGroupIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import useAuthStore from '@/store/authStore';
// import Img from '../../public/dashboard-preview.png'

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  // Redirect to dashboard if authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

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
    <div className="bg-white min-h-screen">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <div className="flex items-center">
            <span className="text-xl font-semibold text-primary-600">Task Manager</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/login" className="text-gray-600 hover:text-gray-900">
              Login
            </Link>
            <Link href="/register" className="btn-primary">
              Sign Up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="pt-16 pb-24 sm:pt-24 sm:pb-32"
        >
          {/* Hero Content */}
          <motion.div variants={itemVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-8">
              <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
                <h1>
                  <span className="block text-base font-semibold tracking-wide text-primary-600 uppercase">
                    Introducing
                  </span>
                  <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                    <span className="block text-gray-900">Task Management</span>
                    <span className="block text-primary-600">Made Simple</span>
                  </span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                  A comprehensive task management system for teams with real-time collaboration,
                  analytics, and offline support. Boost your team's productivity today.
                </p>
                <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                  <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                    <div className="rounded-md shadow">
                      <Link
                        href="/register"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                      >
                        Get Started
                        <ArrowRightIcon className="ml-2 w-5 h-5" />
                      </Link>
                    </div>
                    <div className="mt-3 sm:mt-0 sm:ml-3">
                      <Link
                        href="/login"
                        className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-primary-100 hover:bg-primary-200 md:py-4 md:text-lg md:px-10"
                      >
                        Login
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
                <div className="relative mx-auto w-full lg:max-w-md">
                  <div className="relative block w-full bg-white rounded-lg shadow-lg overflow-hidden">
                    <img
                      className="w-full"
                      src="./dashboard-preview.png"
                      alt="Dashboard Preview"
                    />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Features Section */}
          <motion.div variants={itemVariants} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Key Features
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-base text-gray-500 sm:text-xl">
                Everything you need to manage tasks efficiently with your team
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <CheckCircleIcon className="h-6 w-6" />
                  </div>
                  <div className="mt-5">
                    <h3 className="text-lg font-medium text-gray-900">Task Management</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Create, assign, track, and manage tasks with ease. Set due dates, priorities, and recurring schedules.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <UserGroupIcon className="h-6 w-6" />
                  </div>
                  <div className="mt-5">
                    <h3 className="text-lg font-medium text-gray-900">Team Collaboration</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Collaborate in real-time with team members. Receive instant notifications when tasks are assigned or updated.
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary-500 text-white">
                    <ChartBarIcon className="h-6 w-6" />
                  </div>
                  <div className="mt-5">
                    <h3 className="text-lg font-medium text-gray-900">Analytics Dashboard</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Gain insights into task completion rates, team performance, and productivity trends.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <span className="text-gray-900 font-semibold">Task Manager</span>
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center text-base text-gray-500">
                &copy; {new Date().getFullYear()} Task Management System. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}