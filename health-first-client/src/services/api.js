import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post('http://localhost:3000/api/v1/provider/refresh', {
            refresh_token: refreshToken
          });

          const { access_token, refresh_token } = response.data.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', refresh_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_type');
        localStorage.removeItem('user_data');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Provider Authentication APIs
export const providerAuthAPI = {
  // Provider login
  login: async (credentials) => {
    const response = await api.post('/v1/provider/login', {
      identifier: credentials.credential,
      password: credentials.password,
      remember_me: credentials.rememberMe
    });
    return response.data;
  },

  // Provider registration
  register: async (providerData) => {
    const response = await api.post('/v1/provider/register', {
      first_name: providerData.first_name,
      last_name: providerData.last_name,
      email: providerData.email,
      phone_number: providerData.phone_number,
      password: providerData.password,
      confirm_password: providerData.password, // Assuming same as password for now
      specialization: providerData.specialization,
      license_number: providerData.license_number,
      years_of_experience: providerData.years_of_experience,
      clinic_address: providerData.address
    });
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/v1/provider/refresh', {
      refresh_token: refreshToken
    });
    return response.data;
  },

  // Logout
  logout: async (refreshToken) => {
    const response = await api.post('/v1/provider/logout', {
      refresh_token: refreshToken
    });
    return response.data;
  }
};

// Patient Authentication APIs
export const patientAuthAPI = {
  // Patient login
  login: async (credentials) => {
    const response = await api.post('/v1/patient/login', {
      identifier: credentials.identifier,
      password: credentials.password,
      remember_me: credentials.rememberMe
    });
    return response.data;
  },

  // Patient registration
  register: async (patientData) => {
    const response = await api.post('/v1/patient/register', patientData);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await api.post('/v1/patient/refresh', {
      refresh_token: refreshToken
    });
    return response.data;
  },

  // Logout
  logout: async (refreshToken) => {
    const response = await api.post('/v1/patient/logout', {
      refresh_token: refreshToken
    });
    return response.data;
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await api.post('/v1/patient/verify/email', {
      token: token
    });
    return response.data;
  },

  // Verify phone
  verifyPhone: async (token) => {
    const response = await api.post('/v1/patient/verify/phone', {
      token: token
    });
    return response.data;
  }
};

// Provider Availability APIs
export const providerAvailabilityAPI = {
  // Get availability slots for a specific provider
  getAvailability: async (providerId, query = {}) => {
    const params = new URLSearchParams(query);
    const response = await api.get(`/v1/provider/${providerId}/availability?${params}`);
    return response.data;
  },

  // Create availability slot
  createAvailability: async (availabilityData) => {
    const response = await api.post('/v1/provider/availability', availabilityData);
    return response.data;
  },

  // Update availability slot
  updateAvailability: async (slotId, availabilityData) => {
    const response = await api.put(`/v1/provider/availability/${slotId}`, availabilityData);
    return response.data;
  },

  // Delete availability slot
  deleteAvailability: async (slotId, query = {}) => {
    const params = new URLSearchParams(query);
    const response = await api.delete(`/v1/provider/availability/${slotId}?${params}`);
    return response.data;
  },

  // Search for available slots (for patients)
  searchAvailability: async (searchParams = {}) => {
    const params = new URLSearchParams(searchParams);
    const response = await api.get(`/v1/availability/search?${params}`);
    return response.data;
  }
};

// Utility functions
export const authUtils = {
  // Save auth data to localStorage
  saveAuthData: (data, userType) => {
    localStorage.setItem('access_token', data.data.access_token);
    localStorage.setItem('refresh_token', data.data.refresh_token);
    localStorage.setItem('user_type', userType);
    localStorage.setItem('user_data', JSON.stringify(data.data[userType]));
  },

  // Clear auth data from localStorage
  clearAuthData: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_type');
    localStorage.removeItem('user_data');
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('access_token');
  },

  // Get current user type
  getUserType: () => {
    return localStorage.getItem('user_type');
  },

  // Get current user data
  getUserData: () => {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }
};

export default api; 