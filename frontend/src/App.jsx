import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/layout/DashboardLayout";

import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";

import StudentDashboard from "@/pages/student/Dashboard";
import StudentClasses from "@/pages/student/Classes";
import Attendance from "@/pages/student/Attendance";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Public / Student Routes */}
          <Route path="/student" element={<DashboardLayout role="student" />}>
            <Route
              path="dashboard"
              element={
                <ProtectedRoute role="student" showLoginPrompt={true}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="classes"
              element={
                <ProtectedRoute role="student" showLoginPrompt={true}>
                  <StudentClasses />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendance/:classId"
              element={
                <ProtectedRoute role="student" showLoginPrompt={true}>
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>

          {/* Root Redirect */}
          <Route
            path="/"
            element={<Navigate to="/student/dashboard" replace />}
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
