# API Integration Documentation

## Overview

This document describes the API integration between the HealthFirst frontend (React) and backend (NestJS) applications.

## Backend API Endpoints

### Provider Authentication

- **POST** `/api/v1/provider/login` - Provider login
- **POST** `/api/v1/provider/register` - Provider registration
- **POST** `/api/v1/provider/refresh` - Refresh access token
- **POST** `/api/v1/provider/logout` - Provider logout

### Patient Authentication

- **POST** `/api/v1/patient/login` - Patient login
- **POST** `/api/v1/patient/register` - Patient registration
- **POST** `/api/v1/patient/refresh` - Refresh access token
- **POST** `/api/v1/patient/logout` - Patient logout
- **POST** `/api/v1/patient/verify/email` - Verify email address
- **POST** `/api/v1/patient/verify/phone` - Verify phone number

### Provider Availability

- **GET** `/api/v1/provider/:provider_id/availability` - Get availability slots for a specific provider
- **POST** `/api/v1/provider/availability` - Create availability slot
- **PUT** `/api/v1/provider/availability/:slot_id` - Update availability slot
- **DELETE** `/api/v1/provider/availability/:slot_id` - Delete availability slot

### Patient Availability Search

- **GET** `/api/v1/availability/search` - Search for available appointment slots

## Frontend Integration

### API Service (`src/services/api.js`)

The frontend uses a centralized API service that handles:

- Axios configuration with base URL and timeouts
- Request interceptors to add authentication tokens
- Response interceptors to handle token refresh
- Error handling and automatic logout on authentication failures

### Authentication Flow

1. User submits login/registration form
2. Frontend calls appropriate API endpoint
3. On success, authentication data is stored in localStorage
4. User is redirected to dashboard
5. Subsequent API calls include Bearer token in Authorization header

### Dashboard Integration

- Dashboard component checks authentication status on mount
- Shows different content based on user type (provider/patient)
- Provides logout functionality
- Handles token refresh automatically

## Data Flow

### Provider Registration

```javascript
const registrationData = {
  first_name: "John",
  last_name: "Doe",
  email: "john.doe@clinic.com",
  phone_number: "+1234567890",
  password: "SecurePassword123!",
  specialization: "Cardiology",
  license_number: "MD123456789",
  years_of_experience: 10,
  clinic_address: {
    street: "123 Medical Center Dr",
    city: "New York",
    state: "NY",
    zip: "10001",
  },
};
```

### Patient Registration

```javascript
const registrationData = {
  first_name: "Jane",
  last_name: "Smith",
  email: "jane.smith@email.com",
  phone_number: "+1234567890",
  date_of_birth: "1990-05-15",
  gender: "female",
  password: "SecurePassword123!",
  address: {
    street: "456 Main Street",
    city: "Boston",
    state: "MA",
    zip: "02101",
  },
  emergency_contact: {
    name: "John Smith",
    phone: "+1234567891",
    relationship: "spouse",
  },
};
```

### Login Response

```javascript
{
  success: true,
  message: "Login successful",
  data: {
    access_token: "jwt-access-token",
    refresh_token: "jwt-refresh-token",
    expires_in: 3600,
    token_type: "Bearer",
    provider: { // or patient
      id: "provider-id",
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@clinic.com",
      // ... other user data
    }
  }
}
```

### Availability Data Structures

#### Create Availability Request

```javascript
{
  date: "2025-08-15",
  start_time: "09:00",
  end_time: "17:00",
  timezone: "America/New_York",
  slot_duration: 30,
  break_duration: 15,
  appointment_type: "consultation",
  location: {
    type: "clinic",
    address: "123 Main St",
    room_number: "101"
  },
  is_recurring: true,
  recurrence_pattern: "weekly",
  recurrence_end_date: "2025-09-15",
  max_appointments_per_slot: 1,
  pricing: {
    base_fee: 100,
    insurance_accepted: true,
    currency: "USD"
  },
  special_requirements: ["wheelchair accessible"],
  notes: "Regular consultation hours"
}
```

#### Availability Search Request

```javascript
{
  date: "2025-08-15",
  start_date: "2025-08-15",
  end_date: "2025-08-20",
  specialization: "cardiology",
  location: "New York, NY",
  appointment_type: "consultation",
  insurance_accepted: true,
  max_price: 150,
  timezone: "America/New_York",
  available_only: true
}
```

#### Availability Search Response

```javascript
{
  success: true,
  data: {
    search_criteria: {
      date: "2025-08-15",
      specialization: "cardiology"
    },
    total_results: 2,
    results: [
      {
        provider: {
          id: "provider-id",
          name: "Dr. John Doe",
          specialization: "Cardiology",
          years_of_experience: 10,
          clinic_address: "123 Medical Center Dr, New York, NY 10001"
        },
        available_slots: [
          {
            slot_id: "slot-id",
            start_time: "09:00",
            end_time: "09:30",
            status: "available",
            appointment_type: "consultation",
            location: {
              type: "clinic",
              address: "123 Main St"
            },
            pricing: {
              base_fee: 100,
              insurance_accepted: true
            }
          }
        ]
      }
    ]
  }
}
```

## Error Handling

- Network errors are caught and displayed to users
- Authentication errors trigger automatic logout
- Validation errors are displayed inline with form fields
- Rate limiting and server errors are handled gracefully

## Security Features

- JWT tokens for authentication
- Automatic token refresh
- Secure password requirements
- CORS configuration
- Input validation and sanitization
- HIPAA compliance considerations

## Running the Application

### Backend (Port 3000)

```bash
cd health-first-server
npm install
npm run start:dev
```

### Frontend (Port 5173)

```bash
cd health-first-client
npm install
npm run dev
```

## Testing the Integration

1. Start both servers
2. Navigate to `http://localhost:5173`
3. Test provider registration and login
4. Test patient registration and login
5. Verify dashboard functionality
6. Test availability management (for providers):
   - Navigate to Provider Availability page
   - Create new availability slots
   - View and manage existing slots
7. Test availability search (for patients):
   - Navigate to Availability Search page
   - Search for available appointments
   - Filter by specialization, location, date range

## Notes

- The backend runs on port 3000 by default
- The frontend runs on port 5173 by default
- CORS is enabled on the backend for development
- Authentication tokens are stored in localStorage
- The integration supports both provider and patient workflows
