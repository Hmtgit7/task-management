# Task Management Frontend

The client-side component of the Task Management System, built with Next.js and React.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Install dependencies

```bash
npm install
```

2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit the `.env.local` file with your configuration:

```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

3. Start the development server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## 📱 Features

### User Authentication

- Register
- Login
- Guest mode (without registration)

### Task Management

- Create, view, update, and delete tasks
- Assign tasks to users
- Set due dates, priorities, and statuses
- Mark tasks as completed

### Dashboard

- View assigned tasks
- View created tasks
- View overdue tasks
- Track tasks due today

### Analytics

- Task completion rates
- Task distribution by status and priority
- Team performance metrics

### Notifications

- Real-time notifications for task changes
- Email notification settings
- Custom notification preferences

## 🛠️ Troubleshooting

### No Tasks Displaying

If you don't see any task data in the UI:

1. Check API connectivity:

   - Open browser dev tools (F12)
   - Look for API errors in the Network tab
   - Verify status codes and response data

2. Authentication issues:

   - Ensure you're properly logged in
   - Check if your token is stored in localStorage
   - Try logging out and back in

3. API endpoint configuration:
   - Verify NEXT_PUBLIC_API_URL is correctly set
   - Make sure backend server is running
   - Check for CORS issues

### UI Elements Not Working

If buttons like delete or mark as completed don't work:

1. Look for JavaScript errors in the console
2. Check if API calls are being made but failing
3. Verify that you have the right permissions for the action

### Guest Mode Issues

If guest login fails:

1. Check the auth middleware to ensure it accepts the 'guest-token'
2. Verify the guest mode is properly implemented in the auth store
3. Make sure the guest role has appropriate permissions

## 💡 Tips for Development

### State Management

The application uses Zustand for state management:

```typescript
// Example from src/store/taskStore.ts
const useTaskStore = create<TaskState>()((set, get) => ({
  tasks: [],
  task: null,
  isLoading: false,
  error: null,

  // Actions
  fetchTasks: async () => {
    // Implementation
  },
  // More actions...
}));
```

### API Services

API calls are handled through service modules:

```typescript
// Example from src/services/apiService.ts
export const tasksAPI = {
  getAllTasks: async (params: any = {}) => {
    try {
      const response = await api.get("/tasks", { params });
      return response.data;
    } catch (error) {
      console.error("Get all tasks error:", error);
      throw error;
    }
  },
  // More API methods...
};
```

### Component Structure

Components are organized by feature:

```
src/components/
├── layouts/      # Layout components
├── tasks/        # Task-related components
├── dashboard/    # Dashboard components
├── analytics/    # Analytics components
└── common/       # Shared/utility components
```

## 📦 Build & Deployment

To build for production:

```bash
npm run build
```

To start the production build:

```bash
npm start
```

## 🧪 Testing

Run tests:

```bash
npm test
```

## 📝 License

This project is licensed under the MIT License
