import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from "sonner";
import {
  LayoutDashboard,
  Users,
  CheckCircle,
  BookOpen,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import api from "./services/api";

// Import pages
import Dashboard from "./pages/Dashboard";
import ManageUsers from "./pages/ManageUsers";
import AttendanceView from "./pages/AttendanceView";
import ManageClasses from "./pages/ManageClasses";
import Reports from "./pages/Reports";
import Login from "./pages/Login";

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: BookOpen, label: "Classes", path: "/classes" },
    { icon: Users, label: "Users", path: "/users" },
    { icon: CheckCircle, label: "Attendance", path: "/attendance" },
    { icon: FileText, label: "Reports", path: "/reports" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 border-b flex items-center justify-between px-6">
          <h1 className="font-bold text-xl">Admin Panel</h1>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-8"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "lg:ml-64" : "ml-0"
        }`}
      >
        {/* Top Bar */}
        <header className="h-16 bg-white border-b flex items-center px-6">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="mr-4"
          >
            <Menu className="h-6 w-6" />
          </button>
          <h2 className="text-lg font-semibold">
            Attendance System Administration
          </h2>
        </header>

        {/* Page Content */}
        <main className="min-h-[calc(100vh-4rem)]">{children}</main>
      </div>
    </div>
  );
}

function AppContent() {
  const [isChecking, setIsChecking] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check URL for token parameter (from frontend redirect)
    const searchParams = new URLSearchParams(window.location.search);
    const tokenFromUrl = searchParams.get("token");

    // Get token from localStorage or URL param
    const token = tokenFromUrl || localStorage.getItem("token");

    if (token) {
      // Save token to localStorage if it came from URL
      if (tokenFromUrl) {
        localStorage.setItem("token", tokenFromUrl);
      }

      // Verify token is valid by calling /auth/me
      api
        .get("/auth/me")
        .then(() => {
          setIsAuthenticated(true);
          setIsChecking(false);
          // Clean URL by removing token param
          if (tokenFromUrl) {
            window.history.replaceState({}, document.title, "/dashboard");
            // Only auto-navigate if token came from URL (first login)
            navigate("/dashboard", { replace: true });
          }
        })
        .catch(() => {
          // Token is invalid, clear it
          localStorage.removeItem("token");
          setIsAuthenticated(false);
          setIsChecking(false);
        });
    } else {
      setIsChecking(false);
    }
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 mb-4">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/login" element={<Login />} />
        {isAuthenticated ? (
          <Route
            path="/*"
            element={
              <Layout>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/users" element={<ManageUsers />} />
                  <Route path="/attendance" element={<AttendanceView />} />
                  <Route path="/classes" element={<ManageClasses />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Routes>
              </Layout>
            }
          />
        ) : (
          <Route path="/*" element={<Navigate to="/login" replace />} />
        )}
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
