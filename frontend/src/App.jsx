import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import DashboardLayout from '@/components/layout/DashboardLayout'

import Login from '@/pages/auth/Login'
import Signup from '@/pages/auth/Signup'

import StudentDashboard from '@/pages/student/Dashboard'
import StudentClasses from '@/pages/student/Classes'
import Attendance from '@/pages/student/Attendance'

import AdminDashboard from '@/pages/admin/Dashboard'
import ManageClasses from '@/pages/admin/ManageClasses'
import ManageUsers from '@/pages/admin/ManageUsers'
import AttendanceView from '@/pages/admin/AttendanceView'
import Reports from '@/pages/admin/Reports'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Public / Student Routes */}
          <Route path="/student" element={<DashboardLayout role="student" />}>
            <Route path="dashboard" element={
              <ProtectedRoute role="student" showLoginPrompt={true}>
                <StudentDashboard />
              </ProtectedRoute>
            } />
            <Route path="classes" element={
              <ProtectedRoute role="student" showLoginPrompt={true}>
                <StudentClasses />
              </ProtectedRoute>
            } />
            <Route path="attendance/:classId" element={
              <ProtectedRoute role="student" showLoginPrompt={true}>
                <Attendance />
              </ProtectedRoute>
            } />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute role="admin">
              <DashboardLayout role="admin" />
            </ProtectedRoute>
          }>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="classes" element={<ManageClasses />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="attendance" element={<AttendanceView />} />
            <Route path="reports" element={<Reports />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/student/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
