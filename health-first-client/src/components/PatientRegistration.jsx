import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Calendar,
  MapPin,
  Heart,
  AlertCircle,
  CheckCircle,
  Camera,
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  Users,
} from "lucide-react";
import { patientAuthAPI } from "../services/api";

const PatientRegistration = ({ onLoginClick, onBackToLanding }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    emergencyName: "",
    emergencyRelationship: "",
    emergencyPhone: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToHIPAA: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const steps = [
    { id: 1, title: "Personal Info", icon: User },
    { id: 2, title: "Address", icon: MapPin },
    { id: 3, title: "Emergency Contact", icon: Users },
    { id: 4, title: "Security", icon: Shield },
  ];

  const genderOptions = ["Male", "Female", "Other", "Prefer not to say"];
  const relationshipOptions = [
    "Spouse",
    "Parent",
    "Sibling",
    "Child",
    "Friend",
    "Other",
  ];
  const states = [
    "Alabama",
    "Alaska",
    "Arizona",
    "Arkansas",
    "California",
    "Colorado",
    "Connecticut",
    "Delaware",
    "Florida",
    "Georgia",
    "Hawaii",
    "Idaho",
    "Illinois",
    "Indiana",
    "Iowa",
    "Kansas",
    "Kentucky",
    "Louisiana",
    "Maine",
    "Maryland",
    "Massachusetts",
    "Michigan",
    "Minnesota",
    "Mississippi",
    "Missouri",
    "Montana",
    "Nebraska",
    "Nevada",
    "New Hampshire",
    "New Jersey",
    "New Mexico",
    "New York",
    "North Carolina",
    "North Dakota",
    "Ohio",
    "Oklahoma",
    "Oregon",
    "Pennsylvania",
    "Rhode Island",
    "South Carolina",
    "South Dakota",
    "Tennessee",
    "Texas",
    "Utah",
    "Vermont",
    "Virginia",
    "Washington",
    "West Virginia",
    "Wisconsin",
    "Wyoming",
  ];

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.firstName.trim())
          newErrors.firstName = "First name is required";
        if (!formData.lastName.trim())
          newErrors.lastName = "Last name is required";
        if (!formData.email) {
          newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = "Please enter a valid email address";
        }
        if (!formData.phone) {
          newErrors.phone = "Phone number is required";
        } else if (
          !/^[+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ""))
        ) {
          newErrors.phone = "Please enter a valid phone number";
        }
        if (!formData.dateOfBirth)
          newErrors.dateOfBirth = "Date of birth is required";
        if (!formData.gender) newErrors.gender = "Please select your gender";
        break;
      case 2:
        if (!formData.streetAddress.trim())
          newErrors.streetAddress = "Street address is required";
        if (!formData.city.trim()) newErrors.city = "City is required";
        if (!formData.state) newErrors.state = "State is required";
        if (!formData.zipCode.trim())
          newErrors.zipCode = "ZIP code is required";
        break;
      case 3:
        if (!formData.emergencyName.trim())
          newErrors.emergencyName = "Emergency contact name is required";
        if (!formData.emergencyRelationship)
          newErrors.emergencyRelationship = "Relationship is required";
        if (!formData.emergencyPhone) {
          newErrors.emergencyPhone = "Emergency phone number is required";
        } else if (
          !/^[+]?[1-9][\d]{0,15}$/.test(
            formData.emergencyPhone.replace(/\s/g, "")
          )
        ) {
          newErrors.emergencyPhone = "Please enter a valid phone number";
        }
        break;
      case 4:
        if (!formData.password) {
          newErrors.password = "Password is required";
        } else if (formData.password.length < 8) {
          newErrors.password = "Password must be at least 8 characters long";
        }
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
        if (!formData.agreeToTerms)
          newErrors.agreeToTerms = "You must agree to the terms of service";
        if (!formData.agreeToPrivacy)
          newErrors.agreeToPrivacy = "You must agree to the privacy policy";
        if (!formData.agreeToHIPAA)
          newErrors.agreeToHIPAA = "You must agree to HIPAA consent";
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender.toLowerCase(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
        address: {
          street: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zip: formData.zipCode,
        },
        emergency_contact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relationship: formData.emergencyRelationship,
        },
        marketing_opt_in: false,
        data_retention_consent: formData.agreeToPrivacy,
        hipaa_consent: formData.agreeToHIPAA,
      };

      const response = await patientAuthAPI.register(registrationData);

      if (response.success) {
        setIsSuccess(true);
      } else {
        setErrors({
          general: response.message || "Registration failed. Please try again.",
        });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        general:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Welcome to HealthFirst!
            </h1>
            <p className="text-gray-600 mb-6">
              Your patient account has been created successfully. We've sent a
              verification email to your inbox.
            </p>
            <div className="space-y-3 text-sm text-gray-600 mb-6">
              <p>• Please check your email and click the verification link</p>
              <p>• Complete your profile to get the most from your account</p>
              <p>
                • You can now schedule appointments and view your health records
              </p>
            </div>
            <button
              onClick={onLoginClick}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back to Landing Button */}
        <div className="mb-6">
          <button
            onClick={onBackToLanding}
            className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-green-500 p-4 rounded-full">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join HealthFirst
          </h1>
          <p className="text-gray-600">
            Create your patient account to access healthcare services
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex justify-center">
            <div className="flex space-x-4">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;

                return (
                  <div key={step.id} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                        isCompleted
                          ? "bg-green-500 border-green-500 text-white"
                          : isActive
                          ? "bg-blue-500 border-blue-500 text-white"
                          : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`w-16 h-0.5 mx-2 ${
                          isCompleted ? "bg-green-500" : "bg-gray-300"
                        }`}
                      ></div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}:{" "}
              {steps[currentStep - 1].title}
            </p>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.general && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <span className="text-red-800">{errors.general}</span>
              </div>
            )}

            {/* Step 1: Personal Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600" />
                  Personal Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.firstName
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.lastName
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.email
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.phone
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="Enter your phone number"
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.phone}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.dateOfBirth
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.dateOfBirth}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender *
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.gender ? "border-red-300 focus:ring-red-500" : ""
                      }`}
                    >
                      <option value="">Select your gender</option>
                      {genderOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.gender && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.gender}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address Information */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-600" />
                  Address Information
                </h2>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                      errors.streetAddress
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="Enter your street address"
                  />
                  {errors.streetAddress && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.streetAddress}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.city ? "border-red-300 focus:ring-red-500" : ""
                      }`}
                      placeholder="Enter your city"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.city}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.state ? "border-red-300 focus:ring-red-500" : ""
                      }`}
                    >
                      <option value="">Select your state</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.state}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ZIP Code *
                    </label>
                    <input
                      type="text"
                      name="zipCode"
                      value={formData.zipCode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.zipCode
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      placeholder="Enter ZIP code"
                    />
                    {errors.zipCode && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.zipCode}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Emergency Contact */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  Emergency Contact
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Name *
                    </label>
                    <input
                      type="text"
                      name="emergencyName"
                      value={formData.emergencyName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.emergencyName
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      placeholder="Enter emergency contact name"
                    />
                    {errors.emergencyName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.emergencyName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Relationship *
                    </label>
                    <select
                      name="emergencyRelationship"
                      value={formData.emergencyRelationship}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.emergencyRelationship
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                    >
                      <option value="">Select relationship</option>
                      {relationshipOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.emergencyRelationship && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.emergencyRelationship}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Emergency Phone Number *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      name="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                        errors.emergencyPhone
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      placeholder="Enter emergency contact phone number"
                    />
                  </div>
                  {errors.emergencyPhone && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.emergencyPhone}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Account Security */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600" />
                  Account Security
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.password
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                          errors.confirmPassword
                            ? "border-red-300 focus:ring-red-500"
                            : ""
                        }`}
                        placeholder="Confirm your password"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Terms and Conditions
                  </h3>

                  <div className="space-y-3">
                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        name="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        I agree to the{" "}
                        <a
                          href="#terms"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Terms of Service
                        </a>
                        *
                      </span>
                    </label>
                    {errors.agreeToTerms && (
                      <p className="ml-7 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.agreeToTerms}
                      </p>
                    )}

                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        name="agreeToPrivacy"
                        checked={formData.agreeToPrivacy}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        I agree to the{" "}
                        <a
                          href="#privacy"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          Privacy Policy
                        </a>
                        *
                      </span>
                    </label>
                    {errors.agreeToPrivacy && (
                      <p className="ml-7 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.agreeToPrivacy}
                      </p>
                    )}

                    <label className="flex items-start">
                      <input
                        type="checkbox"
                        name="agreeToHIPAA"
                        checked={formData.agreeToHIPAA}
                        onChange={handleInputChange}
                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        I consent to the use and disclosure of my health
                        information as described in the{" "}
                        <a
                          href="#hipaa"
                          className="text-blue-600 hover:text-blue-700 underline"
                        >
                          HIPAA Notice
                        </a>
                        *
                      </span>
                    </label>
                    {errors.agreeToHIPAA && (
                      <p className="ml-7 text-sm text-red-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.agreeToHIPAA}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-2" />
                      Create Account
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <button
                onClick={onLoginClick}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientRegistration;
