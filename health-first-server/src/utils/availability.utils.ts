import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment-timezone';

@Injectable()
export class AvailabilityUtils {
  private readonly logger = new Logger(AvailabilityUtils.name);

  /**
   * Convert time from one timezone to another
   * @param time - Time in HH:mm format
   * @param fromTimezone - Source timezone
   * @param toTimezone - Target timezone
   * @param date - Date in YYYY-MM-DD format
   * @returns Converted time in HH:mm format
   */
  convertTimezone(
    time: string,
    fromTimezone: string,
    toTimezone: string,
    date: string
  ): string {
    try {
      const dateTimeString = `${date}T${time}:00`;
      const momentObj = moment.tz(dateTimeString, fromTimezone);
      const converted = momentObj.tz(toTimezone);
      return converted.format('HH:mm');
    } catch (error) {
      this.logger.error(`Timezone conversion error: ${error.message}`);
      return time; // Return original time if conversion fails
    }
  }

  /**
   * Generate time slots between start and end time
   * @param startTime - Start time in HH:mm format
   * @param endTime - End time in HH:mm format
   * @param slotDuration - Duration of each slot in minutes
   * @param breakDuration - Break duration between slots in minutes
   * @returns Array of time slots
   */
  generateTimeSlots(
    startTime: string,
    endTime: string,
    slotDuration: number = 30,
    breakDuration: number = 0
  ): string[] {
    const slots: string[] = [];
    const start = moment(startTime, 'HH:mm');
    const end = moment(endTime, 'HH:mm');
    
    if (start.isAfter(end)) {
      throw new Error('Start time must be before end time');
    }

    let current = start.clone();
    while (current.isBefore(end)) {
      const slotEnd = current.clone().add(slotDuration, 'minutes');
      if (slotEnd.isAfter(end)) break;
      
      slots.push(current.format('HH:mm'));
      current.add(slotDuration + breakDuration, 'minutes');
    }

    return slots;
  }

  /**
   * Generate dates for recurring availability
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @param pattern - Recurrence pattern
   * @returns Array of dates
   */
  generateRecurringDates(
    startDate: string,
    endDate: string,
    pattern: 'daily' | 'weekly' | 'monthly'
  ): string[] {
    const dates: string[] = [];
    const start = moment(startDate);
    const end = moment(endDate);
    
    if (start.isAfter(end)) {
      throw new Error('Start date must be before end date');
    }

    let current = start.clone();
    while (current.isSameOrBefore(end)) {
      dates.push(current.format('YYYY-MM-DD'));
      
      switch (pattern) {
        case 'daily':
          current.add(1, 'day');
          break;
        case 'weekly':
          current.add(1, 'week');
          break;
        case 'monthly':
          current.add(1, 'month');
          break;
      }
    }

    return dates;
  }

  /**
   * Check for time conflicts between two time ranges
   * @param start1 - First start time
   * @param end1 - First end time
   * @param start2 - Second start time
   * @param end2 - Second end time
   * @returns True if there's a conflict
   */
  hasTimeConflict(
    start1: string,
    end1: string,
    start2: string,
    end2: string
  ): boolean {
    const s1 = moment(start1, 'HH:mm');
    const e1 = moment(end1, 'HH:mm');
    const s2 = moment(start2, 'HH:mm');
    const e2 = moment(end2, 'HH:mm');

    return s1.isBefore(e2) && s2.isBefore(e1);
  }

  /**
   * Validate time format and range
   * @param time - Time in HH:mm format
   * @returns True if valid
   */
  isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) return false;
    
    const [hours, minutes] = time.split(':').map(Number);
    return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
  }

  /**
   * Validate date format
   * @param date - Date in YYYY-MM-DD format
   * @returns True if valid
   */
  isValidDate(date: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const momentDate = moment(date, 'YYYY-MM-DD', true);
    return momentDate.isValid();
  }

  /**
   * Check if a date is in the past
   * @param date - Date in YYYY-MM-DD format
   * @returns True if date is in the past
   */
  isPastDate(date: string): boolean {
    const momentDate = moment(date);
    return momentDate.isBefore(moment(), 'day');
  }

  /**
   * Get current timezone offset
   * @param timezone - Timezone string
   * @returns Offset in minutes
   */
  getTimezoneOffset(timezone: string): number {
    try {
      return moment.tz(timezone).utcOffset();
    } catch (error) {
      this.logger.error(`Invalid timezone: ${timezone}`);
      return 0;
    }
  }

  /**
   * Convert local time to UTC
   * @param time - Local time in HH:mm format
   * @param date - Date in YYYY-MM-DD format
   * @param timezone - Local timezone
   * @returns UTC time in HH:mm format
   */
  localToUTC(time: string, date: string, timezone: string): string {
    try {
      const dateTimeString = `${date}T${time}:00`;
      const localMoment = moment.tz(dateTimeString, timezone);
      const utcMoment = localMoment.utc();
      return utcMoment.format('HH:mm');
    } catch (error) {
      this.logger.error(`Local to UTC conversion error: ${error.message}`);
      return time;
    }
  }

  /**
   * Convert UTC time to local time
   * @param time - UTC time in HH:mm format
   * @param date - Date in YYYY-MM-DD format
   * @param timezone - Target timezone
   * @returns Local time in HH:mm format
   */
  utcToLocal(time: string, date: string, timezone: string): string {
    try {
      const dateTimeString = `${date}T${time}:00Z`;
      const utcMoment = moment.utc(dateTimeString);
      const localMoment = utcMoment.tz(timezone);
      return localMoment.format('HH:mm');
    } catch (error) {
      this.logger.error(`UTC to local conversion error: ${error.message}`);
      return time;
    }
  }

  /**
   * Generate unique booking reference
   * @returns Unique booking reference
   */
  generateBookingReference(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `BK${timestamp}${random}`.toUpperCase();
  }

  /**
   * Calculate total duration between two times
   * @param startTime - Start time in HH:mm format
   * @param endTime - End time in HH:mm format
   * @returns Duration in minutes
   */
  calculateDuration(startTime: string, endTime: string): number {
    const start = moment(startTime, 'HH:mm');
    const end = moment(endTime, 'HH:mm');
    
    if (end.isBefore(start)) {
      end.add(1, 'day');
    }
    
    return end.diff(start, 'minutes');
  }

  /**
   * Validate slot duration constraints
   * @param slotDuration - Slot duration in minutes
   * @param minDuration - Minimum duration in minutes
   * @param maxDuration - Maximum duration in minutes
   * @returns True if valid
   */
  isValidSlotDuration(
    slotDuration: number,
    minDuration: number = 15,
    maxDuration: number = 480
  ): boolean {
    return slotDuration >= minDuration && slotDuration <= maxDuration;
  }

  /**
   * Get day of week from date
   * @param date - Date in YYYY-MM-DD format
   * @returns Day of week (0-6, where 0 is Sunday)
   */
  getDayOfWeek(date: string): number {
    return moment(date).day();
  }

  /**
   * Check if date is a weekend
   * @param date - Date in YYYY-MM-DD format
   * @returns True if weekend
   */
  isWeekend(date: string): boolean {
    const dayOfWeek = this.getDayOfWeek(date);
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  /**
   * Get business days between two dates
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Array of business days
   */
  getBusinessDays(startDate: string, endDate: string): string[] {
    const businessDays: string[] = [];
    const start = moment(startDate);
    const end = moment(endDate);
    
    let current = start.clone();
    while (current.isSameOrBefore(end)) {
      if (!this.isWeekend(current.format('YYYY-MM-DD'))) {
        businessDays.push(current.format('YYYY-MM-DD'));
      }
      current.add(1, 'day');
    }
    
    return businessDays;
  }
} 