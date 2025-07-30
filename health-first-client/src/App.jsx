import { useState, useEffect } from "react";
import LandingPage from "./components/LandingPage";
import ProviderLogin from "./components/ProviderLogin";
import ProviderRegistration from "./components/ProviderRegistration";
import PatientLogin from "./components/PatientLogin";
import PatientRegistration from "./components/PatientRegistration";
import ProviderAvailability from "./components/ProviderAvailability";
import Dashboard from "./components/Dashboard";
import { authUtils } from "./services/api";
import "./App.css";

function App() {
  const [currentScreen, setCurrentScreen] = useState("landing"); // 'landing', 'login', 'register', 'availability', 'dashboard'
  const [userType, setUserType] = useState("provider"); // 'provider' or 'patient'
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status on component mount
  useEffect(() => {
    const authenticated = authUtils.isAuthenticated();
    setIsAuthenticated(authenticated);

    if (authenticated) {
      const userType = authUtils.getUserType();
      setUserType(userType);
      setCurrentScreen("dashboard");
    }
  }, []);

  const handleNavigateToLanding = () => {
    setCurrentScreen("landing");
  };

  const handleNavigateToRegister = () => {
    setCurrentScreen("register");
  };

  const handleNavigateToPatientRegister = () => {
    setCurrentScreen("patient-register");
  };

  const handleNavigateToAvailability = () => {
    setCurrentScreen("availability");
  };

  const handleNavigateToLogin = () => {
    setCurrentScreen("login");
  };

  const handleProviderLogin = () => {
    setUserType("provider");
    setCurrentScreen("login");
  };

  const handlePatientLogin = () => {
    setUserType("patient");
    setCurrentScreen("login");
  };

  const handleSwitchToPatient = () => {
    setUserType("patient");
    setCurrentScreen("login");
  };

  const handleSwitchToProvider = () => {
    setUserType("provider");
    setCurrentScreen("login");
  };

  const handleLogout = () => {
    authUtils.clearAuthData();
    setIsAuthenticated(false);
    setCurrentScreen("landing");
  };

  // If user is authenticated, show dashboard
  if (isAuthenticated && currentScreen === "dashboard") {
    return <Dashboard onLogout={handleLogout} />;
  }

  return (
    <div className="App">
      {currentScreen === "landing" ? (
        <LandingPage
          onProviderLogin={handleProviderLogin}
          onPatientLogin={handlePatientLogin}
          onPatientRegister={handleNavigateToPatientRegister}
        />
      ) : currentScreen === "login" ? (
        userType === "provider" ? (
          <ProviderLogin
            onRegisterClick={handleNavigateToRegister}
            onPatientLoginClick={handleSwitchToPatient}
            onBackToLanding={handleNavigateToLanding}
            onAvailabilityClick={handleNavigateToAvailability}
          />
        ) : (
          <PatientLogin
            onProviderLoginClick={handleSwitchToProvider}
            onBackToLanding={handleNavigateToLanding}
          />
        )
      ) : currentScreen === "register" ? (
        <ProviderRegistration
          onLoginClick={handleNavigateToLogin}
          onBackToLanding={handleNavigateToLanding}
        />
      ) : currentScreen === "availability" ? (
        <ProviderAvailability onBackToDashboard={handleNavigateToLogin} />
      ) : (
        <PatientRegistration
          onLoginClick={handleNavigateToLogin}
          onBackToLanding={handleNavigateToLanding}
        />
      )}
    </div>
  );
}

export default App;
