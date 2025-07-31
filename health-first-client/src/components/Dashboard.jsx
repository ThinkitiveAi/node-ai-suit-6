import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Calendar,
  Clock,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Heart,
  Stethoscope,
  Users,
  FileText,
  BarChart3,
  Shield,
  Home,
  Phone,
  Mail,
  MapPin,
} from "lucide-react";
import { authUtils, providerAvailabilityAPI } from "../services/api";

const Dashboard = () => {
  const navigate = useNavigate();
  const [userType, setUserType] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const type = authUtils.getUserType();
    const data = authUtils.getUserData();

    if (!type || !data) {
      // Redirect to login if no auth data
      handleLogout();
      return;
    }

    setUserType(type);
    setUserData(data);

    // Load availability data for providers
    if (type === "provider") {
      loadAvailabilityData();
    }

    setIsLoading(false);
  }, []);

  const loadAvailabilityData = async () => {
    try {
      const response = await providerAvailabilityAPI.getAvailability();
      setAvailabilitySlots(response.data || []);
    } catch (error) {
      console.error("Error loading availability:", error);
    }
  };

  const handleLogout = () => {
    authUtils.clearAuthData();
    navigate("/");
  };

  const handleAvailabilityClick = () => {
    navigate("/provider/availability");
  };

  const handleAvailabilitySearchClick = () => {
    navigate("/availability/search");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const ProviderDashboard = () => (
    <div className="flex-1 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Patients
                </p>
                <p className="text-2xl font-semibold text-gray-900">1,234</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Today's Appointments
                </p>
                <p className="text-2xl font-semibold text-gray-900">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Available Slots
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {availabilitySlots.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Monthly Revenue
                </p>
                <p className="text-2xl font-semibold text-gray-900">$12,450</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Activity
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      New patient registration
                    </p>
                    <p className="text-sm text-gray-500">
                      John Doe registered for consultation
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">2 min ago</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Appointment scheduled
                    </p>
                    <p className="text-sm text-gray-500">
                      Follow-up appointment with Sarah Smith
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">15 min ago</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Availability updated
                    </p>
                    <p className="text-sm text-gray-500">
                      Added new time slots for next week
                    </p>
                  </div>
                  <span className="text-sm text-gray-400">1 hour ago</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={handleAvailabilityClick}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Availability
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Schedule
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Users className="w-4 h-4 mr-2" />
                  Patient List
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <FileText className="w-4 h-4 mr-2" />
                  Reports
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const PatientDashboard = () => (
    <div className="flex-1 p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Overview Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Upcoming Appointments
                </p>
                <p className="text-2xl font-semibold text-gray-900">2</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Medical Records
                </p>
                <p className="text-2xl font-semibold text-gray-900">15</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Notifications
                </p>
                <p className="text-2xl font-semibold text-gray-900">3</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Heart className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Health Score
                </p>
                <p className="text-2xl font-semibold text-gray-900">85%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Upcoming Appointments
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Stethoscope className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Dr. Sarah Johnson
                      </p>
                      <p className="text-sm text-gray-500">General Checkup</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      Tomorrow, 10:00 AM
                    </p>
                    <p className="text-sm text-gray-500">Room 205</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Heart className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Dr. Michael Chen
                      </p>
                      <p className="text-sm text-gray-500">
                        Cardiology Consultation
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">Dec 15, 2:30 PM</p>
                    <p className="text-sm text-gray-500">Room 312</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <button
                  onClick={handleAvailabilitySearchClick}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Appointment
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <FileText className="w-4 h-4 mr-2" />
                  View Records
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Provider
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="flex items-center">
                  {userType === "provider" ? (
                    <Stethoscope className="w-8 h-8 text-blue-600" />
                  ) : (
                    <Heart className="w-8 h-8 text-green-600" />
                  )}
                  <h1 className="ml-2 text-xl font-semibold text-gray-900">
                    HealthFirst{" "}
                    {userType === "provider" ? "Provider" : "Patient"} Portal
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-500">
                <Bell className="w-6 h-6" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {userData?.first_name} {userData?.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{userData?.email}</p>
                </div>
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("appointments")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "appointments"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Appointments
            </button>
            <button
              onClick={() => setActiveTab("patients")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "patients"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {userType === "provider" ? "Patients" : "Records"}
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "settings"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Settings
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === "overview" &&
          (userType === "provider" ? (
            <ProviderDashboard />
          ) : (
            <PatientDashboard />
          ))}
        {activeTab === "appointments" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Appointments
            </h2>
            <p className="text-gray-500">
              Appointment management coming soon...
            </p>
          </div>
        )}
        {activeTab === "patients" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {userType === "provider" ? "Patients" : "Medical Records"}
            </h2>
            <p className="text-gray-500">
              {userType === "provider"
                ? "Patient management"
                : "Medical records"}{" "}
              coming soon...
            </p>
          </div>
        )}
        {activeTab === "settings" && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Settings
            </h2>
            <p className="text-gray-500">Settings panel coming soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
