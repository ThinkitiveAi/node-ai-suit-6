import { useState } from "react";
import LandingPage from "./components/LandingPage";
import ProviderLogin from "./components/ProviderLogin";
import ProviderRegistration from "./components/ProviderRegistration";
import PatientLogin from "./components/PatientLogin";
import "./App.css";

function App() {
  const [currentScreen, setCurrentScreen] = useState("landing"); // 'landing', 'login', 'register'
  const [userType, setUserType] = useState("provider"); // 'provider' or 'patient'

  const handleNavigateToLanding = () => {
    setCurrentScreen("landing");
  };

  const handleNavigateToRegister = () => {
    setCurrentScreen("register");
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

  return (
    <div className="App">
      {currentScreen === "landing" ? (
        <LandingPage
          onProviderLogin={handleProviderLogin}
          onPatientLogin={handlePatientLogin}
        />
      ) : currentScreen === "login" ? (
        userType === "provider" ? (
          <ProviderLogin
            onRegisterClick={handleNavigateToRegister}
            onPatientLoginClick={handleSwitchToPatient}
            onBackToLanding={handleNavigateToLanding}
          />
        ) : (
          <PatientLogin
            onProviderLoginClick={handleSwitchToProvider}
            onBackToLanding={handleNavigateToLanding}
          />
        )
      ) : (
        <ProviderRegistration
          onLoginClick={handleNavigateToLogin}
          onBackToLanding={handleNavigateToLanding}
        />
      )}
    </div>
  );
}

export default App;
