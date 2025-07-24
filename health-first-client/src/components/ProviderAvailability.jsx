import React, { useState } from "react";
import {
  Calendar,
  Clock,
  Plus,
  Edit,
  Trash2,
  Copy,
  Settings,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
  Info,
  User,
  Stethoscope,
  Grid,
  List,
  CalendarDays,
  ArrowLeft,
  Save,
  X,
  RotateCcw,
  Download,
  Upload,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  EyeOff,
} from "lucide-react";

const ProviderAvailability = ({ onBackToDashboard }) => {
  const [currentView, setCurrentView] = useState("week"); // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sample availability data
  const [availability, setAvailability] = useState([
    {
      id: 1,
      date: "2024-01-15",
      startTime: "09:00",
      endTime: "10:00",
      type: "consultation",
      status: "available",
      duration: 30,
      notes: "General consultation",
    },
    {
      id: 2,
      date: "2024-01-15",
      startTime: "10:30",
      endTime: "11:00",
      type: "follow-up",
      status: "booked",
      duration: 30,
      notes: "Follow-up appointment",
    },
    {
      id: 3,
      date: "2024-01-15",
      startTime: "11:00",
      endTime: "12:00",
      type: "consultation",
      status: "blocked",
      duration: 60,
      notes: "Lunch break",
    },
  ]);

  const [formData, setFormData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    type: "consultation",
    duration: 30,
    notes: "",
    recurring: false,
    recurringDays: [],
  });

  const appointmentTypes = [
    {
      value: "consultation",
      label: "General Consultation",
      color: "bg-blue-500",
    },
    { value: "follow-up", label: "Follow-up", color: "bg-green-500" },
    { value: "emergency", label: "Emergency", color: "bg-red-500" },
    { value: "procedure", label: "Procedure", color: "bg-purple-500" },
    { value: "break", label: "Break", color: "bg-gray-500" },
  ];

  const durationOptions = [15, 30, 45, 60, 90, 120];
  const timeSlots = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-500";
      case "booked":
        return "bg-blue-500";
      case "blocked":
        return "bg-red-500";
      case "tentative":
        return "bg-yellow-500";
      case "break":
        return "bg-gray-500";
      default:
        return "bg-gray-300";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "available":
        return "Available";
      case "booked":
        return "Booked";
      case "blocked":
        return "Blocked";
      case "tentative":
        return "Tentative";
      case "break":
        return "Break";
      default:
        return "Unknown";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const getWeekDays = () => {
    const days = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      days.push(day);
    }
    return days;
  };

  const getSlotsForDate = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availability.filter((slot) => slot.date === dateStr);
  };

  const handleDateChange = (direction) => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      if (currentView === "month") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else if (currentView === "week") {
        newDate.setDate(newDate.getDate() - 7);
      } else {
        newDate.setDate(newDate.getDate() - 1);
      }
    } else {
      if (currentView === "month") {
        newDate.setMonth(newDate.getMonth() + 1);
      } else if (currentView === "week") {
        newDate.setDate(newDate.getDate() + 7);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
    }
    setCurrentDate(newDate);
  };

  const handleAddAvailability = () => {
    setShowAddForm(true);
    setFormData({
      date: currentDate.toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "09:30",
      type: "consultation",
      duration: 30,
      notes: "",
      recurring: false,
      recurringDays: [],
    });
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setFormData({
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      type: slot.type,
      duration: slot.duration,
      notes: slot.notes,
      recurring: false,
      recurringDays: [],
    });
    setShowEditForm(true);
  };

  const handleDeleteSlot = (slotId) => {
    setAvailability((prev) => prev.filter((slot) => slot.id !== slotId));
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      if (showEditForm && editingSlot) {
        // Edit existing slot
        setAvailability((prev) =>
          prev.map((slot) =>
            slot.id === editingSlot.id
              ? { ...slot, ...formData, endTime: formData.startTime }
              : slot
          )
        );
        setShowEditForm(false);
        setEditingSlot(null);
      } else {
        // Add new slot
        const newSlot = {
          id: Date.now(),
          ...formData,
          status: "available",
          endTime: formData.startTime,
        };
        setAvailability((prev) => [...prev, newSlot]);
        setShowAddForm(false);
      }

      setFormData({
        date: "",
        startTime: "",
        endTime: "",
        type: "consultation",
        duration: 30,
        notes: "",
        recurring: false,
        recurringDays: [],
      });
      setIsLoading(false);
    }, 1000);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const renderWeekView = () => {
    const weekDays = getWeekDays();

    return (
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Week Header */}
        <div className="grid grid-cols-8 border-b">
          <div className="p-3 font-medium text-gray-700">Time</div>
          {weekDays.map((day, index) => (
            <div key={index} className="p-3 text-center border-l">
              <div className="font-medium text-gray-900">
                {day.toLocaleDateString("en-US", { weekday: "short" })}
              </div>
              <div className="text-sm text-gray-500">
                {day.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Time Slots */}
        <div className="max-h-96 overflow-y-auto">
          {timeSlots
            .filter((_, index) => index >= 16 && index <= 40)
            .map((time, timeIndex) => (
              <div
                key={time}
                className="grid grid-cols-8 border-b hover:bg-gray-50"
              >
                <div className="p-2 text-sm text-gray-600 border-r flex items-center justify-center">
                  {time}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dateStr = day.toISOString().split("T")[0];
                  const slotsForTime = availability.filter(
                    (slot) => slot.date === dateStr && slot.startTime === time
                  );

                  return (
                    <div
                      key={dayIndex}
                      className="p-1 border-l relative min-h-[40px]"
                    >
                      {slotsForTime.map((slot) => (
                        <div
                          key={slot.id}
                          className={`${getStatusColor(
                            slot.status
                          )} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={() => handleEditSlot(slot)}
                          title={`${slot.type} - ${slot.notes}`}
                        >
                          <div className="font-medium">{slot.type}</div>
                          <div className="text-xs opacity-90">
                            {slot.duration}min
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const daySlots = getSlotsForDate(currentDate);

    return (
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {currentDate.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h3>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {timeSlots
            .filter((_, index) => index >= 16 && index <= 40)
            .map((time) => {
              const slot = daySlots.find((s) => s.startTime === time);

              return (
                <div
                  key={time}
                  className="flex items-center p-3 border-b hover:bg-gray-50"
                >
                  <div className="w-20 text-sm font-medium text-gray-600">
                    {time}
                  </div>
                  <div className="flex-1 ml-4">
                    {slot ? (
                      <div className="flex items-center justify-between">
                        <div
                          className={`${getStatusColor(
                            slot.status
                          )} text-white px-3 py-2 rounded-lg flex-1 mr-4`}
                        >
                          <div className="font-medium capitalize">
                            {slot.type}
                          </div>
                          <div className="text-sm opacity-90">{slot.notes}</div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditSlot(slot)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSlot(slot.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm">
                        No appointment scheduled
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  const renderAddEditForm = () => {
    const isEdit = showEditForm;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {isEdit ? "Edit Availability" : "Add Availability"}
              </h2>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setShowEditForm(false);
                  setEditingSlot(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <select
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes)
                  </label>
                  <select
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {durationOptions.map((duration) => (
                      <option key={duration} value={duration}>
                        {duration}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  {appointmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes about this availability..."
                />
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {isEdit ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {isEdit ? "Update Availability" : "Add Availability"}
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setShowEditForm(false);
                    setEditingSlot(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToDashboard}
                className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Availability Management
                </h1>
                <p className="text-sm text-gray-500">
                  Dr. Sarah Johnson - Cardiology
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleAddAvailability}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Availability
              </button>
              <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              {/* View Selector */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Calendar View
                </h3>
                <div className="space-y-2">
                  {[
                    { id: "month", label: "Month", icon: Calendar },
                    { id: "week", label: "Week", icon: Grid },
                    { id: "day", label: "Day", icon: CalendarDays },
                  ].map((view) => {
                    const Icon = view.icon;
                    return (
                      <button
                        key={view.id}
                        onClick={() => setCurrentView(view.id)}
                        className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentView === view.id
                            ? "bg-blue-100 text-blue-700"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {view.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Navigation */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Navigation
                </h3>
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleDateChange("prev")}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentDate(new Date())}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => handleDateChange("next")}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center mt-2">
                  <p className="text-sm font-medium text-gray-900">
                    {currentDate.toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Status Legend */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Status Legend
                </h3>
                <div className="space-y-2">
                  {[
                    { status: "available", label: "Available" },
                    { status: "booked", label: "Booked" },
                    { status: "blocked", label: "Blocked" },
                    { status: "tentative", label: "Tentative" },
                    { status: "break", label: "Break" },
                  ].map((item) => (
                    <div key={item.status} className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${getStatusColor(
                          item.status
                        )} mr-2`}
                      ></div>
                      <span className="text-sm text-gray-600">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Quick Actions
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => setShowBulkEdit(true)}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Bulk Edit
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Download className="w-4 h-4 mr-2" />
                    Export Schedule
                  </button>
                  <button className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <Filter className="w-4 h-4 mr-2" />
                    Filter View
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Calendar Area */}
          <div className="lg:col-span-3">
            {currentView === "week" && renderWeekView()}
            {currentView === "day" && renderDayView()}
            {currentView === "month" && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <p className="text-gray-500 text-center">
                  Month view coming soon...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {(showAddForm || showEditForm) && renderAddEditForm()}
    </div>
  );
};

export default ProviderAvailability;
