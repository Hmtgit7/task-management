# Task Management Backend

The server-side component of the Task Management System, built with Express.js and MongoDB.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- MongoDB installed locally or a MongoDB Atlas account
- npm or yarn

### Installation

1. Install dependencies

```bash
npm install
```

2. Set up environment variables

```bash
cp .env.example .env
```

Edit the `.env` file with your configuration:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/task-management
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=7d
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@taskmanager.com
FRONTEND_URL=http://localhost:3000
```

3. Start the development server

```bash
npm run dev
```

The server will start on port 5000 (or the port specified in your .env file).

## 🛠️ API Routes

### Authentication

- **POST** `/api/auth/register` - Register a new user
- **POST** `/api/auth/login` - Login a user
- **GET** `/api/auth/me` - Get current user
- **GET** `/api/auth/logout` - Logout user

### Tasks

- **GET** `/api/tasks` - Get all tasks
- **POST** `/api/tasks` - Create a new task
- **GET** `/api/tasks/:id` - Get a single task
- **PUT** `/api/tasks/:id` - Update a task
- **DELETE** `/api/tasks/:id` - Delete a task
- **GET** `/api/tasks/assigned` - Get tasks assigned to current user
- **GET** `/api/tasks/created` - Get tasks created by current user
- **GET** `/api/tasks/overdue` - Get overdue tasks
- **GET** `/api/tasks/due-today` - Get tasks due today

### Notifications

- **GET** `/api/notifications` - Get notifications
- **PUT** `/api/notifications/:id/read` - Mark notification as read
- **PUT** `/api/notifications/read-all` - Mark all notifications as read
- **DELETE** `/api/notifications/:id` - Delete a notification
- **GET** `/api/notifications/preferences` - Get notification preferences
- **PUT** `/api/notifications/preferences` - Update notification preferences

### Analytics

- **GET** `/api/analytics/dashboard` - Get dashboard statistics
- **GET** `/api/analytics/user` - Get user analytics
- **GET** `/api/analytics/task-completion` - Get task completion analytics

## 📁 Project Structure

```
backend/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Helper functions
├── .env             # Environment variables
├── package.json     # Dependencies
└── server.js        # Entry point
```

## 🐛 Debugging

### Common Issues

#### MongoDB Connection

If you see MongoDB connection errors:

```
Error connecting to MongoDB: MongoNetworkError: failed to connect to server
```

Make sure:

1. MongoDB is running
2. Your connection string in `.env` is correct
3. Network access is allowed for your IP address (if using Atlas)

#### JWT Authentication

If you see authentication errors:

```
Not authorized to access this route
```

Make sure:

1. Your JWT_SECRET is set in .env
2. The token is being sent in the Authorization header
3. The token is not expired

#### Task Deletion Error

If you encounter "task.remove is not a function" error:

- Update to use `findByIdAndDelete()` instead of the deprecated `remove()` method:

```javascript
// Replace this:
await task.remove();

// With this:
await Task.findByIdAndDelete(task._id);
```

## 🚧 Testing

Run tests using:

```bash
npm test
```

## 📝 License

This project is licensed under the MIT License
