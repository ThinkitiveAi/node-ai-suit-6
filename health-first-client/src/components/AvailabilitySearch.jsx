import React, { useState } from "react";
import {
  Search,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  Filter,
  BookOpen,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { providerAvailabilityAPI, appointmentAPI } from "../services/api";

const AvailabilitySearch = () => {
  const [searchParams, setSearchParams] = useState({
    date: "",
    start_date: "",
    end_date: "",
    specialization: "",
    location: "",
    appointment_type: "",
    insurance_accepted: undefined, // Changed from "" to undefined for boolean handling
    max_price: "",
    timezone: "America/New_York",
    available_only: true,
  });

  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const appointmentTypes = [
    { value: "consultation", label: "General Consultation" },
    { value: "follow_up", label: "Follow-up" },
    { value: "emergency", label: "Emergency" },
    { value: "telemedicine", label: "Telemedicine" },
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Handle boolean fields specifically
    if (name === "insurance_accepted") {
      setSearchParams((prev) => ({
        ...prev,
        [name]: value === "true" ? true : value === "false" ? false : undefined,
      }));
    } else {
      setSearchParams((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setHasSearched(true);

    try {
      // Remove empty values and undefined values
      const params = Object.fromEntries(
        Object.entries(searchParams).filter(
          ([, value]) => value !== "" && value !== undefined && value !== null
        )
      );

      const response = await providerAvailabilityAPI.searchAvailability(params);
      if (response.success) {
        setSearchResults(response.data.results || []);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error("Error searching availability:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchParams({
      date: "",
      start_date: "",
      end_date: "",
      specialization: "",
      location: "",
      appointment_type: "",
      insurance_accepted: undefined,
      max_price: "",
      timezone: "America/New_York",
      available_only: true,
    });
    setSearchResults([]);
    setHasSearched(false);
  };

  const handleBookAppointment = (slot) => {
    setSelectedSlot(slot);
    setShowBookingModal(true);
    setBookingError(null);
    setBookingSuccess(false);
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);
    setBookingError(null);

    try {
      const userData = JSON.parse(localStorage.getItem("user_data") || "{}");
      const patientId = userData._id || userData.id;

      if (!patientId) {
        setBookingError("Patient ID not found. Please login again.");
        return;
      }

      const bookingData = {
        slot_id: selectedSlot.slot_id,
        patient_id: patientId,
        appointment_type: selectedSlot.appointment_type,
        special_requirements: selectedSlot.special_requirements || [],
      };

      const response = await appointmentAPI.bookAppointment(bookingData);

      if (response.success) {
        setBookingSuccess(true);
        // Refresh search results to update availability
        setTimeout(() => {
          handleSearch({ preventDefault: () => {} });
        }, 2000);
      } else {
        setBookingError(response.message || "Failed to book appointment");
      }
    } catch (error) {
      console.error("Error booking appointment:", error);
      setBookingError(
        error.response?.data?.message || "Failed to book appointment"
      );
    } finally {
      setIsBooking(false);
    }
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedSlot(null);
    setBookingError(null);
    setBookingSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Available Appointments
          </h1>
          <p className="text-gray-600">
            Search for healthcare providers and available appointment slots
          </p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Date Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Date
                </label>
                <input
                  type="date"
                  name="date"
                  value={searchParams.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  name="start_date"
                  value={searchParams.start_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  name="end_date"
                  value={searchParams.end_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={searchParams.specialization}
                  onChange={handleInputChange}
                  placeholder="e.g., Cardiology, Dermatology"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={searchParams.location}
                  onChange={handleInputChange}
                  placeholder="City, State, or ZIP"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Appointment Type
                </label>
                <select
                  name="appointment_type"
                  value={searchParams.appointment_type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any Type</option>
                  {appointmentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Accepted
                </label>
                <select
                  name="insurance_accepted"
                  value={searchParams.insurance_accepted}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price ($)
                </label>
                <input
                  type="number"
                  name="max_price"
                  value={searchParams.max_price}
                  onChange={handleInputChange}
                  placeholder="Maximum price"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex items-center space-x-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={clearSearch}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Search Results */}
        {hasSearched && (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">
                Search Results
              </h2>
              <p className="text-gray-600 mt-1">
                {searchResults.length} provider
                {searchResults.length !== 1 ? "s" : ""} found
              </p>
            </div>

            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">
                  Searching for available slots...
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search criteria or expanding your date
                  range.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {searchResults.map((result, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            Dr. {result.provider.name}
                          </h3>
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                            {result.provider.specialization}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {result.provider.clinic_address}
                          </div>
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            {result.provider.years_of_experience} years
                            experience
                          </div>
                        </div>

                        {result.available_slots.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">
                              Available Slots:
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {result.available_slots
                                .slice(0, 8)
                                .map((slot, slotIndex) => (
                                  <div
                                    key={slotIndex}
                                    className="p-2 border border-gray-200 rounded text-sm text-center hover:bg-gray-50 cursor-pointer"
                                    onClick={() => handleBookAppointment(slot)}
                                  >
                                    <div className="font-medium">
                                      {slot.start_time}
                                    </div>
                                    <div className="text-gray-600 text-xs">
                                      ${slot.pricing?.base_fee || "N/A"}
                                    </div>
                                  </div>
                                ))}
                              {result.available_slots.length > 8 && (
                                <div className="p-2 text-sm text-gray-500 text-center">
                                  +{result.available_slots.length - 8} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="ml-6">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          Book Appointment
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Book Appointment
              </h3>
              <button
                onClick={closeBookingModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="text-center">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Appointment Booked Successfully!
                </h4>
                <p className="text-gray-600 mb-4">
                  Your appointment has been confirmed. You will receive a
                  confirmation email shortly.
                </p>
                <button
                  onClick={closeBookingModal}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">
                    Appointment Details
                  </h4>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{selectedSlot.date}</span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">
                        {selectedSlot.start_time} - {selectedSlot.end_time}
                      </span>
                    </div>
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">
                        {selectedSlot.appointment_type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price:</span>
                      <span className="font-medium">
                        ${selectedSlot.pricing?.base_fee || "N/A"}
                      </span>
                    </div>
                  </div>
                </div>

                {bookingError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-4 h-4 text-red-500 mr-2" />
                      <span className="text-red-700 text-sm">
                        {bookingError}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={closeBookingModal}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    disabled={isBooking}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={isBooking}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isBooking ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking...
                      </>
                    ) : (
                      <>
                        <BookOpen className="w-4 h-4 mr-2" />
                        Confirm Booking
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilitySearch;
