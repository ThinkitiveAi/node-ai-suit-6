import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { providerAvailabilityAPI } from "../services/api";

const ProviderAvailability = () => {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState("week"); // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Availability data structure to match backend response
  const [availability, setAvailability] = useState([]);
  const [availabilitySummary, setAvailabilitySummary] = useState({
    total_slots: 0,
    available_slots: 0,
    booked_slots: 0,
    cancelled_slots: 0,
  });

  // Load availability data on component mount
  useEffect(() => {
    loadAvailabilityData();
  }, [currentDate, currentView]);

  const loadAvailabilityData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      const providerId = userData._id || userData.id;

      if (!providerId) {
        console.error("Provider ID not found in user data");
        setError("Provider ID not found. Please login again.");
        return;
      }

      // Get current week's availability
      const startDate = new Date(currentDate);
      startDate.setDate(startDate.getDate() - startDate.getDay()); // Start of week
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 6); // End of week

      const query = {
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
      };

      console.log(
        "Loading availability for provider:",
        providerId,
        "with query:",
        query
      );

      const response = await providerAvailabilityAPI.getAvailability(
        providerId,
        query
      );

      console.log("Availability response:", response);

      if (response.success) {
        setAvailability(response.data.availability || []);
        setAvailabilitySummary(
          response.data.availability_summary || {
            total_slots: 0,
            available_slots: 0,
            booked_slots: 0,
            cancelled_slots: 0,
          }
        );
      } else {
        setError(response.message || "Failed to load availability");
      }
    } catch (error) {
      console.error("Error loading availability:", error);
      setError("Failed to load availability. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    appointment_type: "consultation",
    slot_duration: 30,
    break_duration: 15,
    timezone: "America/New_York",
    location: {
      type: "clinic",
      address: "",
      room_number: "",
    },
    is_recurring: false,
    recurrence_pattern: "weekly",
    recurrence_end_date: "",
    max_appointments_per_slot: 1,
    pricing: {
      base_fee: 100,
      insurance_accepted: true,
      currency: "USD",
    },
    special_requirements: [],
    notes: "",
  });

  const appointmentTypes = [
    {
      value: "consultation",
      label: "General Consultation",
      color: "bg-blue-500",
    },
    { value: "follow_up", label: "Follow-up", color: "bg-green-500" },
    { value: "emergency", label: "Emergency", color: "bg-red-500" },
    { value: "telemedicine", label: "Telemedicine", color: "bg-purple-500" },
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
      default:
        return "bg-gray-500";
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
      default:
        return "Unknown";
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
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
    const dayAvailability = availability.find((day) => day.date === dateStr);
    return dayAvailability ? dayAvailability.slots : [];
  };

  const handleDateChange = (direction) => {
    const newDate = new Date(currentDate);
    if (currentView === "week") {
      newDate.setDate(currentDate.getDate() + direction * 7);
    } else if (currentView === "month") {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else {
      newDate.setDate(currentDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard");
  };

  const handleAddAvailability = () => {
    console.log("handleAddAvailability called");
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Default to 30 days from now

    setShowAddForm(true);
    setFormData({
      date: startDate.toISOString().split("T")[0],
      start_time: "09:00",
      end_time: "17:00",
      appointment_type: "consultation",
      slot_duration: 30,
      break_duration: 15,
      timezone: "America/New_York",
      location: {
        type: "clinic",
        address: "",
        room_number: "",
      },
      is_recurring: false,
      recurrence_pattern: "weekly",
      recurrence_end_date: endDate.toISOString().split("T")[0],
      max_appointments_per_slot: 1,
      pricing: {
        base_fee: 100,
        insurance_accepted: true,
        currency: "USD",
      },
      special_requirements: [],
      notes: "",
    });
    console.log("showAddForm set to true");
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setFormData({
      date: slot.date || new Date().toISOString().split("T")[0],
      start_time: slot.start_time || "09:00",
      end_time: slot.end_time || "17:00",
      appointment_type: slot.appointment_type || "consultation",
      slot_duration: slot.slot_duration || 30,
      break_duration: slot.break_duration || 15,
      timezone: slot.timezone || "America/New_York",
      location: slot.location || {
        type: "clinic",
        address: "",
        room_number: "",
      },
      is_recurring: slot.is_recurring || false,
      recurrence_pattern: slot.recurrence_pattern || "weekly",
      recurrence_end_date: slot.recurrence_end_date || "",
      max_appointments_per_slot: slot.max_appointments_per_slot || 1,
      pricing: slot.pricing || {
        base_fee: 100,
        insurance_accepted: true,
        currency: "USD",
      },
      special_requirements: slot.special_requirements || [],
      notes: slot.notes || "",
    });
    setShowEditForm(true);
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      const response = await providerAvailabilityAPI.deleteAvailability(slotId);
      if (response.success) {
        await loadAvailabilityData(); // Reload data
      } else {
        setError(response.message || "Failed to delete slot");
      }
    } catch (error) {
      console.error("Error deleting slot:", error);
      setError("Failed to delete slot. Please try again.");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate dates for recurring availability
      if (formData.is_recurring) {
        const startDate = new Date(formData.date);
        const endDate = new Date(formData.recurrence_end_date);

        if (endDate <= startDate) {
          setError("Recurrence end date must be after the start date");
          setIsLoading(false);
          return;
        }
      }

      // Validate that the date is not in the past
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        setError("Cannot create availability for past dates");
        setIsLoading(false);
        return;
      }

      if (showEditForm && editingSlot) {
        // Edit existing slot
        const response = await providerAvailabilityAPI.updateAvailability(
          editingSlot.slot_id,
          formData
        );
        if (response.success) {
          await loadAvailabilityData(); // Reload data
          setShowEditForm(false);
          setEditingSlot(null);
        } else {
          setError(response.message || "Failed to update availability");
        }
      } else {
        // Add new slot
        // Clean up form data - remove recurrence fields if not recurring
        const cleanFormData = { ...formData };
        if (!cleanFormData.is_recurring) {
          delete cleanFormData.recurrence_pattern;
          delete cleanFormData.recurrence_end_date;
        }

        console.log("Submitting availability data:", cleanFormData);

        const response = await providerAvailabilityAPI.createAvailability(
          cleanFormData
        );

        console.log("Create availability response:", response);

        if (response.success) {
          await loadAvailabilityData(); // Reload data
          setShowAddForm(false);
        } else {
          setError(response.message || "Failed to create availability");
        }
      }

      // Reset form data
      setFormData({
        date: "",
        start_time: "",
        end_time: "",
        appointment_type: "consultation",
        slot_duration: 30,
        break_duration: 15,
        timezone: "America/New_York",
        location: {
          type: "clinic",
          address: "",
          room_number: "",
        },
        is_recurring: false,
        recurrence_pattern: "weekly",
        recurrence_end_date: "",
        max_appointments_per_slot: 1,
        pricing: {
          base_fee: 100,
          insurance_accepted: true,
          currency: "USD",
        },
        special_requirements: [],
        notes: "",
      });
    } catch (error) {
      console.error("Error saving availability:", error);
      setError("Failed to save availability. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle nested objects
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
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
            .map((time) => (
              <div
                key={time}
                className="grid grid-cols-8 border-b hover:bg-gray-50"
              >
                <div className="p-2 text-sm text-gray-600 border-r flex items-center justify-center">
                  {time}
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dateStr = day.toISOString().split("T")[0];
                  const dayAvailability = availability.find(
                    (day) => day.date === dateStr
                  );
                  const slotsForTime = dayAvailability
                    ? dayAvailability.slots.filter(
                        (slot) => slot.start_time === time
                      )
                    : [];

                  return (
                    <div
                      key={dayIndex}
                      className="p-1 border-l relative min-h-[40px]"
                    >
                      {slotsForTime.map((slot) => (
                        <div
                          key={slot.slot_id}
                          className={`${getStatusColor(
                            slot.status
                          )} text-white text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={() => handleEditSlot(slot)}
                          title={`${slot.appointment_type} - ${
                            slot.notes || "No notes"
                          }`}
                        >
                          <div className="font-medium">
                            {slot.appointment_type}
                          </div>
                          <div className="text-xs opacity-90">
                            ${slot.pricing?.base_fee || 0}
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
          {daySlots.length > 0 ? (
            daySlots.map((slot) => (
              <div
                key={slot.slot_id}
                className="flex items-center p-3 border-b hover:bg-gray-50"
              >
                <div className="w-20 text-sm font-medium text-gray-600">
                  {slot.start_time} - {slot.end_time}
                </div>
                <div className="flex-1 ml-4">
                  <div className="flex items-center justify-between">
                    <div
                      className={`${getStatusColor(
                        slot.status
                      )} text-white px-3 py-2 rounded-lg flex-1 mr-4`}
                    >
                      <div className="font-medium capitalize">
                        {slot.appointment_type}
                      </div>
                      <div className="text-sm opacity-90">
                        ${slot.pricing?.base_fee || 0} -{" "}
                        {slot.notes || "No notes"}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSlot(slot)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(slot.slot_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No availability slots for this day</p>
              <button
                onClick={handleAddAvailability}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Add availability
              </button>
            </div>
          )}
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
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center">
                  <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              </div>
            )}

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
                  min={new Date().toISOString().split("T")[0]}
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
                    name="start_time"
                    value={formData.start_time}
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
                    End Time
                  </label>
                  <select
                    name="end_time"
                    value={formData.end_time}
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slot Duration (minutes)
                  </label>
                  <select
                    name="slot_duration"
                    value={formData.slot_duration}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Break Duration (minutes)
                  </label>
                  <input
                    type="number"
                    name="break_duration"
                    value={formData.break_duration}
                    onChange={handleInputChange}
                    min="0"
                    max="120"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type
                </label>
                <select
                  name="appointment_type"
                  value={formData.appointment_type}
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
                  Location Type
                </label>
                <select
                  name="location.type"
                  value={formData.location.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="clinic">Clinic</option>
                  <option value="hospital">Hospital</option>
                  <option value="telemedicine">Telemedicine</option>
                  <option value="home_visit">Home Visit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="location.address"
                  value={formData.location.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter address..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room Number
                </label>
                <input
                  type="text"
                  name="location.room_number"
                  value={formData.location.room_number}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter room number..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Base Fee ($)
                  </label>
                  <input
                    type="number"
                    name="pricing.base_fee"
                    value={formData.pricing.base_fee}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Insurance Accepted
                  </label>
                  <select
                    name="pricing.insurance_accepted"
                    value={formData.pricing.insurance_accepted}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value={true}>Yes</option>
                    <option value={false}>No</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recurring Availability
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="is_recurring"
                      checked={formData.is_recurring}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">
                      Make this a recurring availability
                    </label>
                  </div>

                  {formData.is_recurring && (
                    <div className="space-y-3 pl-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recurrence Pattern
                        </label>
                        <select
                          name="recurrence_pattern"
                          value={formData.recurrence_pattern}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Date
                        </label>
                        <input
                          type="date"
                          name="recurrence_end_date"
                          value={formData.recurrence_end_date}
                          onChange={handleInputChange}
                          min={formData.date}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required={formData.is_recurring}
                        />
                      </div>
                    </div>
                  )}
                </div>
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
                    setError(null);
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
                onClick={handleBackToDashboard}
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
                  Manage your appointment availability
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
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Slots</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {availabilitySummary.total_slots}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {availabilitySummary.available_slots}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Booked</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {availabilitySummary.booked_slots}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <X className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cancelled</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {availabilitySummary.cancelled_slots}
                </p>
              </div>
            </div>
          </div>
        </div>

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
                    onClick={() => handleDateChange(-1)}
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
                    onClick={() => handleDateChange(1)}
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
            {isLoading ? (
              <div className="bg-white rounded-lg shadow-sm border p-12">
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">
                    Loading availability...
                  </span>
                </div>
              </div>
            ) : (
              <>
                {currentView === "week" && renderWeekView()}
                {currentView === "day" && renderDayView()}
                {currentView === "month" && (
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <p className="text-gray-500 text-center">
                      Month view coming soon...
                    </p>
                  </div>
                )}
              </>
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
