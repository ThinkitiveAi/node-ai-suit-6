import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Stethoscope,
  Heart,
  ArrowRight,
  Shield,
  Users,
  UserPlus,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const handleProviderLogin = () => {
    navigate("/provider/login");
  };

  const handlePatientLogin = () => {
    navigate("/patient/login");
  };

  const handlePatientRegister = () => {
    navigate("/patient/register");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-blue-600 to-green-600 p-4 rounded-full">
              <Shield className="w-12 h-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Welcome to HealthFirst
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Your trusted platform for healthcare management. Choose your login
            type to get started.
          </p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Provider Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="bg-blue-100 p-4 rounded-full inline-block mb-4">
                <Stethoscope className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Healthcare Providers
              </h2>
              <p className="text-gray-600">
                Access your professional dashboard, manage patients, and
                coordinate care.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Manage patient records and appointments
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Access medical history and test results
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Coordinate with healthcare teams
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                Update treatment plans and prescriptions
              </div>
            </div>

            <button
              onClick={handleProviderLogin}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center group"
            >
              Provider Login
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Patient Login Card */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <div className="text-center mb-6">
              <div className="bg-green-100 p-4 rounded-full inline-block mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Patients
              </h2>
              <p className="text-gray-600">
                View your health information, schedule appointments, and connect
                with your care team.
              </p>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                View medical records and test results
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Schedule and manage appointments
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Message your healthcare providers
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                Track medications and health goals
              </div>
            </div>

            <button
              onClick={handlePatientLogin}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center group"
            >
              Patient Login
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Patient Registration Button */}
            <div className="mt-4">
              <button
                onClick={handlePatientRegister}
                className="w-full bg-green-100 text-green-700 font-semibold py-3 px-6 rounded-lg hover:bg-green-200 transition-colors duration-200 flex items-center justify-center group"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                New Patient Registration
              </button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-8">
            Why Choose HealthFirst?
          </h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <div className="bg-blue-100 p-3 rounded-full mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Secure & Private
              </h4>
              <p className="text-gray-600 text-sm">
                Bank-level security to protect your health information
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-green-100 p-3 rounded-full mb-4">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Connected Care
              </h4>
              <p className="text-gray-600 text-sm">
                Seamless communication between patients and providers
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="bg-purple-100 p-3 rounded-full mb-4">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Patient-Centered
              </h4>
              <p className="text-gray-600 text-sm">
                Designed with your health and convenience in mind
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <div className="flex justify-center space-x-6 text-sm mb-4">
            <a
              href="#support"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Support
            </a>
            <a
              href="#privacy"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Privacy Policy
            </a>
            <a
              href="#terms"
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Terms of Service
            </a>
          </div>
          <p className="text-xs text-gray-400">
            © 2024 HealthFirst. Your health, our priority.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
