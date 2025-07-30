# Provider Availability Management Module

## Overview

The Provider Availability Management module is a comprehensive solution for healthcare providers to manage their appointment availability, including slot creation, updates, deletion, and patient search functionality. The module supports recurring patterns, timezone handling, conflict detection, and appointment booking integration.

## Features

### Core Functionality
- **Availability Slot Creation**: Create single or recurring availability slots with customizable parameters
- **Slot Management**: Update and delete availability slots with conflict prevention
- **Patient Search**: Search for available slots based on various criteria
- **Timezone Support**: Full timezone handling with daylight saving time transitions
- **Conflict Detection**: Prevent overlapping slots for the same provider
- **Recurring Patterns**: Support for daily, weekly, and monthly recurring availability

### Advanced Features
- **Appointment Integration**: Automatic generation of appointment slots from availability
- **Pricing Management**: Support for different pricing structures and insurance acceptance
- **Location Management**: Support for clinic, hospital, telemedicine, and home visit locations
- **Special Requirements**: Track special requirements for appointments
- **Booking References**: Unique booking references for appointment tracking

## Database Schema

### Provider Availability Schema
```typescript
{
  id: ObjectId,
  provider_id: ObjectId (required),
  date: string (YYYY-MM-DD format, required),
  start_time: string (HH:mm format, required),
  end_time: string (HH:mm format, required),
  timezone: string (required),
  is_recurring: boolean (default: false),
  recurrence_pattern: enum (daily/weekly/monthly, optional),
  recurrence_end_date: string (optional),
  slot_duration: number (minutes, default: 30),
  break_duration: number (minutes, default: 0),
  status: enum (available/booked/cancelled/blocked/maintenance),
  max_appointments_per_slot: number (default: 1),
  current_appointments: number (default: 0),
  appointment_type: enum (consultation/follow_up/emergency/telemedicine),
  location: {
    type: enum (clinic/hospital/telemedicine/home_visit),
    address: string (optional),
    room_number: string (optional)
  },
  pricing: {
    base_fee: number,
    insurance_accepted: boolean,
    currency: string (default: "USD")
  },
  notes: string (max: 500),
  special_requirements: string[],
  created_at: Date,
  updated_at: Date
}
```

### Appointment Slots Schema
```typescript
{
  id: ObjectId,
  availability_id: ObjectId (required),
  provider_id: ObjectId (required),
  slot_start_time: Date (with timezone),
  slot_end_time: Date (with timezone),
  status: enum (available/booked/cancelled/blocked),
  patient_id: ObjectId (optional),
  appointment_type: string,
  booking_reference: string (unique)
}
```

## API Endpoints

### 1. Create Availability Slots
**POST** `/api/v1/provider/availability`

Creates availability slots for a healthcare provider. Supports recurring patterns and generates appointment slots automatically.

**Request Body:**
```json
{
  "date": "2024-02-15",
  "start_time": "09:00",
  "end_time": "17:00",
  "timezone": "America/New_York",
  "slot_duration": 30,
  "break_duration": 15,
  "is_recurring": true,
  "recurrence_pattern": "weekly",
  "recurrence_end_date": "2024-08-15",
  "appointment_type": "consultation",
  "location": {
    "type": "clinic",
    "address": "123 Medical Center Dr, New York, NY 10001",
    "room_number": "Room 205"
  },
  "pricing": {
    "base_fee": 150.00,
    "insurance_accepted": true,
    "currency": "USD"
  },
  "special_requirements": ["fasting_required", "bring_insurance_card"],
  "notes": "Standard consultation slots"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Availability slots created successfully",
  "data": {
    "availability_id": "uuid-here",
    "slots_created": 32,
    "date_range": {
      "start": "2024-02-15",
      "end": "2024-08-15"
    },
    "total_appointments_available": 224
  }
}
```

### 2. Get Provider Availability
**GET** `/api/v1/provider/:provider_id/availability`

Retrieves availability slots for a specific provider within a date range.

**Query Parameters:**
- `start_date` (required): Start date in YYYY-MM-DD format
- `end_date` (required): End date in YYYY-MM-DD format
- `status` (optional): Filter by slot status
- `appointment_type` (optional): Filter by appointment type
- `timezone` (optional): Timezone for display

**Response (200):**
```json
{
  "success": true,
  "data": {
    "provider_id": "uuid-here",
    "availability_summary": {
      "total_slots": 48,
      "available_slots": 32,
      "booked_slots": 14,
      "cancelled_slots": 2
    },
    "availability": [
      {
        "date": "2024-02-15",
        "slots": [
          {
            "slot_id": "uuid-here",
            "start_time": "09:00",
            "end_time": "09:30",
            "status": "available",
            "appointment_type": "consultation",
            "location": {
              "type": "clinic",
              "address": "123 Medical Center Dr",
              "room_number": "Room 205"
            },
            "pricing": {
              "base_fee": 150.00,
              "insurance_accepted": true
            }
          }
        ]
      }
    ]
  }
}
```

### 3. Update Availability Slot
**PUT** `/api/v1/provider/availability/:slot_id`

Updates a specific availability slot. Cannot update booked slots.

**Request Body:**
```json
{
  "start_time": "10:00",
  "end_time": "10:30",
  "status": "available",
  "notes": "Updated consultation time",
  "pricing": {
    "base_fee": 175.00
  }
}
```

### 4. Delete Availability Slot
**DELETE** `/api/v1/provider/availability/:slot_id`

Deletes a specific availability slot. Cannot delete booked slots.

**Query Parameters:**
- `delete_recurring` (optional): Delete all recurring instances
- `reason` (optional): Reason for deletion

### 5. Search Available Slots
**GET** `/api/v1/availability/search`

Searches for available appointment slots based on various criteria.

**Query Parameters:**
- `date` (optional): Specific date in YYYY-MM-DD format
- `start_date` & `end_date` (optional): Date range
- `specialization` (optional): Medical specialization
- `location` (optional): City, state, or zip
- `appointment_type` (optional): Type of appointment
- `insurance_accepted` (optional): Whether insurance is accepted
- `max_price` (optional): Maximum price
- `timezone` (optional): Timezone for display
- `available_only` (optional): Show only available slots (default: true)

**Response (200):**
```json
{
  "success": true,
  "data": {
    "search_criteria": {
      "date": "2024-02-15",
      "specialization": "cardiology",
      "location": "New York, NY"
    },
    "total_results": 15,
    "results": [
      {
        "provider": {
          "id": "uuid-here",
          "name": "Dr. John Doe",
          "specialization": "Cardiology",
          "years_of_experience": 15,
          "rating": 4.8,
          "clinic_address": "123 Medical Center Dr, New York, NY"
        },
        "available_slots": [
          {
            "slot_id": "uuid-here",
            "date": "2024-02-15",
            "start_time": "10:00",
            "end_time": "10:30",
            "appointment_type": "consultation",
            "location": {
              "type": "clinic",
              "address": "123 Medical Center Dr",
              "room_number": "Room 205"
            },
            "pricing": {
              "base_fee": 150.00,
              "insurance_accepted": true,
              "currency": "USD"
            },
            "special_requirements": ["bring_insurance_card"]
          }
        ]
      }
    ]
  }
}
```

## Implementation Details

### Timezone Handling
- All times are stored in UTC in the database
- Times are converted to provider's local timezone for display
- Full support for daylight saving time transitions
- Automatic timezone conversion for different regions

### Conflict Prevention
- Prevents overlapping slots for the same provider
- Validates time ranges (end_time > start_time)
- Ensures minimum and maximum slot durations
- Checks for existing appointments before slot deletion

### Slot Generation
- Automatic generation of appointment slots from availability
- Support for break durations between slots
- Configurable slot durations (15 minutes to 8 hours)
- Unique booking references for each slot

### Recurring Patterns
- **Daily**: Creates slots for every day in the date range
- **Weekly**: Creates slots for the same day of the week
- **Monthly**: Creates slots for the same date each month
- Automatic handling of business days vs weekends

## Testing

### Unit Tests
- **Service Tests**: Comprehensive tests for all service methods
- **Utility Tests**: Tests for timezone conversion, slot generation, and validation
- **Conflict Detection**: Tests for time conflict detection
- **Recurring Patterns**: Tests for daily, weekly, and monthly patterns

### Test Coverage
- Timezone conversions and daylight saving time handling
- Slot creation and conflict detection
- Validation of input parameters
- Error handling and edge cases
- Concurrent booking scenarios

## Security Features

### Authentication
- JWT-based authentication for all provider endpoints
- Role-based access control
- Secure token validation

### Data Validation
- Comprehensive input validation using class-validator
- SQL injection prevention through Mongoose
- XSS protection through input sanitization

### Rate Limiting
- API rate limiting to prevent abuse
- Brute force protection for authentication endpoints

## Performance Optimizations

### Database Indexes
- Indexes on provider_id, date, and status for fast queries
- Compound indexes for complex search operations
- Indexes on appointment_type and location for filtering

### Query Optimization
- Efficient aggregation queries for availability summaries
- Pagination support for large result sets
- Caching strategies for frequently accessed data

## Error Handling

### Validation Errors
- Detailed validation error messages
- Field-specific error reporting
- User-friendly error descriptions

### Business Logic Errors
- Conflict detection with clear error messages
- Graceful handling of timezone conversion errors
- Proper error codes for different scenarios

## Future Enhancements

### Planned Features
- **Calendar Integration**: Google Calendar, Outlook integration
- **Notification System**: Email/SMS notifications for appointments
- **Analytics Dashboard**: Provider performance metrics
- **Mobile App Support**: Native mobile app integration
- **Multi-language Support**: Internationalization support

### Scalability Improvements
- **Microservices Architecture**: Split into smaller, focused services
- **Event-Driven Architecture**: Async processing for better performance
- **Caching Layer**: Redis integration for improved response times
- **Load Balancing**: Horizontal scaling support

## Usage Examples

### Creating Weekly Recurring Availability
```javascript
const availabilityData = {
  date: '2024-02-15',
  start_time: '09:00',
  end_time: '17:00',
  timezone: 'America/New_York',
  is_recurring: true,
  recurrence_pattern: 'weekly',
  recurrence_end_date: '2024-08-15',
  appointment_type: 'consultation',
  location: {
    type: 'clinic',
    address: '123 Medical Center Dr'
  },
  pricing: {
    base_fee: 150.00,
    insurance_accepted: true
  }
};
```

### Searching for Available Slots
```javascript
const searchCriteria = {
  date: '2024-02-15',
  specialization: 'cardiology',
  location: 'New York, NY',
  insurance_accepted: true,
  max_price: 200
};
```

## Dependencies

### Required Packages
- `@nestjs/common`: NestJS framework
- `@nestjs/mongoose`: MongoDB integration
- `mongoose`: MongoDB ODM
- `moment-timezone`: Timezone handling
- `class-validator`: Input validation
- `class-transformer`: Data transformation

### Development Dependencies
- `@nestjs/testing`: Testing utilities
- `jest`: Testing framework
- `@types/jest`: TypeScript definitions for Jest

## Configuration

### Environment Variables
```env
# Database
MONGODB_URI=mongodb://localhost:27017/health-first

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=24h

# Timezone
DEFAULT_TIMEZONE=America/New_York

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Deployment

### Production Considerations
- **Database**: Use MongoDB Atlas or self-hosted MongoDB cluster
- **Caching**: Implement Redis for session and data caching
- **Monitoring**: Set up application monitoring and logging
- **Backup**: Regular database backups and disaster recovery
- **SSL**: HTTPS encryption for all API endpoints

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

## Support and Documentation

### API Documentation
- Swagger/OpenAPI documentation available at `/api/docs`
- Interactive API testing interface
- Request/response examples for all endpoints

### Error Codes
- `400`: Bad Request - Invalid input data
- `401`: Unauthorized - Invalid or missing authentication
- `404`: Not Found - Resource not found
- `409`: Conflict - Time conflict with existing availability
- `500`: Internal Server Error - Unexpected server error

### Contact
For technical support or feature requests, please contact the development team or create an issue in the project repository. 