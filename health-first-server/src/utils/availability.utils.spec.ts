import { Test, TestingModule } from '@nestjs/testing';
import { AvailabilityUtils } from './availability.utils';
import * as moment from 'moment-timezone';

describe('AvailabilityUtils', () => {
  let service: AvailabilityUtils;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AvailabilityUtils],
    }).compile();

    service = module.get<AvailabilityUtils>(AvailabilityUtils);
  });

  describe('convertTimezone', () => {
    it('should convert timezone correctly', () => {
      const time = '09:00';
      const fromTimezone = 'America/New_York';
      const toTimezone = 'America/Los_Angeles';
      const date = '2024-02-15';

      const result = service.convertTimezone(time, fromTimezone, toTimezone, date);

      // New York to Los Angeles should be 3 hours difference
      expect(result).toBe('06:00');
    });

    it('should handle invalid timezone gracefully', () => {
      const time = '09:00';
      const fromTimezone = 'Invalid/Timezone';
      const toTimezone = 'America/New_York';
      const date = '2024-02-15';

      const result = service.convertTimezone(time, fromTimezone, toTimezone, date);

      // Should return original time if conversion fails
      expect(result).toBe(time);
    });
  });

  describe('generateTimeSlots', () => {
    it('should generate time slots correctly', () => {
      const startTime = '09:00';
      const endTime = '10:00';
      const slotDuration = 30;
      const breakDuration = 0;

      const result = service.generateTimeSlots(startTime, endTime, slotDuration, breakDuration);

      expect(result).toEqual(['09:00', '09:30']);
    });

    it('should handle break duration', () => {
      const startTime = '09:00';
      const endTime = '10:00';
      const slotDuration = 30;
      const breakDuration = 15;

      const result = service.generateTimeSlots(startTime, endTime, slotDuration, breakDuration);

      // With 30 min slots + 15 min breaks, we get: 09:00, 09:45
      expect(result).toEqual(['09:00', '09:45']);
    });

    it('should throw error for invalid time range', () => {
      const startTime = '10:00';
      const endTime = '09:00';

      expect(() => service.generateTimeSlots(startTime, endTime))
        .toThrow('Start time must be before end time');
    });

    it('should handle edge case where slot duration exceeds time range', () => {
      const startTime = '09:00';
      const endTime = '09:15';
      const slotDuration = 30;

      const result = service.generateTimeSlots(startTime, endTime, slotDuration);

      expect(result).toEqual([]);
    });
  });

  describe('generateRecurringDates', () => {
    it('should generate daily recurring dates', () => {
      const startDate = '2024-02-15';
      const endDate = '2024-02-17';
      const pattern = 'daily';

      const result = service.generateRecurringDates(startDate, endDate, pattern);

      expect(result).toEqual(['2024-02-15', '2024-02-16', '2024-02-17']);
    });

    it('should generate weekly recurring dates', () => {
      const startDate = '2024-02-15';
      const endDate = '2024-03-07';
      const pattern = 'weekly';

      const result = service.generateRecurringDates(startDate, endDate, pattern);

      expect(result).toEqual(['2024-02-15', '2024-02-22', '2024-02-29', '2024-03-07']);
    });

    it('should generate monthly recurring dates', () => {
      const startDate = '2024-02-15';
      const endDate = '2024-04-15';
      const pattern = 'monthly';

      const result = service.generateRecurringDates(startDate, endDate, pattern);

      expect(result).toEqual(['2024-02-15', '2024-03-15', '2024-04-15']);
    });

    it('should throw error for invalid date range', () => {
      const startDate = '2024-03-15';
      const endDate = '2024-02-15';
      const pattern = 'daily';

      expect(() => service.generateRecurringDates(startDate, endDate, pattern))
        .toThrow('Start date must be before end date');
    });
  });

  describe('hasTimeConflict', () => {
    it('should detect overlapping time conflicts', () => {
      const start1 = '09:00';
      const end1 = '10:00';
      const start2 = '09:30';
      const end2 = '10:30';

      const result = service.hasTimeConflict(start1, end1, start2, end2);

      expect(result).toBe(true);
    });

    it('should detect complete overlap', () => {
      const start1 = '09:00';
      const end1 = '10:00';
      const start2 = '08:30';
      const end2 = '10:30';

      const result = service.hasTimeConflict(start1, end1, start2, end2);

      expect(result).toBe(true);
    });

    it('should not detect conflict for adjacent times', () => {
      const start1 = '09:00';
      const end1 = '10:00';
      const start2 = '10:00';
      const end2 = '11:00';

      const result = service.hasTimeConflict(start1, end1, start2, end2);

      expect(result).toBe(false);
    });

    it('should not detect conflict for non-overlapping times', () => {
      const start1 = '09:00';
      const end1 = '10:00';
      const start2 = '11:00';
      const end2 = '12:00';

      const result = service.hasTimeConflict(start1, end1, start2, end2);

      expect(result).toBe(false);
    });
  });

  describe('isValidTime', () => {
    it('should validate correct time format', () => {
      expect(service.isValidTime('09:00')).toBe(true);
      expect(service.isValidTime('23:59')).toBe(true);
      expect(service.isValidTime('00:00')).toBe(true);
    });

    it('should reject invalid time format', () => {
      expect(service.isValidTime('25:00')).toBe(false);
      expect(service.isValidTime('09:60')).toBe(false);
      expect(service.isValidTime('09:0')).toBe(false);
      expect(service.isValidTime('invalid')).toBe(false);
    });
  });

  describe('isValidDate', () => {
    it('should validate correct date format', () => {
      expect(service.isValidDate('2024-02-15')).toBe(true);
      expect(service.isValidDate('2024-12-31')).toBe(true);
    });

    it('should reject invalid date format', () => {
      expect(service.isValidDate('2024-13-01')).toBe(false);
      expect(service.isValidDate('2024-02-30')).toBe(false);
      expect(service.isValidDate('invalid')).toBe(false);
      expect(service.isValidDate('2024/02/15')).toBe(false);
    });
  });

  describe('isPastDate', () => {
    it('should identify past dates', () => {
      const pastDate = moment().subtract(1, 'day').format('YYYY-MM-DD');
      expect(service.isPastDate(pastDate)).toBe(true);
    });

    it('should not identify future dates as past', () => {
      const futureDate = moment().add(1, 'day').format('YYYY-MM-DD');
      expect(service.isPastDate(futureDate)).toBe(false);
    });

    it('should not identify today as past', () => {
      const today = moment().format('YYYY-MM-DD');
      expect(service.isPastDate(today)).toBe(false);
    });
  });

  describe('getTimezoneOffset', () => {
    it('should return timezone offset', () => {
      const offset = service.getTimezoneOffset('America/New_York');
      expect(typeof offset).toBe('number');
    });

    it('should handle invalid timezone', () => {
      const offset = service.getTimezoneOffset('Invalid/Timezone');
      expect(offset).toBe(0);
    });
  });

  describe('localToUTC', () => {
    it('should convert local time to UTC', () => {
      const time = '09:00';
      const date = '2024-02-15';
      const timezone = 'America/New_York';

      const result = service.localToUTC(time, date, timezone);

      // Should return a time in UTC format
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle conversion errors gracefully', () => {
      const time = '09:00';
      const date = '2024-02-15';
      const timezone = 'Invalid/Timezone';

      const result = service.localToUTC(time, date, timezone);

      expect(result).toBe(time);
    });
  });

  describe('utcToLocal', () => {
    it('should convert UTC time to local time', () => {
      const time = '14:00';
      const date = '2024-02-15';
      const timezone = 'America/New_York';

      const result = service.utcToLocal(time, date, timezone);

      // Should return a time in local format
      expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle conversion errors gracefully', () => {
      const time = '14:00';
      const date = '2024-02-15';
      const timezone = 'Invalid/Timezone';

      const result = service.utcToLocal(time, date, timezone);

      expect(result).toBe(time);
    });
  });

  describe('generateBookingReference', () => {
    it('should generate unique booking reference', () => {
      const ref1 = service.generateBookingReference();
      const ref2 = service.generateBookingReference();

      expect(ref1).toMatch(/^BK[A-Z0-9]+$/);
      expect(ref2).toMatch(/^BK[A-Z0-9]+$/);
      expect(ref1).not.toBe(ref2);
    });

    it('should generate reference with correct format', () => {
      const ref = service.generateBookingReference();
      
      expect(ref).toMatch(/^BK/);
      expect(ref.length).toBeGreaterThan(2);
    });
  });

  describe('calculateDuration', () => {
    it('should calculate duration correctly', () => {
      const startTime = '09:00';
      const endTime = '10:30';

      const result = service.calculateDuration(startTime, endTime);

      expect(result).toBe(90); // 1 hour 30 minutes = 90 minutes
    });

    it('should handle overnight duration', () => {
      const startTime = '23:00';
      const endTime = '01:00';

      const result = service.calculateDuration(startTime, endTime);

      expect(result).toBe(120); // 2 hours
    });
  });

  describe('isValidSlotDuration', () => {
    it('should validate slot duration within range', () => {
      expect(service.isValidSlotDuration(30)).toBe(true);
      expect(service.isValidSlotDuration(15)).toBe(true);
      expect(service.isValidSlotDuration(480)).toBe(true);
    });

    it('should reject slot duration outside range', () => {
      expect(service.isValidSlotDuration(10)).toBe(false);
      expect(service.isValidSlotDuration(500)).toBe(false);
    });

    it('should accept custom range', () => {
      expect(service.isValidSlotDuration(60, 30, 120)).toBe(true);
      expect(service.isValidSlotDuration(20, 30, 120)).toBe(false);
    });
  });

  describe('getDayOfWeek', () => {
    it('should return correct day of week', () => {
      // 2024-02-15 is a Thursday (day 4)
      const result = service.getDayOfWeek('2024-02-15');
      expect(result).toBe(4);
    });

    it('should handle different dates', () => {
      // 2024-02-17 is a Saturday (day 6)
      const result = service.getDayOfWeek('2024-02-17');
      expect(result).toBe(6);
    });
  });

  describe('isWeekend', () => {
    it('should identify weekends', () => {
      // 2024-02-17 is a Saturday
      expect(service.isWeekend('2024-02-17')).toBe(true);
      
      // 2024-02-18 is a Sunday
      expect(service.isWeekend('2024-02-18')).toBe(true);
    });

    it('should not identify weekdays as weekends', () => {
      // 2024-02-15 is a Thursday
      expect(service.isWeekend('2024-02-15')).toBe(false);
      
      // 2024-02-16 is a Friday
      expect(service.isWeekend('2024-02-16')).toBe(false);
    });
  });

  describe('getBusinessDays', () => {
    it('should return business days only', () => {
      const startDate = '2024-02-15'; // Thursday
      const endDate = '2024-02-20'; // Tuesday

      const result = service.getBusinessDays(startDate, endDate);

      // Should exclude weekends (2024-02-17 and 2024-02-18)
      expect(result).toEqual([
        '2024-02-15', // Thursday
        '2024-02-16', // Friday
        '2024-02-19', // Monday
        '2024-02-20'  // Tuesday
      ]);
    });

    it('should handle single day range', () => {
      const startDate = '2024-02-15';
      const endDate = '2024-02-15';

      const result = service.getBusinessDays(startDate, endDate);

      expect(result).toEqual(['2024-02-15']);
    });

    it('should handle weekend-only range', () => {
      const startDate = '2024-02-17'; // Saturday
      const endDate = '2024-02-18'; // Sunday

      const result = service.getBusinessDays(startDate, endDate);

      expect(result).toEqual([]);
    });
  });

  describe('daylight saving time handling', () => {
    it('should handle DST transitions correctly', () => {
      // Test spring forward (March 10, 2024)
      const springForward = '2024-03-10';
      const time = '02:30';
      
      // This time doesn't exist during spring forward
      const result = service.convertTimezone(
        time, 
        'America/New_York', 
        'America/New_York', 
        springForward
      );
      
      expect(result).toBeDefined();
    });

    it('should handle fall back correctly', () => {
      // Test fall back (November 3, 2024)
      const fallBack = '2024-11-03';
      const time = '02:30';
      
      // This time occurs twice during fall back
      const result = service.convertTimezone(
        time, 
        'America/New_York', 
        'America/New_York', 
        fallBack
      );
      
      expect(result).toBeDefined();
    });
  });
}); 