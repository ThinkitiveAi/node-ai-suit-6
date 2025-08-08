import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Filter,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  User,
  Phone,
  Mail,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { appointmentAPI } from "../services/api";

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    start_date: "",
    end_date: "",
    status: "",
    appointment_type: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  const appointmentTypes = [
    { value: "consultation", label: "General Consultation" },
    { value: "follow_up", label: "Follow-up" },
    { value: "emergency", label: "Emergency" },
    { value: "telemedicine", label: "Telemedicine" },
  ];

  const appointmentStatuses = [
    { value: "booked", label: "Booked", color: "blue" },
    { value: "confirmed", label: "Confirmed", color: "green" },
    { value: "cancelled", label: "Cancelled", color: "red" },
    { value: "completed", label: "Completed", color: "gray" },
    { value: "no_show", label: "No Show", color: "yellow" },
  ];

  useEffect(() => {
    loadAppointments();
  }, [pagination.page, filters]);

  const loadAppointments = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      const patientId = userData._id || userData.id;

      if (!patientId) {
        setError("Patient ID not found. Please login again.");
        return;
      }

      const query = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      // Remove empty filters
      Object.keys(query).forEach((key) => {
        if (query[key] === "" || query[key] === undefined) {
          delete query[key];
        }
      });

      const response = await appointmentAPI.getPatientAppointments(
        patientId,
        query
      );

      if (response.success) {
        setAppointments(response.data.appointments);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || "Failed to load appointments");
      }
    } catch (error) {
      console.error("Error loading appointments:", error);
      setError("Failed to load appointments. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      start_date: "",
      end_date: "",
      status: "",
      appointment_type: "",
    });
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("Are you sure you want to cancel this appointment?")) {
      return;
    }

    try {
      const response = await appointmentAPI.cancelAppointment(appointmentId, {
        reason: "Cancelled by patient",
      });

      if (response.success) {
        // Refresh appointments
        loadAppointments();
      } else {
        alert(response.message || "Failed to cancel appointment");
      }
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      alert("Failed to cancel appointment. Please try again.");
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = appointmentStatuses.find((s) => s.value === status);
    return statusConfig ? statusConfig.color : "gray";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "booked":
        return <ClockIcon className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "no_show":
        return <XCircle className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading && appointments.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Appointments
          </h1>
          <p className="text-gray-600">
            Manage and view your healthcare appointments
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <Filter className="w-4 h-4 mr-2" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) =>
                    handleFilterChange("start_date", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) =>
                    handleFilterChange("end_date", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Statuses</option>
                  {appointmentStatuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={filters.appointment_type}
                  onChange={(e) =>
                    handleFilterChange("appointment_type", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Types</option>
                  {appointmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={loadAppointments}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Appointments List */}
        <div className="space-y-6">
          {appointments.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No appointments found
              </h3>
              <p className="text-gray-600">
                {error
                  ? "Try refreshing the page or check your filters."
                  : "You don't have any appointments yet."}
              </p>
            </div>
          ) : (
            appointments.map((appointment) => (
              <div
                key={appointment.appointment_id}
                className="bg-white rounded-lg shadow-sm border p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {appointment.provider?.name || "Provider"}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full bg-${getStatusColor(
                          appointment.status
                        )}-100 text-${getStatusColor(
                          appointment.status
                        )}-800 flex items-center`}
                      >
                        {getStatusIcon(appointment.status)}
                        <span className="ml-1 capitalize">
                          {appointment.status}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>{formatDate(appointment.date)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        <span>
                          {appointment.start_time} - {appointment.end_time}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span className="capitalize">
                          {appointment.appointment_type}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="w-4 h-4 mr-2" />
                        <span>${appointment.pricing?.base_fee || "N/A"}</span>
                      </div>
                    </div>

                    {appointment.location && (
                      <div className="mb-4">
                        <div className="flex items-center text-gray-600 mb-1">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span className="font-medium">Location:</span>
                        </div>
                        <p className="text-gray-700 ml-6">
                          {appointment.location.address && (
                            <span>{appointment.location.address}</span>
                          )}
                          {appointment.location.room_number && (
                            <span className="ml-2">
                              Room {appointment.location.room_number}
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="mb-4">
                        <p className="text-gray-700">
                          <span className="font-medium">Notes:</span>{" "}
                          {appointment.notes}
                        </p>
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      Booking Reference: {appointment.booking_reference}
                    </div>
                  </div>

                  <div className="ml-6">
                    {appointment.status === "booked" && (
                      <button
                        onClick={() =>
                          handleCancelAppointment(appointment.appointment_id)
                        }
                        className="px-3 py-1 text-red-600 hover:text-red-800 transition-colors flex items-center"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination.total_pages > 1 && (
          <div className="mt-8 flex items-center justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
                disabled={pagination.page === 1}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="px-3 py-2 text-gray-700">
                Page {pagination.page} of {pagination.total_pages}
              </span>

              <button
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
                disabled={pagination.page === pagination.total_pages}
                className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;
