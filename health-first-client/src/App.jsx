import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LandingPage from "./components/LandingPage";
import ProviderLogin from "./components/ProviderLogin";
import ProviderRegistration from "./components/ProviderRegistration";
import PatientLogin from "./components/PatientLogin";
import PatientRegistration from "./components/PatientRegistration";
import ProviderAvailability from "./components/ProviderAvailability";
import AvailabilitySearch from "./components/AvailabilitySearch";
import Dashboard from "./components/Dashboard";
import { authUtils } from "./services/api";
import "./App.css";

// Protected Route Component
const ProtectedRoute = ({ children, userType }) => {
  const isAuthenticated = authUtils.isAuthenticated();
  const currentUserType = authUtils.getUserType();

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (userType && currentUserType !== userType) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const isAuthenticated = authUtils.isAuthenticated();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  const handleLogout = () => {
    authUtils.clearAuthData();
  };

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Landing Page - Public */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            }
          />

          {/* Provider Routes */}
          <Route
            path="/provider/login"
            element={
              <PublicRoute>
                <ProviderLogin />
              </PublicRoute>
            }
          />

          <Route
            path="/provider/register"
            element={
              <PublicRoute>
                <ProviderRegistration />
              </PublicRoute>
            }
          />

          {/* Patient Routes */}
          <Route
            path="/patient/login"
            element={
              <PublicRoute>
                <PatientLogin />
              </PublicRoute>
            }
          />

          <Route
            path="/patient/register"
            element={
              <PublicRoute>
                <PatientRegistration />
              </PublicRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />

          <Route
            path="/provider/availability"
            element={
              <ProtectedRoute userType="provider">
                <ProviderAvailability />
              </ProtectedRoute>
            }
          />

          <Route
            path="/availability/search"
            element={
              <ProtectedRoute userType="patient">
                <AvailabilitySearch />
              </ProtectedRoute>
            }
          />

          {/* Catch all route - redirect to landing */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
