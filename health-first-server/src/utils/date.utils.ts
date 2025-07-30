export class DateUtils {
  private static readonly MIN_AGE = 13; // COPPA compliance
  private static readonly MAX_AGE = 120; // Reasonable maximum age

  /**
   * Calculate age from date of birth
   * @param dateOfBirth - Date of birth
   * @returns Age in years
   */
  static calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Validate date of birth for age requirements
   * @param dateOfBirth - Date of birth string
   * @returns Validation result with age
   */
  static validateDateOfBirth(dateOfBirth: string): { isValid: boolean; age: number; errors: string[] } {
    const errors: string[] = [];
    
    // Parse the date
    const birthDate = new Date(dateOfBirth);
    
    // Check if date is valid
    if (isNaN(birthDate.getTime())) {
      errors.push('Invalid date format');
      return { isValid: false, age: 0, errors };
    }
    
    // Check if date is in the past
    const today = new Date();
    if (birthDate >= today) {
      errors.push('Date of birth must be in the past');
      return { isValid: false, age: 0, errors };
    }
    
    // Calculate age
    const age = this.calculateAge(birthDate);
    
    // Check minimum age (COPPA compliance)
    if (age < this.MIN_AGE) {
      errors.push(`Must be at least ${this.MIN_AGE} years old`);
    }
    
    // Check maximum age
    if (age > this.MAX_AGE) {
      errors.push(`Age cannot exceed ${this.MAX_AGE} years`);
    }
    
    return {
      isValid: errors.length === 0,
      age,
      errors
    };
  }

  /**
   * Check if date is in the past
   * @param date - Date to check
   * @returns True if date is in the past
   */
  static isDateInPast(date: Date): boolean {
    const today = new Date();
    return date < today;
  }

  /**
   * Format date for display
   * @param date - Date to format
   * @returns Formatted date string
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Get minimum allowed date of birth
   * @returns Minimum date of birth (13 years ago)
   */
  static getMinimumDateOfBirth(): Date {
    const today = new Date();
    today.setFullYear(today.getFullYear() - this.MIN_AGE);
    return today;
  }

  /**
   * Get maximum allowed date of birth
   * @returns Maximum date of birth (120 years ago)
   */
  static getMaximumDateOfBirth(): Date {
    const today = new Date();
    today.setFullYear(today.getFullYear() - this.MAX_AGE);
    return today;
  }

  /**
   * Sanitize date string
   * @param dateString - Date string to sanitize
   * @returns Sanitized date string
   */
  static sanitizeDateString(dateString: string): string {
    return dateString.trim();
  }

  /**
   * Validate date string format (YYYY-MM-DD)
   * @param dateString - Date string to validate
   * @returns True if valid format
   */
  static isValidDateString(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  }
} 