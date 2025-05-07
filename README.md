# Task Management System

A comprehensive task management application for teams with real-time collaboration, analytics, and offline support.

## Features

### Core Features

- **User Authentication**: Secure user registration and login with JWT
- **Task Management**: Full CRUD operations for creating, reading, updating, and deleting tasks
- **Team Collaboration**: Assign tasks to team members with real-time notifications
- **Dashboard**: View assigned tasks, created tasks, and overdue tasks at a glance
- **Search and Filter**: Find tasks quickly with comprehensive search and filtering options

### Advanced Features

- **Role-Based Access Control (RBAC)**: Admin, Manager, and User roles with different permissions
- **Real-Time Notifications**: Instant updates using Socket.IO when tasks are assigned or modified
- **Recurring Tasks**: Schedule tasks that repeat daily, weekly, or monthly
- **Audit Logging**: Track all user actions for transparency and accountability
- **Offline Support (PWA)**: Work offline with automatic syncing when back online
- **Unit and Integration Tests**: Comprehensive test coverage for backend and frontend
- **Analytics Dashboard**: Visualize task metrics and team performance
- **Customizable Notifications**: Configure email and in-app notification preferences

## Tech Stack

### Backend

- **Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.IO for instant notifications
- **Testing**: Jest for unit and integration tests
- **Validation**: Express Validator

### Frontend

- **Framework**: Next.js (React)
- **State Management**: Zustand
- **API Communication**: Axios, React Query
- **UI Components**: Tailwind CSS, Headless UI
- **Animations**: Framer Motion
- **Charts**: Chart.js with React Chart.js 2
- **Forms**: Formik with Yup validation
- **Notifications**: React Hot Toast

## Project Structure

### Backend Structure

```
backend/
├── config/         # Configuration files
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── models/         # Mongoose models
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Helper functions
├── tests/          # Test files
└── server.js       # Entry point
```

### Frontend Structure

```
frontend/
├── public/         # Static assets
├── src/
│   ├── app/        # Next.js pages
│   ├── components/ # React components
│   ├── hooks/      # Custom React hooks
│   ├── providers/  # Context providers
│   ├── services/   # API services
│   ├── store/      # Zustand stores
│   └── utils/      # Helper functions
└── next.config.js  # Next.js configuration
```

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/Hmtgit7/task-management.git
cd task-management
```

2. Install backend dependencies

```bash
cd backend
npm install
```

3. Set up environment variables

```bash
# Create a .env file in the backend directory
cp .env.example .env
# Edit the .env file with your configuration
```

4. Start the backend server

```bash
npm run dev
```

5. Install frontend dependencies

```bash
cd ../frontend
npm install
```

6. Set up frontend environment variables

```bash
# Create a .env.local file in the frontend directory
cp .env.example .env.local
# Edit the .env.local file with your configuration
```

7. Start the frontend development server

```bash
npm run dev
```

8. Open your browser and navigate to http://localhost:3000

## Deployment

### Backend Deployment

The backend can be deployed on any Node.js-compatible hosting service, such as:

- Render
- Railway
- Heroku
- AWS, GCP, or Azure

### Frontend Deployment

The Next.js frontend can be deployed on:

- Vercel (recommended for Next.js)
- Netlify
- GitHub Pages

## API Documentation

The API documentation is available at `/api/docs` when running the backend server in development mode.

## Testing

### Running Backend Tests

```bash
cd backend
npm test
```

### Running Frontend Tests

```bash
cd frontend
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- This project was built as a take-home assignment for a software developer position.
- UI design inspiration from various modern task management applications.
