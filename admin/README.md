# Admin Dashboard Setup Guide

## Overview

A standalone admin dashboard has been created in the `admin/` directory. This application is separate from the main student/lecturer frontend and provides dedicated administrative capabilities.

## Tech Stack

- **Framework**: React + Vite
- **Styling**: Tailwind CSS + ShadCN UI
- **Routing**: React Router DOM
- **State Management**: React Hooks
- **HTTP Client**: Axios

## Features

- **Dashboard**: Real-time statistics and recent activity
- **User Management**: View, search, and delete users
- **Class Management**: Create and list classes
- **Attendance**: View and export attendance records
- **Reports**: Placeholder for future analytics

## Setup & Running

### Prerequisites

- Node.js installed
- Backend server running on port 8000

### Installation

```bash
cd admin
npm install
```

### Running Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:5174`.

## Project Structure

```
admin/
├── src/
│   ├── components/
│   │   └── ui/          # Reusable UI components (ShadCN)
│   ├── hooks/           # Custom hooks (useAuth)
│   ├── lib/             # Utilities
│   ├── pages/           # Page components
│   │   ├── Dashboard.jsx
│   │   ├── Login.jsx
│   │   ├── ManageClasses.jsx
│   │   ├── ManageUsers.jsx
│   │   ├── AttendanceView.jsx
│   │   └── Reports.jsx
│   ├── services/        # API configuration
│   ├── App.jsx          # Main application component
│   └── main.jsx         # Entry point
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Key Components

- **App.jsx**: Handles routing and the main layout (sidebar, header).
- **useAuth.js**: Custom hook to decode the JWT token and provide user info.
- **api.js**: Axios instance with interceptors for authentication.

## Notes

- The admin dashboard runs on port **5174** to avoid conflict with the main frontend (port 5173).
- Ensure the backend CORS settings allow requests from `http://localhost:5174`.
