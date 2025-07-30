import React, { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  Stethoscope,
  MapPin,
  Building,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
  X,
  ArrowLeft,
} from "lucide-react";
import { providerAuthAPI } from "../services/api";

const ProviderRegistration = ({ onLoginClick, onBackToLanding }) => {
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    profilePhoto: null,

    // Professional Information
    licenseNumber: "",
    specialization: "",
    yearsExperience: "",
    qualifications: "",

    // Practice Information
    practiceName: "",
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    practiceType: "",

    // Account Security
    password: "",
    confirmPassword: "",

    // Terms
    agreeToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Medical specializations
  const specializations = [
    "Cardiology",
    "Dermatology",
    "Pediatrics",
    "Neurology",
    "Orthopedics",
    "Psychiatry",
    "Oncology",
    "Emergency Medicine",
    "Family Medicine",
    "Internal Medicine",
    "Obstetrics & Gynecology",
    "Radiology",
    "Surgery",
    "Anesthesiology",
    "Pathology",
  ];

  // Practice types
  const practiceTypes = [
    "Private Practice",
    "Hospital",
    "Clinic",
    "Medical Center",
    "Urgent Care",
    "Specialty Center",
    "Academic Medical Center",
  ];

  // Years of experience
  const experienceYears = Array.from({ length: 41 }, (_, i) => i);

  const validateForm = () => {
    const newErrors = {};

    // Personal Information Validation
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (
      !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/\s/g, ""))
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Professional Information Validation
    if (!formData.licenseNumber.trim())
      newErrors.licenseNumber = "Medical license number is required";
    if (!formData.specialization)
      newErrors.specialization = "Specialization is required";
    if (!formData.yearsExperience)
      newErrors.yearsExperience = "Years of experience is required";
    if (!formData.qualifications.trim())
      newErrors.qualifications = "Medical qualifications are required";

    // Practice Information Validation
    if (!formData.practiceName.trim())
      newErrors.practiceName = "Practice name is required";
    if (!formData.streetAddress.trim())
      newErrors.streetAddress = "Street address is required";
    if (!formData.city.trim()) newErrors.city = "City is required";
    if (!formData.state.trim()) newErrors.state = "State is required";
    if (!formData.zipCode.trim()) newErrors.zipCode = "ZIP code is required";
    if (!formData.practiceType)
      newErrors.practiceType = "Practice type is required";

    // Password Validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file" && files[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setFormData((prev) => ({ ...prev, [name]: file }));
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target.result);
        reader.readAsDataURL(file);
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const registrationData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone_number: formData.phone,
        password: formData.password,
        license_number: formData.licenseNumber,
        specialization: formData.specialization,
        years_of_experience: parseInt(formData.yearsExperience),
        qualifications: formData.qualifications,
        practice_name: formData.practiceName,
        address: {
          street: formData.streetAddress,
          city: formData.city,
          state: formData.state,
          zip: formData.zipCode,
        },
        practice_type: formData.practiceType,
      };

      const response = await providerAuthAPI.register(registrationData);

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

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, profilePhoto: null }));
    setPhotoPreview(null);
  };

  const getPasswordStrength = (password) => {
    if (!password) return { strength: 0, color: "gray", text: "" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    const colors = ["red", "orange", "yellow", "lightgreen", "green"];
    const texts = ["Very Weak", "Weak", "Fair", "Good", "Strong"];

    return {
      strength: Math.min(strength, 5),
      color: colors[strength - 1] || "gray",
      text: texts[strength - 1] || "",
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

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
              Registration Successful!
            </h1>
            <p className="text-gray-600 mb-6">
              Thank you for registering with HealthFirst. We've sent a
              verification email to your inbox.
            </p>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Please check your email and click the verification link</p>
              <p>• Your account will be reviewed within 24-48 hours</p>
              <p>• You'll receive an approval notification</p>
            </div>
            <button
              onClick={onLoginClick}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 w-full"
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
            <div className="bg-blue-600 p-3 rounded-full">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Provider Registration
          </h1>
          <p className="text-gray-600">
            Join our network of healthcare professionals
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Success/Error Messages */}
            {errors.general && (
              <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                <span className="text-red-800">{errors.general}</span>
              </div>
            )}

            {/* Personal Information Section */}
            <div>
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
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
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
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                      errors.lastName ? "border-red-300 focus:ring-red-500" : ""
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
                      className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                        errors.email ? "border-red-300 focus:ring-red-500" : ""
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
                      className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                        errors.phone ? "border-red-300 focus:ring-red-500" : ""
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

                {/* Profile Photo Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Photo
                  </label>
                  {photoPreview ? (
                    <div className="relative">
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG up to 5MB
                      </p>
                      <input
                        type="file"
                        name="profilePhoto"
                        onChange={handleInputChange}
                        accept="image/*"
                        className="hidden"
                        id="photo-upload"
                      />
                      <label
                        htmlFor="photo-upload"
                        className="mt-2 inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Upload Photo
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Professional Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                Professional Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical License Number *
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                      errors.licenseNumber
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="Enter your license number"
                  />
                  {errors.licenseNumber && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.licenseNumber}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Specialization *
                  </label>
                  <select
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                      errors.specialization
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                  >
                    <option value="">Select specialization</option>
                    {specializations.map((spec) => (
                      <option key={spec} value={spec}>
                        {spec}
                      </option>
                    ))}
                  </select>
                  {errors.specialization && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.specialization}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Years of Experience *
                  </label>
                  <select
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                      errors.yearsExperience
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                  >
                    <option value="">Select years of experience</option>
                    {experienceYears.map((year) => (
                      <option key={year} value={year}>
                        {year} {year === 1 ? "year" : "years"}
                      </option>
                    ))}
                  </select>
                  {errors.yearsExperience && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.yearsExperience}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medical Qualifications *
                  </label>
                  <input
                    type="text"
                    name="qualifications"
                    value={formData.qualifications}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                      errors.qualifications
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="e.g., MD, MBBS, DO"
                  />
                  {errors.qualifications && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.qualifications}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Practice Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-600" />
                Practice Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Practice Name *
                  </label>
                  <input
                    type="text"
                    name="practiceName"
                    value={formData.practiceName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                      errors.practiceName
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                    placeholder="Enter practice or hospital name"
                  />
                  {errors.practiceName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.practiceName}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Street Address *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      name="streetAddress"
                      value={formData.streetAddress}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                        errors.streetAddress
                          ? "border-red-300 focus:ring-red-500"
                          : ""
                      }`}
                      placeholder="Enter street address"
                    />
                  </div>
                  {errors.streetAddress && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.streetAddress}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                      errors.city ? "border-red-300 focus:ring-red-500" : ""
                    }`}
                    placeholder="Enter city"
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
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                      errors.state ? "border-red-300 focus:ring-red-500" : ""
                    }`}
                    placeholder="Enter state"
                  />
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
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                      errors.zipCode ? "border-red-300 focus:ring-red-500" : ""
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Practice Type *
                  </label>
                  <select
                    name="practiceType"
                    value={formData.practiceType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
                      errors.practiceType
                        ? "border-red-300 focus:ring-red-500"
                        : ""
                    }`}
                  >
                    <option value="">Select practice type</option>
                    {practiceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.practiceType && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.practiceType}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Account Security Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Lock className="w-5 h-5 mr-2 text-blue-600" />
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
                      className={`w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
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
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              passwordStrength.color === "red"
                                ? "bg-red-500"
                                : passwordStrength.color === "orange"
                                ? "bg-orange-500"
                                : passwordStrength.color === "yellow"
                                ? "bg-yellow-500"
                                : passwordStrength.color === "lightgreen"
                                ? "bg-green-400"
                                : passwordStrength.color === "green"
                                ? "bg-green-600"
                                : "bg-gray-300"
                            }`}
                            style={{
                              width: `${
                                (passwordStrength.strength / 5) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            passwordStrength.color === "red"
                              ? "text-red-600"
                              : passwordStrength.color === "orange"
                              ? "text-orange-600"
                              : passwordStrength.color === "yellow"
                              ? "text-yellow-600"
                              : passwordStrength.color === "lightgreen"
                              ? "text-green-600"
                              : passwordStrength.color === "green"
                              ? "text-green-700"
                              : "text-gray-500"
                          }`}
                        >
                          {passwordStrength.text}
                        </span>
                      </div>
                    </div>
                  )}
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
                      className={`w-full px-4 py-3 pl-10 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all duration-200 ${
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
            </div>

            {/* Terms and Conditions */}
            <div>
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-600 border-gray-300 rounded mt-1"
                />
                <span className="ml-3 text-sm text-gray-700">
                  I agree to the{" "}
                  <a
                    href="#terms"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Terms and Conditions
                  </a>{" "}
                  and{" "}
                  <a
                    href="#privacy"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Privacy Policy
                  </a>
                </span>
              </label>
              {errors.agreeToTerms && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.agreeToTerms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
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

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team at{" "}
            <a
              href="mailto:support@healthfirst.com"
              className="text-blue-600 hover:text-blue-700"
            >
              support@healthfirst.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProviderRegistration;
